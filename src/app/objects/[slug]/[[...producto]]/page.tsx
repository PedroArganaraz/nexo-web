import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import ObjetosGrid from "@/components/objects/ObjetosGrid";
import { getObjetoCategoriaPorSlug, getObjetoPorSlug } from "@/lib/objetos";
import { rutaObjeto } from "@/lib/objetos-links";
import { formatearPrecio } from "@/lib/precio";
import type { NexoObject, ObjectCategoryDetail } from "@/types";

type Params = Promise<{ slug: string; producto?: string[] }>;

type Vista =
  | { tipo: "no-encontrado" }
  | { tipo: "redirigir"; destino: string }
  | { tipo: "ok"; categoria: ObjectCategoryDetail; objeto: NexoObject | null };

const MAX_DESCRIPCION = 160;

async function cargarVista(params: Params): Promise<Vista> {
  const { slug, producto } = await params;

  if (producto && producto.length > 1) {
    return { tipo: "no-encontrado" };
  }

  const productoSlug = producto?.[0];

  if (productoSlug) {
    const referencia = await getObjetoPorSlug(productoSlug);
    if (!referencia) {
      return { tipo: "no-encontrado" };
    }
    if (referencia.categoriaSlug !== slug) {
      return {
        tipo: "redirigir",
        destino: rutaObjeto(referencia.categoriaSlug, referencia.slug),
      };
    }
  }

  const categoria = await getObjetoCategoriaPorSlug(slug);
  if (!categoria) {
    return { tipo: "no-encontrado" };
  }

  if (!productoSlug) {
    return { tipo: "ok", categoria, objeto: null };
  }

  const objeto = categoria.objects.find((item) => item.slug === productoSlug);
  return objeto
    ? { tipo: "ok", categoria, objeto }
    : { tipo: "no-encontrado" };
}

function recortar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const ultimoEspacio = corte.lastIndexOf(" ");
  const base = ultimoEspacio > max * 0.6 ? corte.slice(0, ultimoEspacio) : corte;
  return `${base.replace(/[\s.,;:]+$/, "")}…`;
}

function metadataDeObjeto(
  objeto: NexoObject,
  categoria: ObjectCategoryDetail
): Metadata {
  const ruta = rutaObjeto(categoria.slug, objeto.slug);
  const title = `${objeto.name} | Nexo Objects`;
  const texto =
    objeto.description.replace(/\s+/g, " ").trim() ||
    `${objeto.name}, de la categoría ${categoria.name}. Objetos de diseño seleccionados por Nexo Estudio.`;
  const description = recortar(
    objeto.price !== null
      ? `Precio: ${formatearPrecio(objeto.price)}. ${texto}`
      : texto,
    MAX_DESCRIPCION
  );
  const imagen = objeto.coverImage.src
    ? { url: objeto.coverImage.src, alt: objeto.name }
    : null;

  return {
    title,
    description,
    alternates: { canonical: ruta },
    openGraph: {
      type: "website",
      url: ruta,
      title,
      description,
      ...(imagen ? { images: [imagen] } : {}),
    },
    twitter: {
      card: imagen ? "summary_large_image" : "summary",
      title,
      description,
      ...(imagen ? { images: [imagen.url] } : {}),
    },
  };
}

function metadataDeCategoria(categoria: ObjectCategoryDetail): Metadata {
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

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const vista = await cargarVista(params);

  if (vista.tipo !== "ok") {
    return { title: "Nexo Objects" };
  }

  return vista.objeto
    ? metadataDeObjeto(vista.objeto, vista.categoria)
    : metadataDeCategoria(vista.categoria);
}

export default async function ObjetoCategoriaPage({
  params,
}: {
  params: Params;
}) {
  const vista = await cargarVista(params);

  if (vista.tipo === "no-encontrado") {
    notFound();
  }

  if (vista.tipo === "redirigir") {
    permanentRedirect(vista.destino);
  }

  const { categoria } = vista;

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

          <ObjetosGrid
            objetos={categoria.objects}
            categoria={categoria.name}
            categoriaSlug={categoria.slug}
            subcategorias={categoria.subcategories}
          />
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
