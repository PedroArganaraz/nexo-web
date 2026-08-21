import { createClient } from "@/lib/supabase/server";

export type HeroImage = {
  src: string;
  focalX: number;
  focalY: number;
  zoom: number;
  mobileFocalX: number;
  mobileFocalY: number;
  mobileZoom: number;
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
    // Fallback a 1 (sin zoom): la fila puede ser anterior a la migración
    // que agregó hero_zoom/hero_mobile_zoom.
    zoom: data.hero_zoom ?? 1,
    mobileFocalX: data.hero_mobile_focal_x,
    mobileFocalY: data.hero_mobile_focal_y,
    mobileZoom: data.hero_mobile_zoom ?? 1,
  };
}
