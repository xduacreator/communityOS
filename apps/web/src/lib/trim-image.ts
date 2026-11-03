/**
 * Crops empty margins off a logo before upload. The site shows logos at a
 * fixed height, so transparent (or plain white) padding inside the file
 * would make the visible artwork smaller. Returns the original file when
 * there is nothing to trim or the image can't be read (e.g. SVG).
 */
export async function trimImageMargins(file: File, padding = 2): Promise<File> {
  if (!/^image\/(png|webp|jpeg)$/.test(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const { width, height } = bitmap;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  // The top-left pixel tells what the margin is: transparent, plain white, or
  // (anything else) artwork that reaches the edge, which is left alone
  const transparentBg = data[3] < 16;
  const whiteBg = !transparentBg && data[0] > 244 && data[1] > 244 && data[2] > 244;
  if (!transparentBg && !whiteBg) return file;
  const isEmpty = (i: number) =>
    data[i + 3] < 16 || (whiteBg && data[i] > 244 && data[i + 1] > 244 && data[i + 2] > 244);

  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isEmpty((y * width + x) * 4)) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return file; // fully empty image

  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  const w = right - left + 1;
  const h = bottom - top + 1;
  if (w === width && h === height) return file;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  // PNG keeps transparency; JPEG input stays JPEG
  const type = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, type, 0.95));
  if (!blob) return file;
  const name = file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".jpg");
  return new File([blob], name, { type });
}
