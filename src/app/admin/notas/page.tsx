import { getNotas } from "@/lib/admin/notas";
import NotasGrid from "./NotasGrid";

export default async function AdminNotasPage() {
  const notas = await getNotas();

  return <NotasGrid initialNotas={notas} />;
}
