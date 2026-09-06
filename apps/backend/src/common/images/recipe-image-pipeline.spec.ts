import sharp from 'sharp';
import {
  compressRecipeImage,
  RECIPE_IMAGE_MAX_BYTES,
} from './recipe-image-pipeline.js';

describe('recipe image pipeline', () => {
  it('always returns WebP at or below the hard byte limit', async () => {
    const width = 1600;
    const height = 1200;
    const raw = Buffer.alloc(width * height * 3);

    for (let i = 0; i < raw.length; i += 3) {
      raw[i] = i % 251;
      raw[i + 1] = (i / 3) % 251;
      raw[i + 2] = (i / 7) % 251;
    }

    const input = await sharp(raw, {
      raw: { width, height, channels: 3 },
    })
      .png()
      .toBuffer();

    const result = await compressRecipeImage(input);

    expect(result.mimeType).toBe('image/webp');
    expect(result.byteSize).toBeLessThanOrEqual(RECIPE_IMAGE_MAX_BYTES);
    expect(result.buffer.byteLength).toBe(result.byteSize);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  }, 20000);

  it('rejects empty input instead of producing a bogus image', async () => {
    await expect(compressRecipeImage(Buffer.alloc(0))).rejects.toThrow(
      'non-empty Buffer',
    );
  });
});
