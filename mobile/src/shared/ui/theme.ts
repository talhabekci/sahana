/**
 * Sahana tasarım sistemi — "Gece Maçı"
 * Projektör altındaki halı saha: koyu çim zemin, tebeşir beyazı çizgiler,
 * tek aksan olarak projektör limonu. docs/features/01-auth-profile.md ekranları
 * bu token'lardan türetilir; ekranlarda ham hex KULLANILMAZ.
 */

export const Palette = {
  /** Zemin — gece çimi (nötr siyah değil, sahanın kendisi) */
  pitchNight: '#0B1F14',
  /** Yüzey — kabarık çim (kartlar, hücreler) */
  turf: '#12301F',
  /** Yüzey vurgulu — seçili hücre zemini */
  turfRaised: '#1A4029',
  /** Saha çizgisi — soluk */
  lineFaint: 'rgba(234,242,234,0.12)',
  /** Saha çizgisi — belirgin */
  line: 'rgba(234,242,234,0.30)',
  /** Tebeşir — birincil metin */
  chalk: '#EAF2EA',
  /** Yosun — ikincil metin */
  moss: '#8CA695',
  /** Projektör limonu — tek aksan (CTA, seçim, odak) */
  lime: '#C9F24E',
  /** Limon üstü mürekkep — CTA metni */
  limeInk: '#0B1A0F',
  /** Kiremit — hata */
  clay: '#E56A4D',
} as const;

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
