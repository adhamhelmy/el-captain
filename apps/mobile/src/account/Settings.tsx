import { CHANGE_PASSWORD_ERRORS, pickError } from '@el-captain/rules/error-codes';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Segmented } from '@/ui/Segmented';
import { SettingRow } from '@/ui/SettingRow';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';
import { changePassword } from './password';
import { passwordProblems } from './rules';

const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

/** Mirrors the web's PasswordSetting: current + new + confirm. Signs in again afterwards so this phone stays in. */
function PasswordSetting() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tr = useTranslations('reset');
  const te = useTranslations('errors');
  const { colors } = useTheme();
  const { user, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const problems = passwordProblems(form.next, form.confirm);
  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setError(null);
  };

  async function submit() {
    setTried(true);
    if (!form.current || Object.keys(problems).length || !form.confirm) return;
    setBusy(true);
    try {
      if (!user) return;
      const result = await changePassword(user.email, form.current, form.next, signIn);
      if (result === 'changedSignInAgain') return await signOut('passwordChanged');
      setForm({ current: '', next: '', confirm: '' });
      setTried(false);
      setOpen(false);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'network' ? 'network' : pickError(CHANGE_PASSWORD_ERRORS, e instanceof ApiError ? e.code : undefined));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingRow label={tc('password')} hint={done ? t('passwordUpdated') : t('passwordHint')}>
      <LinkText
        label={open ? tc('cancel') : tc('change')}
        onPress={() => {
          setOpen(!open);
          setError(null);
          setDone(false);
        }}
      />
      {open && (
        <View style={styles.form}>
          <TextField
            label={t('currentPassword')}
            value={form.current}
            onChangeText={(current) => edit({ current })}
            secureTextEntry
            autoComplete="current-password"
            style={ltr}
            error={tried && !form.current ? te('passwordRequired') : null}
          />
          <TextField
            label={tr('newPassword')}
            value={form.next}
            onChangeText={(next) => edit({ next })}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            style={ltr}
            hint={te('weak_password')}
            error={(tried || form.next.length >= 8) && problems.password ? te(problems.password) : null}
          />
          <TextField
            label={tr('confirm')}
            value={form.confirm}
            onChangeText={(confirm) => edit({ confirm })}
            secureTextEntry
            autoComplete="new-password"
            style={ltr}
            error={problems.confirm ? te(problems.confirm) : tried && !form.confirm ? te('passwordsDontMatch') : null}
          />
          {error && <Text style={{ color: colors.warn }}>{te(error)}</Text>}
          <Button label={t('updatePassword')} onPress={submit} busy={busy} />
        </View>
      )}
    </SettingRow>
  );
}

/** Apple requires in-app deletion. The API has no delete yet (todos.md), so a failure explains that. */
function DeleteAccount() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api('/api/users/me', { method: 'DELETE' });
      await signOut();
    } catch {
      setUnavailable(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingRow label={t('deleteAccount')} hint={t('deleteHint')}>
      {!confirming ? (
        <LinkText label={t('deleteAccount')} onPress={() => setConfirming(true)} />
      ) : (
        <View style={[styles.danger, { borderColor: colors.warn, backgroundColor: colors.warnTint }]}>
          <Text variant="title">{t('deleteConfirmTitle')}</Text>
          <Text muted>{t('deleteConfirmText')}</Text>
          {unavailable && <Text style={{ color: colors.warn }}>{t('deleteUnavailable')}</Text>}
          <Button label={t('deleteConfirm')} variant="danger" onPress={remove} busy={busy} />
          <Button
            label={tc('cancel')}
            variant="secondary"
            onPress={() => {
              setConfirming(false);
              setUnavailable(false);
            }}
          />
        </View>
      )}
    </SettingRow>
  );
}

/** The settings card on both profile tabs. */
export function Settings() {
  const tt = useTranslations('theme');
  const tl = useTranslations('locale');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const { choice, setScheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { signOut } = useAuth();

  return (
    <>
      <Card>
        <Text variant="title">{tp('settings')}</Text>
        <SettingRow label={tt('setting')} hint={tt('settingHint')}>
          <Segmented
            label={tt('setting')}
            value={choice ?? 'system'}
            onChange={(v) => setScheme(v === 'system' ? null : v)}
            options={(['dark', 'light', 'system'] as const).map((c) => ({ value: c, label: tt(`choice.${c}`) }))}
          />
        </SettingRow>
        <SettingRow label={tl('setting')} hint={tl('settingHint')}>
          <Segmented
            label={tl('setting')}
            value={locale}
            onChange={setLocale}
            options={(['en', 'ar'] as const).map((l) => ({ value: l, label: tl(`name.${l}`) }))}
          />
        </SettingRow>
        <PasswordSetting />
        <DeleteAccount />
      </Card>
      <Button label={tc('logOut')} variant="secondary" onPress={() => signOut()} />
    </>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, marginTop: 4 },
  danger: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
});
