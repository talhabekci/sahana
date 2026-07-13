import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { listMatches, Match } from '@/features/match/api';
import { formatDayLabel, formatTimeLabel, MATCH_STATUS_LABELS } from '@/features/match/constants';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

function MatchCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Summary = match.rsvp_summary;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flexShrink}>
          <Text style={styles.cardTeam}>{match.team?.name ?? 'Takım'}</Text>
          <Text style={styles.cardVenue}>{match.venue_text}</Text>
        </View>
        <View style={styles.cardWhen}>
          <Text style={styles.cardDay}>{formatDayLabel(match.starts_at)}</Text>
          <Text style={styles.cardTime}>{formatTimeLabel(match.starts_at)}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.statusChip, match.status === 'confirmed' && styles.statusChipConfirmed]}>
          <Text
            style={[
              styles.statusChipText,
              match.status === 'confirmed' && styles.statusChipTextConfirmed,
            ]}>
            {MATCH_STATUS_LABELS[match.status]}
          </Text>
        </View>

        {Summary != null && (
          <Text style={styles.summary}>
            {Summary.yes} geliyor · {Summary.pending} yanıtsız
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function Matches() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const [Filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const Matches_ = useQuery({
    queryKey: ['matches', Filter],
    queryFn: () => listMatches(Filter),
  });

  // Sekmeler arası geçişte veri tazelensin (kullanıcı talebi, 2026-07-12).
  useFocusEffect(
    useCallback(() => {
      void Matches_.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Filter]),
  );

  return (
    <Screen pitch pitchY={-160}>
      <View style={styles.header}>
        <Text style={styles.kicker}>MAÇLAR</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => Router.push('/venues')}
            hitSlop={8}
            style={styles.discoverLink}>
            <Ionicons name="business" size={16} color={Palette.lime} />
            <Text style={styles.discoverText}>Sahalar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Router.push('/listings')}
            hitSlop={8}
            style={styles.discoverLink}>
            <Ionicons name="search" size={16} color={Palette.lime} />
            <Text style={styles.discoverText}>Keşfet</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.segmentRow}>
        {(['upcoming', 'past'] as const).map((Key) => (
          <Pressable
            key={Key}
            accessibilityRole="button"
            onPress={() => setFilter(Key)}
            style={[styles.segment, Filter === Key && styles.segmentActive]}>
            <Text style={[styles.segmentText, Filter === Key && styles.segmentTextActive]}>
              {Key === 'upcoming' ? 'Yaklaşan' : 'Geçmiş'}
            </Text>
          </Pressable>
        ))}
      </View>

      {Matches_.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : Matches_.isError ? (
        <ErrorState onRetry={() => void Matches_.refetch()} />
      ) : (
        <FlatList
          data={Matches_.data}
          keyExtractor={(Match_) => Match_.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MatchCard match={item} onPress={() => Router.push(`/match/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Filter === 'upcoming' ? 'calendar-outline' : 'time-outline'}
              message={
                Filter === 'upcoming'
                  ? 'Yaklaşan maçın yok. Kur ve takımına duyur.'
                  : 'Henüz oynanmış maç yok.'
              }
            />
          }
        />
      )}

      <View style={styles.footer}>
        <Button label="Maç kur" onPress={() => Router.push('/match/create')} />
      </View>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space(4),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 5,
    color: Palette.lime,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(5),
  },
  discoverLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1),
  },
  discoverText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.lime,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: space(2),
    marginTop: space(4),
    marginBottom: space(4),
  },
  segment: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  segmentActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  segmentText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  segmentTextActive: {
    color: Palette.limeInk,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: space(3),
    paddingBottom: space(24),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space(3),
  },
  flexShrink: {
    flexShrink: 1,
  },
  cardTeam: {
    fontFamily: Type.displaySemi,
    fontSize: 20,
    color: Palette.chalk,
  },
  cardVenue: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  cardWhen: {
    alignItems: 'flex-end',
  },
  cardDay: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.moss,
  },
  cardTime: {
    fontFamily: Type.mono,
    fontSize: 18,
    color: Palette.lime,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space(3),
  },
  statusChip: {
    paddingVertical: 3,
    paddingHorizontal: space(2),
    borderRadius: Radius.s,
    backgroundColor: Palette.turfRaised,
  },
  statusChipConfirmed: {
    backgroundColor: Palette.lime,
  },
  statusChipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 11,
    color: Palette.moss,
  },
  statusChipTextConfirmed: {
    color: Palette.limeInk,
  },
  summary: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
  },
  footer: {
    paddingBottom: space(22),
    paddingTop: space(3),
  },
});
