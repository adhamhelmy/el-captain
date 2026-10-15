import { describe, expect, it, vi } from 'vitest';
import { bodyFor, filledSteps, formOf, leaveStep, savedBodiesOf, submitBlocked, type Form } from './wizard-form';

const form: Form = {
  photoUrl: 'https://blob/x.jpg',
  address: 'Zamalek, Cairo',
  bio: 'Ten years of boxing.',
  birthDate: '',
  gender: '',
  languages: [],
  instagram: 'mona',
  tiktok: '',
  links: [],
  sports: [{ id: 's1', nameEn: 'Boxing', nameAr: null, status: 'APPROVED' }],
  certifications: [],
  private: { on: false, price: '', duration: '' },
};

describe('leaveStep', () => {
  it('saves the step being left when it changed, whichever way the coach leaves', async () => {
    const saved = savedBodiesOf(form);
    const save = vi.fn(async () => true);
    const edited = { ...form, bio: 'Twelve years of boxing.' };
    expect(await leaveStep(1, edited, saved, save)).toBe(true);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ city: 'Zamalek, Cairo', bio: 'Twelve years of boxing.' }));
  });

  it("doesn't save an untouched step again", async () => {
    const saved = savedBodiesOf(form);
    const save = vi.fn(async () => true);
    expect(await leaveStep(2, form, saved, save)).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps the coach on the step when saving fails, and tries again next time', async () => {
    const saved = savedBodiesOf(form);
    const save = vi.fn(async () => false);
    const edited = { ...form, sports: [] };
    expect(await leaveStep(3, edited, saved, save)).toBe(false);
    save.mockResolvedValue(true);
    expect(await leaveStep(3, edited, saved, save)).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    // Saved now, so leaving again does nothing.
    expect(await leaveStep(3, edited, saved, save)).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('has nothing to save on locations, certifications and review', async () => {
    const save = vi.fn(async () => true);
    for (const s of [4, 5, 7] as const) expect(await leaveStep(s, form, {}, save)).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });
});

describe('bodyFor', () => {
  it('sends a newly uploaded photo with the first step', () => {
    expect(bodyFor(1, { ...form, photoPath: 'coaches/k1/photo/a.jpg' })).toMatchObject({ photoPath: 'coaches/k1/photo/a.jpg' });
  });
});

describe('the about you step', () => {
  it('saves the optional birth date, gender and languages, sending blanks as cleared', () => {
    expect(bodyFor(1, { ...form, birthDate: '1990-01-15', gender: 'MALE', languages: ['ar', 'en'] })).toMatchObject({
      birthDate: '1990-01-15',
      gender: 'MALE',
      languages: ['ar', 'en'],
    });
    expect(bodyFor(1, form)).toMatchObject({ birthDate: null, gender: null, languages: [] });
  });
});

describe('the private sessions step', () => {
  const on = { on: true, price: '600', duration: '60' };

  it('saves price and length as numbers when on, and clears both when off', () => {
    expect(bodyFor(6, { ...form, private: on })).toEqual({ privatePrice: 600, privateDuration: 60 });
    expect(bodyFor(6, { ...form, private: { ...on, on: false } })).toEqual({ privatePrice: null, privateDuration: null });
  });

  it('ticks in the rail once switched on', () => {
    expect(filledSteps(form).has(6)).toBe(false);
    expect(filledSteps({ ...form, private: on }).has(6)).toBe(true);
  });
});

describe('formOf', () => {
  it('shows saved social links as handles and the city as the address', () => {
    const coach = {
      photoUrl: null,
      city: 'Maadi, Cairo',
      bio: null,
      instagram: 'https://www.instagram.com/mona',
      tiktok: 'https://www.tiktok.com/@mona',
      links: [],
      sports: [],
      certifications: [],
    };
    expect(formOf({ coach, missing: [], reason: null } as any)).toMatchObject({ address: 'Maadi, Cairo', instagram: 'mona', tiktok: 'mona' });
  });
});

describe('submitBlocked', () => {
  it('disables Submit on the review step while anything required is missing', () => {
    expect(submitBlocked(7, ['photo'])).toBe(true);
    expect(submitBlocked(7, ['address', 'locations'])).toBe(true);
    expect(submitBlocked(7, [])).toBe(false);
  });
  it('never blocks Continue on the other steps', () => {
    expect(submitBlocked(1, ['photo', 'bio'])).toBe(false);
  });
});

describe('filledSteps', () => {
  it('ticks socials and certifications only once they hold something', () => {
    expect([...filledSteps({ ...form, instagram: '' })]).toEqual([]);
    expect([...filledSteps(form)]).toEqual([2]);
    expect([...filledSteps({ ...form, instagram: '', certifications: [{ id: 'c1' } as never] })]).toEqual([5]);
  });
});
