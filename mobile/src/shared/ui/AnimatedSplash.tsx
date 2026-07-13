import { useEffect, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import SplashMark from '@/assets/images/splash-icon.png';
import { PaletteTokens, useTheme } from './theme';

type Props = {
  /** Fontlar + auth hydration bitince true olur — animasyon en az bir miktar
   * gösterildikten sonra bunu bekleyip kapanır (erken bitip boşluk bırakmasın). */
  ready: boolean;
  onFinish: () => void;
};

/**
 * Native splash (statik) kapanır kapanmaz devreye giren, aynı marka görseliyle
 * (splash-icon.png) devam eden kısa bir giriş animasyonu — sıçrayarak
 * büyüyen amblem + genişleyip kaybolan floodlight halkası, sonra tüm ekran
 * solarak asıl uygulamayı açığa çıkarır. Bkz. BACKLOG.md #22.
 */
export function AnimatedSplash({ ready, onFinish }: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const MarkScale = useSharedValue(0.7);
  const MarkOpacity = useSharedValue(0);
  const RingScale = useSharedValue(0.9);
  const RingOpacity = useSharedValue(0);
  const OverlayOpacity = useSharedValue(1);

  useEffect(() => {
    MarkOpacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    MarkScale.value = withSequence(
      withTiming(1.08, { duration: 340, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 160 }),
    );
    RingOpacity.value = withDelay(
      120,
      withSequence(withTiming(0.5, { duration: 260 }), withTiming(0, { duration: 600 })),
    );
    RingScale.value = withDelay(120, withTiming(1.7, { duration: 900, easing: Easing.out(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) {
      OverlayOpacity.value = withDelay(
        500,
        withTiming(0, { duration: 380 }, (Finished) => {
          if (Finished === true) {
            runOnJS(onFinish)();
          }
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const MarkStyle = useAnimatedStyle(() => ({
    opacity: MarkOpacity.value,
    transform: [{ scale: MarkScale.value }],
  }));
  const RingStyle = useAnimatedStyle(() => ({
    opacity: RingOpacity.value,
    transform: [{ scale: RingScale.value }],
  }));
  const OverlayStyle = useAnimatedStyle(() => ({ opacity: OverlayOpacity.value }));

  return (
    <Animated.View style={[styles.container, OverlayStyle]}>
      <Animated.View style={[styles.ring, RingStyle]} />
      <Animated.View style={MarkStyle}>
        <Image source={SplashMark} style={styles.mark} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (Palette: PaletteTokens) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Palette.pitchNight,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    ring: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 2,
      borderColor: Palette.lime,
    },
    mark: {
      width: 140,
      height: 140,
    },
  });
