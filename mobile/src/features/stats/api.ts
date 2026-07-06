import { Api } from '@/shared/api/client';

export type RecentRating = {
  match_id: string;
  starts_at: string;
  average_score: number;
};

export type PlayerStats = {
  season: number;
  matches: number;
  goals: number;
  assists: number;
  rating: number | null;
  ratings_count: number;
  reliability: number | null;
  recent_ratings: RecentRating[];
};

export async function getPlayerStats(playerId: string, season?: number): Promise<PlayerStats> {
  const { data } = await Api.get<{ data: PlayerStats }>(`/players/${playerId}/stats`, {
    params: season != null ? { season } : undefined,
  });

  return data.data;
}
