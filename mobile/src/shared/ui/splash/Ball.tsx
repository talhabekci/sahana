import { memo } from 'react';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Circle } from 'react-native-svg';

import { quadraticBezier } from './bezier';
import { BALL_CONTROL, BALL_END, BALL_START } from './geometry';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BALL_RADIUS = 6;
/** Topun gerisinde kalan, giderek soluklaşan iz noktalarının gecikme miktarları. */
const TRAIL_OFFSETS = [0.08, 0.16, 0.24, 0.32] as const;

function ballX(T: number): number {
  'worklet';

  return quadraticBezier(T, BALL_START.x, BALL_CONTROL.x, BALL_END.x);
}

function ballY(T: number): number {
  'worklet';

  return quadraticBezier(T, BALL_START.y, BALL_CONTROL.y, BALL_END.y);
}

type TrailDotProps = {
  BallT: SharedValue<number>;
  Offset: number;
  radius: number;
  opacity: number;
  color: string;
};

function BallTrailDot({ BallT, Offset, radius, opacity, color }: TrailDotProps) {
  const TrailProps = useAnimatedProps(() => {
    const T = Math.max(0, BallT.value - Offset);

    return { cx: ballX(T), cy: ballY(T) };
  });

  return <AnimatedCircle animatedProps={TrailProps} r={radius} fill={color} opacity={opacity} />;
}

type Props = {
  BallT: SharedValue<number>;
  color: string;
  trailColor: string;
};

/** BACKLOG #64 — top: kavisli yörünge boyunca hareket eder, arkasında lime renkli soluklaşan bir iz bırakır. */
export const Ball = memo(function Ball({ BallT, color, trailColor }: Props) {
  const BallProps = useAnimatedProps(() => {
    const T = BallT.value;

    return { cx: ballX(T), cy: ballY(T) };
  });

  return (
    <>
      {TRAIL_OFFSETS.map((Offset, Index) => (
        <BallTrailDot
          key={Offset}
          BallT={BallT}
          Offset={Offset}
          radius={Math.max(1.5, BALL_RADIUS - 1.5 - Index)}
          opacity={0.5 - Index * 0.11}
          color={trailColor}
        />
      ))}
      <AnimatedCircle animatedProps={BallProps} r={BALL_RADIUS} fill={color} />
    </>
  );
});
