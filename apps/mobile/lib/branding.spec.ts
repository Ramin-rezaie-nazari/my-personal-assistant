import { BRAND, BRAND_NAME, BRAND_TAGLINE } from './branding';

describe('branding contract', () => {
  it('exposes the canonical product identity', () => {
    expect(BRAND_NAME).toBe('My Personal Assistant');
    expect(BRAND_TAGLINE).toBe('Your day. Your goals. Your assistant.');
    expect(BRAND.colors.primaryStrong).toBe('#7C3AED');
    expect(BRAND.colors.cyan).toBe('#22D3EE');
    expect(BRAND.colors.startup).toBe('#070B1A');
  });
});
