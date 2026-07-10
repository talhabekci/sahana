import { Api } from '@/shared/api/client';

export type TeamRole = 'captain' | 'member';

export type TeamMember = {
  id: string;
  name: string | null;
  avatar_path: string | null;
  role: TeamRole;
  jersey_number: number | null;
  joined_at: string;
};

export type Team = {
  id: string;
  name: string;
  badge_icon: string | null;
  logo_url: string | null;
  color_home: string;
  my_role: TeamRole | null;
  members_count: number;
  members: TeamMember[];
  created_at: string;
};

export type TeamInvite = {
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
};

export type LineupPosition = {
  id: string;
  x: number;
  y: number;
  label: string | null;
  user_id: string | null;
  user_name: string | null;
  guest_name: string | null;
};

export type Lineup = {
  id: string;
  name: string;
  formation: string | null;
  positions: LineupPosition[];
  created_at: string;
  updated_at: string;
};

export type CreateTeamPayload = {
  name: string;
  badge_icon?: string | null;
  color_home: string;
  logo?: { uri: string; name: string; type: string } | null;
};

export type LineupPayload = {
  name: string;
  formation?: string | null;
  positions: {
    id: string;
    x: number;
    y: number;
    label?: string | null;
    user_id?: string | null;
    guest_name?: string | null;
  }[];
};

export async function listTeams(): Promise<Team[]> {
  const { data } = await Api.get<{ data: Team[] }>('/teams');

  return data.data;
}

function toTeamFormData(payload: Partial<CreateTeamPayload>): FormData {
  const Form = new FormData();

  if (payload.name != null) {
    Form.append('name', payload.name);
  }

  if (payload.badge_icon != null) {
    Form.append('badge_icon', payload.badge_icon);
  }

  if (payload.color_home != null) {
    Form.append('color_home', payload.color_home);
  }

  if (payload.logo != null) {
    Form.append('logo', {
      uri: payload.logo.uri,
      name: payload.logo.name,
      type: payload.logo.type,
    } as unknown as Blob);
  }

  return Form;
}

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  if (payload.logo == null) {
    const { data } = await Api.post<{ data: Team }>('/teams', payload);

    return data.data;
  }

  const { data } = await Api.post<{ data: Team }>('/teams', toTeamFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

export async function getTeam(teamId: string): Promise<Team> {
  const { data } = await Api.get<{ data: Team }>(`/teams/${teamId}`);

  return data.data;
}

export async function updateTeam(teamId: string, payload: Partial<CreateTeamPayload>): Promise<Team> {
  if (payload.logo == null) {
    const { data } = await Api.patch<{ data: Team }>(`/teams/${teamId}`, payload);

    return data.data;
  }

  const Form = toTeamFormData(payload);
  Form.append('_method', 'PATCH');

  const { data } = await Api.post<{ data: Team }>(`/teams/${teamId}`, Form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

export async function generateInvite(teamId: string): Promise<TeamInvite> {
  const { data } = await Api.post<{ data: TeamInvite }>(`/teams/${teamId}/invites`);

  return data.data;
}

export async function acceptInvite(code: string): Promise<Team> {
  const { data } = await Api.post<{ data: Team }>(`/invites/${code}/accept`);

  return data.data;
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await Api.delete(`/teams/${teamId}/members/${userId}`);
}

export async function transferCaptaincy(teamId: string, userId: string): Promise<Team> {
  const { data } = await Api.post<{ data: Team }>(`/teams/${teamId}/transfer-captaincy`, {
    user_id: userId,
  });

  return data.data;
}

export async function listLineups(teamId: string): Promise<Lineup[]> {
  const { data } = await Api.get<{ data: Lineup[] }>(`/teams/${teamId}/lineups`);

  return data.data;
}

export async function createLineup(teamId: string, payload: LineupPayload): Promise<Lineup> {
  const { data } = await Api.post<{ data: Lineup }>(`/teams/${teamId}/lineups`, payload);

  return data.data;
}

export async function getLineup(lineupId: string): Promise<Lineup> {
  const { data } = await Api.get<{ data: Lineup }>(`/lineups/${lineupId}`);

  return data.data;
}

export async function updateLineup(lineupId: string, payload: Partial<LineupPayload>): Promise<Lineup> {
  const { data } = await Api.patch<{ data: Lineup }>(`/lineups/${lineupId}`, payload);

  return data.data;
}

export async function deleteLineup(lineupId: string): Promise<void> {
  await Api.delete(`/lineups/${lineupId}`);
}

export async function deleteTeam(teamId: string): Promise<void> {
  await Api.delete(`/teams/${teamId}`);
}
