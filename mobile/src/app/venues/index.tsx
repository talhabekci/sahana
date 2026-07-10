import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { listVenues } from '@/features/venue/api';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

export default function Venues() {
  const Router = useRouter();
  const [Search, setSearch] = useState('');

  const Venues_ = useQuery({
    queryKey: ['venues', Search],
    queryFn: () => listVenues(Search.trim() !== '' ? { search: Search.trim() } : undefined),
  });

  return (
    <Screen bare>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <Text style={styles.headline}>SAHALAR</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Palette.moss} />
        <TextInput
          value={Search}
          onChangeText={setSearch}
          placeholder="Saha ara..."
          placeholderTextColor={Palette.moss}
          selectionColor={Palette.lime}
          style={styles.searchInput}
        />
      </View>

      {Venues_.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : Venues_.isError ? (
        <ErrorState onRetry={() => void Venues_.refetch()} />
      ) : (
        <FlatList
          data={Venues_.data ?? []}
          keyExtractor={(Item) => Item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => Router.push(`/venues/${item.id}`)}
              style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.average_score !== null && (
                  <View style={styles.scoreChip}>
                    <Ionicons name="star" size={12} color={Palette.limeInk} />
                    <Text style={styles.scoreText}>{item.average_score}</Text>
                  </View>
                )}
              </View>
              {item.address != null && <Text style={styles.cardAddress}>{item.address}</Text>}
              <View style={styles.cardMetaRow}>
                {(item.price_min != null || item.price_max != null) && (
                  <Text style={styles.cardMeta}>
                    {item.price_min ?? '?'}-{item.price_max ?? '?'} TL
                  </Text>
                )}
                {item.distance_km != null && (
                  <Text style={styles.cardMeta}>{item.distance_km} km</Text>
                )}
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState icon="business-outline" message="Henüz saha eklenmedi." />}
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
    letterSpacing: 5,
    color: Palette.lime,
    paddingHorizontal: space(6),
    marginTop: space(3),
    marginBottom: space(3),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginHorizontal: space(6),
    marginBottom: space(4),
    paddingHorizontal: space(4),
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  searchInput: {
    flex: 1,
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: space(6),
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
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Type.bodyBold,
    fontSize: 16,
    color: Palette.chalk,
    flexShrink: 1,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.lime,
    paddingHorizontal: space(2),
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  scoreText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.limeInk,
  },
  cardAddress: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: space(3),
    marginTop: space(2),
  },
  cardMeta: {
    fontFamily: Type.mono,
    fontSize: 12,
    color: Palette.moss,
  },
  separator: {
    height: space(3),
  },
});
