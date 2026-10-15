'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import { birthDateOk, GENDERS, MAX_AGE, MIN_AGE, SPOKEN_LANGUAGES, type Gender } from '@/lib/shared/profile-rules';
import onb from './onboarding.module.css';

export type Personal = { birthDate: string; gender: Gender | '' };

/** A typed birth date that can't be saved; a blank one is fine, the field is optional. */
export const birthDateInvalid = (birthDate: string) => birthDate !== '' && !birthDateOk(birthDate);

/** Optional birth date and gender, for the member and coach profile pages. `hint` says who sees them. */
export function PersonalFields({ value, onChange, hint }: Readonly<{ value: Personal; onChange: (v: Personal) => void; hint: string }>) {
  const t = useTranslations('profile');
  const td = useTranslations('data');
  const invalid = birthDateInvalid(value.birthDate);
  return (
    <div className='fields'>
      <Field label={t('birthDate')}>
        <input className='input' type='date' dir='ltr' value={value.birthDate} onChange={(e) => onChange({ ...value, birthDate: e.target.value })} />
        <div className={invalid ? onb.error : `muted ${onb.hint}`}>{invalid ? t('birthDateRule', { min: MIN_AGE, max: MAX_AGE }) : hint}</div>
      </Field>
      <Field label={t('gender')}>
        <select className='input' value={value.gender} onChange={(e) => onChange({ ...value, gender: e.target.value as Gender | '' })}>
          <option value=''>{t('genderUnset')}</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {td(`gender.${g}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

/** A language's name in the viewer's language, e.g. "French" or "الفرنسية". */
export function useLanguageName() {
  const locale = useLocale();
  const names = new Intl.DisplayNames([locale], { type: 'language' });
  return (code: string) => names.of(code) ?? code;
}

/** Toggle chips for the languages a coach speaks. */
export function LanguagePicker({ selected, onChange }: Readonly<{ selected: string[]; onChange: (codes: string[]) => void }>) {
  const name = useLanguageName();
  const toggle = (code: string) => onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  return (
    <div className='chips'>
      {SPOKEN_LANGUAGES.map((code) => (
        <button
          key={code}
          type='button'
          className={selected.includes(code) ? 'chip on' : 'chip'}
          aria-pressed={selected.includes(code)}
          onClick={() => toggle(code)}
        >
          {name(code)}
        </button>
      ))}
    </div>
  );
}
