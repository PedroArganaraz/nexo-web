import { getAdminProyectos } from "@/lib/admin/proyectos";
import ProyectosTable from "./ProyectosTable";

export default async function AdminProyectosPage() {
  const proyectos = await getAdminProyectos();

  return <ProyectosTable initialProyectos={proyectos} />;
}
