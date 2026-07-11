import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createMatch } from '@/features/match/api';
import { FORMATS } from '@/features/match/constants';
import { listTeams } from '@/features/team/api';
import { listVenues } from '@/features/venue/api';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { GlassView } from '@/shared/ui/GlassView';
import { MonthCalendar } from '@/shared/ui/MonthCalendar';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] as const;

function toDateKey(Date_: Date): string {
  return Date_.toISOString().slice(0, 10);
}

export default function CreateMatch() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });
  const CaptainTeams = useMemo(
    () => (Teams.data ?? []).filter((Team) => Team.my_role === 'captain'),
    [Teams.data],
  );

  const [TeamId, setTeamId] = useState<string | null>(null);
  const [VenueId, setVenueId] = useState<string | null>(null);
  const [VenueText, setVenueText] = useState('');
  const [VenuePickerVisible, setVenuePickerVisible] = useState(false);
  const Venues = useQuery({ queryKey: ['venues'], queryFn: () => listVenues(), enabled: VenuePickerVisible });
  const [SelectedDate, setSelectedDate] = useState<Date | null>(null);
  const [CalendarVisible, setCalendarVisible] = useState(false);
  const [Hour, setHour] = useState<number | null>(null);
  const [HalfPast, setHalfPast] = useState(false);
  const [Format, setFormat] = useState<number>(7);
  const [Price, setPrice] = useState('');
  const [Error_, setError] = useState<string | null>(null);

  const Days = useMemo(() => {
    return Array.from({ length: 14 }, (_, Index) => {
      const Date_ = new Date();
      Date_.setHours(0, 0, 0, 0);
      Date_.setDate(Date_.getDate() + Index);

      return {
        date: Date_,
        key: toDateKey(Date_),
        label: Date_.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        weekday: Date_.toLocaleDateString('tr-TR', { weekday: 'short' }),
      };
    });
  }, []);

  const SelectedKey = SelectedDate != null ? toDateKey(SelectedDate) : null;
  const SelectedBeyondStrip = SelectedKey != null && !Days.some((Day) => Day.key === SelectedKey);

  const startsAtIso = (): string | null => {
    if (SelectedDate === null || Hour === null) {
      return null;
    }

    const Date_ = new Date(SelectedDate);
    Date_.setHours(Hour, HalfPast ? 30 : 0, 0, 0);

    return Date_.toISOString();
  };

  const Create = useMutation({
    mutationFn: () =>
      createMatch({
        team_id: TeamId ?? '',
        venue_id: VenueId,
        venue_text: VenueText.trim(),
        starts_at: startsAtIso() ?? '',
        format: Format,
        price_per_player: Price.trim() === '' ? null : Number(Price),
      }),
    onSuccess: (Match) => {
      void QueryClient.invalidateQueries({ queryKey: ['matches'] });
      Router.replace(`/match/${Match.id}`);
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  const CanSubmit =
    TeamId !== null && VenueText.trim().length >= 3 && SelectedDate !== null && Hour !== null;

  if (!Teams.isPending && CaptainTeams.length === 0) {
    return (
      <Screen>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <View style={styles.emptyState}>
          <Text style={styles.headline}>ÖNCE TAKIM LAZIM</Text>
          <Text style={styles.sub}>
            Maç kurmak için kaptanı olduğun bir takım gerekiyor. Takımını kur, üyeleri davet et,
            sonra maçı planla.
          </Text>
          <View style={styles.emptyButton}>
            <Button label="Takım kur" onPress={() => Router.replace('/team/create')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>

          <Text style={styles.headline}>MAÇ KUR</Text>

          <Text style={styles.sectionLabel}>TAKIM</Text>
          <View style={styles.chipWrap}>
            {CaptainTeams.map((Team) => (
              <Pressable
                key={Team.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: TeamId === Team.id }}
                onPress={() => setTeamId(Team.id)}
                style={[styles.chip, TeamId === Team.id && styles.chipActive]}>
                <Text style={[styles.chipText, TeamId === Team.id && styles.chipTextActive]}>
                  {Team.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.field}>
            <TextField
              label="Saha"
              value={VenueText}
              onChangeText={(Value) => {
                setVenueText(Value);
                setVenueId(null);
              }}
              placeholder="Yıldız Halı Saha, Kadıköy"
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setVenuePickerVisible(true)}
              hitSlop={8}
              style={styles.venuePickerLinkRow}>
              <Text style={styles.venuePickerLink}>Rehberden seç</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>GÜN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayRow}>
              {Days.map((Day) => {
                const Active = SelectedKey === Day.key;

                return (
                  <Pressable
                    key={Day.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: Active }}
                    onPress={() => setSelectedDate(Day.date)}
                    style={[styles.dayCell, Active && styles.dayCellActive]}>
                    <Text style={[styles.dayWeekday, Active && styles.dayTextActive]}>
                      {Day.weekday}
                    </Text>
                    <Text style={[styles.dayLabel, Active && styles.dayTextActive]}>
                      {Day.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                accessibilityRole="button"
                onPress={() => setCalendarVisible(true)}
                style={[styles.dayCell, styles.otherDayCell, SelectedBeyondStrip && styles.dayCellActive]}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={SelectedBeyondStrip ? Palette.limeInk : Palette.chalk}
                />
                <Text style={[styles.dayLabel, SelectedBeyondStrip && styles.dayTextActive]}>
                  {SelectedBeyondStrip
                    ? SelectedDate?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                    : 'Başka gün'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <Modal visible={CalendarVisible} transparent animationType="slide">
            <Pressable style={styles.calendarBackdrop} onPress={() => setCalendarVisible(false)} />
            <GlassView style={styles.calendarSheet}>
              <View style={styles.calendarHandle} />
              <MonthCalendar
                value={SelectedDate}
                minDate={new Date()}
                onSelect={(Picked) => {
                  setSelectedDate(Picked);
                  setCalendarVisible(false);
                }}
              />
            </GlassView>
          </Modal>

          <Modal visible={VenuePickerVisible} transparent animationType="slide">
            <Pressable style={styles.calendarBackdrop} onPress={() => setVenuePickerVisible(false)} />
            <GlassView style={styles.venuePickerSheet}>
              <View style={styles.calendarHandle} />
              <Text style={styles.venuePickerTitle}>SAHA SEÇ</Text>
              <ScrollView style={styles.venuePickerList}>
                {(Venues.data ?? []).map((VenueOption) => (
                  <Pressable
                    key={VenueOption.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setVenueId(VenueOption.id);
                      setVenueText(VenueOption.name);
                      setVenuePickerVisible(false);
                    }}
                    style={styles.venueOption}>
                    <Text style={styles.venueOptionName}>{VenueOption.name}</Text>
                    {VenueOption.address != null && (
                      <Text style={styles.venueOptionAddress}>{VenueOption.address}</Text>
                    )}
                  </Pressable>
                ))}
                {Venues.data != null && Venues.data.length === 0 && (
                  <Text style={styles.venuePickerEmpty}>Henüz saha eklenmedi.</Text>
                )}
              </ScrollView>
            </GlassView>
          </Modal>

          <Text style={styles.sectionLabel}>SAAT</Text>
          <View style={styles.chipWrap}>
            {HOURS.map((HourOption) => (
              <Pressable
                key={HourOption}
                accessibilityRole="radio"
                accessibilityState={{ selected: Hour === HourOption }}
                onPress={() => setHour(HourOption)}
                style={[styles.chip, Hour === HourOption && styles.chipActive]}>
                <Text style={[styles.chipMono, Hour === HourOption && styles.chipTextActive]}>
                  {HourOption}:{HalfPast ? '30' : '00'}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: HalfPast }}
              onPress={() => setHalfPast(!HalfPast)}
              style={[styles.chip, HalfPast && styles.chipActive]}>
              <Text style={[styles.chipText, HalfPast && styles.chipTextActive]}>+30 dk</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>FORMAT</Text>
          <View style={styles.chipWrap}>
            {FORMATS.map((FormatOption) => (
              <Pressable
                key={FormatOption}
                accessibilityRole="radio"
                accessibilityState={{ selected: Format === FormatOption }}
                onPress={() => setFormat(FormatOption)}
                style={[styles.chip, Format === FormatOption && styles.chipActive]}>
                <Text style={[styles.chipMono, Format === FormatOption && styles.chipTextActive]}>
                  {FormatOption}v{FormatOption}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.field}>
            <TextField
              label="Kişi başı ücret (TL, opsiyonel)"
              value={Price}
              onChangeText={(Value) => setPrice(Value.replace(/[^0-9]/g, ''))}
              placeholder="150"
              keyboardType="number-pad"
            />
          </View>

          {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

          <View style={styles.footer}>
            <Button
              label="Maçı kur"
              onPress={() => Create.mutate()}
              disabled={!CanSubmit}
              loading={Create.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 40,
    color: Palette.chalk,
    marginBottom: space(2),
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    gap: space(3),
  },
  emptyButton: {
    marginTop: space(4),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(6),
    marginBottom: space(2),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
  },
  chip: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  chipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  chipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  chipMono: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: Palette.chalk,
  },
  chipTextActive: {
    color: Palette.limeInk,
  },
  dayRow: {
    flexDirection: 'row',
    gap: space(2),
  },
  dayCell: {
    width: 64,
    paddingVertical: space(2),
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    alignItems: 'center',
  },
  dayCellActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  dayWeekday: {
    fontFamily: Type.bodyMedium,
    fontSize: 11,
    color: Palette.moss,
  },
  dayLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
    marginTop: 2,
  },
  dayTextActive: {
    color: Palette.limeInk,
  },
  otherDayCell: {
    width: 76,
    gap: 2,
  },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calendarSheet: {
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingTop: space(3),
    paddingBottom: space(8),
    paddingHorizontal: space(4),
  },
  calendarHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lineFaint,
    marginBottom: space(2),
  },
  field: {
    marginTop: space(6),
  },
  venuePickerLinkRow: {
    alignItems: 'flex-end',
    marginTop: space(1),
  },
  venuePickerLink: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.lime,
  },
  venuePickerSheet: {
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingTop: space(3),
    paddingBottom: space(6),
    paddingHorizontal: space(4),
    maxHeight: '70%',
  },
  venuePickerTitle: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginBottom: space(3),
  },
  venuePickerList: {
    maxHeight: '100%',
  },
  venueOption: {
    paddingVertical: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineFaint,
  },
  venueOptionName: {
    fontFamily: Type.bodyBold,
    fontSize: 15,
    color: Palette.chalk,
  },
  venueOptionAddress: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  venuePickerEmpty: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    paddingVertical: space(4),
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginTop: space(4),
  },
  footer: {
    paddingVertical: space(6),
  },
});
