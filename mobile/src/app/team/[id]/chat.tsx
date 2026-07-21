import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

import { ChatMessage, listTeamMessages, sendTeamMessage, SendMessagePayload } from '@/features/chat/api';
import { ChatConversation } from '@/features/chat/ChatConversation';
import { setActiveChat } from '@/features/notifications/activeChatContext';
import { toApiFailure } from '@/shared/api/client';
import { disconnectEcho, getEcho } from '@/shared/api/echo';

export default function TeamChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const QueryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      setActiveChat({ teamId: id });

      return () => setActiveChat(null);
    }, [id]),
  );

  const QueryKey = ['teams', id, 'messages'];

  const List = useInfiniteQuery({
    queryKey: QueryKey,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => listTeamMessages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (LastPage) => LastPage.nextCursor ?? undefined,
  });

  const appendMessage = (Message: ChatMessage) => {
    QueryClient.setQueryData<typeof List.data>(QueryKey, (Current) => {
      if (Current == null) {
        return Current;
      }

      const [First, ...Rest] = Current.pages;

      // X-Socket-Id köprüsü gönderenin kendi echo'sunu genelde dışlar, ama
      // bağlantı henüz kurulmamışken gönderilen ilk mesajda ırk koşulu
      // olabilir — aynı id zaten varsa tekrar eklenmez (bkz. BACKLOG.md #13).
      if (First.data.some((Existing) => Existing.id === Message.id)) {
        return Current;
      }

      return {
        ...Current,
        pages: [{ ...First, data: [Message, ...First.data] }, ...Rest],
      };
    });
  };

  const Send = useMutation({
    mutationFn: (Payload: SendMessagePayload) => sendTeamMessage(id, Payload),
    onSuccess: appendMessage,
    onError: (E) => Alert.alert('Mesaj gönderilemedi', toApiFailure(E).message),
  });

  useEffect(() => {
    const Channel = getEcho().private(`team.${id}`);

    Channel.listen('.message.sent', appendMessage);

    return () => {
      Channel.stopListening('.message.sent');
      disconnectEcho();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <ChatConversation
      title="TAKIM SOHBETİ"
      messages={List.data?.pages.flatMap((Page) => Page.data) ?? []}
      loading={List.isPending}
      error={List.isError}
      onRetry={() => void List.refetch()}
      onEndReached={() => {
        if (List.hasNextPage === true && !List.isFetchingNextPage) {
          void List.fetchNextPage();
        }
      }}
      sending={Send.isPending}
      onSend={(Payload) => Send.mutate(Payload)}
      showAuthorName
      teamId={id}
    />
  );
}
