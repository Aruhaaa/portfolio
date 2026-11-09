import { createHash } from 'node:crypto';
import sharp from 'sharp';

export const MAX_UPLOAD = 3 * 1024 * 1024; // Vercel allows about 4.5 MB per request
const MAX_WIDTH = 1400;

export class ImageError extends Error {}

/**
 * Checks an uploaded screenshot and shrinks it: at most 1400 px wide, saved as WebP.
 * A full-page PNG of 1.4 MB comes out around 50 KB, which keeps the pages and the film fast.
 */
export async function prepareImage(file: File): Promise<{ data: Buffer; mime: string; hash: string }> {
  if (file.size > MAX_UPLOAD) throw new ImageError('The screenshot is bigger than 3 MB.');
  const input = Buffer.from(await file.arrayBuffer());

  try {
    const meta = await sharp(input).metadata();
    if (!meta.format || !['png', 'jpeg', 'webp'].includes(meta.format)) {
      throw new ImageError('Use a JPG, PNG or WebP screenshot.');
    }
    const data = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    return { data, mime: 'image/webp', hash: createHash('sha1').update(data).digest('hex') };
  } catch (err) {
    if (err instanceof ImageError) throw err;
    throw new ImageError('That file could not be read as an image.');
  }
}
