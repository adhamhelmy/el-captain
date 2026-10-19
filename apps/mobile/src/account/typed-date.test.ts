import { typedDate, typedTime } from './typed-date';

describe('typedDate', () => {
  it('reads Arabic and Persian digits and pads short parts', () => {
    expect(typedDate('٢٠٢٦-١٠-٢٥')).toBe('2026-10-25');
    expect(typedDate('۲۰۲۶-۱۰-۵')).toBe('2026-10-05');
    expect(typedDate('2026-1-5')).toBe('2026-01-05');
  });

  it('is null for anything that is not a year, month and day', () => {
    expect(typedDate('25/10/2026')).toBeNull();
    expect(typedDate('')).toBeNull();
  });
});

describe('typedTime', () => {
  it('reads Arabic digits and single-digit hours', () => {
    expect(typedTime('١٨:٠٠')).toBe('18:00');
    expect(typedTime('6:05')).toBe('06:05');
  });

  it('is null for something that is not hours and minutes', () => {
    expect(typedTime('6pm')).toBeNull();
    expect(typedTime('25:00')).toBeNull();
  });
});
