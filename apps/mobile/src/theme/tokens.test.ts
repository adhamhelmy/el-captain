import { colors } from './tokens';

describe('colors', () => {
  it('has the same tokens in both themes', () => {
    expect(Object.keys(colors.light).sort()).toEqual(Object.keys(colors.dark).sort());
  });

  it('uses the web palette', () => {
    expect(colors.dark.bg).toBe('#131417');
    expect(colors.dark.accent).toBe('#d7ff3d');
    expect(colors.light.bg).toBe('#f6f6f2');
    expect(colors.light.accentText).toBe('#4d6b00');
  });
});
