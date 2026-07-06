import { Api } from '@/shared/api/client';

export type PostType = 'text' | 'match_played' | 'lineup_shared';

export type PostAuthor = {
  id: string;
  name: string | null;
  avatar_path: string | null;
};

export type PostTeamSummary = {
  id: string;
  name: string;
  badge_icon: string;
  color_home: string;
};

export type Post = {
  id: string;
  type: PostType;
  body: string | null;
  author?: PostAuthor;
  team?: PostTeamSummary | null;
  match?: {
    id: string;
    venue_text: string;
    starts_at: string;
    opponent_team_name: string | null;
  } | null;
  lineup?: { id: string; name: string } | null;
  likes_count: number;
  comments_count: number;
  i_liked: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  body: string;
  author?: PostAuthor;
  created_at: string;
};

export type PublicPlayer = {
  id: string;
  name: string | null;
  avatar_path: string | null;
  profile?: {
    positions: string[];
    foot: string | null;
    level: number;
    city: string | null;
    district: string | null;
    bio: string | null;
  } | null;
  followers_count: number;
  following_count: number;
  is_following: boolean | null;
  is_blocked: boolean | null;
};

export async function getFeed(cursor?: string): Promise<{ data: Post[]; nextCursor: string | null }> {
  const { data } = await Api.get<{ data: Post[]; meta: { next_cursor: string | null } }>('/feed', {
    params: cursor != null ? { cursor } : undefined,
  });

  return { data: data.data, nextCursor: data.meta.next_cursor };
}

export async function createPost(payload: { body: string; team_id?: string | null }): Promise<Post> {
  const { data } = await Api.post<{ data: Post }>('/posts', payload);

  return data.data;
}

export async function getPost(postId: string): Promise<Post> {
  const { data } = await Api.get<{ data: Post }>(`/posts/${postId}`);

  return data.data;
}

export async function deletePost(postId: string): Promise<void> {
  await Api.delete(`/posts/${postId}`);
}

export async function likePost(postId: string): Promise<void> {
  await Api.post(`/posts/${postId}/like`);
}

export async function unlikePost(postId: string): Promise<void> {
  await Api.delete(`/posts/${postId}/like`);
}

export async function getComments(postId: string): Promise<Comment[]> {
  const { data } = await Api.get<{ data: Comment[] }>(`/posts/${postId}/comments`);

  return data.data;
}

export async function createComment(postId: string, body: string): Promise<Comment> {
  const { data } = await Api.post<{ data: Comment }>(`/posts/${postId}/comments`, { body });

  return data.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await Api.delete(`/comments/${commentId}`);
}

export async function getPlayer(publicId: string): Promise<PublicPlayer> {
  const { data } = await Api.get<{ data: PublicPlayer }>(`/players/${publicId}`);

  return data.data;
}

export async function getPlayerPosts(publicId: string): Promise<Post[]> {
  const { data } = await Api.get<{ data: Post[] }>(`/players/${publicId}/posts`);

  return data.data;
}

export async function followPlayer(publicId: string): Promise<void> {
  await Api.post(`/players/${publicId}/follow`);
}

export async function unfollowPlayer(publicId: string): Promise<void> {
  await Api.delete(`/players/${publicId}/follow`);
}

export async function blockPlayer(publicId: string): Promise<void> {
  await Api.post(`/players/${publicId}/block`);
}

export async function unblockPlayer(publicId: string): Promise<void> {
  await Api.delete(`/players/${publicId}/block`);
}

export async function reportSubject(payload: {
  subject_type: 'post' | 'comment' | 'user';
  subject_id: string;
  reason: string;
}): Promise<void> {
  await Api.post('/reports', payload);
}

export type TeamSearchResult = {
  id: string;
  name: string;
  badge_icon: string;
  color_home: string;
};

export async function searchPlayers(query: string): Promise<PublicPlayer[]> {
  const { data } = await Api.get<{ data: PublicPlayer[] }>('/search', {
    params: { q: query, type: 'player' },
  });

  return data.data;
}

export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  const { data } = await Api.get<{ data: TeamSearchResult[] }>('/search', {
    params: { q: query, type: 'team' },
  });

  return data.data;
}
