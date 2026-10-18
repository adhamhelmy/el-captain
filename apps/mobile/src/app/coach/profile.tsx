import { birthDateInvalid, privateDraftOk } from '@el-captain/rules/coach-form';
import { BIO_MAX, CITY_MAX, MAX_LINKS, NAME_MAX } from '@el-captain/rules/coach-rules';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { Settings } from '@/account/Settings';
import { api, ApiError } from '@/api/client';
import type { CoachMe, CoachVenue, Media, Onboarding } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { CertificationList, type Certification } from '@/coach/CertificationList';
import { CoverPicker } from '@/coach/CoverPicker';
import { LinksEditor } from '@/coach/LinksEditor';
import { MediaList } from '@/coach/MediaList';
import { PersonalFields } from '@/coach/PersonalFields';
import { PhotoPicker } from '@/coach/PhotoPicker';
import { PrivateSettings } from '@/coach/PrivateSettings';
import { profileBody, profileFormOf, profileSnapshot, type ProfileForm } from '@/coach/profile-form';
import { SportPicker } from '@/coach/SportPicker';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/nav/FloatingTabBar';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

const SAVE_ERRORS = ['invalid_profile', 'invalid_upload', 'network'] as const;
const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="title">{title}</Text>
        {aside}
      </View>
      {children}
    </Card>
  );
}

/**
 * The web's coach profile page: public profile, sports, photos & videos, certificates, private sessions, locations and
 * account. One save bar for the form; media and certificates save as each changes.
 */
