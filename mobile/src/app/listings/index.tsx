import * as Location from 'expo-location';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { POSITIONS } from '@/features/auth/PitchPositionPicker';
import {
  applyToListing,
  discoverListings,
  discoverOpponentListings,
  matchOpponentListing,
  OpponentListing,
  PlayerListing,
} from '@/features/match/api';
import { FALLBACK_CENTER, formatDayLabel, formatTimeLabel } from '@/features/match/constants';
import { listTeams } from '@/features/team/api';
import { toApiFailure } from '@/shared/api/client';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function positionLabel(Key: string): string {
  return POSITIONS.find((Position) => Position.key === Key)?.label ?? Key;
}

const APPLY_LABELS = {
  pending: 'Beklemede',
  approved: 'Kadrodasın',
  rejected: 'Reddedildi',
} as const;

export default function Discover() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const [Tab, setTab] = useState<'players' | 'opponents'>('players');
  const [Near, setNear] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const Permission = await Location.requestForegroundPermissionsAsync();

      if (Permission.status === 'granted') {
        const Position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setNear(`${Position.coords.latitude},${Position.coords.longitude}`);
      } else {
        setNear(`${FALLBACK_CENTER.lat},${FALLBACK_CENTER.lng}`);
      }
    })();
  }, []);

  const PlayerListings = useQuery({
    queryKey: ['discover', 'players', Near],
    queryFn: () => discoverListings({ near: Near ?? undefined, radius: 30 }),
    enabled: Near != null,
  });

  const OpponentListings = useQuery({
    queryKey: ['discover', 'opponents', Near],
    queryFn: () => discoverOpponentListings({ near: Near ?? undefined, radius: 50 }),
    enabled: Near != null && Tab === 'opponents',
  });

  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });
  const MyCaptainTeams = useMemo(
    () => (Teams.data ?? []).filter((Team) => Team.my_role === 'captain'),
    [Teams.data],
  );

  const Apply = useMutation({
    mutationFn: (ListingId: string) => applyToListing(ListingId),
    onSuccess: () => {
      void QueryClient.invalidateQueries({ queryKey: ['discover'] });
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const MatchOpponent = useMutation({
    mutationFn: ({ listingId, teamId }: { listingId: string; teamId: string }) =>
      matchOpponentListing(listingId, teamId),
    onSuccess: () => {
      void QueryClient.invalidateQueries({ queryKey: ['discover'] });
      Alert.alert('Eşleşti!', 'Maç detayında rakip olarak görünüyorsunuz.');
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const promptOpponentMatch = (Listing: OpponentListing) => {
    if (MyCaptainTeams.length === 0) {
      Alert.alert('Takım gerekli', 'Rakip olmak için kaptanı olduğun bir takım gerekiyor.');

      return;
    }

    Alert.alert('Maç yapalım', `${Listing.team?.name ?? 'Bu takım'} ile eşleşilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      ...MyCaptainTeams.map((Team) => ({
        text: Team.name,
        onPress: () => MatchOpponent.mutate({ listingId: Listing.id, teamId: Team.id }),
      })),
    ]);
  };

  const renderPlayerListing = ({ item }: { item: PlayerListing }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flexShrink}>
          <Text style={styles.cardTitle}>{item.match?.team_name ?? 'Takım'}</Text>
          <Text style={styles.cardMeta}>
            {item.match != null
              ? `${formatDayLabel(item.match.starts_at)} · ${formatTimeLabel(item.match.starts_at)} · ${item.match.venue_text}`
              : ''}
          </Text>
        </View>
        {item.distance_km != null && (
          <Text style={styles.distance}>{item.distance_km} km</Text>
        )}
      </View>

      <View style={styles.chipRow}>
        {item.positions_needed.map((Position) => (
          <View key={Position} style={styles.positionChip}>
            <Text style={styles.positionChipText}>{positionLabel(Position)}</Text>
          </View>
        ))}
        <View style={styles.positionChip}>
          <Text style={styles.positionChipText}>Seviye {item.level_min}-{item.level_max}</Text>
        </View>
        <View style={styles.positionChip}>
          <Text style={styles.positionChipText}>{item.needed_count} kişi</Text>
        </View>
      </View>

      {item.my_application_status != null ? (
        <View style={styles.appliedBadge}>
          <Text style={styles.appliedText}>{APPLY_LABELS[item.my_application_status]}</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => Apply.mutate(item.id)}
          style={styles.applyButton}>
          <Text style={styles.applyText}>Başvur</Text>
        </Pressable>
      )}
    </View>
  );

  const renderOpponentListing = ({ item }: { item: OpponentListing }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.team?.name ?? 'Takım'}</Text>
      {item.match != null && (
        <Text style={styles.cardMeta}>
          {formatDayLabel(item.match.starts_at)} · {formatTimeLabel(item.match.starts_at)} ·{' '}
          {item.match.venue_text} · {item.match.format}v{item.match.format}
        </Text>
      )}
      {item.note != null && <Text style={styles.note}>{item.note}</Text>}

      <Pressable
        accessibilityRole="button"
        onPress={() => promptOpponentMatch(item)}
        style={styles.applyButton}>
        <Text style={styles.applyText}>Maç yapalım</Text>
      </Pressable>
    </View>
  );

  const Loading = Near == null || (Tab === 'players' ? PlayerListings.isPending : OpponentListings.isPending);

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Geri</Text>
      </Pressable>

      <Text style={styles.headline}>KEŞFET</Text>

      <View style={styles.segmentRow}>
        {(
          [
            ['players', 'Adam Eksik'],
            ['opponents', 'Rakip Arayanlar'],
          ] as const
        ).map(([Key, Label]) => (
          <Pressable
            key={Key}
            accessibilityRole="button"
            onPress={() => setTab(Key)}
            style={[styles.segment, Tab === Key && styles.segmentActive]}>
            <Text style={[styles.segmentText, Tab === Key && styles.segmentTextActive]}>
              {Label}
            </Text>
          </Pressable>
        ))}
      </View>

      {Loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : Tab === 'players' ? (
        <FlatList
          data={PlayerListings.data}
          keyExtractor={(Listing) => Listing.id}
          contentContainerStyle={styles.list}
          renderItem={renderPlayerListing}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Yakınında açık ilan yok. Yarıçapı genişletmek için daha sonra tekrar bak.
            </Text>
          }
        />
      ) : (
        <FlatList
          data={OpponentListings.data}
          keyExtractor={(Listing) => Listing.id}
          contentContainerStyle={styles.list}
          renderItem={renderOpponentListing}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Şu an rakip arayan takım yok.</Text>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 38,
    color: Palette.chalk,
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
    paddingBottom: space(8),
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
  cardTitle: {
    fontFamily: Type.displaySemi,
    fontSize: 19,
    color: Palette.chalk,
  },
  cardMeta: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  distance: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: Palette.lime,
  },
  note: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
    marginTop: space(2),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
    marginTop: space(3),
  },
  positionChip: {
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: space(2),
  },
  positionChipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.chalk,
  },
  applyButton: {
    marginTop: space(3),
    backgroundColor: Palette.lime,
    borderRadius: Radius.pill,
    paddingVertical: space(2),
    alignItems: 'center',
  },
  applyText: {
    fontFamily: Type.displaySemi,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Palette.limeInk,
  },
  appliedBadge: {
    marginTop: space(3),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    paddingVertical: space(2),
    alignItems: 'center',
  },
  appliedText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.moss,
    textAlign: 'center',
    paddingVertical: space(8),
  },
});
