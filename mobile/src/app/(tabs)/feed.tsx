import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getFeed, likePost, Post, unlikePost } from '@/features/social/api';
import { PostCard } from '@/features/social/PostCard';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Type, space } from '@/shared/ui/theme';

export default function Feed() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Feed_ = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (LastPage) => LastPage.nextCursor ?? undefined,
  });

  const ToggleLike = useMutation({
    mutationFn: ({ post }: { post: Post }) => (post.i_liked ? unlikePost(post.id) : likePost(post.id)),
    onMutate: async ({ post }) => {
      await QueryClient.cancelQueries({ queryKey: ['feed'] });

      QueryClient.setQueryData(
        ['feed'],
        (Current: typeof Feed_.data) =>
          Current != null && {
            ...Current,
            pages: Current.pages.map((Page) => ({
              ...Page,
              data: Page.data.map((Item) =>
                Item.id === post.id
                  ? {
                      ...Item,
                      i_liked: !Item.i_liked,
                      likes_count: Item.likes_count + (Item.i_liked ? -1 : 1),
                    }
                  : Item,
              ),
            })),
          },
      );
    },
  });

  const Posts = Feed_.data?.pages.flatMap((Page) => Page.data) ?? [];

  return (
    <Screen pitch pitchY={-160} bare>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityRole="button" onPress={() => Router.push('/post/create')} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={26} color={Palette.lime} />
          </Pressable>
          <Text style={styles.kicker}>AKIŞ</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => Router.push('/notifications')} hitSlop={12}>
            <Ionicons name="notifications-outline" size={22} color={Palette.chalk} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => Router.push('/search')} hitSlop={12}>
            <Ionicons name="search-outline" size={22} color={Palette.chalk} />
          </Pressable>
        </View>
      </View>

      {Feed_.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : Feed_.isError ? (
        <ErrorState onRetry={() => void Feed_.refetch()} />
      ) : (
        <FlatList
          data={Posts}
          keyExtractor={(Item) => Item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Feed_.isRefetching && !Feed_.isFetchingNextPage}
              onRefresh={() => void Feed_.refetch()}
              tintColor={Palette.lime}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (Feed_.hasNextPage === true && !Feed_.isFetchingNextPage) {
              void Feed_.fetchNextPage();
            }
          }}
          ListFooterComponent={
            Feed_.isFetchingNextPage ? (
              <ActivityIndicator color={Palette.lime} style={styles.footerSpinner} />
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => Router.push(`/post/${item.id}`)}
              onToggleLike={() => ToggleLike.mutate({ post: item })}
              onPressAuthor={item.author != null ? () => Router.push(`/player/${item.author?.id}`) : undefined}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon="newspaper-outline"
              message="Henüz akışın boş. Takım arkadaşlarını takip et ya da ilk gönderini paylaş."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space(4),
    paddingHorizontal: space(6),
    marginBottom: space(3),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(4),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 5,
    color: Palette.lime,
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
  footerSpinner: {
    marginVertical: space(4),
  },
});
