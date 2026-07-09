import { Api } from '@/shared/api/client';

export type Foot = 'L' | 'R' | 'B';

export type Profile = {
  positions: string[];
  foot: Foot | null;
  level: number;
  city_id: number;
  city: string | null;
  district: string | null;
  availability: Record<string, string[]> | null;
  bio: string | null;
};

export type Me = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_path: string | null;
  profile?: Profile | null;
  followers_count: number;
  following_count: number;
};

export type City = { id: number; name: string };

export type UpdateMePayload = Partial<{
  name: string;
  positions: string[];
  foot: Foot | null;
  level: number;
  city_id: number;
  district: string | null;
  bio: string | null;
}>;

export async function requestOtp(Identifier: string): Promise<void> {
  await Api.post('/auth/otp', { identifier: Identifier });
}

export async function verifyOtp(Identifier: string, Code: string) {
  const { data } = await Api.post<{ data: { token: string; is_new_user: boolean } }>(
    '/auth/verify',
    { identifier: Identifier, code: Code },
  );

  return data.data;
}

export async function getMe(): Promise<Me> {
  const { data } = await Api.get<{ data: Me }>('/me');

  return data.data;
}

export async function updateMe(Payload: UpdateMePayload): Promise<Me> {
  const { data } = await Api.patch<{ data: Me }>('/me', Payload);

  return data.data;
}

export async function getCities(): Promise<City[]> {
  const { data } = await Api.get<{ data: City[] }>('/cities');

  return data.data;
}

export async function logout(): Promise<void> {
  await Api.post('/auth/logout');
}

export async function deleteMe(): Promise<void> {
  await Api.delete('/me');
}
