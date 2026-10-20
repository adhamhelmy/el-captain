import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, uiFont } from '@/theme/tokens';
import { addMonths, addYears, clampMonth, inRange, monthGrid, monthOf, startMonth } from './calendar';
import { Text } from './Text';

type Props = Readonly<{
  label: string;
  /** 'YYYY-MM-DD', or '' for none yet. */
  value: string;
  onChange: (date: string) => void;
  /** Today as 'YYYY-MM-DD' in the app's time zone; the calendar opens on it when nothing is picked. */
  today: string;
  min?: string;
  max?: string;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  invalid?: boolean;
  editable?: boolean;
}>;

type Range = Readonly<{ min?: string; max?: string }>;

// A wall-clock date at noon UTC, formatted in UTC, shows that same day whatever the phone's zone.
const noonUtc = (date: string) => new Date(`${date}T12:00:00Z`);
const YEARS_PER_ROW = 4;
const YEAR_HEIGHT = 44;
// The Saturday-to-Friday week the weekday header is drawn from.
const SAMPLE_WEEK = monthGrid('2026-10-01')[1] as string[];

type DateOptions = Pick<Intl.DateTimeFormatOptions, 'weekday' | 'day' | 'month' | 'year' | 'dateStyle'>;

function useDateFormat() {
  const f = useFormatter();
  return (date: string, options: DateOptions) => f.dateTime(noonUtc(date), { timeZone: 'UTC', ...options });
}

/**
 * A date input that opens a month calendar under it instead of a keyboard: the web's `<input type="date">`.
 * Tapping the month title switches to a year grid, for dates years away like a birthday.
 */
export function DateField({ label, value, onChange, today, min, max, placeholder, hint, error, invalid, editable = true }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const fmt = useDateFormat();
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState(false);
  const [month, setMonth] = useState(() => startMonth(value, today, min, max));

  const toggle = () => {
    if (!open) setMonth(startMonth(value, today, min, max));
    setYears(false);
    setOpen(!open);
  };
  const pick = (date: string) => {
    onChange(date);
    setOpen(false);
  };
  let border = colors.border;
  if (open) border = colors.focusBorder;
  if (error || invalid) border = colors.warn;
  const shown = value ? fmt(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : (placeholder ?? t('pickDate'));

  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={editable ? toggle : undefined}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? fmt(value, { dateStyle: 'full' }) : '' }}
        accessibilityState={{ expanded: open, disabled: !editable }}
        style={[styles.input, { backgroundColor: colors.surface, borderColor: border, opacity: editable ? 1 : 0.6 }]}>
        <Text style={{ fontFamily: uiFont(isRTL), color: value ? colors.text : colors.text3 }}>{shown}</Text>
      </Pressable>

      {open && (
        <View style={[styles.calendar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MonthHead month={month} setMonth={setMonth} years={years} setYears={setYears} min={min} max={max} />
          {years ? (
            <YearGrid
              month={month}
              first={Number((min ?? addYears(today, -100)).slice(0, 4))}
              last={Number((max ?? addYears(today, 10)).slice(0, 4))}
              onPick={(next) => {
                setMonth(clampMonth(next, min, max));
                setYears(false);
              }}
            />
          ) : (
            <Days month={month} value={value} today={today} min={min} max={max} onPick={pick} />
          )}
        </View>
      )}
      {!!error && <Text style={[styles.error, { color: colors.warn }]}>{error}</Text>}
      {!error && !!hint && <Text variant="label">{hint}</Text>}
    </View>
  );
}

