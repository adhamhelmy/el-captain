import { birthDateInvalid } from '@el-captain/rules/coach-form';
import { MAX_AGE, MIN_AGE, SPOKEN_LANGUAGES, type Gender } from '@el-captain/rules/profile-rules';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { typedDate } from '@/account/typed-date';
import { useLocale } from '@/i18n/IntlProvider';
import { Chip } from '@/ui/Chip';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';
import { languageName } from './languages';

const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

export type Personal = { birthDate: string; gender: Gender | ''; languages: string[] };

/** The web's PersonalFields and LanguagePicker for coaches: optional birth date (typed) and gender, and spoken languages. */
export function PersonalFields({ value, onChange, hint }: { value: Personal; onChange: (v: Personal) => void; hint: string }) {
  const t = useTranslations('profile');
  const td = useTranslations('data');
  const { locale } = useLocale();
  // The field shows what was typed; the form gets it as YYYY-MM-DD once readable (Arabic digits, missing zeros).
  const [typed, setTyped] = useState(value.birthDate);
  const invalid = birthDateInvalid(value.birthDate);
  const toggle = (code: string) =>
    onChange({ ...value, languages: value.languages.includes(code) ? value.languages.filter((c) => c !== code) : [...value.languages, code] });

  return (
    <View style={styles.wrap}>
      <TextField
        label={t('birthDate')}
        value={typed}
        onChangeText={(raw) => {
          setTyped(raw);
          onChange({ ...value, birthDate: typedDate(raw) ?? raw });
        }}
        keyboardType="numbers-and-punctuation"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        style={ltr}
        hint={hint}
        error={invalid ? t('birthDateRule', { min: MIN_AGE, max: MAX_AGE }) : null}
      />
      <View style={styles.group}>
        <Text variant="label">{t('gender')}</Text>
        <Segmented
          label={t('gender')}
          value={value.gender || 'unset'}
          onChange={(g) => onChange({ ...value, gender: g === 'unset' ? '' : g })}
          options={[
            { value: 'unset' as const, label: t('genderUnset') },
            { value: 'MALE' as const, label: td('gender.MALE') },
            { value: 'FEMALE' as const, label: td('gender.FEMALE') },
          ]}
        />
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
