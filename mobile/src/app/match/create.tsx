import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const HOURS = [17, 18, 19, 20, 21, 22, 23] as const;

export default function CreateMatch() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });
  const CaptainTeams = useMemo(
    () => (Teams.data ?? []).filter((Team) => Team.my_role === 'captain'),
    [Teams.data],
  );

  const [TeamId, setTeamId] = useState<string | null>(null);
  const [VenueText, setVenueText] = useState('');
  const [DayOffset, setDayOffset] = useState<number | null>(null);
  const [Hour, setHour] = useState<number | null>(null);
  const [HalfPast, setHalfPast] = useState(false);
  const [Format, setFormat] = useState<number>(7);
  const [Price, setPrice] = useState('');
  const [Error_, setError] = useState<string | null>(null);

  const Days = useMemo(() => {
    return Array.from({ length: 14 }, (_, Index) => {
      const Date_ = new Date();
      Date_.setDate(Date_.getDate() + Index);

      return {
        offset: Index,
        label: Date_.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        weekday: Date_.toLocaleDateString('tr-TR', { weekday: 'short' }),
      };
    });
  }, []);

  const startsAtIso = (): string | null => {
    if (DayOffset === null || Hour === null) {
      return null;
    }

    const Date_ = new Date();
    Date_.setDate(Date_.getDate() + DayOffset);
    Date_.setHours(Hour, HalfPast ? 30 : 0, 0, 0);

    return Date_.toISOString();
  };

  const Create = useMutation({
    mutationFn: () =>
      createMatch({
        team_id: TeamId ?? '',
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
    TeamId !== null && VenueText.trim().length >= 3 && DayOffset !== null && Hour !== null;

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
              onChangeText={setVenueText}
              placeholder="Yıldız Halı Saha, Kadıköy"
            />
          </View>

          <Text style={styles.sectionLabel}>GÜN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayRow}>
              {Days.map((Day) => (
                <Pressable
                  key={Day.offset}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: DayOffset === Day.offset }}
                  onPress={() => setDayOffset(Day.offset)}
                  style={[styles.dayCell, DayOffset === Day.offset && styles.dayCellActive]}>
                  <Text
                    style={[styles.dayWeekday, DayOffset === Day.offset && styles.dayTextActive]}>
                    {Day.weekday}
                  </Text>
                  <Text style={[styles.dayLabel, DayOffset === Day.offset && styles.dayTextActive]}>
                    {Day.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

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
  field: {
    marginTop: space(6),
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
