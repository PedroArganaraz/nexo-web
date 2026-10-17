import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  NexoObject,
  ObjectCategory,
  ObjectCategoryDetail,
} from "@/types";
import type { Objeto, ObjetoCategoria, ObjetoImagen } from "@/types/database";

export function elegirPortada<T extends Pick<ObjetoImagen, "orden" | "es_portada">>(
  imagenes: T[]
): T | undefined {
  const sorted = [...imagenes].sort((a, b) => a.orden - b.orden);
  return sorted.find((img) => img.es_portada) ?? sorted[0];
}

function mapObjetoCategoriaToObjectCategory(
  categoria: ObjetoCategoria
): ObjectCategory {
  return {
    id: categoria.id,
    name: categoria.nombre,
    slug: categoria.slug,
    image: categoria.imagen_url
      ? {
          src: categoria.imagen_url,
          alt: categoria.nombre,
          focalX: categoria.focal_x,
          focalY: categoria.focal_y,
        }
      : null,
  };
}

function mapObjetoToNexoObject(
  objeto: Objeto,
  imagenes: ObjetoImagen[]
): NexoObject {
  const sorted = [...imagenes].sort((a, b) => a.orden - b.orden);
  const portada = elegirPortada(sorted);

  return {
    id: objeto.id,
    name: objeto.nombre,
    description: objeto.descripcion,
    coverImage: portada
      ? {
          src: portada.url,
          alt: objeto.nombre,
          focalX: portada.focal_x,
          focalY: portada.focal_y,
        }
      : { src: "", alt: objeto.nombre },
    galleryImages: sorted.map((img) => ({
      src: img.url,
      alt: objeto.nombre,
      focalX: img.focal_x,
      focalY: img.focal_y,
    })),
  };
}

export async function getObjetoCategoriasVisibles(): Promise<ObjectCategory[]> {
  const supabase = await createClient();

  const { data: categorias, error: categoriasError } = await supabase
    .from("objeto_categorias")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (categoriasError || !categorias || categorias.length === 0) {
    return [];
  }

  const { data: objetos, error: objetosError } = await supabase
    .from("objetos")
    .select("categoria_id")
    .eq("activo", true)
    .in(
      "categoria_id",
      categorias.map((categoria) => categoria.id)
    );

  if (objetosError || !objetos) {
    return [];
  }

  const categoriasConObjetos = new Set(
    objetos.map((objeto) => objeto.categoria_id)
  );

  return categorias
    .filter((categoria) => categoriasConObjetos.has(categoria.id))
    .map(mapObjetoCategoriaToObjectCategory);
}

export const getObjetoCategoriaPorSlug = cache(async function (
  slug: string
): Promise<ObjectCategoryDetail | null> {
  const supabase = await createClient();

  const { data: categoria, error: categoriaError } = await supabase
    .from("objeto_categorias")
    .select("*")
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();

  if (categoriaError || !categoria) {
    return null;
  }

  const { data: objetos, error: objetosError } = await supabase
    .from("objetos")
    .select("*")
    .eq("categoria_id", categoria.id)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (objetosError || !objetos || objetos.length === 0) {
    return null;
  }

  const { data: imagenes, error: imagenesError } = await supabase
    .from("objeto_imagenes")
    .select("*")
    .in(
      "objeto_id",
      objetos.map((objeto) => objeto.id)
    )
    .order("orden", { ascending: true });

  if (imagenesError) {
    return null;
  }

  const imagenesPorObjeto = new Map<string, ObjetoImagen[]>();
  for (const imagen of imagenes ?? []) {
    const list = imagenesPorObjeto.get(imagen.objeto_id) ?? [];
    list.push(imagen);
    imagenesPorObjeto.set(imagen.objeto_id, list);
  }

  return {
    ...mapObjetoCategoriaToObjectCategory(categoria),
    objects: objetos.map((objeto) =>
      mapObjetoToNexoObject(objeto, imagenesPorObjeto.get(objeto.id) ?? [])
    ),
  };
});
