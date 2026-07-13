import { memo } from 'react';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Circle, G, Line } from 'react-native-svg';

import { PLAYER_HEAD_Y, PLAYER_HIP_Y, PLAYER_X, GROUND_Y } from './geometry';

const AnimatedG = Animated.createAnimatedComponent(G);

type Props = {
  KickT: SharedValue<number>;
  color: string;
};

/**
 * BACKLOG #64 — piktogram (Olimpiyat işareti) tarzı oyuncu silüeti: sabit
 * gövde/destek bacağı + döner şut bacağı ve kol. Dolgu şekil değil, kalın
 * yuvarlak uçlu çizgiler — minimal/vektör.
 */
export const PlayerFigure = memo(function PlayerFigure({ KickT, color }: Props) {
  const LegProps = useAnimatedProps(() => {
    const Rotation = interpolate(KickT.value, [0, 0.4, 1], [32, 38, -68], Extrapolation.CLAMP);

    return { transform: `rotate(${Rotation}, ${PLAYER_X}, ${PLAYER_HIP_Y})` };
  });

  const ArmProps = useAnimatedProps(() => {
    const Rotation = interpolate(KickT.value, [0, 0.4, 1], [-18, -24, 34], Extrapolation.CLAMP);

    return { transform: `rotate(${Rotation}, ${PLAYER_X}, ${PLAYER_HEAD_Y + 9})` };
  });

  return (
    <G>
      {/* Destek bacağı — sabit */}
      <Line
        x1={PLAYER_X - 3}
        y1={PLAYER_HIP_Y}
        x2={PLAYER_X - 9}
        y2={GROUND_Y}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Gövde */}
      <Line
        x1={PLAYER_X}
        y1={PLAYER_HEAD_Y + 9}
        x2={PLAYER_X}
        y2={PLAYER_HIP_Y}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Kol — döner */}
      <AnimatedG animatedProps={ArmProps}>
        <Line
          x1={PLAYER_X}
          y1={PLAYER_HEAD_Y + 9}
          x2={PLAYER_X}
          y2={PLAYER_HEAD_Y + 30}
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </AnimatedG>
      {/* Şut bacağı — döner */}
      <AnimatedG animatedProps={LegProps}>
        <Line
          x1={PLAYER_X}
          y1={PLAYER_HIP_Y}
          x2={PLAYER_X}
          y2={PLAYER_HIP_Y + 30}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </AnimatedG>
      {/* Kafa */}
      <Circle cx={PLAYER_X} cy={PLAYER_HEAD_Y} r={8} fill={color} />
    </G>
  );
});
