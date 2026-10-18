import { formOf } from '@el-captain/rules/coach-form';
import { Linking, StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { apiUrl } from '@/api/client';
import type { Onboarding } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { ProfilePreview } from './ProfilePreview';

type Stage = 'done' | 'now' | 'todo';
const contact = () => Linking.openURL(apiUrl('/contact')).catch(() => {});

/** The web's StatusScreen: what a coach sees while their profile is in review, or after it was suspended. */
export function StatusScreen({ data }: { data: Onboarding }) {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const f = useFormatter();
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const pending = data.coach.status === 'PENDING';
  const submitted = data.coach.submittedAt ? f.dateTime(new Date(data.coach.submittedAt), { dateStyle: 'medium' }) : null;
  const br = () => '\n';

  const timeline: [string, string, Stage][] = [
    [t('timeline.created'), t('timeline.done'), 'done'],
    [t('timeline.submitted'), submitted ?? t('timeline.done'), 'done'],
    [t('timeline.review'), t('timeline.inProgress'), 'now'],
    [t('timeline.live'), t('timeline.liveSub'), 'todo'],
  ];

  return (
    <Screen tabs={false}>
      <View style={styles.tag}>
        <Tag kind={pending ? 'pending' : 'warn'} label={pending ? t('inReview') : t('suspended')} />
      </View>
      <Text variant="display" style={styles.title}>
        {t.rich(pending ? 'pendingTitle' : 'suspendedTitle', { br })}
      </Text>
      <Text muted>{pending ? t('pendingBody', { date: submitted ?? '' }) : t('suspendedBody')}</Text>

      {pending ? (
        <>
          <View style={styles.timeline}>
            {timeline.map(([label, sub, stage], i) => (
              <View key={label} style={styles.tlItem}>
                <View style={styles.tlRail}>
                  <View
                    style={[
                      styles.dot,
                      stage === 'done' && { backgroundColor: colors.accent, borderColor: colors.accent },
                      stage === 'now' && { borderColor: colors.pending },
                      stage === 'todo' && { borderColor: colors.border },
                    ]}>
                    {stage === 'done' && <Text style={[styles.check, { color: colors.onAccent }]}>✓</Text>}
                  </View>
                  {i < timeline.length - 1 && <View style={[styles.line, { backgroundColor: stage === 'done' ? colors.accent : colors.border }]} />}
                </View>
                <View style={styles.tlText}>
                  <Text>{label}</Text>
                  <Text variant="label">{sub}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text variant="eyebrow">{t('previewWillSee')}</Text>
          <ProfilePreview name={data.coach.coachName} form={formOf(data)} />
          <Text variant="label">
            {t.rich('lockedNote', {
              contact: (chunks) => (
                <Text variant="label" style={{ color: colors.accentText }} onPress={contact}>
                  {chunks}
                </Text>
              ),
            })}
          </Text>
        </>
      ) : (
        <>
          {data.reason && (
            <Card style={styles.gap}>
              <Text variant="label">{t('teamNote')}</Text>
              <Text>{data.reason}</Text>
            </Card>
          )}
          <Button label={t('contactUs')} onPress={contact} />
        </>
      )}
      <Button variant="secondary" label={tc('logOut')} onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 8 },
  tag: { flexDirection: 'row' },
  title: { fontSize: 44, lineHeight: 46 },
  timeline: { gap: 0 },
  tlItem: { flexDirection: 'row', gap: 12 },
  tlRail: { alignItems: 'center', width: 24 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 12 },
  line: { width: 2, flex: 1, minHeight: 22 },
  tlText: { paddingBottom: 18, gap: 2 },
});
