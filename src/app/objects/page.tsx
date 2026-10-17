import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import CategoriasGrid from "@/components/objects/CategoriasGrid";
import { getObjetoCategoriasVisibles } from "@/lib/objetos";

export const metadata: Metadata = {
  title: "Nexo Objects | NEXO",
  description:
    "Objetos de diseño seleccionados por Nexo Estudio para habitar tus espacios.",
};

export default async function ObjectsPage() {
  const categorias = await getObjetoCategoriasVisibles();

  return (
    <>
      <Navbar solid />
      <main className="pt-16">
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 md:pt-24 md:pb-28">
          <h1 className="font-helvetica font-bold text-[#1a1a1a] text-4xl md:text-6xl leading-tight">
            Nexo Objects
          </h1>

          {categorias.length === 0 ? (
            <div className="mt-10 md:mt-16 rounded-2xl border border-dashed border-gray-200 bg-bg-alt px-6 py-20 md:py-28 flex items-center justify-center text-center">
              <p className="text-xl md:text-3xl tracking-[0.2em] uppercase text-text-secondary">
                Próximamente
              </p>
            </div>
          ) : (
            <>
              <div className="mt-10 md:mt-16">
                <CategoriasGrid categorias={categorias} />
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
