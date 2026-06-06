/* ===========================================================
   Client-side image compression — runs in the browser BEFORE upload.
   Downscales very large photos and re-encodes as JPEG, so stored
   files are lighter (= faster to load later) and never hit the
   upload size ceiling. Small photos are returned untouched.
   =========================================================== */

export async function compressImage(file, { maxDim = 1600, quality = 0.85 } = {}) {
  // Only rasterizable images; leave SVG (vector) and non-images alone.
  if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  // Tiny files: not worth touching.
  if (file.size < 300 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // flatten any transparency to white (product photos)
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close && bitmap.close();

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    // Keep the original if compression didn't actually help (no quality loss for free).
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (e) {
    return file; // any failure → upload the original
  }
}
