import { StyleSheet, View } from 'react-native';

import { Palette } from './theme';

type Props = {
  /** Orta yuvarlağın dikey konumu (ekran üstünden px) */
  y?: number;
};

/**
 * İmza motif: sahanın orta çizgisi + orta yuvarlak, ekranın arkasında
 * soluk tebeşir çizgisi olarak durur. Dekor değil zemin — her auth ekranı
 * aynı sahanın bir karesi gibi hissettirir.
 */
export function PitchLines({ y = -120 }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.halfwayLine, { top: y + CIRCLE / 2 }]} />
      <View style={[styles.centerCircle, { top: y }]} />
      <View style={[styles.centerDot, { top: y + CIRCLE / 2 - 3 }]} />
    </View>
  );
}

const CIRCLE = 340;

const styles = StyleSheet.create({
  halfwayLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.line,
  },
  centerCircle: {
    position: 'absolute',
    alignSelf: 'center',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  centerDot: {
    position: 'absolute',
    alignSelf: 'center',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.line,
  },
});
