import { memo } from 'react';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Circle } from 'react-native-svg';

import { BALL_END } from './geometry';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  ImpactT: SharedValue<number>;
  color: string;
};

/** BACKLOG #64 — çarpma anında köşede beliren, hızla sönümlenen yumuşak lime parlama (tam ekran değil, lokal). */
export const ImpactFlash = memo(function ImpactFlash({ ImpactT, color }: Props) {
  const AnimProps = useAnimatedProps(() => {
    const T = ImpactT.value;

    return {
      r: interpolate(T, [0, 1], [4, 46], Extrapolation.CLAMP),
      opacity: interpolate(T, [0, 0.3, 1], [0, 0.55, 0], Extrapolation.CLAMP),
    };
  });

  return <AnimatedCircle animatedProps={AnimProps} cx={BALL_END.x} cy={BALL_END.y} fill={color} />;
});
