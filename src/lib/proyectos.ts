import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";
import type { Proyecto, ProyectoImagen } from "@/types/database";

function mapProyectoToProject(
  proyecto: Proyecto,
  imagenes: ProyectoImagen[]
): Project {
  const sorted = [...imagenes].sort((a, b) => a.orden - b.orden);
  const portada = sorted.find((img) => img.es_portada) ?? sorted[0];

  return {
    id: proyecto.id,
    title: proyecto.nombre,
    subtitle: proyecto.subtitulo,
    category: proyecto.categoria,
    description: proyecto.descripcion,
    coverImage: portada
      ? { src: portada.url, alt: proyecto.nombre }
      : { src: "", alt: proyecto.nombre },
    galleryImages: sorted.map((img) => ({
      src: img.url,
      alt: proyecto.nombre,
    })),
  };
}

export async function getProyectos(): Promise<Project[]> {
  const supabase = await createClient();

  const { data: proyectos, error: proyectosError } = await supabase
    .from("proyectos")
    .select("*")
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

  const imagenesPorProyecto = new Map<string, ProyectoImagen[]>();
  for (const imagen of imagenes ?? []) {
    const list = imagenesPorProyecto.get(imagen.proyecto_id) ?? [];
    list.push(imagen);
    imagenesPorProyecto.set(imagen.proyecto_id, list);
  }

  return proyectos.map((proyecto) =>
    mapProyectoToProject(proyecto, imagenesPorProyecto.get(proyecto.id) ?? [])
  );
}
