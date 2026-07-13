import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { PaletteTokens } from '@/shared/ui/theme';
import { Ball } from './Ball';
import { GoalkeeperFigure } from './GoalkeeperFigure';
import { GoalNet } from './GoalNet';
import { GROUND_Y, SCENE_HEIGHT, SCENE_WIDTH } from './geometry';
import { ImpactFlash } from './ImpactFlash';
import { PlayerFigure } from './PlayerFigure';

type Props = {
  Palette: PaletteTokens;
  onSequenceEnd: () => void;
};

const KICK_DURATION = 340;
const BALL_DELAY = 230;
const BALL_DURATION = 560;
const DIVE_DELAY = 320;
const DIVE_DURATION = 480;
const IMPACT_AT = BALL_DELAY + BALL_DURATION;
const SCENE_HOLD_AFTER_IMPACT = 420;
const SCENE_FADE_START = IMPACT_AT + SCENE_HOLD_AFTER_IMPACT;
const SCENE_FADE_DURATION = 340;

/**
 * BACKLOG #64 — açılışta bir kez oynayan gol sekansı: oyuncu şut çeker, top
 * kavisli bir izle kaleye gider, kaleci tam uzanır ama yetişemez, top üst
 * köşeye çarpar (file esner + lokal parlama + hafif kamera sarsıntısı),
 * sahne söner. Bitince `onSequenceEnd` çağrılır — `AnimatedSplash` bundan
 * sonra logo/halka animasyonuna geçer.
 */
export const GoalIntro = memo(function GoalIntro({ Palette, onSequenceEnd }: Props) {
  const KickT = useSharedValue(0);
  const BallT = useSharedValue(0);
  const DiveT = useSharedValue(0);
  const ImpactT = useSharedValue(0);
  const RippleT = useSharedValue(0);
  const ShakeT = useSharedValue(0);
  const CameraPan = useSharedValue(0);
  const SceneOpacity = useSharedValue(1);

  useEffect(() => {
    KickT.value = withTiming(1, { duration: KICK_DURATION, easing: Easing.out(Easing.cubic) });

    BallT.value = withDelay(
      BALL_DELAY,
      withTiming(1, { duration: BALL_DURATION, easing: Easing.out(Easing.quad) }),
    );
    CameraPan.value = withDelay(
      BALL_DELAY,
      withTiming(1, { duration: BALL_DURATION, easing: Easing.inOut(Easing.quad) }),
    );

    DiveT.value = withDelay(
      DIVE_DELAY,
      withTiming(1, { duration: DIVE_DURATION, easing: Easing.out(Easing.cubic) }),
    );

    ImpactT.value = withDelay(
      IMPACT_AT,
      withSequence(
        withTiming(1, { duration: 90, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 210 }),
      ),
    );
    RippleT.value = withDelay(
      IMPACT_AT,
      withSequence(
        withTiming(1, { duration: 70 }),
        withTiming(-0.4, { duration: 90 }),
        withTiming(0.15, { duration: 110 }),
        withTiming(0, { duration: 160 }),
      ),
    );
    ShakeT.value = withDelay(
      IMPACT_AT,
      withSequence(
        withTiming(1, { duration: 40 }),
        withTiming(-0.8, { duration: 40 }),
        withTiming(0.5, { duration: 40 }),
        withTiming(0, { duration: 90 }),
      ),
    );

    SceneOpacity.value = withDelay(
      SCENE_FADE_START,
      withTiming(0, { duration: SCENE_FADE_DURATION }, (Finished) => {
        if (Finished === true) {
          runOnJS(onSequenceEnd)();
        }
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CameraStyle = useAnimatedStyle(() => {
    const Pan = CameraPan.value * -10;
    const Shake = ShakeT.value * 3;

    return {
      opacity: SceneOpacity.value,
      transform: [{ translateX: Pan + Shake }, { translateY: ShakeT.value * 2 }],
    };
  });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.camera, CameraStyle]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}>
          <Line x1={0} y1={GROUND_Y} x2={SCENE_WIDTH} y2={GROUND_Y} stroke={Palette.lineFaint} strokeWidth={1} />
          <GoalNet RippleT={RippleT} frameColor={Palette.chalk} netColor={Palette.lineFaint} />
          <GoalkeeperFigure DiveT={DiveT} color={Palette.moss} />
          <PlayerFigure KickT={KickT} color={Palette.chalk} />
          <Ball BallT={BallT} color={Palette.chalk} trailColor={Palette.lime} />
          <ImpactFlash ImpactT={ImpactT} color={Palette.lime} />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    width: '84%',
    aspectRatio: SCENE_WIDTH / SCENE_HEIGHT,
  },
});
