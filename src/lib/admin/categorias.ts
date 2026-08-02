import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "@/types/database";

export async function getCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}