export default function CoachProfile() {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const tv = useTranslations('venues');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CoachMe | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [venueCount, setVenueCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped when the form is reset from the server or discarded, so fields that keep their own typed text start over.
  const [version, setVersion] = useState(0);
  // Uploads and sport adds still running; saving now would leave them out.
  const [working, setWorking] = useState(0);
  const track = (on: boolean) => setWorking((n) => n + (on ? 1 : -1));

  const show = (c: CoachMe) => {
    setProfile(c);
    setForm(profileFormOf(c));
    setCerts(c.certifications);
    setMedia(c.media);
    setVersion((v) => v + 1);
  };

  const load = useCallback(
    () =>
      api<Onboarding>('/api/coaches/me/onboarding')
        .then((r) => show(r.coach))
        .catch((e) => setError(te(e instanceof ApiError && e.code === 'network' ? 'network' : 'generic'))),
    [te],
  );
  useEffect(() => {
    load();
  }, [load]);

  // The location count can change on the Locations tab. A failed load leaves it blank, as the web does.
  useFocusEffect(
    useCallback(() => {
      api<CoachVenue[]>('/api/venues/me')
        .then((v) => setVenueCount(v.filter((x) => !x.archived).length))
        .catch(() => setVenueCount(null));
    }, []),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!profile || !form) {
    return (
      <Screen>
        <Text variant="display">{tp('title')}</Text>
        {error && <Text style={{ color: colors.warn }}>{error}</Text>}
        {error && (
          <LinkText
            label={tc('tryAgain')}
            onPress={() => {
              setError(null);
              load();
            }}
          />
        )}
        <Settings />
      </Screen>
    );
  }

  const set = (patch: Partial<ProfileForm>) => {
    setForm((f) => f && { ...f, ...patch });
    setError(null);
  };
  const dirty = profileSnapshot(form) !== profileSnapshot(profileFormOf(profile));

  async function save() {
    if (!profile || !form || working) return;
    if (!privateDraftOk(form.private)) return setError(t('privateRules'));
    if (birthDateInvalid(form.birthDate)) return setError(tp('fixFields'));
    setBusy(true);
    try {
      show(await api<CoachMe>(`/api/coaches/${profile.id}`, { method: 'PATCH', json: profileBody(form) }));
      setToast(true);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(SAVE_ERRORS.find((c) => c === code) ?? 'generic'));
    } finally {
      setBusy(false);
    }
  }

  const barBottom = insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_GAP * 2;
  const showBar = dirty || !!error;

  return (
    <View style={styles.fill}>
      <Screen>
        <Text variant="display">{tp('title')}</Text>
        <LinkText label={t('viewPublic')} onPress={() => router.push(`/coach-profile/${profile.id}` as Href)} />

        <Section title={t('section.public')}>
          <CoverPicker onBusy={track} userId={profile.id} url={form.cover?.url ?? profile.coverUrl} onUploaded={(path, url) => set({ cover: { path, url } })} />
          <PhotoPicker onBusy={track} userId={profile.id} url={form.photo?.url ?? profile.photoUrl} onUploaded={(path, url) => set({ photo: { path, url } })} />
          <TextField label={t('displayName')} value={form.name} maxLength={NAME_MAX} onChangeText={(name) => set({ name })} />
          <TextField label={to('address')} value={form.city} maxLength={CITY_MAX} placeholder={to('addressPlaceholder')} onChangeText={(city) => set({ city })} />
          <TextField
            label={t('bio')}
            value={form.bio}
            maxLength={BIO_MAX}
            multiline
            style={styles.bio}
            onChangeText={(bio) => set({ bio })}
            aside={<Text variant="label">{to('bioCount', { count: form.bio.trim().length, max: BIO_MAX })}</Text>}
          />
          <PersonalFields key={version} value={form} hint={tp('personalHintCoach')} onChange={({ birthDate, gender, languages }) => set({ birthDate, gender, languages })} />
          {(['instagram', 'tiktok'] as const).map((net) => (
            <TextField
              key={net}
              label={`${to(net)} (@)`}
              value={form[net]}
              placeholder={to('socialPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              style={ltr}
              onChangeText={(v) => set(net === 'instagram' ? { instagram: v } : { tiktok: v })}
            />
          ))}
          <View style={styles.labelRow}>
            <Text variant="label">{to('links')}</Text>
            <Text variant="label">
              {form.links.length} / {MAX_LINKS}
            </Text>
          </View>
          <LinksEditor links={form.links} onChange={(links) => set({ links })} />
        </Section>

        <Section title={t('section.sports')}>
          <SportPicker onBusy={track} selected={form.sports} onChange={(sports) => set({ sports })} />
        </Section>

        <Section title={t('section.media')}>
          <MediaList coachId={profile.id} items={media} sports={profile.sports} onChange={setMedia} />
        </Section>

        <Section title={t('section.certifications')}>
          <CertificationList coachId={profile.id} items={certs} onChange={setCerts} />
        </Section>

        <Section title={t('section.private')}>
          <PrivateSettings
            value={form.private}
            onChange={(p) => set({ private: p })}
            active={profile.privatePrice !== null && profile.privateDuration !== null ? { price: profile.privatePrice, duration: profile.privateDuration } : null}
          />
        </Section>

        <Section title={t('section.locations')} aside={<LinkText label={tv('manage')} onPress={() => router.push('/coach/venues')} />}>
          <Text muted>{venueCount === null ? '' : tv('count', { count: venueCount })}</Text>
        </Section>

        <Section title={t('section.account')}>
          <TextField label={tc('email')} value={user?.email ?? ''} editable={false} style={ltr} />
        </Section>
        <Settings />
        {/* Room for the save bar, so it never covers the last fields. */}
        {showBar && <View style={styles.barSpace} />}
      </Screen>

      {showBar && (
        <View style={[styles.bar, { bottom: barBottom, backgroundColor: colors.surface, borderColor: error ? colors.warn : colors.border }]}>
          <Text style={[styles.grow, error ? { color: colors.warn } : undefined]}>{error || t('unsaved')}</Text>
          <LinkText
            label={t('discard')}
            muted
            onPress={() => {
              // Not while a save or upload is still on its way: it would land after and undo the discard.
              if (busy || working) return;
              setForm(profileFormOf(profile));
              setVersion((v) => v + 1);
              setError(null);
            }}
          />
          <View style={styles.saveBtn}>
            <Button label={busy ? to('saving') : t('saveChanges')} busy={busy || working > 0} onPress={save} />
          </View>
        </View>
      )}
      {toast && !showBar && (
        <View style={[styles.bar, { bottom: barBottom, backgroundColor: colors.surface, borderColor: colors.accentText }]}>
          <Text>{tc('saved')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  section: { gap: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bio: { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barSpace: { height: 80 },
  bar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.card, padding: 12 },
  saveBtn: { minWidth: 130 },
});
