import { normalizeEmail } from '@el-captain/rules/auth-rules';
import { pickError, REGISTER_ERRORS } from '@el-captain/rules/error-codes';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { registerProblems } from '@/account/rules';
import { api, ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { LinkText } from '@/ui/LinkText';
import { Logo } from '@/ui/Logo';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

type Role = 'user' | 'coach';

function RoleCard({ on, title, sub, onPress }: { on: boolean; title: string; sub: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={[styles.role, { backgroundColor: on ? colors.accentTint : colors.surface, borderColor: on ? colors.accentText : colors.border }]}>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text variant="label">{sub}</Text>
    </Pressable>
  );
}

/** Mirrors the web's /register: pick a role, then name, email and password; the account waits for the emailed link. */
export default function Register() {
  const t = useTranslations('register');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const tp = useTranslations('profile');
  const { colors } = useTheme();
  const { user } = useAuth();

  const [role, setRole] = useState<Role>('user');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState('');
  const [resent, setResent] = useState(false);

  if (user) return <Redirect href="/" />;

  const problems = registerProblems(form);
  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setError(null);
  };
  // The password rule shows as a hint from the start and turns red once it's broken after a try or while typing.
  const passwordMsg = form.password && problems.password ? te(problems.password) : null;

  async function submit() {
    setTried(true);
    if (Object.keys(problems).length || !form.confirm) return;
    setBusy(true);
    try {
      const email = normalizeEmail(form.email);
      await api('/api/auth/register', {
        method: 'POST',
        json: { name: form.name.trim(), email, password: form.password, role: role === 'coach' ? 'COACH' : 'USER' },
      });
      setSentTo(email);
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'network' ? 'network' : pickError(REGISTER_ERRORS, e instanceof ApiError ? e.code : undefined));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    await api('/api/auth/resend-verification', { method: 'POST', json: { email: sentTo } }).catch(() => {});
    setResent(true);
  }

  if (sentTo) {
    return (
      <Screen>
        <Logo />
        <View style={styles.head}>
          <Text variant="display">{t('checkTitle')}</Text>
          <Text muted>
            {t.rich(role === 'coach' ? 'checkTextCoach' : 'checkText', {
              email: sentTo,
              b: (chunks) => <Text style={{ color: colors.text }}>{chunks}</Text>,
            })}
          </Text>
        </View>
        <Button label={t('confirmed')} onPress={() => router.replace('/guest/sign-in')} />
        <LinkText label={resent ? t('resent') : t('resend')} onPress={resend} muted={resent} />
        <Text muted>
          {t.rich('wrongAddress', {
            again: (chunks) => (
              <Text style={{ color: colors.accentText }} onPress={() => setSentTo('')}>
                {chunks}
              </Text>
            ),
          })}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <LinkText label={t('haveAccount').replace(/<\/?link>/g, '')} onPress={() => router.back()} muted />
      <View style={styles.head}>
        <Text variant="display">{t('title')}</Text>
        <Text muted>{t('sub')}</Text>
      </View>
      <View style={styles.roles} accessibilityRole="radiogroup">
        <RoleCard on={role === 'user'} title={t('roleUser.title')} sub={t('roleUser.sub')} onPress={() => setRole('user')} />
        <RoleCard on={role === 'coach'} title={t('roleCoach.title')} sub={t('roleCoach.sub')} onPress={() => setRole('coach')} />
      </View>
      <TextField
        label={tc('fullName')}
        value={form.name}
        onChangeText={(name) => edit({ name })}
        placeholder={t('namePlaceholder')}
        autoComplete="name"
        error={tried && problems.name ? tp(problems.name) : null}
      />
      <TextField
        label={tc('email')}
        value={form.email}
        onChangeText={(email) => edit({ email })}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        style={styles.ltr}
        error={tried && problems.email ? te(problems.email) : null}
      />
      <TextField
        label={tc('password')}
        value={form.password}
        onChangeText={(password) => edit({ password })}
        placeholder={t('passwordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        style={styles.ltr}
        error={tried || form.password.length >= 8 ? passwordMsg : null}
        hint={te('weak_password')}
      />
      <TextField
        label={t('confirmPassword')}
        value={form.confirm}
        onChangeText={(confirm) => edit({ confirm })}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        style={styles.ltr}
        error={problems.confirm ? te(problems.confirm) : tried && !form.confirm ? te('passwordsDontMatch') : null}
      />
      {role === 'coach' && (
        <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text variant="label">{t('coachNotice')}</Text>
        </View>
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.warn }}>
          {te(error)}
        </Text>
      )}
      <Button label={role === 'coach' ? t('submitCoach') : t('submit')} onPress={submit} busy={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 6, marginTop: 8 },
  roles: { flexDirection: 'row', gap: 10 },
  role: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  roleTitle: { fontSize: 15 },
  notice: { borderWidth: 1, borderRadius: 10, padding: 12 },
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
});
