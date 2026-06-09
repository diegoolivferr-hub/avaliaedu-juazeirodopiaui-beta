export async function fileToDownscaledDataUrl(
  file: File,
  maxDim = 1200,
  quality = 0.88,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return await readAsDataUrl(file);
  }
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  if (ratio === 1) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}

export async function imageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  const img = await loadImage(src);
  return { width: img.width, height: img.height };
}
