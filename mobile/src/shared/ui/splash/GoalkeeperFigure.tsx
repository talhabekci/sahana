import { memo } from 'react';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Circle, G, Line } from 'react-native-svg';

import { GROUND_Y, KEEPER_HEAD_Y, KEEPER_HIP_Y, KEEPER_X } from './geometry';

const AnimatedG = Animated.createAnimatedComponent(G);

type Props = {
  DiveT: SharedValue<number>;
  color: string;
};

/**
 * BACKLOG #64 — kaleci piktogramı: gövde topun gittiği köşeye doğru
 * dönerek/kayarak "tam uzanır", bir kol ekstra döner ki gerçekten
 * uzanıyormuş hissi versin — ama sekansta topa yetişemez.
 */
export const GoalkeeperFigure = memo(function GoalkeeperFigure({ DiveT, color }: Props) {
  const BodyProps = useAnimatedProps(() => {
    const T = DiveT.value;
    const Rotation = interpolate(T, [0, 1], [0, 74], Extrapolation.CLAMP);
    const TranslateX = interpolate(T, [0, 1], [0, 22], Extrapolation.CLAMP);
    const TranslateY = interpolate(T, [0, 1], [0, -10], Extrapolation.CLAMP);

    return {
      transform: `translate(${TranslateX}, ${TranslateY}) rotate(${Rotation}, ${KEEPER_X}, ${KEEPER_HIP_Y})`,
    };
  });

  const ReachArmProps = useAnimatedProps(() => {
    const Rotation = interpolate(DiveT.value, [0, 1], [-30, -95], Extrapolation.CLAMP);

    return { transform: `rotate(${Rotation}, ${KEEPER_X}, ${KEEPER_HEAD_Y + 8})` };
  });

  return (
    <AnimatedG animatedProps={BodyProps}>
      {/* Destek bacakları */}
      <Line
        x1={KEEPER_X - 5}
        y1={KEEPER_HIP_Y}
        x2={KEEPER_X - 10}
        y2={GROUND_Y}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Line
        x1={KEEPER_X + 5}
        y1={KEEPER_HIP_Y}
        x2={KEEPER_X + 10}
        y2={GROUND_Y}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Gövde */}
      <Line
        x1={KEEPER_X}
        y1={KEEPER_HEAD_Y + 8}
        x2={KEEPER_X}
        y2={KEEPER_HIP_Y}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Sabit kol */}
      <Line
        x1={KEEPER_X}
        y1={KEEPER_HEAD_Y + 8}
        x2={KEEPER_X - 16}
        y2={KEEPER_HEAD_Y + 20}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* Uzanan kol */}
      <AnimatedG animatedProps={ReachArmProps}>
        <Line
          x1={KEEPER_X}
          y1={KEEPER_HEAD_Y + 8}
          x2={KEEPER_X}
          y2={KEEPER_HEAD_Y - 14}
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </AnimatedG>
      {/* Kafa */}
      <Circle cx={KEEPER_X} cy={KEEPER_HEAD_Y} r={8} fill={color} />
    </AnimatedG>
  );
});
