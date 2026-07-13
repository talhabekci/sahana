import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { listFollowers, listFollowing, PublicPlayer } from '@/features/social/api';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

function initials(name: string | null): string {
  if (name == null || name.trim() === '') {
    return '?';
  }

  const Parts = name.trim().split(/\s+/);
  const First = Parts[0]?.[0] ?? '';
  const Last = Parts.length > 1 ? (Parts[Parts.length - 1]?.[0] ?? '') : '';

  return (First + Last).toUpperCase();
}

/** BACKLOG #63: memo — `onPress` ebeveynden SABİT referans olarak gelmeli (useCallback). */
const PlayerRow = memo(function PlayerRow({ player, onPress }: { player: PublicPlayer; onPress: (id: string) => void }) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(player.id)} style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitials}>{initials(player.name)}</Text>
      </View>
      <View style={styles.flexShrink}>
        <Text style={styles.rowTitle}>{player.name ?? 'İsimsiz'}</Text>
        {player.profile != null && (
          <Text style={styles.rowSubtitle}>
            {[player.profile.city, player.profile.district].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

export default function Connections() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const Router = useRouter();

  const [ActiveTab, setActiveTab] = useState<'followers' | 'following'>(
    tab === 'following' ? 'following' : 'followers',
  );

  const handleOpenPlayer = useCallback((PlayerId: string) => Router.push(`/player/${PlayerId}`), [Router]);

  const Followers = useQuery({
    queryKey: ['players', id, 'followers'],
    queryFn: () => listFollowers(id),
    enabled: ActiveTab === 'followers',
  });

  const Following = useQuery({
    queryKey: ['players', id, 'following'],
    queryFn: () => listFollowing(id),
    enabled: ActiveTab === 'following',
  });

  const List = ActiveTab === 'followers' ? Followers : Following;

  return (
    <Screen bare>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <View style={styles.segmentRow}>
        {(
          [
            ['followers', 'Takipçiler'],
            ['following', 'Takip Edilenler'],
          ] as const
        ).map(([Key, Label]) => (
          <Pressable
            key={Key}
            accessibilityRole="button"
            onPress={() => setActiveTab(Key)}
            style={[styles.segment, ActiveTab === Key && styles.segmentActive]}>
            <Text style={[styles.segmentText, ActiveTab === Key && styles.segmentTextActive]}>{Label}</Text>
          </Pressable>
        ))}
      </View>

      {List.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : List.isError ? (
        <ErrorState onRetry={() => void List.refetch()} />
      ) : (
        <FlatList
          data={List.data}
          keyExtractor={(Player) => Player.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PlayerRow player={item} onPress={handleOpenPlayer} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              message={ActiveTab === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimseyi takip etmiyor.'}
            />
          }
        />
      )}
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  topBar: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: space(2),
    paddingHorizontal: space(6),
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
    paddingHorizontal: space(6),
    paddingBottom: space(8),
  },
  separator: {
    height: space(3),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: Type.bodyBold,
    fontSize: 15,
    color: Palette.lime,
  },
  flexShrink: {
    flexShrink: 1,
  },
  rowTitle: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  rowSubtitle: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
});
