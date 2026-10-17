import { getAdminObjetoCategorias } from "@/lib/admin/objetos";
import ObjetoCategoriasTable from "./ObjetoCategoriasTable";

export default async function AdminObjetoCategoriasPage() {
  const categorias = await getAdminObjetoCategorias();
  const dataKey = categorias
    .map(
      (c) =>
        `${c.id}:${c.orden}:${c.activo}:${c.objetosActivos}:${c.totalObjetos}:${c.nombre}:${c.imagen_url}:${c.focal_x}:${c.focal_y}`
    )
    .join("|");

  return <ObjetoCategoriasTable key={dataKey} initialCategorias={categorias} />;
}
