import {
  getAdminObjetoCategorias,
  getAdminSubcategoriasPorCategoria,
} from "@/lib/admin/objetos";
import ObjetoCategoriasTable from "./ObjetoCategoriasTable";

export default async function AdminObjetoCategoriasPage() {
  const [categorias, subcategorias] = await Promise.all([
    getAdminObjetoCategorias(),
    getAdminSubcategoriasPorCategoria(),
  ]);
  const dataKey = categorias
    .map(
      (c) =>
        `${c.id}:${c.orden}:${c.activo}:${c.objetosActivos}:${c.totalObjetos}:${c.nombre}:${c.imagen_url}:${c.focal_x}:${c.focal_y}:${c.totalSubcategorias}`
    )
    .join("|")
    .concat(
      "#",
      Object.values(subcategorias)
        .flat()
        .map((sub) => `${sub.id}:${sub.nombre}:${sub.orden}`)
        .join("|")
    );

  return (
    <ObjetoCategoriasTable
      key={dataKey}
      initialCategorias={categorias}
      initialSubcategorias={subcategorias}
    />
  );
}
