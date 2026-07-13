import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { discoverListings, discoverOpponentListings } from '@/features/match/api';
import { FALLBACK_CENTER } from '@/features/match/constants';
import { OpponentListingCard, PlayerListingCard } from '@/features/match/ListingCards';
import { useListingActions } from '@/features/match/useListingActions';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

export default function Discover() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const { apply, promptOpponentMatch } = useListingActions();

  const [Tab, setTab] = useState<'players' | 'opponents'>('players');
  const [Near, setNear] = useState<string | null>(null);
  const [SearchRadius, setSearchRadius] = useState<number>(25);

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
    queryKey: ['discover', 'players', Near, SearchRadius],
    queryFn: () => discoverListings({ near: Near ?? undefined, radius: SearchRadius }),
    enabled: Near != null,
  });

  const OpponentListings = useQuery({
    queryKey: ['discover', 'opponents', Near, SearchRadius],
    queryFn: () => discoverOpponentListings({ near: Near ?? undefined, radius: SearchRadius }),
    enabled: Near != null && Tab === 'opponents',
  });

  const Loading = Near == null || (Tab === 'players' ? PlayerListings.isPending : OpponentListings.isPending);
  const IsError = Tab === 'players' ? PlayerListings.isError : OpponentListings.isError;

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

      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>YARIÇAP</Text>
        <View style={styles.radiusChips}>
          {RADIUS_OPTIONS.map((Option) => (
            <Pressable
              key={Option}
              accessibilityRole="radio"
              accessibilityState={{ selected: SearchRadius === Option }}
              onPress={() => setSearchRadius(Option)}
              style={[styles.radiusChip, SearchRadius === Option && styles.radiusChipActive]}>
              <Text
                style={[
                  styles.radiusChipText,
                  SearchRadius === Option && styles.radiusChipTextActive,
                ]}>
                {Option} km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {Loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : IsError ? (
        <ErrorState
          onRetry={() => void (Tab === 'players' ? PlayerListings.refetch() : OpponentListings.refetch())}
        />
      ) : Tab === 'players' ? (
        <FlatList
          data={PlayerListings.data}
          keyExtractor={(Listing) => Listing.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PlayerListingCard listing={item} onApply={() => apply(item.id)} />}
          ListEmptyComponent={
            <EmptyState
              icon="person-add-outline"
              message="Yakınında açık ilan yok. Yarıçapı genişletmek için daha sonra tekrar bak."
            />
          }
        />
      ) : (
        <FlatList
          data={OpponentListings.data}
          keyExtractor={(Listing) => Listing.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <OpponentListingCard listing={item} onMatch={() => promptOpponentMatch(item)} />
          )}
          ListEmptyComponent={<EmptyState icon="shield-outline" message="Şu an rakip arayan takım yok." />}
        />
      )}
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
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
  radiusRow: {
    marginBottom: space(4),
  },
  radiusLabel: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.moss,
    marginBottom: space(2),
  },
  radiusChips: {
    flexDirection: 'row',
    gap: space(2),
  },
  radiusChip: {
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  radiusChipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  radiusChipText: {
    fontFamily: Type.mono,
    fontSize: 13,
    color: Palette.chalk,
  },
  radiusChipTextActive: {
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
});
