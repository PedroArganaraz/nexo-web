export function rutaCategoriaObjetos(categoriaSlug: string): string {
  return `/objects/${categoriaSlug}`;
}

export function rutaObjeto(categoriaSlug: string, objetoSlug: string): string {
  return `/objects/${categoriaSlug}/${objetoSlug}`;
}
