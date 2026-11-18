import {
  CACHE_IMAGENES_SEGUNDOS,
  CALIDAD_JPEG,
  CALIDAD_WEBP,
  LADO_MAXIMO_GRANDE,
  LADO_MAXIMO_VARIANTE,
  SUFIJOS_VARIANTE,
} from "@/lib/imagenes-constantes";

export {
  rutaVariante,
  rutasConVariantes,
  urlVariante,
  type Variante,
} from "@/lib/imagenes-constantes";

const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export type VersionesImagen = {
  grande: File;
  card: File | null;
  thumb: File | null;
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function abrirImagen(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
}

async function codificar(
  bitmap: ImageBitmap,
  ladoMaximo: number,
  tipo: string
): Promise<Blob | null> {
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const context = canvas.getContext("2d");
  if (!context) return null;

  if (tipo === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, ancho, alto);
  }
  context.drawImage(bitmap, 0, 0, ancho, alto);

  const calidad = tipo === "image/jpeg" ? CALIDAD_JPEG : CALIDAD_WEBP;
  const blob = await canvasToBlob(canvas, tipo, calidad);
  return blob && blob.type === tipo ? blob : null;
}

async function codificarPreferido(
  bitmap: ImageBitmap,
  ladoMaximo: number
): Promise<Blob | null> {
  return (
    (await codificar(bitmap, ladoMaximo, "image/webp")) ??
    (await codificar(bitmap, ladoMaximo, "image/jpeg"))
  );
}

function aArchivo(blob: Blob, nombreOriginal: string, sufijo: string): File {
  const nombreBase = nombreOriginal.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${nombreBase}${sufijo}.${EXTENSION_POR_TIPO[blob.type]}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

export async function comprimirImagen(file: File): Promise<File> {
  const bitmap = await abrirImagen(file);
  if (!bitmap) return file;

  try {
    const blob = await codificarPreferido(bitmap, LADO_MAXIMO_GRANDE);
    if (!blob || blob.size >= file.size) return file;
    return aArchivo(blob, file.name, "");
  } finally {
    bitmap.close();
  }
}

export async function generarVersionesImagen(
  file: File
): Promise<VersionesImagen> {
  const bitmap = await abrirImagen(file);
  if (!bitmap) return { grande: file, card: null, thumb: null };

  try {
    const recodificada = await codificarPreferido(bitmap, LADO_MAXIMO_GRANDE);
    const conservarOriginal =
      Boolean(EXTENSION_POR_TIPO[file.type]) &&
      (!recodificada || recodificada.size >= file.size);

    if (conservarOriginal) {
      const card = await codificar(bitmap, LADO_MAXIMO_VARIANTE.card, file.type);
      const thumb = await codificar(bitmap, LADO_MAXIMO_VARIANTE.thumb, file.type);
      if (card && thumb) {
        return {
          grande: file,
          card: aArchivo(card, file.name, SUFIJOS_VARIANTE.card),
          thumb: aArchivo(thumb, file.name, SUFIJOS_VARIANTE.thumb),
        };
      }
    }

    if (!recodificada) return { grande: file, card: null, thumb: null };

    const card = await codificar(
      bitmap,
      LADO_MAXIMO_VARIANTE.card,
      recodificada.type
    );
    const thumb = await codificar(
      bitmap,
      LADO_MAXIMO_VARIANTE.thumb,
      recodificada.type
    );
    return {
      grande: aArchivo(recodificada, file.name, ""),
      card: card ? aArchivo(card, file.name, SUFIJOS_VARIANTE.card) : null,
      thumb: thumb ? aArchivo(thumb, file.name, SUFIJOS_VARIANTE.thumb) : null,
    };
  } finally {
    bitmap.close();
  }
}

export function extensionDeImagen(file: File): string {
  return (
    EXTENSION_POR_TIPO[file.type] ??
    file.name.split(".").pop()?.toLowerCase() ??
    "jpg"
  );
}

export function opcionesDeSubida() {
  return { cacheControl: CACHE_IMAGENES_SEGUNDOS, upsert: false };
}

export function precargarImagen(
  url: string,
  prioridad: "high" | "low" | "auto" = "low"
): void {
  const imagen = new window.Image();
  imagen.decoding = "async";
  imagen.fetchPriority = prioridad;
  imagen.src = url;
}
