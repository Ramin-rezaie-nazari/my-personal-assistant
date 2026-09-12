import sharp from 'sharp';

export type ImageVariant = {
  buffer: Buffer;
  mimeType: 'image/webp';
  byteSize: number;
  width: number;
  height: number;
};

export const RECIPE_IMAGE_MAX_BYTES = 60 * 1024;

// Prefer a genuinely usable image over an ultra-small blurry thumbnail.
// Keep the fallback ladder bounded because this runs on an upload hot path.
const DIMENSION_STEPS = [768, 640, 512, 448, 384, 320];
const QUALITY_STEPS = [60, 40, 25];

export async function compressRecipeImage(input: Buffer): Promise<ImageVariant> {
  if (!Buffer.isBuffer(input) || input.length === 0) {
    throw new Error('Recipe image input must be a non-empty Buffer');
  }

  // Preserve quality first: for each quality level, keep the largest
  // resolution that fits the hard byte limit instead of accepting a tiny
  // image merely because it compresses sooner.
  for (const quality of QUALITY_STEPS) {
    for (const width of DIMENSION_STEPS) {
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
