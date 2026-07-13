import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlayerStats } from './api';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

type Props = {
  stats: PlayerStats;
  /** Verilirse kart dokunulabilir olur ve sağ üstte detay oku görünür (BACKLOG #44). */
  onPress?: () => void;
};

export function StatsCard({ stats, onPress }: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);

  return (
    <Pressable
      accessibilityRole={onPress != null ? 'button' : undefined}
      onPress={onPress}
      disabled={onPress == null}
      style={styles.card}>
      <View style={styles.kickerRow}>
        <Text style={styles.kicker}>{stats.season} SEZONU</Text>
        {onPress != null && <Ionicons name="chevron-forward" size={16} color={Palette.moss} />}
      </View>

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
    </Pressable>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
