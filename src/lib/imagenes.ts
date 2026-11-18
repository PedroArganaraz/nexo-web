const LADO_MAXIMO = 1920;
const CALIDAD_WEBP = 0.82;
const CALIDAD_JPEG = 0.82;

const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function comprimirImagen(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const escala = Math.min(
      1,
      LADO_MAXIMO / Math.max(bitmap.width, bitmap.height)
    );
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, ancho, alto);
    let tipo = "image/webp";
    let blob = await canvasToBlob(canvas, tipo, CALIDAD_WEBP);

    if (!blob || blob.type !== tipo) {
      context.clearRect(0, 0, ancho, alto);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, ancho, alto);
      context.drawImage(bitmap, 0, 0, ancho, alto);
      tipo = "image/jpeg";
      blob = await canvasToBlob(canvas, tipo, CALIDAD_JPEG);
    }

    if (!blob || blob.type !== tipo || blob.size >= file.size) {
      return file;
    }

    const nombreBase = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return new File([blob], `${nombreBase}.${EXTENSION_POR_TIPO[tipo]}`, {
      type: tipo,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export const CACHE_IMAGENES_SEGUNDOS = "31536000";

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
