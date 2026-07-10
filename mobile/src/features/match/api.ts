import { Api } from '@/shared/api/client';

export type MatchStatus = 'draft' | 'confirmed' | 'played' | 'cancelled';
export type Rsvp = 'yes' | 'no' | 'maybe';

export type MatchTeamSummary = {
  id: string;
  name: string;
  badge_icon: string;
  color_home: string;
};

export type MatchParticipant = {
  id: string;
  name: string | null;
  rsvp: Rsvp | null;
  source: 'team' | 'listing';
  is_me: boolean;
};

export type Match = {
  id: string;
  team?: MatchTeamSummary;
  opponent_team?: MatchTeamSummary | null;
  venue?: { id: string; name: string; lat: number; lng: number } | null;
  venue_text: string;
  venue_lat: number | null;
  venue_lng: number | null;
  starts_at: string;
  format: number;
  price_per_player: number | null;
  status: MatchStatus;
  my_rsvp: Rsvp | null;
  i_am_captain?: boolean;
  i_am_participant?: boolean;
  i_am_opponent_captain?: boolean;
  rsvp_summary?: { yes: number; no: number; maybe: number; pending: number };
  participants?: MatchParticipant[];
  listings?: { id: string; status: string; needed_count: number; positions_needed: string[] }[];
  result?: MatchResult | null;
};

export type MatchResultStatus = 'pending' | 'confirmed' | 'disputed';

export type MatchResult = {
  home_score: number;
  away_score: number;
  status: MatchResultStatus;
};

export type PlayerMatchStat = {
  id: string;
  goals: number;
  assists: number;
  approved: boolean;
  player?: { id: string; name: string | null };
};

export type VideoProvider = 'youtube' | 'sosyalhalisaha' | 'other';

export type MatchVideo = {
  id: string;
  type: 'external_link' | 'uploaded';
  provider: VideoProvider;
  url: string | null;
  video_url: string | null;
  title: string | null;
  thumbnail_url: string | null;
  uploader?: { id: string; name: string | null };
  created_at: string;
};

export type ListingApplication = {
  id: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  applicant?: { id: string; name: string | null; avatar_path: string | null };
};

export type PlayerListing = {
  id: string;
  positions_needed: string[];
  needed_count: number;
  level_min: number;
  level_max: number;
  lat: number;
  lng: number;
  status: 'open' | 'filled' | 'expired';
  expires_at: string;
  distance_km?: number;
  my_application_status?: 'pending' | 'approved' | 'rejected' | null;
  match?: {
    id: string;
    starts_at: string;
    venue_text: string;
    format: number;
    price_per_player: number | null;
    team_name: string | null;
  };
  applications?: ListingApplication[];
};

export type OpponentListing = {
  id: string;
  note: string | null;
  status: 'open' | 'matched' | 'expired';
  team?: MatchTeamSummary;
  match?: { id: string; starts_at: string; venue_text: string; format: number } | null;
};

export type CreateMatchPayload = {
  team_id: string;
  venue_id?: string | null;
  venue_text: string;
  starts_at: string;
  format: number;
  price_per_player?: number | null;
};

export type CreateListingPayload = {
  positions_needed: string[];
  needed_count: number;
  level_min: number;
  level_max: number;
  lat: number;
  lng: number;
};

export async function listMatches(filter: 'upcoming' | 'past'): Promise<Match[]> {
  const { data } = await Api.get<{ data: Match[] }>('/matches', { params: { filter } });

  return data.data;
}

export async function createMatch(payload: CreateMatchPayload): Promise<Match> {
  const { data } = await Api.post<{ data: Match }>('/matches', payload);

  return data.data;
}

export async function getMatch(matchId: string): Promise<Match> {
  const { data } = await Api.get<{ data: Match }>(`/matches/${matchId}`);

  return data.data;
}

export async function confirmMatch(matchId: string): Promise<Match> {
  const { data } = await Api.post<{ data: Match }>(`/matches/${matchId}/confirm`);

  return data.data;
}

export async function cancelMatch(matchId: string): Promise<Match> {
  const { data } = await Api.post<{ data: Match }>(`/matches/${matchId}/cancel`);

  return data.data;
}

export async function submitRsvp(matchId: string, status: Rsvp): Promise<Match> {
  const { data } = await Api.put<{ data: Match }>(`/matches/${matchId}/rsvp`, { status });

  return data.data;
}

export async function createListing(matchId: string, payload: CreateListingPayload): Promise<PlayerListing> {
  const { data } = await Api.post<{ data: PlayerListing }>(`/matches/${matchId}/listings`, payload);

  return data.data;
}

