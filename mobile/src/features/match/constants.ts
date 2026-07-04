import type { MatchStatus, Rsvp } from './api';

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  draft: 'Taslak',
  confirmed: 'Onaylandı',
  played: 'Oynandı',
  cancelled: 'İptal',
};

export const RSVP_LABELS: Record<Rsvp, string> = {
  yes: 'Geliyorum',
  no: 'Gelmiyorum',
  maybe: 'Belki',
};

export const FORMATS = [5, 6, 7, 8] as const;

/** Keşif konum izni reddedilirse varsayılan merkez (İstanbul). */
export const FALLBACK_CENTER = { lat: 41.0082, lng: 28.9784 } as const;

export function formatDayLabel(iso: string): string {
  const Date_ = new Date(iso);

  return Date_.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' });
}

export function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
