import { getCategorias } from "@/lib/admin/categorias";
import ProyectoForm from "../ProyectoForm";

export default async function NuevoProyectoPage() {
  const categorias = await getCategorias();

  return <ProyectoForm categorias={categorias} />;
}
