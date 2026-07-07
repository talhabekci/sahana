import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getMe } from '@/features/auth/api';
import { ChatMessage, listDirectMessages, sendDirectMessage } from '@/features/chat/api';
import { getPlayer } from '@/features/social/api';
import { disconnectEcho, getEcho } from '@/shared/api/echo';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function DirectChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();
  const [Body, setBody] = useState('');

  const Me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const Other = useQuery({ queryKey: ['players', id], queryFn: () => getPlayer(id) });

  const QueryKey = ['dm', id, 'messages'];

  const List = useInfiniteQuery({
    queryKey: QueryKey,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => listDirectMessages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (LastPage) => LastPage.nextCursor ?? undefined,
  });

  const Send = useMutation({
    mutationFn: (Text: string) => sendDirectMessage(id, { type: 'text', body: Text }),
    onSuccess: (Message) => {
      QueryClient.setQueryData<typeof List.data>(QueryKey, (Current) => {
        if (Current == null) {
          return Current;
        }

        const [First, ...Rest] = Current.pages;

        return {
          ...Current,
          pages: [{ ...First, data: [Message, ...First.data] }, ...Rest],
        };
      });
      void QueryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (Me.data == null) {
      return;
    }

    const PublicIds = [Me.data.id, id].sort();
    const Channel = getEcho().private(`dm.${PublicIds[0]}.${PublicIds[1]}`);

    Channel.listen('.message.sent', (Message: ChatMessage) => {
      QueryClient.setQueryData<typeof List.data>(QueryKey, (Current) => {
        if (Current == null) {
          return Current;
        }

        const [First, ...Rest] = Current.pages;

        return {
          ...Current,
          pages: [{ ...First, data: [Message, ...First.data] }, ...Rest],
        };
      });
      void QueryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      Channel.stopListening('.message.sent');
      disconnectEcho();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, Me.data?.id]);

  const Messages = List.data?.pages.flatMap((Page) => Page.data) ?? [];

  function submit() {
    const Trimmed = Body.trim();

    if (Trimmed.length < 1 || Send.isPending) {
      return;
    }

    setBody('');
    Send.mutate(Trimmed);
  }

  return (
    <Screen bare>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {Other.data?.name ?? 'İsimsiz'}
          </Text>
          <View style={styles.backSpacer} />
        </View>

        {List.isPending ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.lime} />
          </View>
        ) : (
          <FlatList
            data={Messages}
            keyExtractor={(Item) => Item.id}
            inverted
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (List.hasNextPage === true && !List.isFetchingNextPage) {
                void List.fetchNextPage();
              }
            }}
            renderItem={({ item }) => (
              <View style={styles.messageRow}>
                <View
                  style={[
                    styles.bubble,
                    item.author?.id === Me.data?.id ? styles.bubbleMine : styles.bubbleTheirs,
                  ]}>
                  {item.type === 'image' ? (
                    <Text style={styles.refText}>🖼️ Görsel</Text>
                  ) : (
                    <Text style={styles.bubbleBody}>{item.body}</Text>
                  )}
                  <Text style={styles.bubbleWhen}>{formatWhen(item.created_at)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Henüz mesaj yok. İlk mesajı sen yaz.</Text>}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={Body}
            onChangeText={setBody}
            placeholder="Mesaj yaz..."
            placeholderTextColor={Palette.moss}
            selectionColor={Palette.lime}
            style={styles.input}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            disabled={Body.trim().length < 1 || Send.isPending}
            onPress={submit}
            style={[
              styles.sendButton,
              (Body.trim().length < 1 || Send.isPending) && styles.sendButtonDisabled,
            ]}>
            <Ionicons name="arrow-up" size={18} color={Palette.limeInk} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(3),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  backSpacer: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Type.bodyBold,
    fontSize: 15,
    color: Palette.chalk,
  },
  list: {
    paddingHorizontal: space(6),
    paddingVertical: space(3),
    gap: space(2),
  },
  messageRow: {
    marginVertical: space(1),
  },
  bubble: {
    borderRadius: Radius.l,
    borderWidth: 1,
    padding: space(3),
    maxWidth: '85%',
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.turf,
    borderColor: Palette.lineFaint,
  },
  bubbleBody: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 21,
    color: Palette.chalk,
  },
  refText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  bubbleWhen: {
    fontFamily: Type.mono,
    fontSize: 10,
    color: Palette.moss,
    marginTop: space(1),
  },
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    textAlign: 'center',
    marginTop: space(6),
    transform: [{ scaleY: -1 }],
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space(2),
    paddingHorizontal: space(6),
    paddingVertical: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingHorizontal: space(4),
    paddingVertical: space(2),
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
