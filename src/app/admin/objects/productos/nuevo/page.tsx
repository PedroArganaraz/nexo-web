import {
  getAdminObjetoCategorias,
  getAdminSubcategoriasPorCategoria,
} from "@/lib/admin/objetos";
import ObjetoForm from "../ObjetoForm";

export default async function NuevoObjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ categoria }, categorias, subcategorias] = await Promise.all([
    searchParams,
    getAdminObjetoCategorias(),
    getAdminSubcategoriasPorCategoria(),
  ]);

  const initialCategoriaId =
    typeof categoria === "string" && categorias.some((c) => c.id === categoria)
      ? categoria
      : undefined;

  return (
    <ObjetoForm
      categorias={categorias}
      subcategorias={subcategorias}
      initialCategoriaId={initialCategoriaId}
    />
  );
}
