import sharp from 'sharp';

export type ImageVariant = {
  buffer: Buffer;
  mimeType: 'image/webp';
  byteSize: number;
  width: number;
  height: number;
};

export const RECIPE_IMAGE_MAX_BYTES = 60 * 1024;

// Keep the fallback ladder intentionally small: image compression is on a hot
// path and the hard byte limit is more important than trying dozens of encodes.
const DIMENSION_STEPS = [768, 640, 512, 448, 384, 320];
const QUALITY_STEPS = [60, 40, 25];

export async function compressRecipeImage(input: Buffer): Promise<ImageVariant> {
  if (!Buffer.isBuffer(input) || input.length === 0) {
    throw new Error('Recipe image input must be a non-empty Buffer');
  }

  for (const width of DIMENSION_STEPS) {
    for (const quality of QUALITY_STEPS) {
      const buffer = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();

      if (buffer.byteLength > RECIPE_IMAGE_MAX_BYTES) continue;

      const metadata = await sharp(buffer).metadata();
      return {
        buffer,
        mimeType: 'image/webp',
        byteSize: buffer.byteLength,
        width: metadata.width ?? width,
        height: metadata.height ?? width,
      };
    }
  }

  throw new Error(
    `Unable to compress recipe image under ${RECIPE_IMAGE_MAX_BYTES} bytes`,
  );
}
