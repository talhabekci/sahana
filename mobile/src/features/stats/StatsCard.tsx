import { StyleSheet, Text, View } from 'react-native';

import type { PlayerStats } from './api';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

type Props = {
  stats: PlayerStats;
};

export function StatsCard({ stats }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{stats.season} SEZONU</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{stats.matches}</Text>
          <Text style={styles.statLabel}>MAÇ</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{stats.goals}</Text>
          <Text style={styles.statLabel}>GOL</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{stats.assists}</Text>
          <Text style={styles.statLabel}>ASİST</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {stats.reliability != null ? `${stats.reliability}%` : '—'}
          </Text>
          <Text style={styles.statLabel}>GÜVENİLİRLİK</Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <Text style={styles.ratingLabel}>REYTİNG</Text>
        {stats.rating != null ? (
          <Text style={styles.ratingValue}>{stats.rating.toFixed(1)}</Text>
        ) : (
          <Text style={styles.ratingPending}>
            {stats.ratings_count}/3 puan — henüz yeterli veri yok
          </Text>
        )}
      </View>

      {stats.recent_ratings.length > 0 && (
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>FORM</Text>
          <View style={styles.formDots}>
            {stats.recent_ratings
              .slice()
              .reverse()
              .map((Item) => (
                <View key={Item.match_id} style={styles.formDot}>
                  <Text style={styles.formDotText}>{Item.average_score.toFixed(0)}</Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
    marginTop: space(4),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.lime,
    marginBottom: space(3),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Type.mono,
    fontSize: 20,
    color: Palette.chalk,
  },
  statLabel: {
    fontFamily: Type.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: Palette.moss,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space(4),
    paddingTop: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  ratingLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.moss,
  },
  ratingValue: {
    fontFamily: Type.mono,
    fontSize: 20,
    color: Palette.lime,
  },
  ratingPending: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
  },
  formRow: {
    marginTop: space(3),
  },
  formLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.moss,
    marginBottom: space(2),
  },
  formDots: {
    flexDirection: 'row',
    gap: space(2),
  },
  formDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    fontFamily: Type.mono,
    fontSize: 12,
    color: Palette.chalk,
  },
});
