import { getAdminObjetoCategorias } from "@/lib/admin/objetos";
import ObjetoCategoriasTable from "./ObjetoCategoriasTable";

export default async function AdminObjetoCategoriasPage() {
  const categorias = await getAdminObjetoCategorias();

  return <ObjetoCategoriasTable initialCategorias={categorias} />;
}
