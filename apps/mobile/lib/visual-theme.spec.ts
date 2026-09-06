import { getVisualTheme, getVisualThemeForGender, getVisualThemeKey } from './visual-theme';

describe('visual theme policy', () => {
  it('maps only female gender to the feminine presentation theme', () => {
    expect(getVisualThemeKey('female')).toBe('feminine');
    expect(getVisualThemeKey('male')).toBe('default');
    expect(getVisualThemeKey('other')).toBe('default');
    expect(getVisualThemeKey('prefer_not_to_say')).toBe('default');
    expect(getVisualThemeKey('')).toBe('default');
  });

  it('returns stable distinct palettes without changing business semantics', () => {
    const defaultTheme = getVisualTheme('default');
    const feminineTheme = getVisualTheme('feminine');
    expect(defaultTheme.key).toBe('default');
    expect(feminineTheme.key).toBe('feminine');
    expect(defaultTheme.colors.canvas).not.toBe(feminineTheme.colors.canvas);
    expect(defaultTheme.colors.primary).not.toBe(feminineTheme.colors.primary);
  });

  it('derives the same theme through the gender helper', () => {
    expect(getVisualThemeForGender('female').key).toBe('feminine');
    expect(getVisualThemeForGender('male').key).toBe('default');
  });
});
