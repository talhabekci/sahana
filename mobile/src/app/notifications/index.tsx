import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const TITLES: Record<string, string> = {
  MatchCreatedNotification: 'Yeni maç kuruldu',
  MatchConfirmedNotification: 'Maç onaylandı',
  RsvpReminderNotification: 'Geliyor musun?',
  MatchReminderNotification: 'Maça az kaldı',
  ListingApplicationNotification: 'Yeni başvuru',
  ApplicationDecisionNotification: 'Başvuru kararı',
  InviteAcceptedNotification: 'Yeni üye katıldı',
  OpponentFoundNotification: 'Rakip bulundu',
  SocialSummaryNotification: 'Akışında hareket var',
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describe(Item: AppNotification): string {
  const Data = Item.data;

  switch (Item.type) {
    case 'MatchCreatedNotification':
    case 'MatchConfirmedNotification':
    case 'RsvpReminderNotification':
    case 'MatchReminderNotification':
      return typeof Data.venue_text === 'string' ? Data.venue_text : '';
    case 'SocialSummaryNotification': {
      const Parts = [
        typeof Data.likes_count === 'number' && Data.likes_count > 0 ? `${Data.likes_count} beğeni` : null,
        typeof Data.comments_count === 'number' && Data.comments_count > 0 ? `${Data.comments_count} yorum` : null,
        typeof Data.new_followers_count === 'number' && Data.new_followers_count > 0
          ? `${Data.new_followers_count} yeni takipçi`
          : null,
      ].filter(Boolean);

      return Parts.join(' · ');
    }
    default:
      return '';
  }
}

export default function Notifications() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const List = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (LastPage) => LastPage.nextCursor ?? undefined,
  });

  const MarkRead = useMutation({
    mutationFn: (Id: string) => markNotificationRead(Id),
    onSuccess: () => void QueryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const MarkAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void QueryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const Items = List.data?.pages.flatMap((Page) => Page.data) ?? [];

  return (
    <Screen bare>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => MarkAllRead.mutate()} hitSlop={12}>
            <Text style={styles.markAll}>Tümünü okundu yap</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Router.push('/notifications/preferences')}
            hitSlop={12}>
            <Ionicons name="settings-outline" size={20} color={Palette.moss} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.headline}>BİLDİRİMLER</Text>

      {List.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : (
        <FlatList
          data={Items}
          keyExtractor={(Item) => Item.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (List.hasNextPage === true && !List.isFetchingNextPage) {
              void List.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!item.read) {
                  MarkRead.mutate(item.id);
                }
              }}
              style={[styles.card, !item.read && styles.cardUnread]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{TITLES[item.type] ?? 'Bildirim'}</Text>
                {!item.read && <View style={styles.dot} />}
              </View>
              {describe(item) !== '' && <Text style={styles.cardBody}>{describe(item)}</Text>}
              <Text style={styles.cardWhen}>{formatWhen(item.created_at)}</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Henüz bildirimin yok.</Text>}
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
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(4),
  },
  markAll: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.lime,
  },
  headline: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 3,
    color: Palette.lime,
    paddingHorizontal: space(6),
    marginTop: space(3),
    marginBottom: space(4),
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
  cardUnread: {
    borderColor: Palette.lime,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Type.bodyBold,
    fontSize: 15,
    color: Palette.chalk,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.lime,
  },
  cardBody: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
  },
  cardWhen: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: Palette.moss,
    marginTop: space(2),
  },
  separator: {
    height: space(3),
  },
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(4),
  },
});
