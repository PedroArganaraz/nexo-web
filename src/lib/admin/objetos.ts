import { createClient } from "@/lib/supabase/server";
import { elegirPortada } from "@/lib/objetos";
import { normalizarPrecio } from "@/lib/precio";
import type {
  Objeto,
  ObjetoCategoria,
  ObjetoImagen,
  ObjetoSubcategoria,
} from "@/types/database";

export type AdminObjetoCategoria = ObjetoCategoria & {
  totalObjetos: number;
  objetosActivos: number;
  totalSubcategorias: number;
};

type DatosInternos = {
  costo: number | null;
  proveedor: string | null;
};

export type AdminObjeto = Objeto &
  DatosInternos & {
    coverImage: { src: string; alt: string; focalX: number; focalY: number } | null;
    categoriaNombre: string;
    subcategoriaNombre: string | null;
  };

export type AdminObjetoConImagenes = Objeto &
  DatosInternos & {
    imagenes: ObjetoImagen[];
    subcategoriaNombre: string | null;
  };

export type SubcategoriasPorCategoria = Record<string, ObjetoSubcategoria[]>;

export async function getAdminObjetoCategorias(): Promise<
  AdminObjetoCategoria[]
> {
  const supabase = await createClient();

  const { data: categorias, error: categoriasError } = await supabase
    .from("objeto_categorias")
    .select("*")
    .order("orden", { ascending: true });

  if (categoriasError || !categorias) {
    return [];
  }

  const { data: objetos, error: objetosError } = await supabase
    .from("objetos")
    .select("categoria_id, activo");

  if (objetosError || !objetos) {
    return [];
  }

  const { data: subcategorias, error: subcategoriasError } = await supabase
    .from("objeto_subcategorias")
    .select("categoria_id");

  if (subcategoriasError || !subcategorias) {
    return [];
  }

  const subcategoriasPorCategoria = new Map<string, number>();
  for (const subcategoria of subcategorias) {
    subcategoriasPorCategoria.set(
      subcategoria.categoria_id,
      (subcategoriasPorCategoria.get(subcategoria.categoria_id) ?? 0) + 1
    );
  }

  const totalPorCategoria = new Map<string, number>();
  const activosPorCategoria = new Map<string, number>();
  for (const objeto of objetos) {
    totalPorCategoria.set(
      objeto.categoria_id,
      (totalPorCategoria.get(objeto.categoria_id) ?? 0) + 1
    );
    if (objeto.activo) {
      activosPorCategoria.set(
        objeto.categoria_id,
        (activosPorCategoria.get(objeto.categoria_id) ?? 0) + 1
      );
    }
  }

  return categorias.map((categoria) => ({
    ...categoria,
    totalObjetos: totalPorCategoria.get(categoria.id) ?? 0,
    objetosActivos: activosPorCategoria.get(categoria.id) ?? 0,
    totalSubcategorias: subcategoriasPorCategoria.get(categoria.id) ?? 0,
  }));
}

