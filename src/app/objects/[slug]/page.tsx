import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import ObjetosGrid from "@/components/objects/ObjetosGrid";
import { getObjetoCategoriaPorSlug } from "@/lib/objetos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = await getObjetoCategoriaPorSlug(slug);

  if (!categoria) {
    return { title: "Nexo Objects" };
  }

  const title = `${categoria.name} | Nexo Objects`;
  const description = `${categoria.name}: objetos de diseño seleccionados por Nexo Estudio. Consultá por WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(categoria.image
        ? { images: [{ url: categoria.image.src, alt: categoria.name }] }
        : {}),
    },
  };
}

export default async function ObjetoCategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoria = await getObjetoCategoriaPorSlug(slug);

  if (!categoria) {
    notFound();
  }

  return (
    <>
      <Navbar solid />
      <main className="pt-16">
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-16 md:pt-16 md:pb-28">
          <Link
            href="/objects"
            className="inline-flex min-h-10 items-center gap-2 text-sm text-text-secondary hover:text-[#1a1a1a] transition-colors duration-200"
          >
            <span aria-hidden="true">←</span>
            Nexo Objects
          </Link>

          <h1 className="mt-4 mb-10 md:mb-16 font-helvetica font-bold text-[#1a1a1a] text-3xl md:text-4xl leading-tight break-words">
            {categoria.name}
          </h1>

          <ObjetosGrid objetos={categoria.objects} categoria={categoria.name} />
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
