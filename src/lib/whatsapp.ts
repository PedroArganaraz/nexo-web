export const WHATSAPP_NUMERO = "5493512540654";

export function whatsappHref(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
