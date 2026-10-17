import { notFound } from "next/navigation";
import { getAdminObjeto, getAdminObjetoCategorias } from "@/lib/admin/objetos";
import ObjetoForm from "../ObjetoForm";

export default async function EditarObjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [objeto, categorias] = await Promise.all([
    getAdminObjeto(id),
    getAdminObjetoCategorias(),
  ]);

  if (!objeto) {
    notFound();
  }

  return <ObjetoForm objeto={objeto} categorias={categorias} />;
}
