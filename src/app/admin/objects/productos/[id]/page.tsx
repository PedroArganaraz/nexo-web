import { notFound } from "next/navigation";
import {
  getAdminObjeto,
  getAdminObjetoCategorias,
  getAdminSubcategoriasPorCategoria,
} from "@/lib/admin/objetos";
import ObjetoForm from "../ObjetoForm";

export default async function EditarObjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [objeto, categorias, subcategorias] = await Promise.all([
    getAdminObjeto(id),
    getAdminObjetoCategorias(),
    getAdminSubcategoriasPorCategoria(),
  ]);

  if (!objeto) {
    notFound();
  }

  return (
    <ObjetoForm
      objeto={objeto}
      categorias={categorias}
      subcategorias={subcategorias}
    />
  );
}
