import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { getMe } from '@/features/auth/api';
import {
  ChatMessage,
  listDirectMessages,
  sendDirectMessage,
  SendMessagePayload,
} from '@/features/chat/api';
import { ChatConversation } from '@/features/chat/ChatConversation';
import { getPlayer } from '@/features/social/api';
import { toApiFailure } from '@/shared/api/client';
import { disconnectEcho, getEcho } from '@/shared/api/echo';

export default function DirectChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const QueryClient = useQueryClient();
  const Router = useRouter();

  const Me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const Other = useQuery({ queryKey: ['players', id], queryFn: () => getPlayer(id) });

  const QueryKey = ['dm', id, 'messages'];

  const List = useInfiniteQuery({
    queryKey: QueryKey,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => listDirectMessages(id, pageParam),
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
    void QueryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const Send = useMutation({
    mutationFn: (Payload: SendMessagePayload) => sendDirectMessage(id, Payload),
    onSuccess: appendMessage,
    onError: (E) => Alert.alert('Mesaj gönderilemedi', toApiFailure(E).message),
  });

  useEffect(() => {
    if (Me.data == null) {
      return;
    }

    const PublicIds = [Me.data.id, id].sort();
    const Channel = getEcho().private(`dm.${PublicIds[0]}.${PublicIds[1]}`);

    Channel.listen('.message.sent', appendMessage);

    return () => {
      Channel.stopListening('.message.sent');
      disconnectEcho();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, Me.data?.id]);

  return (
    <ChatConversation
      title={Other.data?.name ?? 'İsimsiz'}
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
      myUserId={Me.data?.id}
      onPressTitle={() => Router.push(`/player/${id}`)}
    />
  );
}
