import { createClient } from "@/lib/supabase/server";

export type HeroImage = {
  src: string;
  focalX: number;
  focalY: number;
};

export async function getHeroImage(): Promise<HeroImage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sitio_config")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data || !data.hero_url) {
    return null;
  }

  return {
    src: data.hero_url,
    focalX: data.hero_focal_x,
    focalY: data.hero_focal_y,
  };
}
