import { createClient } from "@/lib/supabase/server";
import { elegirPortada } from "@/lib/objetos";
import type { Objeto, ObjetoCategoria } from "@/types/database";

export type AdminObjetoCategoria = ObjetoCategoria & {
  totalObjetos: number;
  objetosActivos: number;
};

export type AdminObjeto = Objeto & {
  coverImage: { src: string; alt: string } | null;
  categoriaNombre: string;
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
    .select("objeto_id, url, orden, es_portada")
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
    { objeto_id: string; url: string; orden: number; es_portada: boolean }[]
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
      coverImage: portada ? { src: portada.url, alt: objeto.nombre } : null,
      categoriaNombre: categoriaPorId.get(objeto.categoria_id) ?? "Sin categoría",
    };
  });
}
