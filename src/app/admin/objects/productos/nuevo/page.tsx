import { getAdminObjetoCategorias } from "@/lib/admin/objetos";
import ObjetoForm from "../ObjetoForm";

export default async function NuevoObjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ categoria }, categorias] = await Promise.all([
    searchParams,
    getAdminObjetoCategorias(),
  ]);

  const initialCategoriaId =
    typeof categoria === "string" && categorias.some((c) => c.id === categoria)
      ? categoria
      : undefined;

  return (
    <ObjetoForm
      categorias={categorias}
      initialCategoriaId={initialCategoriaId}
    />
  );
}
