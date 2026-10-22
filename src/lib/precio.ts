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

const formateadorPorcentaje = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatearPorcentaje(valor: number): string {
  return `${formateadorPorcentaje.format(valor)}%`;
}

export function formatearImporte(valor: number): string {
  return valor < 0 ? `-${formatearPrecio(-valor)}` : formatearPrecio(valor);
}

export function montoDesdeDigitos(digitos: string): number | null {
  return digitos === "" ? null : Number(digitos);
}

export function montoValido(monto: number | null): boolean {
  return (
    monto === null ||
    (Number.isInteger(monto) && monto > 0 && monto < PRECIO_MAXIMO)
  );
}

export function calcularBeneficio(
  precio: number | null,
  costo: number | null
): { beneficio: number; margen: number } | null {
  if (precio === null || costo === null || precio <= 0) return null;
  const beneficio = precio - costo;
  return { beneficio, margen: (beneficio / precio) * 100 };
}
