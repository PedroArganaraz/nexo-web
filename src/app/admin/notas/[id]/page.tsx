import { notFound } from "next/navigation";
import { getNota } from "@/lib/admin/notas";
import NotaForm from "../NotaForm";

export default async function EditarNotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nota = await getNota(id);

  if (!nota) {
    notFound();
  }

  return <NotaForm nota={nota} />;
}
