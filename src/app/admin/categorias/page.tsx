import { getCategorias } from "@/lib/admin/categorias";
import CategoriasTable from "./CategoriasTable";

export default async function AdminCategoriasPage() {
  const categorias = await getCategorias();

  return <CategoriasTable initialCategorias={categorias} />;
}
