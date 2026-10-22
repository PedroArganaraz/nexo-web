const formateador = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export const PRECIO_MAXIMO = 1_000_000_000;

export function formatearNumero(valor: number): string {
  return formateador.format(valor);
}

export function formatearPrecio(valor: number): string {
  return `$${formateador.format(valor)}`;
}

export function normalizarPrecio(
  valor: number | string | null | undefined
): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}
