import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getMe } from '@/features/auth/api';
import { POSITIONS } from '@/features/auth/PitchPositionPicker';
import { getPlayerPosts, likePost, Post, unlikePost } from '@/features/social/api';
import { PostCard } from '@/features/social/PostCard';
import { getPlayerStats } from '@/features/stats/api';
import { StatsCard } from '@/features/stats/StatsCard';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function positionLabel(Key: string): string {
  return POSITIONS.find((Position) => Position.key === Key)?.label ?? Key;
}

function initials(name: string | null | undefined): string {
  if (name == null || name.trim() === '') {
    return '?';
  }

  const Parts = name.trim().split(/\s+/);
  const First = Parts[0]?.[0] ?? '';
  const Last = Parts.length > 1 ? (Parts[Parts.length - 1]?.[0] ?? '') : '';

  return (First + Last).toUpperCase();
}

export default function Profile() {
  const Router = useRouter();
  const QueryClient = useQueryClient();
  const Me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const Stats = useQuery({
    queryKey: ['players', Me.data?.id, 'stats'],
    queryFn: () => getPlayerStats(Me.data?.id ?? ''),
    enabled: Me.data?.id != null,
  });
  const Posts = useQuery({
    queryKey: ['me', 'posts'],
    queryFn: () => getPlayerPosts(Me.data?.id ?? ''),
    enabled: Me.data?.id != null,
  });

  const ToggleLike = useMutation({
    mutationFn: ({ post }: { post: Post }) => (post.i_liked ? unlikePost(post.id) : likePost(post.id)),
    onMutate: async ({ post }) => {
      await QueryClient.cancelQueries({ queryKey: ['me', 'posts'] });

      QueryClient.setQueryData(['me', 'posts'], (Current: Post[] | undefined) =>
        Current?.map((Item) =>
          Item.id === post.id
            ? { ...Item, i_liked: !Item.i_liked, likes_count: Item.likes_count + (Item.i_liked ? -1 : 1) }
            : Item,
        ),
      );
    },
  });

  if (Me.isError) {
    return (
      <Screen>
        <ErrorState onRetry={() => void Me.refetch()} />
      </Screen>
    );
  }

  if (Me.isPending) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Me.data;

  return (
    <Screen bare pitch pitchY={-220}>
      <Pressable
        accessibilityRole="button"
        onPress={() => Router.push('/settings')}
        style={styles.settingsButton}
        hitSlop={8}>
        <Ionicons name="settings-outline" size={20} color={Palette.chalk} />
      </Pressable>

      <FlatList
        data={Posts.data ?? []}
        keyExtractor={(Item) => Item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.kicker}>PROFİL</Text>

            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                onPress={() => Router.push('/profile-edit')}
                style={styles.editButton}
                hitSlop={8}>
                <Ionicons name="pencil" size={16} color={Palette.moss} />
              </Pressable>

              <View style={styles.cardTop}>
                <View style={styles.avatarWrap}>
                  {Data?.avatar_path != null ? (
                    <Image source={{ uri: Data.avatar_path }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarInitials}>{initials(Data?.name)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.flexShrink}>
                  <Text style={styles.name}>{Data?.name ?? 'İsimsiz Oyuncu'}</Text>
                  <Text style={styles.city}>
                    {Data?.profile?.city ?? 'Şehir yok'}
                    {Data?.profile?.district != null ? ` · ${Data.profile.district}` : ''}
                  </Text>
                </View>

                <View style={styles.levelBadge}>
                  <Text style={styles.levelDigit}>{Data?.profile?.level ?? '–'}</Text>
                  <Text style={styles.levelLabel}>SEVİYE</Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                {(Data?.profile?.positions ?? []).map((Key) => (
                  <View key={Key} style={styles.chip}>
                    <Text style={styles.chipText}>{positionLabel(Key)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.statsRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={Data?.id == null}
                  onPress={() => Router.push(`/connections/${Data?.id}?tab=followers`)}
                  style={styles.statBlock}>
                  <Text style={styles.statValue}>{Data?.followers_count ?? 0}</Text>
                  <Text style={styles.statLabel}>TAKİPÇİ</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={Data?.id == null}
                  onPress={() => Router.push(`/connections/${Data?.id}?tab=following`)}
                  style={styles.statBlock}>
                  <Text style={styles.statValue}>{Data?.following_count ?? 0}</Text>
                  <Text style={styles.statLabel}>TAKİP</Text>
                </Pressable>
              </View>
            </View>

            {Stats.data != null && <StatsCard stats={Stats.data} />}

            <View style={styles.contactBlock}>
              <Text style={styles.contactLabel}>HESAP</Text>
              <Text style={styles.contactValue}>{Data?.email ?? Data?.phone ?? '—'}</Text>
            </View>

            <Text style={styles.sectionLabel}>GÖNDERİLERİM</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postWrap}>
            <PostCard
              post={item}
              onPress={() => Router.push(`/post/${item.id}`)}
              onToggleLike={() => ToggleLike.mutate({ post: item })}
            />
          </View>
        )}
        ListEmptyComponent={
          !Posts.isPending ? (
            <EmptyState icon="images-outline" message="Henüz gönderi paylaşmadın." />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: space(4),
    right: space(6),
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  list: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(10),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 5,
    color: Palette.lime,
    marginBottom: space(4),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(5),
  },
  editButton: {
    position: 'absolute',
    top: space(4),
    right: space(4),
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space(3),
  },
  avatarWrap: {
    marginRight: space(1),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontFamily: Type.bodyBold,
    fontSize: 18,
    color: Palette.lime,
  },
  flexShrink: {
    flexShrink: 1,
  },
  name: {
    fontFamily: Type.display,
    fontSize: 38,
    lineHeight: 40,
    color: Palette.chalk,
  },
  city: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.m,
    paddingVertical: space(2),
    paddingHorizontal: space(4),
  },
  levelDigit: {
    fontFamily: Type.mono,
    fontSize: 30,
    color: Palette.lime,
  },
  levelLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.moss,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
    marginTop: space(4),
  },
  chip: {
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.pill,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
  },
  chipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
  },
  statsRow: {
    flexDirection: 'row',
    gap: space(6),
    marginTop: space(5),
  },
  statBlock: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontFamily: Type.mono,
    fontSize: 20,
    color: Palette.chalk,
  },
  statLabel: {
    fontFamily: Type.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.moss,
    marginTop: 2,
  },
  contactBlock: {
    marginTop: space(6),
  },
  contactLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    color: Palette.moss,
    marginBottom: space(1),
  },
  contactValue: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(7),
    marginBottom: space(3),
  },
  postWrap: {
    marginBottom: space(3),
  },
});
