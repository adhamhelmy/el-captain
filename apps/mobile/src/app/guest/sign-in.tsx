import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { isValidEmail, normalizeEmail } from '@el-captain/rules/auth-rules';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { signInError, type SignInError } from '@/auth/sign-in-error';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { Screen } from '@/ui/Screen';
import { richText, Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

export default function SignIn() {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const { colors } = useTheme();
  const { signIn, user, setReturnTo } = useAuth();

  // Leaving without signing in drops the "come back to this page" detour, so a later sign-in goes home.
  const signedIn = useRef(!!user);
  useEffect(() => {
    signedIn.current = !!user;
  }, [user]);
  useFocusEffect(
    useCallback(
      () => () => {
        if (!signedIn.current) setReturnTo(null);
      },
      [setReturnTo],
    ),
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SignInError | null>(null);
  const [resent, setResent] = useState(false);

  const address = normalizeEmail(email);
  // Shown once the user has tried to submit, and kept live as they fix it.
  const emailError = tried && !isValidEmail(address) ? te('invalid_email') : null;
  const passwordError = tried && !password ? te('passwordRequired') : null;

  async function submit() {
    setTried(true);
    setResent(false);
    if (!isValidEmail(address) || !password) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(address, password);
    } catch (e) {
      setError(signInError(e));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    await api('/api/auth/resend-verification', { method: 'POST', json: { email: address } }).catch(() => {});
    setResent(true);
  }

  return (
    <Screen>
      <Logo />
      <View style={styles.head}>
        <Text variant="display">{t('title')}</Text>
        <Text muted>{t('sub')}</Text>
      </View>

      <TextField
        label={tc('email')}
        value={email}
        onChangeText={setEmail}
        error={emailError}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        style={styles.ltr}
      />
      <TextField
        label={tc('password')}
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
        style={styles.ltr}
        aside={
          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8} accessibilityRole="link">
            <Text variant="label" style={{ color: colors.accentText }}>
              {t('forgot')}
            </Text>
          </Pressable>
        }
      />

      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.warn }}>
          {te(error)}
        </Text>
      )}
      {error === 'emailNotVerified' && (
        <Pressable onPress={resend} accessibilityRole="button" hitSlop={8}>
          <Text style={{ color: resent ? colors.text2 : colors.accentText }}>{resent ? t('resent') : t('resend')}</Text>
        </Pressable>
      )}

      <Button label={tc('logIn')} onPress={submit} busy={busy} />

      <Text muted style={styles.center}>
        {t.rich('newHere', { link: richText({ style: { color: colors.accentText }, onPress: () => router.push('/register'), accessibilityRole: 'link' }) })}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 6, marginTop: 24 },
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
  center: { textAlign: 'center' },
});
