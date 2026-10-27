import { birthDateInvalid } from '@el-captain/rules/coach-form';
import { wallClock } from '@el-captain/rules/app-time';
import { MAX_AGE, MIN_AGE, SPOKEN_LANGUAGES, type Gender } from '@el-captain/rules/profile-rules';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useLocale } from '@/i18n/IntlProvider';
import { addYears } from '@/ui/calendar';
import { Chip } from '@/ui/Chip';
import { DateField } from '@/ui/DateField';
import { Text } from '@/ui/Text';
import { languageName } from './languages';

export type Personal = { birthDate: string; gender: Gender | ''; languages: string[] };

/** The web's PersonalFields and LanguagePicker for coaches: optional birth date (picked on a calendar) and gender, and spoken languages. */
export function PersonalFields({ value, onChange, hint }: Readonly<{ value: Personal; onChange: (v: Personal) => void; hint: string }>) {
  const t = useTranslations('profile');
  const td = useTranslations('data');
  const { locale } = useLocale();
  const today = wallClock(new Date()).date;
  const invalid = birthDateInvalid(value.birthDate);
  const toggle = (code: string) =>
    onChange({ ...value, languages: value.languages.includes(code) ? value.languages.filter((c) => c !== code) : [...value.languages, code] });

  return (
    <View style={styles.wrap}>
      <DateField
        label={t('birthDate')}
        value={value.birthDate}
        onChange={(birthDate) => onChange({ ...value, birthDate })}
        today={today}
        min={addYears(today, -MAX_AGE)}
        max={addYears(today, -MIN_AGE)}
        hint={hint}
        error={invalid ? t('birthDateRule', { min: MIN_AGE, max: MAX_AGE }) : null}
      />
      <View style={styles.group}>
        <Text variant="label">{t('gender')}</Text>
        {/* Chips, not a segmented control: "Prefer not to say" needs more room than a third of the row. */}
        <View style={styles.chips}>
          {(['MALE', 'FEMALE', 'unset'] as const).map((g) => (
            <Chip
              key={g}
              label={g === 'unset' ? t('genderUnset') : td(`gender.${g}`)}
              on={(value.gender || 'unset') === g}
              onPress={() => onChange({ ...value, gender: g === 'unset' ? '' : g })}
            />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="label">{t('languages')}</Text>
        <View style={styles.chips}>
          {SPOKEN_LANGUAGES.map((code) => (
            <Chip key={code} label={languageName(code, locale)} on={value.languages.includes(code)} onPress={() => toggle(code)} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  group: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
