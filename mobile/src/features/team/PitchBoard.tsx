import { forwardRef, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';

import type { LineupPosition } from './api';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const PUCK_SIZE = 56;

type PuckProps = {
  position: LineupPosition;
  boardWidth: number;
  boardHeight: number;
  onMove: (id: string, x: number, y: number) => void;
  onPress: (id: string) => void;
};

function Puck({ position, boardWidth, boardHeight, onMove, onPress }: PuckProps) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const TranslateX = useSharedValue(position.x * boardWidth - PUCK_SIZE / 2);
  const TranslateY = useSharedValue(position.y * boardHeight - PUCK_SIZE / 2);
  const StartX = useSharedValue(0);
  const StartY = useSharedValue(0);
  const Dragging = useSharedValue(false);

  const commitMove = useCallback(
    (PixelX: number, PixelY: number) => {
      const NormX = Math.min(1, Math.max(0, (PixelX + PUCK_SIZE / 2) / boardWidth));
      const NormY = Math.min(1, Math.max(0, (PixelY + PUCK_SIZE / 2) / boardHeight));
      onMove(position.id, NormX, NormY);
    },
    [boardWidth, boardHeight, onMove, position.id],
  );

  const PanGesture = Gesture.Pan()
    .onStart(() => {
      StartX.value = TranslateX.value;
      StartY.value = TranslateY.value;
      Dragging.value = true;
    })
    .onUpdate((Event) => {
      TranslateX.value = StartX.value + Event.translationX;
      TranslateY.value = StartY.value + Event.translationY;
    })
    .onEnd(() => {
      Dragging.value = false;
      runOnJS(commitMove)(TranslateX.value, TranslateY.value);
    });

  const TapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)(position.id);
  });

  const Composed = Gesture.Exclusive(PanGesture, TapGesture);

  const AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: TranslateX.value }, { translateY: TranslateY.value }],
    zIndex: Dragging.value ? 10 : 1,
  }));

  const Occupied = position.user_id != null || position.guest_name != null;
  const DisplayName = position.user_name ?? position.guest_name;

  return (
    <GestureDetector gesture={Composed}>
      <Animated.View style={[styles.puck, AnimatedStyle, Occupied && styles.puckFilled]}>
        <Text style={styles.puckLabel}>{position.label ?? '?'}</Text>
        {DisplayName != null && (
          <Text numberOfLines={1} style={styles.puckName}>
            {DisplayName.split(' ')[0]}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

type Props = {
  positions: LineupPosition[];
  onPositionsChange: (positions: LineupPosition[]) => void;
  onSlotPress: (slotId: string) => void;
};

/**
 * Kadro tahtası — ürünün imza etkileşimi. Her puk sahada serbestçe sürüklenir
 * (diziliş ayarı); dokunma ise oyuncu/misafir atama sayfasını açar.
 * PNG export için dıştan `ref` alır (react-native-view-shot).
 */
export const PitchBoard = forwardRef<ViewShot, Props>(function PitchBoard(
  { positions, onPositionsChange, onSlotPress },
  Ref,
) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const [BoardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const handleLayout = (Event: LayoutChangeEvent) => {
    const { width, height } = Event.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  const handleMove = useCallback(
    (Id: string, X: number, Y: number) => {
      onPositionsChange(positions.map((P) => (P.id === Id ? { ...P, x: X, y: Y } : P)));
    },
    [positions, onPositionsChange],
  );

  return (
    <ViewShot ref={Ref} options={{ format: 'png', quality: 1 }} style={styles.shot}>
      <View style={styles.pitch} onLayout={handleLayout}>
        <View pointerEvents="none" style={styles.goalTop} />
        <View pointerEvents="none" style={styles.goalBottom} />
        <View pointerEvents="none" style={styles.halfway} />
        <View pointerEvents="none" style={styles.centerCircle} />

        {BoardSize.width > 0 &&
          positions.map((Position) => (
            <Puck
              key={Position.id}
              position={Position}
              boardWidth={BoardSize.width}
              boardHeight={BoardSize.height}
              onMove={handleMove}
              onPress={onSlotPress}
            />
          ))}
      </View>
    </ViewShot>
  );
});

/** Sahanın altına export'ta gömülen büyüme kancası (spec: 02-team-lineup.md). */
export function PitchWatermark({ inviteCode }: { inviteCode?: string }) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);

  return (
    <View style={styles.watermark}>
      <Text style={styles.watermarkText}>sahana.app ile kuruldu</Text>
      {inviteCode != null && <Text style={styles.watermarkCode}>Davet: {inviteCode}</Text>}
    </View>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  shot: {
    backgroundColor: Palette.pitchNight,
  },
  pitch: {
    aspectRatio: 0.72,
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.line,
    overflow: 'hidden',
  },
  goalTop: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    width: '36%',
    height: 22,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    borderTopWidth: 0,
  },
  goalBottom: {
    position: 'absolute',
    bottom: -1,
    alignSelf: 'center',
    width: '36%',
    height: 22,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    borderBottomWidth: 0,
  },
  halfway: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.lineFaint,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    width: 90,
    height: 90,
    marginTop: -45,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  puck: {
    position: 'absolute',
    width: PUCK_SIZE,
    height: PUCK_SIZE,
    borderRadius: PUCK_SIZE / 2,
    backgroundColor: Palette.turfRaised,
    borderWidth: 1.5,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckFilled: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  puckLabel: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: Palette.chalk,
  },
  puckName: {
    fontFamily: Type.bodyMedium,
    fontSize: 9,
    color: Palette.limeInk,
    maxWidth: PUCK_SIZE - 6,
  },
  watermark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(4),
    paddingVertical: space(3),
  },
  watermarkText: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: Palette.moss,
  },
  watermarkCode: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: Palette.lime,
  },
});
