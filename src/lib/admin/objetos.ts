import { createClient } from "@/lib/supabase/server";
import { elegirPortada } from "@/lib/objetos";
import { normalizarPrecio } from "@/lib/precio";
import type { Objeto, ObjetoCategoria, ObjetoImagen } from "@/types/database";

export type AdminObjetoCategoria = ObjetoCategoria & {
  totalObjetos: number;
  objetosActivos: number;
};

export type AdminObjeto = Objeto & {
  coverImage: { src: string; alt: string; focalX: number; focalY: number } | null;
  categoriaNombre: string;
};

export type AdminObjetoConImagenes = Objeto & {
  imagenes: ObjetoImagen[];
};

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
  }));
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

  return objetos.map((objeto) => {
    const portada = elegirPortada(imagenesPorObjeto.get(objeto.id) ?? []);
    return {
      ...objeto,
      precio: normalizarPrecio(objeto.precio),
      coverImage: portada
        ? {
            src: portada.url,
            alt: objeto.nombre,
            focalX: portada.focal_x,
            focalY: portada.focal_y,
          }
        : null,
      categoriaNombre: categoriaPorId.get(objeto.categoria_id) ?? "Sin categoría",
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

  return {
    ...objeto,
    precio: normalizarPrecio(objeto.precio),
    imagenes: imagenes ?? [],
  };
}
