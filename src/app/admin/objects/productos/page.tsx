import Link from "next/link";
import { getAdminObjetoCategorias, getAdminObjetos } from "@/lib/admin/objetos";
import { TODAS_LAS_CATEGORIAS } from "@/lib/objetos-constantes";
import ObjetosTable from "./ObjetosTable";

export default async function AdminObjetosProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ categoria }, categorias, objetos] = await Promise.all([
    searchParams,
    getAdminObjetoCategorias(),
    getAdminObjetos(),
  ]);

  if (categorias.length === 0) {
    return (
      <div className="bg-white border border-[#e0e0e0] rounded-sm px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          Para cargar productos primero tenés que crear una categoría.
        </p>
        <Link
          href="/admin/objects/categorias"
          className="inline-flex min-h-10 items-center mt-4 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200"
        >
          Ir a categorías
        </Link>
      </div>
    );
  }

  const pedida = typeof categoria === "string" ? categoria : undefined;
  const seleccion =
    pedida &&
    (pedida === TODAS_LAS_CATEGORIAS || categorias.some((c) => c.id === pedida))
      ? pedida
      : categorias[0].id;

  return (
    <ObjetosTable
      categorias={categorias}
      initialObjetos={objetos}
      initialSeleccion={seleccion}
    />
  );
}
