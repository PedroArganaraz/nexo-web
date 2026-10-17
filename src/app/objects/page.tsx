import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
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
            <ul className="mt-10 md:mt-16 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {categorias.map((categoria) => (
                <li key={categoria.id}>
                  <Link
                    href={`/objects/${categoria.slug}`}
                    className="group relative block aspect-square overflow-hidden bg-bg-alt"
                  >
                    {categoria.image ? (
                      <>
                        <Image
                          src={categoria.image.src}
                          alt={categoria.image.alt}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          style={{
                            objectPosition: `${categoria.image.focalX ?? 50}% ${
                              categoria.image.focalY ?? 50
                            }%`,
                          }}
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-80" />
                      </>
                    ) : null}
                    <span
                      className={`absolute inset-x-0 bottom-0 p-3 md:p-5 font-helvetica font-semibold text-sm md:text-lg leading-snug uppercase tracking-wide break-words ${
                        categoria.image ? "text-white" : "text-[#1a1a1a]"
                      }`}
                    >
                      {categoria.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
