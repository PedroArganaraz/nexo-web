import { createClient } from "@/lib/supabase/server";
import type { SitioConfig } from "@/types/database";

export async function getSitioConfig(): Promise<SitioConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sitio_config")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
