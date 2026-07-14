import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import SplashMark from '@/assets/images/splash-icon.png';
import SplashVideo from '@/assets/videos/splash-intro.mp4';
import { PaletteTokens, useTheme } from './theme';

type Props = {
  /** Fontlar + auth hydration bitince true olur — animasyon en az bir miktar
   * gösterildikten sonra bunu bekleyip kapanır (erken bitip boşluk bırakmasın). */
  ready: boolean;
  onFinish: () => void;
};

/**
 * Native splash (statik) kapanır kapanmaz devreye giren gol sekansı videosu
 * (BACKLOG #64) — oynatılır, son karesinde (parlayan S logosu) donarak
 * bekler. `ready` de gelince tüm ekran solarak asıl uygulamayı açığa
 * çıkarır. Video yüklenemezse statik marka görseline (splash-icon.png)
 * düşülür, splash hiçbir zaman takılı kalmaz. Bkz. BACKLOG.md #22, #64.
 */
export function AnimatedSplash({ ready, onFinish }: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const [IntroDone, setIntroDone] = useState(false);
  const [VideoFailed, setVideoFailed] = useState(false);
  const OverlayOpacity = useSharedValue(1);

  const Player = useVideoPlayer(SplashVideo, (Instance) => {
    Instance.loop = false;
    Instance.muted = true;
    Instance.play();
  });

  useEventListener(Player, 'playToEnd', () => {
    Player.pause();
    setIntroDone(true);
  });

  useEventListener(Player, 'statusChange', ({ status }) => {
    if (status === 'error') {
      setVideoFailed(true);
      setIntroDone(true);
    }
  });

  useEffect(() => {
    if (ready && IntroDone) {
      OverlayOpacity.value = withDelay(
        VideoFailed ? 300 : 500,
        withTiming(0, { duration: 380 }, (Finished) => {
          if (Finished === true) {
            runOnJS(onFinish)();
          }
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, IntroDone, VideoFailed]);

  const OverlayStyle = useAnimatedStyle(() => ({ opacity: OverlayOpacity.value }));

  return (
    <Animated.View style={[styles.container, OverlayStyle]}>
      {VideoFailed ? (
        <Image source={SplashMark} style={styles.mark} resizeMode="contain" />
      ) : (
        <VideoView
          player={Player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          pointerEvents="none"
        />
      )}
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
    video: {
      ...StyleSheet.absoluteFillObject,
    },
    mark: {
      width: 140,
      height: 140,
    },
  });
