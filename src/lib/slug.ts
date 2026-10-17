export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugUnico(base: string, existentes: Iterable<string>): string {
  const usados = new Set(existentes);
  if (!usados.has(base)) return base;

  let sufijo = 2;
  while (usados.has(`${base}-${sufijo}`)) {
    sufijo += 1;
  }
  return `${base}-${sufijo}`;
}