export async function discoverListings(params: {
  near?: string;
  radius?: number;
  position?: string;
  date?: string;
}): Promise<PlayerListing[]> {
  const { data } = await Api.get<{ data: PlayerListing[] }>('/listings', { params });

  return data.data;
}

export async function getListing(listingId: string): Promise<PlayerListing> {
  const { data } = await Api.get<{ data: PlayerListing }>(`/listings/${listingId}`);

  return data.data;
}

export async function applyToListing(listingId: string, note?: string): Promise<ListingApplication> {
  const { data } = await Api.post<{ data: ListingApplication }>(
    `/listings/${listingId}/applications`,
    note != null && note !== '' ? { note } : {},
  );

  return data.data;
}

export async function decideApplication(
  applicationId: string,
  decision: 'approve' | 'reject',
): Promise<ListingApplication> {
  const { data } = await Api.post<{ data: ListingApplication }>(
    `/applications/${applicationId}/${decision}`,
  );

  return data.data;
}

export async function createOpponentListing(payload: {
  team_id: string;
  match_id?: string | null;
  note?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<OpponentListing> {
  const { data } = await Api.post<{ data: OpponentListing }>('/opponent-listings', payload);

  return data.data;
}

export async function discoverOpponentListings(params: {
  near?: string;
  radius?: number;
}): Promise<OpponentListing[]> {
  const { data } = await Api.get<{ data: OpponentListing[] }>('/opponent-listings', { params });

  return data.data;
}

export async function matchOpponentListing(listingId: string, teamId: string): Promise<OpponentListing> {
  const { data } = await Api.post<{ data: OpponentListing }>(
    `/opponent-listings/${listingId}/match`,
    { team_id: teamId },
  );

  return data.data;
}

export async function listMatchVideos(matchId: string): Promise<MatchVideo[]> {
  const { data } = await Api.get<{ data: MatchVideo[] }>(`/matches/${matchId}/videos`);

  return data.data;
}

export async function addMatchVideo(matchId: string, url: string): Promise<MatchVideo> {
  const { data } = await Api.post<{ data: MatchVideo }>(`/matches/${matchId}/videos`, { url });

  return data.data;
}

export async function uploadMatchVideo(
  matchId: string,
  file: { uri: string; name: string; type: string },
  durationSeconds: number | null,
  onProgress?: (percent: number) => void,
): Promise<MatchVideo> {
  const Form = new FormData();
  Form.append('video', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);

  if (durationSeconds != null) {
    Form.append('duration_seconds', String(durationSeconds));
  }

  const { data } = await Api.post<{ data: MatchVideo }>(`/matches/${matchId}/videos`, Form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
    onUploadProgress: (Event) => {
      if (onProgress != null && Event.total != null) {
        onProgress(Math.round((Event.loaded / Event.total) * 100));
      }
    },
  });

  return data.data;
}

export async function enterMatchResult(
  matchId: string,
  payload: { home_score: number; away_score: number; no_show_user_ids?: string[] },
): Promise<Match> {
  const { data } = await Api.post<{ data: Match }>(`/matches/${matchId}/result`, payload);

  return data.data;
}

export async function confirmMatchResult(matchId: string): Promise<Match> {
  const { data } = await Api.post<{ data: Match }>(`/matches/${matchId}/result/confirm`);

  return data.data;
}

export async function disputeMatchResult(matchId: string): Promise<Match> {
  const { data } = await Api.post<{ data: Match }>(`/matches/${matchId}/result/dispute`);

  return data.data;
}

export async function listPlayerStats(matchId: string): Promise<PlayerMatchStat[]> {
  const { data } = await Api.get<{ data: PlayerMatchStat[] }>(`/matches/${matchId}/player-stats`);

  return data.data;
}

export async function submitPlayerStat(
  matchId: string,
  payload: { user_id: string; goals: number; assists: number },
): Promise<PlayerMatchStat> {
  const { data } = await Api.post<{ data: PlayerMatchStat }>(`/matches/${matchId}/player-stats`, payload);

  return data.data;
}

export async function approvePlayerStat(statId: string): Promise<PlayerMatchStat> {
  const { data } = await Api.post<{ data: PlayerMatchStat }>(`/player-stats/${statId}/approve`);

  return data.data;
}

export async function submitRating(matchId: string, payload: { ratee_id: string; score: number }): Promise<void> {
  await Api.post(`/matches/${matchId}/ratings`, payload);
}
