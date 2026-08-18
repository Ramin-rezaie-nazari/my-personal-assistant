import sharp from "sharp";

export type ImageVariant = {
  buffer: Buffer;
  mimeType: "image/webp" | "image/avif";
  byteSize: number;
  width: number;
  height: number;
};

const MAX_BYTES = 60 * 1024;

/**
 * Compress a recipe image for mobile delivery.
 * The routine progressively lowers quality and dimensions until it reaches
 * the target byte budget, while preserving enough detail for food/fitness UI.
 */
export async function compressRecipeImage(input: Buffer): Promise<ImageVariant> {
  const dimensionSteps = [960, 800, 720, 640, 576, 512, 448];
  const qualitySteps = [70, 64, 58, 52, 46, 40, 34, 30];

  let best: ImageVariant | null = null;

  for (const width of dimensionSteps) {
    for (const quality of qualitySteps) {
      const buffer = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();

      const metadata = await sharp(buffer).metadata();
      const candidate: ImageVariant = {
        buffer,
        mimeType: "image/webp",
        byteSize: buffer.byteLength,
        width: metadata.width ?? width,
        height: metadata.height ?? width,
      };

      if (!best || candidate.byteSize < best.byteSize) best = candidate;
      if (candidate.byteSize <= MAX_BYTES) return candidate;
    }
  }

  if (!best) throw new Error("Unable to encode recipe image");
  return best;
}

export const RECIPE_IMAGE_MAX_BYTES = MAX_BYTES;
