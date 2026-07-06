import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  blockPlayer,
  followPlayer,
  getPlayer,
  getPlayerPosts,
  likePost,
  Post,
  reportSubject,
  unblockPlayer,
  unfollowPlayer,
  unlikePost,
} from '@/features/social/api';
import { PostCard } from '@/features/social/PostCard';
import { getPlayerStats } from '@/features/stats/api';
import { StatsCard } from '@/features/stats/StatsCard';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

export default function PlayerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Player = useQuery({ queryKey: ['players', id], queryFn: () => getPlayer(id) });
  const Posts = useQuery({
    queryKey: ['players', id, 'posts'],
    queryFn: () => getPlayerPosts(id),
    enabled: Player.data?.is_blocked !== true,
  });
  const Stats = useQuery({
    queryKey: ['players', id, 'stats'],
    queryFn: () => getPlayerStats(id),
    enabled: Player.data?.is_blocked !== true,
  });

  const invalidate = () => void QueryClient.invalidateQueries({ queryKey: ['players', id] });

  const Follow_ = useMutation({
    mutationFn: () => (Player.data?.is_following === true ? unfollowPlayer(id) : followPlayer(id)),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const Block_ = useMutation({
    mutationFn: () => (Player.data?.is_blocked === true ? unblockPlayer(id) : blockPlayer(id)),
    onSuccess: () => {
      invalidate();
      void QueryClient.invalidateQueries({ queryKey: ['players', id, 'posts'] });
      void QueryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const ToggleLike = useMutation({
    mutationFn: ({ post }: { post: Post }) => (post.i_liked ? unlikePost(post.id) : likePost(post.id)),
    onMutate: async ({ post }) => {
      await QueryClient.cancelQueries({ queryKey: ['players', id, 'posts'] });

      QueryClient.setQueryData(['players', id, 'posts'], (Current: Post[] | undefined) =>
        Current?.map((Item) =>
          Item.id === post.id
            ? { ...Item, i_liked: !Item.i_liked, likes_count: Item.likes_count + (Item.i_liked ? -1 : 1) }
            : Item,
        ),
      );
    },
  });

  const ReportPlayer = useMutation({
    mutationFn: (Reason: string) => reportSubject({ subject_type: 'user', subject_id: id, reason: Reason }),
    onSuccess: () => Alert.alert('Teşekkürler', 'Şikayetin alındı.'),
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const promptReport = () => {
    Alert.alert('Kullanıcıyı şikayet et', 'Sebep seç', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Spam', onPress: () => ReportPlayer.mutate('spam') },
      { text: 'Uygunsuz içerik', onPress: () => ReportPlayer.mutate('uygunsuz_icerik') },
      { text: 'Taciz', onPress: () => ReportPlayer.mutate('taciz') },
    ]);
  };

  const promptBlock = () => {
    const Blocked = Player.data?.is_blocked === true;

    Alert.alert(
      Blocked ? 'Engeli kaldır' : 'Kullanıcıyı engelle',
      Blocked ? 'Bu kullanıcıyı tekrar görebilirsin.' : 'Birbirinizin gönderilerini göremezsiniz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: Blocked ? 'Engeli kaldır' : 'Engelle',
          style: Blocked ? 'default' : 'destructive',
          onPress: () => Block_.mutate(),
        },
      ],
    );
  };

  if (Player.isPending || Player.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Player.data;
  const Blocked = Data.is_blocked === true;

  return (
    <Screen bare>
      <FlatList
        data={Blocked ? [] : Posts.data ?? []}
        keyExtractor={(Item) => Item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
                <Text style={styles.back}>‹ Geri</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={promptReport} hitSlop={12}>
                <Ionicons name="ellipsis-horizontal" size={20} color={Palette.moss} />
              </Pressable>
            </View>

            <Text style={styles.name}>{Data.name ?? 'İsimsiz'}</Text>

            {Data.profile != null && (
              <Text style={styles.meta}>
                {[Data.profile.city, Data.profile.district].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
                {' · '}
                Seviye {Data.profile.level}
              </Text>
            )}

            {Data.profile?.bio != null && Data.profile.bio !== '' && (
              <Text style={styles.bio}>{Data.profile.bio}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{Data.followers_count}</Text>
                <Text style={styles.statLabel}>TAKİPÇİ</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{Data.following_count}</Text>
                <Text style={styles.statLabel}>TAKİP</Text>
              </View>
            </View>

            {Data.is_following != null && (
              <View style={styles.actionsRow}>
                <View style={styles.flex1}>
                  <Button
                    label={Data.is_following ? 'Takipten çık' : 'Takip et'}
                    variant={Data.is_following ? 'ghost' : 'primary'}
                    onPress={() => Follow_.mutate()}
                    loading={Follow_.isPending}
                  />
                </View>
                <Pressable accessibilityRole="button" onPress={promptBlock} style={styles.blockButton} hitSlop={8}>
                  <Ionicons
                    name={Blocked ? 'lock-open-outline' : 'ban-outline'}
                    size={20}
                    color={Blocked ? Palette.lime : Palette.clay}
                  />
                </Pressable>
              </View>
            )}

            {!Blocked && Stats.data != null && <StatsCard stats={Stats.data} />}

            {Blocked ? (
              <Text style={styles.blockedText}>Bu kullanıcıyı engelledin, gönderileri gizli.</Text>
            ) : (
              <Text style={styles.sectionLabel}>GÖNDERİLER</Text>
            )}
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
          !Blocked && !Posts.isPending ? (
            <Text style={styles.emptyText}>Henüz gönderi yok.</Text>
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
  list: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(8),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space(5),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  name: {
    fontFamily: Type.display,
    fontSize: 34,
    color: Palette.chalk,
  },
  meta: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
  },
  bio: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 21,
    color: Palette.chalk,
    marginTop: space(3),
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    marginTop: space(5),
  },
  flex1: {
    flex: 1,
  },
  blockButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(6),
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
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(2),
  },
});
