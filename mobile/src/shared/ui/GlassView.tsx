import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Blur şiddeti (0-100). */
  intensity?: number;
};

/**
 * "Liquid glass" yüzey (BACKLOG #43): koyu saha paletinin üstüne yarı
 * saydam buzlu cam katmanı. İçerik blur'un ÜSTÜNE çizilir; kapsayıcının
 * köşe yarıçapı blur'a da uygulansın diye overflow gizlenir.
 */
export function GlassView({ children, style, intensity = 50 }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView tint="dark" intensity={intensity} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tintOverlay]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  tintOverlay: {
    // Salt blur çok şeffaf kalıyor; marka yeşiline çalan hafif bir film
    // okunabilirliği koruyor (turf #12301F'in yarı saydam hali).
    backgroundColor: 'rgba(18,48,31,0.55)',
  },
});
