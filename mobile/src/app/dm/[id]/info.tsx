import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatMedia, listDirectMessageMedia } from '@/features/chat/api';
import { getPlayer } from '@/features/social/api';
import { Avatar } from '@/shared/ui/Avatar';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ImageViewerModal } from '@/shared/ui/ImageViewerModal';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const GRID_GAP = 2;
const COLUMNS = 3;

/**
 * DM üstündeki başlığa dokununca açılan "Sohbet Bilgisi" ekranı (BACKLOG #86)
 * — profile gitme + paylaşılan medya grid'i, WhatsApp/Instagram'daki gibi.
 */
export default function DmInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const [ViewerUri, setViewerUri] = useState<string | null>(null);

  const Player = useQuery({ queryKey: ['players', id], queryFn: () => getPlayer(id) });

  const Media = useInfiniteQuery({
    queryKey: ['dm', id, 'media'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => listDirectMessageMedia(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (LastPage) => LastPage.nextCursor ?? undefined,
  });

  const MediaItems = Media.data?.pages.flatMap((Page) => Page.data) ?? [];

  return (
    <Screen bare>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <View style={styles.profileBlock}>
        <Avatar uri={Player.data?.avatar_path} name={Player.data?.name} size={88} />
        <Text style={styles.name}>{Player.data?.name ?? 'İsimsiz'}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => Router.push(`/player/${id}`)}
          style={styles.profileButton}>
          <Ionicons name="person-outline" size={16} color={Palette.limeInk} />
          <Text style={styles.profileButtonText}>Profili görüntüle</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>PAYLAŞILAN MEDYA</Text>

      <FlatList
        data={MediaItems}
        keyExtractor={(Item) => Item.id}
        numColumns={COLUMNS}
        contentContainerStyle={styles.grid}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (Media.hasNextPage === true && !Media.isFetchingNextPage) {
            void Media.fetchNextPage();
          }
        }}
        renderItem={({ item }: { item: ChatMedia }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => setViewerUri(item.image_path)}
            style={styles.cell}>
            <Image source={{ uri: item.image_path }} style={styles.thumb} />
          </Pressable>
        )}
        ListEmptyComponent={
          !Media.isPending ? (
            <EmptyState icon="images-outline" message="Bu sohbette henüz paylaşılan fotoğraf yok." />
          ) : null
        }
      />

      <ImageViewerModal uri={ViewerUri} onClose={() => setViewerUri(null)} />
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  header: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  profileBlock: {
    alignItems: 'center',
    paddingVertical: space(6),
    gap: space(3),
  },
  name: {
    fontFamily: Type.display,
    fontSize: 24,
    color: Palette.chalk,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: Palette.lime,
    borderRadius: Radius.pill,
    paddingHorizontal: space(5),
    paddingVertical: space(2),
  },
  profileButtonText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.limeInk,
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.moss,
    paddingHorizontal: space(6),
    marginBottom: space(2),
  },
  grid: {
    paddingHorizontal: space(6) - GRID_GAP,
  },
  cell: {
    flex: 1 / COLUMNS,
    aspectRatio: 1,
    padding: GRID_GAP,
  },
  thumb: {
    flex: 1,
    borderRadius: Radius.s,
    backgroundColor: Palette.turfRaised,
  },
});
