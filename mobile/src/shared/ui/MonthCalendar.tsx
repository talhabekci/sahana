import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaletteTokens, Type, space, useTheme } from './theme';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const WEEKDAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function isSameDay(A: Date, B: Date): boolean {
  return A.getFullYear() === B.getFullYear() && A.getMonth() === B.getMonth() && A.getDate() === B.getDate();
}

function startOfDay(Date_: Date): Date {
  const Copy = new Date(Date_);
  Copy.setHours(0, 0, 0, 0);

  return Copy;
}

function buildMonthGrid(Year: number, Month: number): (Date | null)[] {
  const FirstDay = new Date(Year, Month, 1);
  const LeadingBlanks = (FirstDay.getDay() + 6) % 7; // Pazartesi=0 olacak şekilde kaydır
  const DaysInMonth = new Date(Year, Month + 1, 0).getDate();

  const Cells: (Date | null)[] = [];

  for (let I = 0; I < LeadingBlanks; I++) {
    Cells.push(null);
  }

  for (let Day = 1; Day <= DaysInMonth; Day++) {
    Cells.push(new Date(Year, Month, Day));
  }

  while (Cells.length % 7 !== 0) {
    Cells.push(null);
  }

  return Cells;
}

type Props = {
  value: Date | null;
  minDate: Date;
  onSelect: (date: Date) => void;
};

/**
 * Kendi yazdığımız ay takvimi — react-native-calendars, RN 0.81/New Architecture
 * ile "Cannot convert undefined value to object" hatası verdiği için (2026-07-04)
 * kaldırıldı. Harici bağımlılık yok, tema token'larıyla birebir uyumlu.
 */
export function MonthCalendar({ value, minDate, onSelect }: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Min = startOfDay(minDate);
  const Initial = value ?? Min;
  const [ViewYear, setViewYear] = useState(Initial.getFullYear());
  const [ViewMonth, setViewMonth] = useState(Initial.getMonth());

  const Today = startOfDay(new Date());
  const Cells = buildMonthGrid(ViewYear, ViewMonth);
  const Weeks: (Date | null)[][] = [];

  for (let I = 0; I < Cells.length; I += 7) {
    Weeks.push(Cells.slice(I, I + 7));
  }

  const AtMinMonth = ViewYear === Min.getFullYear() && ViewMonth === Min.getMonth();

  const goPrev = () => {
    if (AtMinMonth) {
      return;
    }

    const Prev = new Date(ViewYear, ViewMonth - 1, 1);
    setViewYear(Prev.getFullYear());
    setViewMonth(Prev.getMonth());
  };

  const goNext = () => {
    const Next = new Date(ViewYear, ViewMonth + 1, 1);
    setViewYear(Next.getFullYear());
    setViewMonth(Next.getMonth());
  };

  return (
    <View>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={goPrev} disabled={AtMinMonth} hitSlop={8}>
          <Ionicons
            name="chevron-back"
            size={22}
            color={AtMinMonth ? Palette.lineFaint : Palette.chalk}
          />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[ViewMonth]} {ViewYear}
        </Text>
        <Pressable accessibilityRole="button" onPress={goNext} hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color={Palette.chalk} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((Label) => (
          <Text key={Label} style={styles.weekdayLabel}>
            {Label}
          </Text>
        ))}
      </View>

      {Weeks.map((Week, WeekIndex) => (
        <View key={WeekIndex} style={styles.weekRow}>
          {Week.map((Day, DayIndex) => {
            if (Day == null) {
              return <View key={DayIndex} style={styles.dayCell} />;
            }

            const Disabled = Day < Min;
            const Selected = value != null && isSameDay(Day, value);
            const IsToday = isSameDay(Day, Today);

            return (
              <View key={DayIndex} style={styles.dayCell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: Selected, disabled: Disabled }}
                  disabled={Disabled}
                  onPress={() => onSelect(Day)}
                  style={[
                    styles.dayButton,
                    Selected && styles.dayButtonSelected,
                    IsToday && !Selected && styles.dayButtonToday,
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      Disabled && styles.dayTextDisabled,
                      Selected && styles.dayTextSelected,
                    ]}>
                    {Day.getDate()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(1),
    marginBottom: space(3),
  },
  monthLabel: {
    fontFamily: Type.displaySemi,
    fontSize: 18,
    color: Palette.chalk,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: space(1),
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.moss,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: '78%',
    height: '78%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Palette.lime,
  },
  dayButtonToday: {
    borderWidth: 1,
    borderColor: Palette.lime,
  },
  dayText: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.chalk,
  },
  dayTextDisabled: {
    color: Palette.lineFaint,
  },
  dayTextSelected: {
    color: Palette.limeInk,
  },
});
