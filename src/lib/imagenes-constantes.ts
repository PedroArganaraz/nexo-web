export const LADO_MAXIMO_GRANDE = 1920;
export const LADO_MAXIMO_CARD = 1280;
export const LADO_MAXIMO_THUMB = 320;

export const CALIDAD_WEBP = 0.82;
export const CALIDAD_JPEG = 0.82;

export const CACHE_IMAGENES_SEGUNDOS = "31536000";

export const SUFIJOS_VARIANTE = {
  card: "-card",
  thumb: "-thumb",
} as const;

export type Variante = keyof typeof SUFIJOS_VARIANTE;

export const LADO_MAXIMO_VARIANTE: Record<Variante, number> = {
  card: LADO_MAXIMO_CARD,
  thumb: LADO_MAXIMO_THUMB,
};

export function rutaVariante(path: string, variante: Variante): string {
  const sufijo = SUFIJOS_VARIANTE[variante];
  const punto = path.lastIndexOf(".");
  const barra = path.lastIndexOf("/");
  if (punto <= barra) return `${path}${sufijo}`;
  return `${path.slice(0, punto)}${sufijo}${path.slice(punto)}`;
}

export function urlVariante(url: string, variante: Variante): string {
  const corte = url.search(/[?#]/);
  if (corte === -1) return rutaVariante(url, variante);
  return `${rutaVariante(url.slice(0, corte), variante)}${url.slice(corte)}`;
}

export function rutasConVariantes(path: string): string[] {
  return [path, rutaVariante(path, "card"), rutaVariante(path, "thumb")];
}
