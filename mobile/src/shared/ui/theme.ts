import { useColorScheme } from 'react-native';

import { useThemeStore } from '@/features/settings/themeStore';

/**
 * Sahana tasarım sistemi — "Gece Maçı" (koyu) / "Gündüz Maçı" (açık).
 * Projektör altındaki halı saha: çim zemin, tebeşir çizgiler, tek aksan
 * olarak projektör limonu. docs/features/01-auth-profile.md ekranları bu
 * token'lardan türetilir; ekranlarda ham hex KULLANILMAZ.
 *
 * BACKLOG #60: iki palet de AYNI anahtar adlarını paylaşır — anahtar
 * isimleri koyu temanın kökeninden geliyor (ör. `pitchNight`), her iki
 * temada da aynı ROLÜ (zemin, yüzey, birincil metin, aksan...) temsil
 * eder. Ekranlar `Palette.xxx` yerine `useTheme()`'den gelen paleti
 * kullanır; anahtar adları aynı kaldığı için ekran kodu değişmez.
 */
export type PaletteTokens = {
  /** Zemin */
  pitchNight: string;
  /** Yüzey (kartlar, hücreler) */
  turf: string;
  /** Yüzey vurgulu — seçili hücre zemini */
  turfRaised: string;
  /** Saha çizgisi — soluk */
  lineFaint: string;
  /** Saha çizgisi — belirgin */
  line: string;
  /** Birincil metin */
  chalk: string;
  /** İkincil metin */
  moss: string;
  /** Projektör limonu — tek aksan (CTA, seçim, odak) */
  lime: string;
  /** Limon üstü mürekkep — CTA metni */
  limeInk: string;
  /** Hata */
  clay: string;
};

export const DarkPalette: PaletteTokens = {
  pitchNight: '#0B1F14',
  turf: '#12301F',
  turfRaised: '#1A4029',
  lineFaint: 'rgba(234,242,234,0.12)',
  line: 'rgba(234,242,234,0.30)',
  chalk: '#EAF2EA',
  moss: '#8CA695',
  lime: '#C9F24E',
  limeInk: '#0B1A0F',
  clay: '#E56A4D',
};

/**
 * Gündüz Maçı: aydınlık sahada tebeşir çizgisi. `lime` gece temasına göre
 * koyulaştırıldı — kullanım noktalarının çoğu (174'ten 133'ü) doğrudan
 * metin/ikon rengi olarak açık zemin üzerinde kullanılıyor, orijinal neon
 * değer beyazda düşük kontrastlı kalıyordu (bkz. BACKLOG #60).
 */
export const LightPalette: PaletteTokens = {
  pitchNight: '#F5F8F3',
  turf: '#FFFFFF',
  turfRaised: '#E7F1E2',
  lineFaint: 'rgba(11,31,20,0.08)',
  line: 'rgba(11,31,20,0.20)',
  chalk: '#10241A',
  moss: '#57705F',
  lime: '#5B7A17',
  limeInk: '#0B1A0F',
  clay: '#C0432A',
};

export const Type = {
  /** Display — forma/afiş kondanse */
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
  /** Gövde */
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  /** Skorbord rakamları — OTP, seviye */
  mono: 'SpaceMono_700Bold',
} as const;

/** 4px taban aralık ölçeği */
export const space = (N: number) => N * 4;

export const Radius = {
  s: 10,
  m: 14,
  l: 22,
  pill: 999,
} as const;

/** Etkin paletin koyu mu açık mı olduğunu, sistem tercihi + kullanıcı override'ıyla hesaplar. */
export function useIsDarkTheme(): boolean {
  const SystemScheme = useColorScheme();
  const Mode = useThemeStore((State) => State.mode);

  if (Mode === 'light') return false;
  if (Mode === 'dark') return true;

  return SystemScheme !== 'light';
}

/** BACKLOG #60 — ekranların `Palette` yerine kullandığı, tema-duyarlı palet hook'u. */
export function useTheme(): PaletteTokens {
  return useIsDarkTheme() ? DarkPalette : LightPalette;
}
