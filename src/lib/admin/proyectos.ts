import { createClient } from "@/lib/supabase/server";
import type { Proyecto } from "@/types/database";

export type AdminProyecto = Proyecto & {
  coverImage: { src: string; alt: string } | null;
};

export async function getAdminProyectos(): Promise<AdminProyecto[]> {
  const supabase = await createClient();

  const { data: proyectos, error: proyectosError } = await supabase
    .from("proyectos")
    .select("*")
    .order("orden", { ascending: true });

  if (proyectosError || !proyectos) {
    return [];
  }

  const { data: portadas } = await supabase
    .from("proyecto_imagenes")
    .select("*")
    .eq("es_portada", true);

  const portadaPorProyecto = new Map(
    (portadas ?? []).map((imagen) => [imagen.proyecto_id, imagen])
  );

  return proyectos.map((proyecto) => {
    const portada = portadaPorProyecto.get(proyecto.id);
    return {
      ...proyecto,
      coverImage: portada
        ? { src: portada.url, alt: proyecto.nombre }
        : null,
    };
  });
}
