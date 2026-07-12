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

export type SeasonMatch = {
  match_id: string;
  starts_at: string;
  venue_text: string | null;
  team_name: string;
  opponent_team_name: string | null;
  home_score: number | null;
  away_score: number | null;
  goals: number;
  assists: number;
  average_score: number | null;
};

export async function getPlayerStats(playerId: string, season?: number): Promise<PlayerStats> {
  const { data } = await Api.get<{ data: PlayerStats }>(`/players/${playerId}/stats`, {
    params: season != null ? { season } : undefined,
  });

  return data.data;
}

export async function getPlayerSeasonMatches(playerId: string, season?: number): Promise<SeasonMatch[]> {
  const { data } = await Api.get<{ data: SeasonMatch[] }>(`/players/${playerId}/stats/matches`, {
    params: season != null ? { season } : undefined,
  });

  return data.data;
}

export type PlayerBadge = {
  key: string;
  label: string;
  description: string;
  icon: string;
  earned_at: string;
};

export async function getPlayerBadges(playerId: string): Promise<PlayerBadge[]> {
  const { data } = await Api.get<{ data: PlayerBadge[] }>(`/players/${playerId}/badges`);

  return data.data;
}
