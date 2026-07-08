import { Api } from '@/shared/api/client';

export type VenueAmenities = {
  indoor?: boolean;
  capacity?: number;
  shower?: boolean;
  parking?: boolean;
  cafeteria?: boolean;
};

export type VenueReview = {
  id: number;
  score: number;
  body: string | null;
  author: { id: string; name: string | null; avatar_path: string | null } | null;
  created_at: string;
};

export type Venue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  photos: string[] | null;
  price_min: number | null;
  price_max: number | null;
  amenities: VenueAmenities | null;
  status: 'seeded' | 'verified';
  reviews_count?: number;
  average_score: number | null;
  distance_km?: number;
  reviews?: VenueReview[];
};

export async function listVenues(params?: {
  near?: string;
  radius?: number;
  search?: string;
}): Promise<Venue[]> {
  const { data } = await Api.get<{ data: Venue[] }>('/venues', { params });

  return data.data;
}

export async function getVenue(venueId: string): Promise<Venue> {
  const { data } = await Api.get<{ data: Venue }>(`/venues/${venueId}`);

  return data.data;
}

export async function createVenueReview(
  venueId: string,
  payload: { match_id: string; score: number; body?: string },
): Promise<VenueReview> {
  const { data } = await Api.post<{ data: VenueReview }>(`/venues/${venueId}/reviews`, payload);

  return data.data;
}
