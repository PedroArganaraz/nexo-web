import { createClient } from "@/lib/supabase/server";
import type { Proyecto } from "@/types/database";

export type AdminProyecto = Proyecto & {
  coverImage: { src: string; alt: string } | null;
  categoriaNombre: string;
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

  const { data: categorias } = await supabase.from("categorias").select("*");

  const portadaPorProyecto = new Map(
    (portadas ?? []).map((imagen) => [imagen.proyecto_id, imagen])
  );
  const categoriaPorId = new Map(
    (categorias ?? []).map((categoria) => [categoria.id, categoria.nombre])
  );

  return proyectos.map((proyecto) => {
    const portada = portadaPorProyecto.get(proyecto.id);
    return {
      ...proyecto,
      coverImage: portada
        ? { src: portada.url, alt: proyecto.nombre }
        : null,
      categoriaNombre: proyecto.categoria_id
        ? categoriaPorId.get(proyecto.categoria_id) ?? "Sin categoría"
        : "Sin categoría",
    };
  });
}
