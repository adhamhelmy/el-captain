import { isValidEmail, normalizeEmail } from '@el-captain/rules/auth-rules';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

/** Mirrors the web's /forgot-password. The emailed link opens the web's reset page. */
export default function ForgotPassword() {
  const t = useTranslations('forgot');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'generic' | 'network' | null>(null);
  const [sent, setSent] = useState(false);

  const address = normalizeEmail(email);
  const emailError = tried && !isValidEmail(address) ? te('invalid_email') : null;

  async function submit() {
    setTried(true);
    if (!isValidEmail(address)) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/forgot-password', { method: 'POST', json: { email: address } });
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'network' ? 'network' : 'generic');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen tabs={false}>
      <LinkText label={t('back')} onPress={() => router.back()} muted />
      {sent ? (
        <View style={styles.head}>
          <Text variant="display">{t('sentTitle')}</Text>
          <Text muted>{t('sentText')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.head}>
            <Text variant="display">{t('title')}</Text>
            <Text muted>{t('sub')}</Text>
          </View>
          <TextField
            label={tc('email')}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onSubmitEditing={submit}
            style={styles.ltr}
            error={emailError}
          />
          {error && (
            <Text accessibilityRole="alert" style={{ color: colors.warn }}>
              {te(error)}
            </Text>
          )}
          <Button label={t('submit')} onPress={submit} busy={busy} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 6, marginTop: 8 },
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
});
