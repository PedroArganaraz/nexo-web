const LADO_MAXIMO = 1920;
const CALIDAD_WEBP = 0.82;

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
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await canvasToBlob(canvas, "image/webp", CALIDAD_WEBP);
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
    return file;
  }

  const nombreBase = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${nombreBase}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
