import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { posix } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  CACHE_IMAGENES_SEGUNDOS,
  CALIDAD_WEBP,
  LADO_MAXIMO_GRANDE,
  LADO_MAXIMO_VARIANTE,
  rutaVariante,
  urlVariante,
  type Variante,
} from "../src/lib/imagenes-constantes.ts";

const BUCKET = "proyectos";
const UMBRAL_LIVIANO = 2 * 1024 * 1024;
const CONCURRENCIA = 2;
const CONCURRENCIA_HEAD = 6;
const VARIANTES: Variante[] = ["card", "thumb"];

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CARPETA_RESPALDO = join(RAIZ, "scripts", "respaldo");

type Tipo = "galeria" | "comparacion" | "portada";
type Tabla = "proyecto_imagenes" | "proyecto_comparaciones" | "sitio_config";
type Accion = "migrar" | "variantes" | "omitir";

type Item = {
  clave: string;
  tipo: Tipo;
  tabla: Tabla;
  id: string;
  columnaUrl: string;
  columnaPath: string;
  url: string;
  path: string;
  proyectoId: string | null;
  etiqueta: string;
  bytes: number | null;
  contentType: string | null;
  variantes: Record<Variante, boolean> | null;
  accion: Accion;
  motivo: string;
};

type Resultado =
  | { estado: "migrada"; nuevoPath: string; nuevaUrl: string; bytesAntes: number; bytesDespues: number; bytesVariantes: number }
  | { estado: "variantes"; subidas: string[]; bytesVariantes: number }
  | { estado: "fallida"; error: string };

type EntradaRespaldo = {
  clave: string;
  tabla: Tabla;
  id: string;
  columnaUrl: string;
  columnaPath: string;
  accion: Accion;
  anterior: { url: string; path: string };
  resultado: Resultado | null;
};

type Respaldo = {
  creado: string;
  archivo: string;
  entradas: EntradaRespaldo[];
};

type Argumentos = {
  aplicar: boolean;
  proyecto: string | null;
  portada: boolean;
  limite: number | null;
  revertir: string | null;
};

type FilaProyecto = { id: string; nombre: string; activo: boolean };
type FilaImagen = { id: string; proyecto_id: string; url: string; path: string; orden: number };
type FilaComparacion = {
  id: string;
  proyecto_id: string;
  orden: number;
  antes_url: string;
  antes_path: string;
  despues_url: string;
  despues_path: string;
};
type FilaSitio = { id: string; hero_url: string | null; hero_path: string | null };

function salir(mensaje: string): never {
  console.error(`\nError: ${mensaje}\n`);
  process.exit(1);
}

function leerArgumentos(argv: string[]): Argumentos {
  const args: Argumentos = { aplicar: false, proyecto: null, portada: false, limite: null, revertir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") continue;
    else if (a === "--apply") args.aplicar = true;
    else if (a === "--portada") args.portada = true;
    else if (a === "--proyecto") args.proyecto = argv[++i] ?? salir("--proyecto necesita un id o nombre.");
    else if (a === "--limite") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) salir("--limite necesita un número entero mayor a 0.");
      args.limite = n;
    } else if (a === "--revertir") args.revertir = argv[++i] ?? salir("--revertir necesita la ruta de un archivo de respaldo.");
    else salir(`Argumento desconocido: ${a}`);
  }
  if (args.revertir && (args.aplicar || args.proyecto || args.portada || args.limite)) {
    salir("--revertir no se combina con otros modos.");
  }
  if (args.portada && args.proyecto) salir("--portada y --proyecto no se combinan.");
  return args;
}

