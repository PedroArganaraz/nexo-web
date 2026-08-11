import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";
import type {
  Proyecto,
  ProyectoComparacion,
  ProyectoImagen,
} from "@/types/database";

function mapProyectoToProject(
  proyecto: Proyecto,
  imagenes: ProyectoImagen[],
  categoriaNombre: string,
  comparaciones: ProyectoComparacion[]
): Project {
  const sorted = [...imagenes].sort((a, b) => a.orden - b.orden);
  const portada = sorted.find((img) => img.es_portada) ?? sorted[0];
  const sortedComparaciones = [...comparaciones].sort(
    (a, b) => a.orden - b.orden
  );

  return {
    id: proyecto.id,
    title: proyecto.nombre,
    subtitle: proyecto.subtitulo,
    category: categoriaNombre,
    description: proyecto.descripcion,
    coverImage: portada
      ? {
          src: portada.url,
          alt: proyecto.nombre,
          focalX: portada.focal_x,
          focalY: portada.focal_y,
        }
      : { src: "", alt: proyecto.nombre },
    galleryImages: sorted.map((img) => ({
      src: img.url,
      alt: proyecto.nombre,
      focalX: img.focal_x,
      focalY: img.focal_y,
    })),
    stage: proyecto.estado,
    year: proyecto.anio ?? undefined,
    comparisons:
      sortedComparaciones.length > 0
        ? sortedComparaciones.map((c) => ({
            antesUrl: c.antes_url,
            despuesUrl: c.despues_url,
          }))
        : undefined,
  };
}

export async function getProyectos(): Promise<Project[]> {
  const supabase = await createClient();

  const { data: proyectos, error: proyectosError } = await supabase
    .from("proyectos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (proyectosError || !proyectos || proyectos.length === 0) {
    return [];
  }

  const { data: imagenes, error: imagenesError } = await supabase
    .from("proyecto_imagenes")
    .select("*")
    .order("orden", { ascending: true });

  if (imagenesError) {
    return [];
  }

  const { data: categorias } = await supabase.from("categorias").select("*");

  const { data: comparaciones } = await supabase
    .from("proyecto_comparaciones")
    .select("*")
    .order("orden", { ascending: true });

  const categoriaPorId = new Map(
    (categorias ?? []).map((categoria) => [categoria.id, categoria.nombre])
  );

  const imagenesPorProyecto = new Map<string, ProyectoImagen[]>();
  for (const imagen of imagenes ?? []) {
    const list = imagenesPorProyecto.get(imagen.proyecto_id) ?? [];
    list.push(imagen);
    imagenesPorProyecto.set(imagen.proyecto_id, list);
  }

  const comparacionesPorProyecto = new Map<string, ProyectoComparacion[]>();
  for (const comparacion of comparaciones ?? []) {
    const list = comparacionesPorProyecto.get(comparacion.proyecto_id) ?? [];
    list.push(comparacion);
    comparacionesPorProyecto.set(comparacion.proyecto_id, list);
  }

  return proyectos.map((proyecto) =>
    mapProyectoToProject(
      proyecto,
      imagenesPorProyecto.get(proyecto.id) ?? [],
      (proyecto.categoria_id && categoriaPorId.get(proyecto.categoria_id)) ||
        "",
      comparacionesPorProyecto.get(proyecto.id) ?? []
    )
  );
}
