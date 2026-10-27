import { LINK_LABEL_MAX, MAX_LINKS } from '@el-captain/rules/coach-rules';
import type { LinkDraft } from '@el-captain/rules/coach-form';
import { ArrowDown, ArrowUp, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { LinkText } from '@/ui/LinkText';
import { TextField } from '@/ui/TextField';

const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;
/** New rows need a key before they're saved; the phone has no crypto.randomUUID, a counter does. */
let next = 0;

/** The web's LinksEditor: extra profile links to add, edit, reorder and remove. */
export function LinksEditor({ links, onChange }: Readonly<{ links: LinkDraft[]; onChange: (l: LinkDraft[]) => void }>) {
  const t = useTranslations('onboarding');
  const { colors } = useTheme();
  const set = (i: number, patch: Partial<LinkDraft>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, by: -1 | 1) => {
    const list = [...links];
    [list[i], list[i + by]] = [list[i + by], list[i]];
    onChange(list);
  };
  const icon = (label: string, onPress: () => void, child: React.ReactNode, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.icon, { borderColor: colors.border, opacity: disabled ? 0.35 : 1 }]}>
      {child}
    </Pressable>
  );

  return (
    <View style={styles.list}>
      {links.map((l, i) => (
        <View key={l.key} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextField label={t('linkLabel')} value={l.label} maxLength={LINK_LABEL_MAX} onChangeText={(label) => set(i, { label })} />
          <TextField
            label={t('linkUrl')}
            value={l.url}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={ltr}
            onChangeText={(url) => set(i, { url })}
          />
          <View style={styles.actions}>
            {links.length > 1 && (
              <>
                {icon(t('moveUp'), () => move(i, -1), <ArrowUp size={16} color={colors.text2} />, i === 0)}
                {icon(t('moveDown'), () => move(i, 1), <ArrowDown size={16} color={colors.text2} />, i === links.length - 1)}
              </>
            )}
            {icon(t('removeLink'), () => onChange(links.filter((_, j) => j !== i)), <X size={16} color={colors.text2} />)}
          </View>
        </View>
      ))}
      {links.length < MAX_LINKS && <LinkText label={t('addLink')} onPress={() => onChange([...links, { key: `new-${next++}`, label: '', url: 'https://' }])} />}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { gap: 10, borderWidth: 1, borderRadius: radius.card, padding: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