/** Previous / next month arrows around the month title, which opens the year grid. */
function MonthHead({
  month,
  setMonth,
  years,
  setYears,
  min,
  max,
}: Range & Readonly<{ month: string; setMonth: (m: string) => void; years: boolean; setYears: (y: boolean) => void }>) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const fmt = useDateFormat();
  const t = useTranslations('common');
  const canBack = !years && (!min || month > monthOf(min));
  const canNext = !years && (!max || month < monthOf(max));
  const Back = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;
  return (
    <View style={styles.head}>
      <Pressable
        onPress={() => setMonth(addMonths(month, -1))}
        disabled={!canBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('prevMonth')}
        style={[styles.arrow, { opacity: canBack ? 1 : 0.3 }]}>
        <Back size={20} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => setYears(!years)} accessibilityRole="button" accessibilityHint={t('pickYear')} hitSlop={8}>
        <Text style={[styles.title, { fontFamily: uiFont(isRTL, 'semibold') }]}>{fmt(month, { month: 'long', year: 'numeric' })} ▾</Text>
      </Pressable>
      <Pressable
        onPress={() => setMonth(addMonths(month, 1))}
        disabled={!canNext}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('nextMonth')}
        style={[styles.arrow, { opacity: canNext ? 1 : 0.3 }]}>
        <Next size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

/** Years from latest to earliest; picking one keeps the month and goes back to the days. */
function YearGrid({ month, first, last, onPick }: Readonly<{ month: string; first: number; last: number; onPick: (month: string) => void }>) {
  const { colors } = useTheme();
  const f = useFormatter();
  const current = Number(month.slice(0, 4));
  // Open scrolled to the shown year, two rows down from the top, rather than at the latest year.
  // scrollTo once laid out, since a starting contentOffset only works on iOS.
  const row = Math.floor((last - current) / YEARS_PER_ROW);
  const scroller = useRef<ScrollView>(null);
  return (
    <ScrollView
      ref={scroller}
      style={styles.years}
      contentContainerStyle={styles.yearGrid}
      onLayout={() => scroller.current?.scrollTo({ y: Math.max(0, (row - 2) * YEAR_HEIGHT), animated: false })}
      nestedScrollEnabled>
      {Array.from({ length: last - first + 1 }, (_, i) => last - i).map((y) => (
        <Pressable
          key={y}
          onPress={() => onPick(`${y}${month.slice(4)}`)}
          accessibilityRole="button"
          accessibilityState={{ selected: y === current }}
          style={[styles.year, y === current && { backgroundColor: colors.accent }]}>
          <Text style={{ color: y === current ? colors.onAccent : colors.text }}>{f.number(y, { useGrouping: false })}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** The weekday header and the month's days; days outside the range are faded and can't be picked. */
function Days({ month, value, today, min, max, onPick }: Range & Readonly<{ month: string; value: string; today: string; onPick: (d: string) => void }>) {
  const { colors } = useTheme();
  const f = useFormatter();
  const fmt = useDateFormat();
  return (
    <>
      <View style={styles.week}>
        {SAMPLE_WEEK.map((d) => (
          <Text key={d} variant="label" style={styles.cell}>
            {fmt(d, { weekday: 'narrow' })}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week) => (
        <View key={week.find(Boolean)} style={styles.week}>
          {week.map((day, j) => {
            // Blank cells only pad the first and last week and never move, so their place is their identity.
            if (!day) return <View key={`${month}-blank-${j}`} style={styles.cell} />;
            const allowed = inRange(day, min, max);
            const on = day === value;
            return (
              <Pressable
                key={day}
                onPress={() => onPick(day)}
                disabled={!allowed}
                accessibilityRole="button"
                accessibilityLabel={fmt(day, { dateStyle: 'full' })}
                accessibilityState={{ selected: on, disabled: !allowed }}
                style={styles.cell}>
                <View style={[styles.day, on && { backgroundColor: colors.accent }, !on && day === today && { borderColor: colors.accentText, borderWidth: 1 }]}>
                  <Text style={{ color: on ? colors.onAccent : colors.text, opacity: allowed ? 1 : 0.3 }}>{f.number(Number(day.slice(8)))}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 14, justifyContent: 'center' },
  calendar: { borderWidth: 1, borderRadius: radius.card, padding: 12, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15 },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: 40 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  years: { maxHeight: 240 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  year: { width: `${100 / YEARS_PER_ROW}%`, height: YEAR_HEIGHT, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13 },
});
