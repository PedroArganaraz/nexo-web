import { createClient } from "@/lib/supabase/server";
import type { Nota } from "@/types/database";

export async function getNotas(): Promise<Nota[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notas")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getNota(id: string): Promise<Nota | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
