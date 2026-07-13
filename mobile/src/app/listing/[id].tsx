import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import { getListing } from '@/features/match/api';
import { PlayerListingCard } from '@/features/match/ListingCards';
import { useListingActions } from '@/features/match/useListingActions';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Type, space, useTheme } from '@/shared/ui/theme';

/** Paylaşılan adam-eksik ilan linkinin (BACKLOG #33) hedef ekranı. */
export default function SharedPlayerListing() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const Token = useAuthStore((State) => State.token);
  const { apply } = useListingActions();

  useEffect(() => {
    if (Token == null) {
      Router.replace('/(auth)/welcome');
    }
  }, [Token, Router]);

  const Listing = useQuery({
    queryKey: ['listings', id],
    queryFn: () => getListing(id),
    enabled: Token != null,
  });

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => (Router.canGoBack() ? Router.back() : Router.replace('/(tabs)/feed'))}
        hitSlop={12}>
        <Text style={styles.back}>‹ Geri</Text>
      </Pressable>

      <Text style={styles.headline}>ADAM EKSİK</Text>

      {Listing.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : Listing.isError ? (
        <ErrorState onRetry={() => void Listing.refetch()} />
      ) : (
        <PlayerListingCard listing={Listing.data} onApply={() => apply(Listing.data.id)} />
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
    fontSize: 34,
    color: Palette.chalk,
    marginBottom: space(5),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
