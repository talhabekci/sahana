import { memo } from 'react';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Line } from 'react-native-svg';

import { GOAL_LEFT_X, GOAL_RIGHT_X, GOAL_TOP_Y, GROUND_Y } from './geometry';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const NET_COLS = 5;
const NET_ROWS = 4;

type NetLineProps = {
  RippleT: SharedValue<number>;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  magnitude: number;
};

/** Çarpma köşesine yakınlığına göre ölçeklenen tek bir file çizgisi. */
function NetLine({ RippleT, x1, y1, x2, y2, color, magnitude }: NetLineProps) {
  const AnimProps = useAnimatedProps(() => {
    const Offset = RippleT.value * magnitude;

    return { x2: x2 + Offset * 0.4, y2: y2 + Offset };
  });

  return (
    <AnimatedLine animatedProps={AnimProps} x1={x1} y1={y1} stroke={color} strokeWidth={1.5} opacity={0.5} />
  );
}

type Props = {
  RippleT: SharedValue<number>;
  frameColor: string;
  netColor: string;
};

/**
 * BACKLOG #64 — kale çerçevesi (direkler + üst çubuk) + file. Çarpma anında
 * üst-sağ köşeye yakın file çizgileri kısa, sönümlenen bir esneme animasyonu
 * yapar (gerçek fizik simülasyonu değil — birkaç keyframe'lik doğal bir his).
 */
export const GoalNet = memo(function GoalNet({ RippleT, frameColor, netColor }: Props) {
  const Width = GOAL_RIGHT_X - GOAL_LEFT_X;
  const Height = GROUND_Y - GOAL_TOP_Y;

  return (
    <>
      <Line
        x1={GOAL_LEFT_X}
        y1={GOAL_TOP_Y}
        x2={GOAL_LEFT_X}
        y2={GROUND_Y}
        stroke={frameColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1={GOAL_RIGHT_X}
        y1={GOAL_TOP_Y}
        x2={GOAL_RIGHT_X}
        y2={GROUND_Y}
        stroke={frameColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1={GOAL_LEFT_X}
        y1={GOAL_TOP_Y}
        x2={GOAL_RIGHT_X}
        y2={GOAL_TOP_Y}
        stroke={frameColor}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {Array.from({ length: NET_COLS }, (_, Index) => {
        const X = GOAL_LEFT_X + (Width / (NET_COLS + 1)) * (Index + 1);
        const Proximity = X / GOAL_RIGHT_X;

        return (
          <NetLine
            key={`v-${Index}`}
            RippleT={RippleT}
            x1={X}
            y1={GOAL_TOP_Y}
            x2={X}
            y2={GROUND_Y}
            color={netColor}
            magnitude={Proximity * 5}
          />
        );
      })}

      {Array.from({ length: NET_ROWS }, (_, Index) => {
        const Y = GOAL_TOP_Y + (Height / (NET_ROWS + 1)) * (Index + 1);
        const Proximity = 1 - Y / GROUND_Y;

        return (
          <NetLine
            key={`h-${Index}`}
            RippleT={RippleT}
            x1={GOAL_LEFT_X}
            y1={Y}
            x2={GOAL_RIGHT_X}
            y2={Y}
            color={netColor}
            magnitude={Proximity * 4}
          />
        );
      })}
    </>
  );
});
