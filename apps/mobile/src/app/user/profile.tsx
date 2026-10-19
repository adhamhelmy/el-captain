import { wallClock } from '@el-captain/rules/app-time';
import { NAME_MAX, sportName } from '@el-captain/rules/coach-rules';
import { MAX_FAVOURITE_SPORTS } from '@el-captain/rules/member-rules';
import { MAX_AGE, MIN_AGE, type Gender } from '@el-captain/rules/profile-rules';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Settings } from '@/account/Settings';
import { profileProblems } from '@/account/rules';
import { typedDate } from '@/account/typed-date';
import { api, ApiError } from '@/api/client';
import type { Member, Sport } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { addYears } from '@/ui/calendar';
import { Chip } from '@/ui/Chip';
import { DateField } from '@/ui/DateField';
import { Screen } from '@/ui/Screen';
import { FadeIn, FormSkeleton, Loading } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

type Form = {
  name: string;
  phone: string;
  birthDate: string;
  gender: Gender | '';
};
const formOf = (m: Member): Form => ({
  name: m.name,
  phone: m.phone ?? '',
  birthDate: m.birthDate ?? '',
  gender: m.gender ?? '',
});
const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

/** Mirrors the web's /user/profile: details, favourite sports, then settings. */
export default function Profile() {
  const t = useTranslations('profile');
  const today = wallClock(new Date()).date;
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const td = useTranslations('data');
  const f = useFormatter();
  const { locale } = useLocale();
  const { colors } = useTheme();

  const [me, setMe] = useState<Member | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [form, setForm] = useState<Form>({
    name: '',
    phone: '',
    birthDate: '',
    gender: '',
  });
  const [favs, setFavs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Member>('/api/users/me')
      .then((m) => {
        setMe(m);
        setForm(formOf(m));
        setFavs(m.sports.map((s) => s.id));
      })
      .catch((e) => setError(te(e instanceof ApiError && e.code === 'network' ? 'network' : 'generic')));
    api<Sport[]>('/api/sports')
      .then(setSports)
      .catch(() => setSports([]));
  }, [te]);
  useEffect(load, [load]);

  const problems = profileProblems(form);
  const edit = (patch: Partial<Form>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };
  const toggleFav = (id: string) => {
    if (!favs.includes(id) && favs.length >= MAX_FAVOURITE_SPORTS) return setError(t('favouritesMax', { max: MAX_FAVOURITE_SPORTS }));
    setFavs(favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]);
    setSaved(false);
    setError(null);
  };

  async function save() {
    setSaved(false);
    if (Object.keys(problems).length) return setError(t('fixFields'));
    setBusy(true);
    setError(null);
    try {
      const m = await api<Member>('/api/users/me', {
        method: 'PATCH',
        json: {
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          birthDate: form.birthDate ? typedDate(form.birthDate) : null,
          gender: form.gender || null,
          sportIds: favs,
        },
      });
      setMe(m);
      setForm(formOf(m));
      setSaved(true);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(code === 'invalid_profile' || code === 'network' ? code : 'generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text variant="display">{t('title')}</Text>
      {!me ? (
        <>
          {!error && (
            <Loading>
              <FormSkeleton fields={5} />
            </Loading>
          )}
          {error && <Text style={{ color: colors.warn }}>{error}</Text>}
          {error && (
            <Button
              label={tc('tryAgain')}
              variant="secondary"
              onPress={() => {
                setError(null);
                load();
              }}
            />
          )}
          <Settings />
        </>
      ) : (
        <FadeIn>
          <Card>
            <View style={styles.head}>
              <Avatar name={form.name || me.name} />
              <View style={styles.headText}>
                <Text style={styles.name}>{form.name}</Text>
                <Text variant="label">
                  {t('memberSince', {
                    date: f.dateTime(new Date(me.createdAt), {
                      month: 'long',
                      year: 'numeric',
                    }),
                  })}
                </Text>
              </View>
            </View>
            <TextField
              label={tc('fullName')}
              value={form.name}
              maxLength={NAME_MAX}
              onChangeText={(name) => edit({ name })}
              error={problems.name ? t(problems.name) : null}
            />
            <TextField label={tc('email')} value={me.email} editable={false} style={[ltr, { color: colors.text2 }]} hint={t('emailLocked')} />
            <TextField
              label={t('phone')}
              value={form.phone}
              onChangeText={(phone) => edit({ phone })}
              keyboardType="phone-pad"
              placeholder="+20 100 123 4567"
              style={ltr}
              hint={t('phoneHint')}
              error={problems.phone ? t(problems.phone) : null}
            />
            <DateField
              label={t('birthDate')}
              value={form.birthDate}
              onChange={(birthDate) => edit({ birthDate })}
              today={today}
              min={addYears(today, -MAX_AGE)}
              max={addYears(today, -MIN_AGE)}
              hint={t('personalHintMember')}
              error={problems.birthDate ? t('birthDateRule', { min: MIN_AGE, max: MAX_AGE }) : null}
            />
            <View style={styles.group}>
              <Text variant="label">{t('gender')}</Text>
              {/* Chips, not a segmented control: "Prefer not to say" needs more room than a third of the row. */}
              <View style={styles.chips}>
                {(['MALE', 'FEMALE', 'unset'] as const).map((g) => (
                  <Chip
                    key={g}
                    label={g === 'unset' ? t('genderUnset') : td(`gender.${g}`)}
                    on={(form.gender || 'unset') === g}
                    onPress={() => edit({ gender: g === 'unset' ? '' : g })}
                  />
                ))}
              </View>
            </View>
            <View style={styles.group}>
              <Text variant="label">
                {t('favourites')}{' '}
                {t('favouritesCount', {
                  count: favs.length,
                  max: MAX_FAVOURITE_SPORTS,
                })}
              </Text>
              <View style={styles.chips}>
                {sports.map((s) => (
                  <Chip key={s.id} label={sportName(s, locale)} on={favs.includes(s.id)} onPress={() => toggleFav(s.id)} />
                ))}
              </View>
            </View>
            {error && <Text style={{ color: colors.warn }}>{error}</Text>}
            {saved && <Text style={{ color: colors.accentText }}>{tc('saved')}</Text>}
            <Button label={tc('save')} onPress={save} busy={busy} />
          </Card>
          <Settings />
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headText: { flex: 1, gap: 2 },
  name: { fontSize: 18 },
  group: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
