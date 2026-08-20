import { getSitioConfig } from "@/lib/admin/sitio-config";
import PortadaForm from "./PortadaForm";

export default async function AdminPortadaPage() {
  const sitioConfig = await getSitioConfig();

  return <PortadaForm sitioConfig={sitioConfig} />;
}
