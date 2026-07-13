import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getMatch, submitRating } from '@/features/match/api';
import { toApiFailure } from '@/shared/api/client';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function RateTeammates() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();

  const [RatedIds, setRatedIds] = useState<Record<string, number>>({});
  const [Error_, setError] = useState<string | null>(null);

  const Match_ = useQuery({ queryKey: ['matches', id], queryFn: () => getMatch(id) });

  const Rate = useMutation({
    mutationFn: ({ rateeId, score }: { rateeId: string; score: number }) =>
      submitRating(id, { ratee_id: rateeId, score }),
    onSuccess: (_Void, { rateeId, score }) => {
      setError(null);
      setRatedIds((Current) => ({ ...Current, [rateeId]: score }));
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  if (Match_.isPending || Match_.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Teammates = (Match_.data.participants ?? []).filter((P) => !P.is_me);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        <Text style={styles.headline}>TAKIM ARKADAŞLARINI PUANLA</Text>
        <Text style={styles.sub}>
          Puanların anonim tutulur; en az 3 puan birikene kadar oyuncunun profilinde görünmez.
        </Text>

        {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

        {Teammates.length === 0 ? (
          <Text style={styles.empty}>Puanlayacak takım arkadaşı yok.</Text>
        ) : (
          <View style={styles.list}>
            {Teammates.map((Player) => {
              const Rated = RatedIds[Player.id];

              return (
                <View key={Player.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.playerName}>{Player.name ?? 'İsimsiz'}</Text>
                    {Rated != null && <Ionicons name="checkmark-circle" size={18} color={Palette.lime} />}
                  </View>

                  <View style={styles.scoreRow}>
                    {SCORES.map((Score) => {
                      const Active = Rated === Score;

                      return (
                        <Pressable
                          key={Score}
                          accessibilityRole="button"
                          onPress={() => Rate.mutate({ rateeId: Player.id, score: Score })}
                          style={[styles.scoreButton, Active && styles.scoreButtonActive]}>
                          <Text style={[styles.scoreText, Active && styles.scoreTextActive]}>{Score}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: space(4),
    paddingBottom: space(10),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingBottom: space(3),
  },
  headline: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 3,
    color: Palette.lime,
    marginBottom: space(2),
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.moss,
    marginBottom: space(6),
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginBottom: space(4),
  },
  empty: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  list: {
    gap: space(4),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space(3),
  },
  playerName: {
    fontFamily: Type.bodyBold,
    fontSize: 16,
    color: Palette.chalk,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
  },
  scoreButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  scoreText: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: Palette.chalk,
  },
  scoreTextActive: {
    color: Palette.limeInk,
  },
});
