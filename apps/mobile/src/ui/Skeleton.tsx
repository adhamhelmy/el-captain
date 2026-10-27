import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

// The browser preview has no native animation driver and warns on every animation that asks for one.
const native = Platform.OS !== 'web';

// One pulse for every placeholder on screen, so they all shimmer together instead of each on its own beat.
const pulse = new Animated.Value(0);
let users = 0;
let loop: Animated.CompositeAnimation | null = null;
const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

function usePulse() {
  useEffect(() => {
    if (users++ === 0) {
      const step = (toValue: number) => Animated.timing(pulse, { toValue, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: native });
      loop = Animated.loop(Animated.sequence([step(1), step(0)]));
      loop.start();
    }
    return () => {
      if (--users === 0) loop?.stop();
    };
  }, []);
}

/** A shimmering block standing in for a line of text, a number or a picture. */
export function Bone({ width = '100%', height = 12, round = 6, style }: Readonly<{ width?: DimensionValue; height?: number; round?: number; style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  usePulse();
  return <Animated.View style={[{ width, height, borderRadius: round, backgroundColor: colors.surface2, opacity }, style]} />;
}

/** Wraps a screen's placeholders; read out once as "Loading". */
export function Loading({ children, style }: Readonly<{ children: ReactNode; style?: StyleProp<ViewStyle> }>) {
  const t = useTranslations('common');
  return (
    <View accessible accessibilityLabel={t('loading')} accessibilityState={{ busy: true }} style={[styles.stack, style]}>
      {children}
    </View>
  );
}

/** Fades content in where its placeholder was, so data fills the screen rather than popping onto it. */
export function FadeIn({ children, style }: Readonly<{ children: ReactNode; style?: StyleProp<ViewStyle> }>) {
  const [shown] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(shown, { toValue: 1, duration: 220, useNativeDriver: native }).start();
  }, [shown]);
  return <Animated.View style={[styles.stack, style, { opacity: shown }]}>{children}</Animated.View>;
}

/** The outline every card shares: the real card's border and corners with bones inside. */
function Shell({ children, style }: Readonly<{ children: ReactNode; style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  return <View style={[styles.shell, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

/** SessionCard / CoachCard: a 96pt head, then a title, a line and a footer. */
export function CardSkeleton({ avatar = false }: Readonly<{ avatar?: boolean }>) {
  const { colors } = useTheme();
  return (
    <Shell style={styles.card}>
      <View style={[styles.head, { backgroundColor: colors.stripeA }]}>{avatar ? <Bone width={64} height={64} round={32} /> : <Bone width={120} height={32} />}</View>
      <View style={styles.body}>
        <Bone width="70%" height={16} />
        <Bone width="45%" />
        <View style={[styles.foot, { borderTopColor: colors.border }]}>
          <Bone width="35%" />
          <Bone width="20%" />
        </View>
      </View>
    </Shell>
  );
}

/** A list row: an optional round picture or date block, two lines, and something on the end. */
export function RowSkeleton({ lead = 'none', lines = 2 }: Readonly<{ lead?: 'none' | 'avatar' | 'date'; lines?: 1 | 2 | 3 }>) {
  return (
    <Shell style={styles.row}>
      {lead === 'avatar' && <Bone width={44} height={44} round={22} />}
      {lead === 'date' && <Bone width={48} height={48} round={8} />}
      <View style={styles.grow}>
        <Bone width="65%" height={15} />
        {lines > 1 && <Bone width="40%" />}
        {lines > 2 && <Bone width="55%" />}
      </View>
      <Bone width={44} />
    </Shell>
  );
}

/** The Stats row: three tiles with a big number and a label. */
export function StatsSkeleton() {
  return (
    <View style={styles.stats}>
      {[0, 1, 2].map((i) => (
        <Shell key={i} style={styles.stat}>
          <Bone width="55%" height={30} />
          <Bone width="80%" height={10} />
        </Shell>
      ))}
    </View>
  );
}

/** A form card: a few labelled fields. */
export function FormSkeleton({ fields = 4 }: Readonly<{ fields?: number }>) {
  return (
    <Shell style={styles.form}>
      {Array.from({ length: fields }, (_, i) => (
        <View key={i} style={styles.field}>
          <Bone width="30%" height={10} />
          <Bone height={44} round={radius.input} />
        </View>
      ))}
    </Shell>
  );
}

/** A detail page: back link, optional cover, a big title and its date line, then a card and a row of chips. */
export function DetailSkeleton({ cover = false }: Readonly<{ cover?: boolean }>) {
  return (
    <Loading>
      <Bone width={90} />
      {cover && <Bone height={140} round={radius.card} />}
      <View style={styles.title}>
        <Bone width="75%" height={34} />
        <Bone width="45%" height={14} />
      </View>
      <Shell style={styles.form}>
        <Bone width="50%" height={18} />
        <Bone width="80%" />
        <Bone height={44} round={radius.input} />
      </Shell>
      <View style={styles.chips}>
        {[70, 60, 80].map((w) => (
          <Bone key={w} width={w} height={32} round={16} />
        ))}
      </View>
    </Loading>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  grow: { flex: 1, gap: 8 },
  shell: { borderWidth: 1, overflow: 'hidden' },
  card: { borderRadius: radius.card + 2 },
  head: { height: 96, justifyContent: 'center', paddingHorizontal: 20 },
  body: { padding: 18, gap: 10 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.card, padding: 14 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: radius.card, padding: 14, gap: 10 },
  form: { borderRadius: radius.card, padding: 18, gap: 16 },
  field: { gap: 8 },
  title: { gap: 12 },
  chips: { flexDirection: 'row', gap: 8 },
});