function leerEnv(): Record<string, string> {
  const archivo = join(RAIZ, ".env.local");
  if (!existsSync(archivo)) salir("No se encontró .env.local en la raíz del proyecto.");
  const env: Record<string, string> = {};
  for (const linea of readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#") || !limpia.includes("=")) continue;
    const corte = limpia.indexOf("=");
    env[limpia.slice(0, corte).trim()] = limpia.slice(corte + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function crearCliente(url: string, clave: string): SupabaseClient {
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mb(bytes: number): string {
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function extension(path: string): string {
  return posix.extname(path).slice(1).toLowerCase();
}

function formato(item: Item): string {
  return item.contentType?.replace("image/", "") ?? extension(item.path);
}

function slugificar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function enParalelo<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(items.length);
  let siguiente = 0;
  async function trabajador() {
    while (siguiente < items.length) {
      const i = siguiente++;
      resultados[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, trabajador));
  return resultados;
}

async function head(url: string): Promise<{ ok: boolean; bytes: number | null; tipo: string | null }> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const largo = res.headers.get("content-length");
    return { ok: res.ok, bytes: res.ok && largo ? Number(largo) : null, tipo: res.ok ? res.headers.get("content-type") : null };
  } catch {
    return { ok: false, bytes: null, tipo: null };
  }
}

async function consultar<T>(promesa: PromiseLike<{ data: T[] | null; error: { message: string } | null }>, que: string): Promise<T[]> {
  const { data, error } = await promesa;
  if (error) salir(`No se pudo leer ${que}: ${error.message}`);
  return data ?? [];
}

async function descubrir(supabase: SupabaseClient, args: Argumentos): Promise<{ items: Item[]; proyectos: FilaProyecto[] }> {
  const items: Item[] = [];
  let proyectos = await consultar<FilaProyecto>(supabase.from("proyectos").select("id, nombre, activo").order("orden"), "proyectos");

  if (args.proyecto) {
    const buscado = args.proyecto.toLowerCase();
    proyectos = proyectos.filter((p) => p.id === args.proyecto || p.nombre.toLowerCase() === buscado || slugificar(p.nombre) === slugificar(buscado));
    if (proyectos.length === 0) salir(`No se encontró el proyecto "${args.proyecto}" (se busca por id o nombre).`);
  }

  if (!args.portada) {
    const ids = proyectos.map((p) => p.id);
    if (ids.length > 0) {
      const imagenes = await consultar<FilaImagen>(
        supabase.from("proyecto_imagenes").select("id, proyecto_id, url, path, orden").in("proyecto_id", ids).order("orden"),
        "proyecto_imagenes"
      );
      for (const img of imagenes) {
        items.push(nuevoItem({ tipo: "galeria", tabla: "proyecto_imagenes", id: img.id, columnaUrl: "url", columnaPath: "path", url: img.url, path: img.path, proyectoId: img.proyecto_id, etiqueta: `galería #${img.orden}` }));
      }
      const comparaciones = await consultar<FilaComparacion>(
        supabase.from("proyecto_comparaciones").select("id, proyecto_id, orden, antes_url, antes_path, despues_url, despues_path").in("proyecto_id", ids).order("orden"),
        "proyecto_comparaciones"
      );
      for (const c of comparaciones) {
        items.push(nuevoItem({ tipo: "comparacion", tabla: "proyecto_comparaciones", id: c.id, columnaUrl: "antes_url", columnaPath: "antes_path", url: c.antes_url, path: c.antes_path, proyectoId: c.proyecto_id, etiqueta: `par #${c.orden} antes` }));
        items.push(nuevoItem({ tipo: "comparacion", tabla: "proyecto_comparaciones", id: c.id, columnaUrl: "despues_url", columnaPath: "despues_path", url: c.despues_url, path: c.despues_path, proyectoId: c.proyecto_id, etiqueta: `par #${c.orden} después` }));
      }
    }
  }

  if (args.portada || !args.proyecto) {
    const filas = await consultar<FilaSitio>(supabase.from("sitio_config").select("id, hero_url, hero_path"), "sitio_config");
    for (const fila of filas) {
      if (fila.hero_url && fila.hero_path) {
        items.push(nuevoItem({ tipo: "portada", tabla: "sitio_config", id: fila.id, columnaUrl: "hero_url", columnaPath: "hero_path", url: fila.hero_url, path: fila.hero_path, proyectoId: null, etiqueta: "portada (hero)" }));
      }
    }
  }

  return { items: items.filter((item) => !item.path.startsWith("objetos/")), proyectos };
}

function nuevoItem(base: Pick<Item, "tipo" | "tabla" | "id" | "columnaUrl" | "columnaPath" | "url" | "path" | "proyectoId" | "etiqueta">): Item {
  return { ...base, clave: `${base.tabla}:${base.id}:${base.columnaPath}`, bytes: null, contentType: null, variantes: null, accion: "omitir", motivo: "" };
}

async function inspeccionar(items: Item[]): Promise<void> {
  await enParalelo(items, CONCURRENCIA_HEAD, async (item) => {
    const info = await head(item.url);
    item.bytes = info.bytes;
    item.contentType = info.tipo;
    if (item.tipo === "galeria") {
      const [card, thumb] = await Promise.all(VARIANTES.map((v) => head(urlVariante(item.url, v))));
      item.variantes = { card: card.ok, thumb: thumb.ok };
    }
    decidir(item);
  });
}

function decidir(item: Item): void {
  if (item.bytes === null) {
    item.accion = "omitir";
    item.motivo = "no se pudo leer el archivo (HEAD)";
    return;
  }
  const liviano = item.bytes <= UMBRAL_LIVIANO;
  const esWebp = extension(item.path) === "webp";
  if (item.tipo === "galeria") {
    const conVariantes = Boolean(item.variantes?.card && item.variantes?.thumb);
    if (liviano && conVariantes) {
      item.accion = "omitir";
      item.motivo = "ya liviana y con variantes";
    } else if (liviano && esWebp) {
      item.accion = "variantes";
      item.motivo = "ya es WebP liviano; faltan variantes";
    } else {
      item.accion = "migrar";
      item.motivo = liviano ? "sin variantes" : "pesada";
    }
    return;
  }
  if (liviano && esWebp) {
    item.accion = "omitir";
    item.motivo = "ya es WebP liviano";
  } else {
    item.accion = "migrar";
    item.motivo = liviano ? "convertir a WebP" : "pesada";
  }
}

function aplicarLimite(items: Item[], limite: number | null): void {
  if (limite === null) return;
  let usados = 0;
  for (const item of items) {
    if (item.accion === "omitir") continue;
    if (usados >= limite) {
      item.accion = "omitir";
      item.motivo = `fuera del --limite ${limite}`;
    } else usados++;
  }
}

function imprimirPlan(items: Item[], proyectos: FilaProyecto[]): void {
  const nombres = new Map(proyectos.map((p) => [p.id, `${p.nombre}${p.activo ? "" : " (inactivo)"}`]));
  const grupos = new Map<string, Item[]>();
  for (const item of items) {
    const clave = item.proyectoId ? nombres.get(item.proyectoId) ?? item.proyectoId : "Portada / hero";
    grupos.set(clave, [...(grupos.get(clave) ?? []), item]);
  }
  for (const [nombre, lista] of grupos) {
    const total = lista.reduce((a, i) => a + (i.bytes ?? 0), 0);
    const formatos = new Map<string, number>();
    for (const i of lista) formatos.set(formato(i), (formatos.get(formato(i)) ?? 0) + 1);
    const galeria = lista.filter((i) => i.tipo === "galeria").length;
    const comparaciones = lista.filter((i) => i.tipo === "comparacion").length;
    console.log(`\n${nombre}`);
    console.log(`  ${lista.length} imágenes (galería ${galeria}, antes/después ${comparaciones}${lista.some((i) => i.tipo === "portada") ? ", hero 1" : ""}) · peso actual ${mb(total)} · formatos: ${[...formatos].map(([f, n]) => `${f}×${n}`).join(", ")}`);
    for (const i of lista) {
      const variantes = i.variantes ? ` card:${i.variantes.card ? "sí" : "no"} thumb:${i.variantes.thumb ? "sí" : "no"}` : "";
      console.log(`  ${i.accion.padEnd(9)} ${(i.bytes === null ? "?" : mb(i.bytes)).padStart(9)} ${formato(i).padEnd(5)} ${i.etiqueta.padEnd(16)} ${posix.basename(i.path)}${variantes}  (${i.motivo})`);
    }
  }
}

async function descargar(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`descarga ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function aWebp(original: Buffer, ladoMaximo: number): Promise<Buffer> {
  return sharp(original, { failOn: "none" })
    .rotate()
    .resize({ width: ladoMaximo, height: ladoMaximo, fit: "inside", withoutEnlargement: true })
    .webp({ quality: Math.round(CALIDAD_WEBP * 100) })
    .toBuffer();
}

async function subir(supabase: SupabaseClient, path: string, contenido: Buffer): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, contenido, {
    cacheControl: CACHE_IMAGENES_SEGUNDOS,
    upsert: false,
    contentType: "image/webp",
  });
  if (error) throw new Error(`subida de ${path}: ${error.message}`);
}

async function verificar(supabase: SupabaseClient, path: string, bytes: number): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).info(path);
  if (error || !data) throw new Error(`verificación de ${path}: ${error?.message ?? "sin datos"}`);
  if (data.size !== bytes) throw new Error(`verificación de ${path}: tamaño ${data.size} distinto de ${bytes}`);
}

async function procesar(supabase: SupabaseClient, item: Item, alMigrar: (item: Item, r: Resultado) => void): Promise<Resultado> {
  const subidos: string[] = [];
  try {
    const original = await descargar(item.url);

    if (item.accion === "variantes") {
      let bytesVariantes = 0;
      for (const v of VARIANTES) {
        if (item.variantes?.[v]) continue;
        const contenido = await aWebp(original, LADO_MAXIMO_VARIANTE[v]);
        const destino = rutaVariante(item.path, v);
        await subir(supabase, destino, contenido);
        subidos.push(destino);
        await verificar(supabase, destino, contenido.length);
        bytesVariantes += contenido.length;
      }
      const resultado: Resultado = { estado: "variantes", subidas: subidos, bytesVariantes };
      alMigrar(item, resultado);
      return resultado;
    }

    const nuevoPath = `${posix.dirname(item.path)}/${randomUUID()}.webp`;
    const grande = await aWebp(original, LADO_MAXIMO_GRANDE);
    const archivos: [string, Buffer][] = [[nuevoPath, grande]];
    if (item.tipo === "galeria") {
      for (const v of VARIANTES) archivos.push([rutaVariante(nuevoPath, v), await aWebp(original, LADO_MAXIMO_VARIANTE[v])]);
    }

    for (const [path, contenido] of archivos) {
      await subir(supabase, path, contenido);
      subidos.push(path);
    }
    for (const [path, contenido] of archivos) await verificar(supabase, path, contenido.length);

    const nuevaUrl = supabase.storage.from(BUCKET).getPublicUrl(nuevoPath).data.publicUrl;
    const { data, error } = await supabase
      .from(item.tabla)
      .update({ [item.columnaUrl]: nuevaUrl, [item.columnaPath]: nuevoPath })
      .eq("id", item.id)
      .eq(item.columnaPath, item.path)
      .select("id");
    if (error) throw new Error(`actualización de la base: ${error.message}`);
    if (!data || data.length !== 1) throw new Error("actualización de la base: la fila cambió o no existe");

    const resultado: Resultado = {
      estado: "migrada",
      nuevoPath,
      nuevaUrl,
      bytesAntes: original.length,
      bytesDespues: grande.length,
      bytesVariantes: archivos.slice(1).reduce((a, [, c]) => a + c.length, 0),
    };
    alMigrar(item, resultado);
    return resultado;
  } catch (e) {
    const aBorrar = subidos.filter((p) => p !== item.path);
    if (aBorrar.length > 0) await supabase.storage.from(BUCKET).remove(aBorrar);
    const resultado: Resultado = { estado: "fallida", error: e instanceof Error ? e.message : String(e) };
    alMigrar(item, resultado);
    return resultado;
  }
}

function crearRespaldo(items: Item[]): Respaldo {
  mkdirSync(CARPETA_RESPALDO, { recursive: true });
  const fecha = new Date().toISOString().replace(/[:.]/g, "-");
  const archivo = join(CARPETA_RESPALDO, `${fecha}.json`);
  const respaldo: Respaldo = {
    creado: new Date().toISOString(),
    archivo,
    entradas: items.map((i) => ({ clave: i.clave, tabla: i.tabla, id: i.id, columnaUrl: i.columnaUrl, columnaPath: i.columnaPath, accion: i.accion, anterior: { url: i.url, path: i.path }, resultado: null })),
  };
  guardarRespaldo(respaldo);
  return respaldo;
}

function guardarRespaldo(respaldo: Respaldo): void {
  writeFileSync(respaldo.archivo, JSON.stringify(respaldo, null, 2));
}

async function listarBucket(supabase: SupabaseClient, prefijo = ""): Promise<{ path: string; bytes: number }[]> {
  const archivos: { path: string; bytes: number }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefijo, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const entrada of data) {
      const path = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
      if (path === "objetos" || path.startsWith("objetos/")) continue;
      if (entrada.id === null) archivos.push(...(await listarBucket(supabase, path)));
      else if (entrada.name !== ".emptyFolderPlaceholder") archivos.push({ path, bytes: Number(entrada.metadata?.size ?? 0) });
    }
    if (data.length < 1000) break;
  }
  return archivos;
}

async function rutasReferenciadas(supabase: SupabaseClient): Promise<Set<string>> {
  const referenciadas = new Set<string>();
  const imagenes = await consultar<{ path: string }>(supabase.from("proyecto_imagenes").select("path"), "proyecto_imagenes");
  for (const { path } of imagenes) {
    referenciadas.add(path);
    for (const v of VARIANTES) referenciadas.add(rutaVariante(path, v));
  }
  const comparaciones = await consultar<{ antes_path: string; despues_path: string }>(supabase.from("proyecto_comparaciones").select("antes_path, despues_path"), "proyecto_comparaciones");
  for (const c of comparaciones) {
    referenciadas.add(c.antes_path);
    referenciadas.add(c.despues_path);
  }
  const sitio = await consultar<{ hero_path: string | null }>(supabase.from("sitio_config").select("hero_path"), "sitio_config");
  for (const s of sitio) if (s.hero_path) referenciadas.add(s.hero_path);
  return referenciadas;
}

function rutasDeRespaldos(): Set<string> {
  const rutas = new Set<string>();
  if (!existsSync(CARPETA_RESPALDO)) return rutas;
  for (const nombre of readdirSync(CARPETA_RESPALDO)) {
    if (!nombre.endsWith(".json")) continue;
    try {
      const respaldo = JSON.parse(readFileSync(join(CARPETA_RESPALDO, nombre), "utf8")) as Respaldo;
      for (const e of respaldo.entradas) if (e.resultado?.estado === "migrada") rutas.add(e.anterior.path);
    } catch {}
  }
  return rutas;
}

async function informarHuerfanos(supabase: SupabaseClient, conClaveDeServicio: boolean): Promise<void> {
  console.log("\n=== Archivos huérfanos (bucket proyectos, sin objetos/) ===");
  let archivos: { path: string; bytes: number }[];
  try {
    archivos = await listarBucket(supabase);
  } catch (e) {
    console.log(`  No se pudo listar el bucket: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  if (archivos.length === 0) {
    console.log(conClaveDeServicio ? "  El bucket no tiene archivos fuera de objetos/." : "  El listado volvió vacío. Con la clave anónima Storage puede no permitir listar el bucket; con --apply se usa la clave de servicio.");
    return;
  }
  const referenciadas = await rutasReferenciadas(supabase);
  const respaldos = rutasDeRespaldos();
  const huerfanos = archivos.filter((a) => !referenciadas.has(a.path));
  const originales = huerfanos.filter((a) => respaldos.has(a.path));
  const otros = huerfanos.filter((a) => !respaldos.has(a.path));
  console.log(`  ${archivos.length} archivos listados · ${huerfanos.length} sin referencia en la base`);
  if (originales.length > 0) {
    console.log(`  Originales conservados como respaldo de una migración: ${originales.length} (${mb(originales.reduce((a, o) => a + o.bytes, 0))})`);
  }
  for (const o of otros) console.log(`  ${mb(o.bytes).padStart(9)}  ${o.path}`);
  if (!conClaveDeServicio) {
    console.log("  Atención: con la clave anónima algunas filas (por ejemplo, de proyectos inactivos) pueden no ser visibles, y sus archivos aparecerían acá como huérfanos sin serlo.");
  }
}

async function revertir(supabase: SupabaseClient, archivo: string): Promise<void> {
  const ruta = existsSync(archivo) ? archivo : join(CARPETA_RESPALDO, archivo);
  if (!existsSync(ruta)) salir(`No existe el archivo de respaldo: ${archivo}`);
  const respaldo = JSON.parse(readFileSync(ruta, "utf8")) as Respaldo;
  let restauradas = 0;
  let omitidas = 0;
  const fallos: string[] = [];
  for (const e of respaldo.entradas) {
    if (e.resultado?.estado !== "migrada") {
      omitidas++;
      continue;
    }
    const { data, error } = await supabase
      .from(e.tabla)
      .update({ [e.columnaUrl]: e.anterior.url, [e.columnaPath]: e.anterior.path })
      .eq("id", e.id)
      .eq(e.columnaPath, e.resultado.nuevoPath)
      .select("id");
    if (error || !data || data.length !== 1) fallos.push(`${e.clave}: ${error?.message ?? "la fila ya no apunta a la versión migrada"}`);
    else restauradas++;
  }
  console.log(`\nReversión de ${ruta}`);
  console.log(`  Restauradas: ${restauradas} · sin cambios (no estaban migradas): ${omitidas} · fallidas: ${fallos.length}`);
  for (const f of fallos) console.log(`  - ${f}`);
  console.log("  Los archivos WebP nuevos no se borran; quedan como huérfanos y se pueden revisar con el modo --dry-run.");
}

async function main(): Promise<void> {
  const args = leerArgumentos(process.argv.slice(2));
  const env = leerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) salir("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local.");

  const escribe = args.aplicar || args.revertir !== null;
  if (escribe && !env.SUPABASE_SERVICE_ROLE_KEY) {
    salir("Este modo escribe en Supabase y necesita SUPABASE_SERVICE_ROLE_KEY en .env.local. No se hizo ningún cambio.");
  }
  if (!escribe && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) salir("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.");

  const supabase = crearCliente(url, escribe ? env.SUPABASE_SERVICE_ROLE_KEY : env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (args.revertir) {
    await revertir(supabase, args.revertir);
    return;
  }

  console.log(args.aplicar ? "Modo --apply: se van a escribir cambios en Storage y en la base." : "Modo de prueba (--dry-run): no se escribe nada.");
  const { items, proyectos } = await descubrir(supabase, args);
  await inspeccionar(items);
  aplicarLimite(items, args.limite);
  imprimirPlan(items, proyectos);

  const candidatos = items.filter((i) => i.accion !== "omitir");
  const pesoCandidatos = candidatos.reduce((a, i) => a + (i.bytes ?? 0), 0);
  console.log(`\n=== Plan ===`);
  console.log(`  Imágenes: ${items.length} · a migrar: ${candidatos.filter((i) => i.accion === "migrar").length} · solo variantes: ${candidatos.filter((i) => i.accion === "variantes").length} · omitidas: ${items.length - candidatos.length}`);
  console.log(`  Peso actual de todas: ${mb(items.reduce((a, i) => a + (i.bytes ?? 0), 0))} · de las que se procesarían: ${mb(pesoCandidatos)}`);

  if (!args.aplicar) {
    await informarHuerfanos(supabase, false);
    console.log("\nNo se escribió nada. Para aplicar: --apply (necesita SUPABASE_SERVICE_ROLE_KEY en .env.local).");
    return;
  }

  sharp.cache(false);
  const respaldo = crearRespaldo(candidatos);
  console.log(`\nRespaldo de los valores anteriores: ${respaldo.archivo}`);

  const resultados = await enParalelo(candidatos, CONCURRENCIA, (item) =>
    procesar(supabase, item, (i, r) => {
      const entrada = respaldo.entradas.find((e) => e.clave === i.clave);
      if (entrada) entrada.resultado = r;
      guardarRespaldo(respaldo);
      console.log(`  ${r.estado.padEnd(9)} ${i.etiqueta.padEnd(16)} ${posix.basename(i.path)}${r.estado === "fallida" ? ` → ${r.error}` : ""}`);
    })
  );

  const migradas = resultados.filter((r) => r.estado === "migrada");
  const variantes = resultados.filter((r) => r.estado === "variantes");
  const fallidas = candidatos.map((item, i) => ({ item, r: resultados[i] })).filter(({ r }) => r.estado === "fallida");
  const antes = migradas.reduce((a, r) => a + (r.estado === "migrada" ? r.bytesAntes : 0), 0);
  const despues = migradas.reduce((a, r) => a + (r.estado === "migrada" ? r.bytesDespues : 0), 0);
  const pesoVariantes = resultados.reduce((a, r) => a + (r.estado === "fallida" ? 0 : r.bytesVariantes), 0);

  console.log("\n=== Informe ===");
  console.log(`  Migradas: ${migradas.length} · solo variantes: ${variantes.length} · fallidas: ${fallidas.length} · omitidas: ${items.length - candidatos.length}`);
  console.log(`  Peso de las imágenes migradas: antes ${mb(antes)} → después ${mb(despues)} (más ${mb(pesoVariantes)} en variantes card/thumb)`);
  if (fallidas.length > 0) {
    console.log("  Fallos (no se tocó la base para estas imágenes y se borró lo que se había subido):");
    for (const { item, r } of fallidas) console.log(`  - ${item.etiqueta} ${item.path}: ${r.estado === "fallida" ? r.error : ""}`);
  }
  console.log(`  Respaldo: ${respaldo.archivo}`);
  console.log("  Los originales no se borraron de Storage.");
  await informarHuerfanos(supabase, true);
}

main().catch((e) => {
  console.error(`\nError inesperado: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
