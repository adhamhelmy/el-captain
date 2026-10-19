import { uiFont } from './tokens';

describe('uiFont', () => {
  it('uses Space Grotesk in English and Cairo in Arabic', () => {
    expect(uiFont(false, 'semibold')).toBe('SpaceGrotesk_600SemiBold');
    expect(uiFont(true, 'semibold')).toBe('Cairo_700Bold');
    expect(uiFont(false, 'regular')).toBe('SpaceGrotesk_400Regular');
    expect(uiFont(true, 'regular')).toBe('Cairo_500Medium');
  });
});
