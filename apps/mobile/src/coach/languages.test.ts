import { SPOKEN_LANGUAGES } from '@el-captain/rules/profile-rules';
import { languageName } from './languages';

describe('languageName', () => {
  it('names every spoken language in English and Arabic', () => {
    for (const code of SPOKEN_LANGUAGES) {
      expect(languageName(code, 'en')).not.toBe(code);
      expect(languageName(code, 'ar')).not.toBe(code);
    }
    expect(languageName('fr', 'en')).toBe('French');
    expect(languageName('fr', 'ar')).toBe('الفرنسية');
  });
  it('falls back to the code for anything else', () => {
    expect(languageName('xx', 'en')).toBe('xx');
  });
});
