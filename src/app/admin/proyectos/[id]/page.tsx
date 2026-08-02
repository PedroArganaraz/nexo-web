import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProyectoForm from "../ProyectoForm";

export default async function EditarProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proyecto, error: proyectoError } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (proyectoError || !proyecto) {
    notFound();
  }

  const { data: imagenes } = await supabase
    .from("proyecto_imagenes")
    .select("*")
    .eq("proyecto_id", id)
    .order("orden", { ascending: true });

  return <ProyectoForm proyecto={{ ...proyecto, imagenes: imagenes ?? [] }} />;
}
