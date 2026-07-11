import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { listConversations } from '@/features/chat/api';
import { badgeIonicon } from '@/features/team/constants';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function formatWhen(iso: string | null): string {
  if (iso == null) {
    return '';
  }

  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Conversations() {
  const Router = useRouter();

  const List = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
  });

  return (
    <Screen bare>
      <View style={styles.header}>
        <Text style={styles.kicker}>SOHBET</Text>
      </View>

      {List.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : List.isError ? (
        <ErrorState onRetry={() => void List.refetch()} />
      ) : (
        <FlatList
          data={List.data ?? []}
          keyExtractor={(Item) => `${Item.type}:${Item.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                Router.push(item.type === 'team' ? `/team/${item.id}/chat` : `/dm/${item.id}`)
              }
              style={styles.card}>
              <View style={[styles.avatar, item.type === 'team' && { backgroundColor: item.color ?? Palette.turfRaised }]}>
                <Ionicons
                  name={item.type === 'team' ? badgeIonicon(item.badge_icon ?? '') : 'person'}
                  size={20}
                  color={item.type === 'team' ? Palette.limeInk : Palette.moss}
                />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title ?? 'İsimsiz'}</Text>
                  <Text style={styles.cardWhen}>{formatWhen(item.last_message_at)}</Text>
                </View>
                <Text style={styles.cardPreview} numberOfLines={1}>
                  {item.last_message ?? 'Henüz mesaj yok'}
                </Text>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" message="Henüz bir sohbetin yok." />
          }
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
  kicker: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 5,
    color: Palette.lime,
    marginBottom: space(3),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: space(6),
    paddingBottom: space(24),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(3),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
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
  cardWhen: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: Palette.moss,
  },
  cardPreview: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  separator: {
    height: space(3),
  },
});