export async function getAdminSubcategorias(
  categoriaId: string
): Promise<ObjetoSubcategoria[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objeto_subcategorias")
    .select("*")
    .eq("categoria_id", categoriaId)
    .order("orden", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getAdminSubcategoriasPorCategoria(): Promise<SubcategoriasPorCategoria> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objeto_subcategorias")
    .select("*")
    .order("orden", { ascending: true });

  if (error || !data) {
    return {};
  }

  const agrupadas: SubcategoriasPorCategoria = {};
  for (const subcategoria of data) {
    (agrupadas[subcategoria.categoria_id] ??= []).push(subcategoria);
  }
  return agrupadas;
}

async function getDatosInternos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Map<string, DatosInternos>> {
  if (ids.length === 0) return new Map();

  const { data } = await supabase
    .from("objeto_datos_internos")
    .select("objeto_id, costo, proveedor")
    .in("objeto_id", ids);

  return new Map(
    (data ?? []).map((fila) => [
      fila.objeto_id,
      { costo: normalizarPrecio(fila.costo), proveedor: fila.proveedor ?? null },
    ])
  );
}

async function getNombresSubcategorias(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const { data } = await supabase
    .from("objeto_subcategorias")
    .select("id, nombre")
    .in("id", ids);

  return new Map((data ?? []).map((sub) => [sub.id, sub.nombre]));
}

export async function getAdminObjetos(
  categoriaId?: string
): Promise<AdminObjeto[]> {
  const supabase = await createClient();

  let query = supabase
    .from("objetos")
    .select("*")
    .order("orden", { ascending: true });

  if (categoriaId) {
    query = query.eq("categoria_id", categoriaId);
  }

  const { data: objetos, error: objetosError } = await query;

  if (objetosError || !objetos || objetos.length === 0) {
    return [];
  }

  const { data: imagenes } = await supabase
    .from("objeto_imagenes")
    .select("objeto_id, url, orden, es_portada, focal_x, focal_y")
    .in(
      "objeto_id",
      objetos.map((objeto) => objeto.id)
    );

  const { data: categorias } = await supabase
    .from("objeto_categorias")
    .select("id, nombre")
    .in("id", [...new Set(objetos.map((objeto) => objeto.categoria_id))]);

  const imagenesPorObjeto = new Map<
    string,
    Pick<
      ObjetoImagen,
      "objeto_id" | "url" | "orden" | "es_portada" | "focal_x" | "focal_y"
    >[]
  >();
  for (const imagen of imagenes ?? []) {
    const list = imagenesPorObjeto.get(imagen.objeto_id) ?? [];
    list.push(imagen);
    imagenesPorObjeto.set(imagen.objeto_id, list);
  }

  const categoriaPorId = new Map(
    (categorias ?? []).map((categoria) => [categoria.id, categoria.nombre])
  );

  const subcategoriaPorId = await getNombresSubcategorias(supabase, [
    ...new Set(
      objetos
        .map((objeto) => objeto.subcategoria_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]);

  const datosInternos = await getDatosInternos(
    supabase,
    objetos.map((objeto) => objeto.id)
  );

  return objetos.map((objeto) => {
    const portada = elegirPortada(imagenesPorObjeto.get(objeto.id) ?? []);
    const internos = datosInternos.get(objeto.id);
    return {
      ...objeto,
      precio: normalizarPrecio(objeto.precio),
      costo: internos?.costo ?? null,
      proveedor: internos?.proveedor ?? null,
      coverImage: portada
        ? {
            src: portada.url,
            alt: objeto.nombre,
            focalX: portada.focal_x,
            focalY: portada.focal_y,
          }
        : null,
      categoriaNombre: categoriaPorId.get(objeto.categoria_id) ?? "Sin categoría",
      subcategoriaNombre: objeto.subcategoria_id
        ? subcategoriaPorId.get(objeto.subcategoria_id) ?? null
        : null,
    };
  });
}

export async function getAdminObjeto(
  id: string
): Promise<AdminObjetoConImagenes | null> {
  const supabase = await createClient();

  const { data: objeto, error: objetoError } = await supabase
    .from("objetos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (objetoError || !objeto) {
    return null;
  }

  const { data: imagenes, error: imagenesError } = await supabase
    .from("objeto_imagenes")
    .select("*")
    .eq("objeto_id", id)
    .order("orden", { ascending: true });

  if (imagenesError) {
    return null;
  }

  const subcategoriaPorId = await getNombresSubcategorias(
    supabase,
    objeto.subcategoria_id ? [objeto.subcategoria_id] : []
  );
  const internos = (await getDatosInternos(supabase, [objeto.id])).get(
    objeto.id
  );

  return {
    ...objeto,
    precio: normalizarPrecio(objeto.precio),
    costo: internos?.costo ?? null,
    proveedor: internos?.proveedor ?? null,
    imagenes: imagenes ?? [],
    subcategoriaNombre: objeto.subcategoria_id
      ? subcategoriaPorId.get(objeto.subcategoria_id) ?? null
      : null,
  };
}
