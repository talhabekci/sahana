import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getPlayerSeasonMatches, getPlayerStats } from '@/features/stats/api';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export default function SeasonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();

  const Stats = useQuery({
    queryKey: ['players', id, 'stats'],
    queryFn: () => getPlayerStats(id),
  });
  const Matches = useQuery({
    queryKey: ['players', id, 'stats', 'matches'],
    queryFn: () => getPlayerSeasonMatches(id),
  });

  if (Matches.isError) {
    return (
      <Screen>
        <ErrorState onRetry={() => void Matches.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen bare>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <Text style={styles.headline}>
        {Stats.data != null ? `${Stats.data.season} SEZONU` : 'SEZON DETAYI'}
      </Text>

      {Matches.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : (
        <FlatList
          data={Matches.data ?? []}
          keyExtractor={(Item) => Item.match_id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            Stats.data != null ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryValue}>{Stats.data.matches}</Text>
                  <Text style={styles.summaryLabel}>MAÇ</Text>
                </View>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryValue}>{Stats.data.goals}</Text>
                  <Text style={styles.summaryLabel}>GOL</Text>
                </View>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryValue}>{Stats.data.assists}</Text>
                  <Text style={styles.summaryLabel}>ASİST</Text>
                </View>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryValue}>
                    {Stats.data.rating != null ? Stats.data.rating.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.summaryLabel}>REYTİNG</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => Router.push(`/match/${item.match_id}`)}
              style={styles.matchRow}>
              <View style={styles.matchLeft}>
                <Text style={styles.matchTitle} numberOfLines={1}>
                  {item.team_name}
                  {item.opponent_team_name != null ? ` — ${item.opponent_team_name}` : ''}
                </Text>
                <Text style={styles.matchMeta} numberOfLines={1}>
                  {formatDate(item.starts_at)}
                  {item.venue_text != null ? ` · ${item.venue_text}` : ''}
                </Text>
              </View>

              <View style={styles.matchRight}>
                {item.home_score != null && item.away_score != null && (
                  <Text style={styles.score}>
                    {item.home_score}-{item.away_score}
                  </Text>
                )}
                <View style={styles.statChips}>
                  {item.goals > 0 && <Text style={styles.statChip}>⚽ {item.goals}</Text>}
                  {item.assists > 0 && <Text style={styles.statChip}>🅰 {item.assists}</Text>}
                  {item.average_score != null && (
                    <Text style={styles.ratingChip}>{item.average_score.toFixed(1)}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState icon="football-outline" message="Bu sezon henüz maç kaydı yok." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  headline: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 3,
    color: Palette.lime,
    paddingHorizontal: space(6),
    marginTop: space(3),
    marginBottom: space(4),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: space(6),
    paddingBottom: space(10),
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
    marginBottom: space(4),
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: Type.mono,
    fontSize: 22,
    color: Palette.lime,
  },
  summaryLabel: {
    fontFamily: Type.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.moss,
    marginTop: 2,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space(3),
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    paddingVertical: space(3),
    paddingHorizontal: space(4),
    marginBottom: space(2),
  },
  matchLeft: {
    flex: 1,
  },
  matchTitle: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.chalk,
  },
  matchMeta: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
    marginTop: 2,
  },
  matchRight: {
    alignItems: 'flex-end',
    gap: space(1),
  },
  score: {
    fontFamily: Type.mono,
    fontSize: 16,
    color: Palette.chalk,
  },
  statChips: {
    flexDirection: 'row',
    gap: space(2),
  },
  statChip: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.chalk,
  },
  ratingChip: {
    fontFamily: Type.mono,
    fontSize: 12,
    color: Palette.limeInk,
    backgroundColor: Palette.lime,
    borderRadius: Radius.pill,
    paddingHorizontal: space(2),
    overflow: 'hidden',
  },
});
