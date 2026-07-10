import type { LineupPosition } from './api';

/** API'nin Team::BADGE_ICONS ile birebir aynı sırayı taşır (api/app/Models/Team.php). */
export const BADGE_ICONS = [
  { key: 'shield', ionicon: 'shield-checkmark' },
  { key: 'ball', ionicon: 'football' },
  { key: 'flash', ionicon: 'flash' },
  { key: 'star', ionicon: 'star' },
  { key: 'flame', ionicon: 'flame' },
  { key: 'wave', ionicon: 'water' },
] as const;

export type BadgeIconKey = (typeof BADGE_ICONS)[number]['key'];

export function badgeIonicon(key: string | null): (typeof BADGE_ICONS)[number]['ionicon'] {
  return BADGE_ICONS.find((Icon) => Icon.key === key)?.ionicon ?? 'shield-checkmark';
}

/** Takım forma renkleri — Gece Maçı paletiyle uyumlu, birbirinden ayırt edilebilir tonlar. */
export const TEAM_COLORS = [
  '#C9F24E', '#4EE2C9', '#4E9DF2', '#B14EF2', '#F24EA0', '#F2764E', '#F2D24E', '#EAF2EA',
] as const;

export function hslToHex(Hue: number, Saturation: number, Lightness: number): string {
  const A = Saturation * Math.min(Lightness, 1 - Lightness);
  const f = (N: number): string => {
    const K = (N + Hue / 30) % 12;
    const Color = Lightness - A * Math.max(Math.min(K - 3, 9 - K, 1), -1);

    return Math.round(255 * Color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function hexToHue(Hex: string): number {
  const R = parseInt(Hex.slice(1, 3), 16) / 255;
  const G = parseInt(Hex.slice(3, 5), 16) / 255;
  const B = parseInt(Hex.slice(5, 7), 16) / 255;
  const Max = Math.max(R, G, B);
  const Min = Math.min(R, G, B);
  const Delta = Max - Min;
  let H = 0;

  if (Delta !== 0) {
    if (Max === R) {
      H = ((G - B) / Delta) % 6;
    } else if (Max === G) {
      H = (B - R) / Delta + 2;
    } else {
      H = (R - G) / Delta + 4;
    }
  }

  H *= 60;

  return H < 0 ? H + 360 : H;
}

type SlotTemplate = Pick<LineupPosition, 'id' | 'x' | 'y' | 'label'>;

/** Boş bir kadro oluşturulurken kullanılan varsayılan diziliş şablonları. */
export const FORMATION_PRESETS: Record<string, { label: string; slots: SlotTemplate[] }> = {
  '5': {
    label: '5\'e 5 · 1-2-1',
    slots: [
      { id: 'gk', x: 0.5, y: 0.92, label: 'KL' },
      { id: 'def', x: 0.5, y: 0.68, label: 'DEF' },
      { id: 'mid-l', x: 0.25, y: 0.42, label: 'OS' },
      { id: 'mid-r', x: 0.75, y: 0.42, label: 'OS' },
      { id: 'fw', x: 0.5, y: 0.15, label: 'FV' },
    ],
  },
  '6': {
    label: '6\'ya 6 · 2-2-1',
    slots: [
      { id: 'gk', x: 0.5, y: 0.92, label: 'KL' },
      { id: 'def-l', x: 0.3, y: 0.68, label: 'DEF' },
      { id: 'def-r', x: 0.7, y: 0.68, label: 'DEF' },
      { id: 'mid-l', x: 0.3, y: 0.42, label: 'OS' },
      { id: 'mid-r', x: 0.7, y: 0.42, label: 'OS' },
      { id: 'fw', x: 0.5, y: 0.15, label: 'FV' },
    ],
  },
  '7': {
    label: '7\'ye 7 · 2-3-1',
    slots: [
      { id: 'gk', x: 0.5, y: 0.92, label: 'KL' },
      { id: 'def-l', x: 0.3, y: 0.7, label: 'DEF' },
      { id: 'def-r', x: 0.7, y: 0.7, label: 'DEF' },
      { id: 'mid-l', x: 0.2, y: 0.45, label: 'OS' },
      { id: 'mid-c', x: 0.5, y: 0.45, label: 'OS' },
      { id: 'mid-r', x: 0.8, y: 0.45, label: 'OS' },
      { id: 'fw', x: 0.5, y: 0.15, label: 'FV' },
    ],
  },
  '8': {
    label: '8\'e 8 · 2-3-2',
    slots: [
      { id: 'gk', x: 0.5, y: 0.92, label: 'KL' },
      { id: 'def-l', x: 0.3, y: 0.7, label: 'DEF' },
      { id: 'def-r', x: 0.7, y: 0.7, label: 'DEF' },
      { id: 'mid-l', x: 0.18, y: 0.45, label: 'OS' },
      { id: 'mid-c', x: 0.5, y: 0.45, label: 'OS' },
      { id: 'mid-r', x: 0.82, y: 0.45, label: 'OS' },
      { id: 'fw-l', x: 0.35, y: 0.15, label: 'FV' },
      { id: 'fw-r', x: 0.65, y: 0.15, label: 'FV' },
    ],
  },
};
