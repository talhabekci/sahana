import { Api } from '@/shared/api/client';

export type MessageType = 'text' | 'image' | 'match_ref' | 'lineup_ref';

export type ChatMessage = {
  id: string;
  type: MessageType;
  body: string | null;
  image_path: string | null;
  match_id: string | null;
  lineup_id: string | null;
  author: { id: string; name: string | null; avatar_path: string | null } | null;
  created_at: string;
};

export async function listTeamMessages(
  teamId: string,
  before?: string,
): Promise<{ data: ChatMessage[]; nextCursor: string | null }> {
  const { data } = await Api.get<{ data: ChatMessage[]; meta: { next_cursor: string | null } }>(
    `/teams/${teamId}/messages`,
    { params: before != null ? { before, limit: 30 } : { limit: 30 } },
  );

  return { data: data.data, nextCursor: data.meta.next_cursor };
}

export async function sendTeamMessage(
  teamId: string,
  payload: { type: MessageType; body?: string; match_id?: string; lineup_id?: string },
): Promise<ChatMessage> {
  const { data } = await Api.post<{ data: ChatMessage }>(`/teams/${teamId}/messages`, payload);

  return data.data;
}

export type Conversation = {
  type: 'team' | 'dm';
  id: string;
  title: string | null;
  badge_icon?: string;
  color?: string;
  avatar_path?: string | null;
  last_message: string | null;
  last_message_at: string | null;
};

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await Api.get<{ data: Conversation[] }>('/conversations');

  return data.data;
}

export async function listDirectMessages(
  userId: string,
  before?: string,
): Promise<{ data: ChatMessage[]; nextCursor: string | null }> {
  const { data } = await Api.get<{ data: ChatMessage[]; meta: { next_cursor: string | null } }>(
    `/players/${userId}/messages`,
    { params: before != null ? { before, limit: 30 } : { limit: 30 } },
  );

  return { data: data.data, nextCursor: data.meta.next_cursor };
}

export async function sendDirectMessage(
  userId: string,
  payload: { type: 'text' | 'image'; body?: string; image_path?: string },
): Promise<ChatMessage> {
  const { data } = await Api.post<{ data: ChatMessage }>(`/players/${userId}/messages`, payload);

  return data.data;
}
