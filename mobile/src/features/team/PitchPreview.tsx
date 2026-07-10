import { StyleSheet, Text, View } from 'react-native';

import type { LineupPosition } from './api';
import { Palette, Radius, Type } from '@/shared/ui/theme';

const PUCK_SIZE = 30;

type Props = {
  positions: LineupPosition[];
};

/**
 * PitchBoard'ın salt-okunur, jestsiz versiyonu — feed kartı gibi kaydırılan
 * listeler içinde göstermek için (PanGesture, FlatList scroll'uyla çakışır).
 * Yüzde tabanlı konumlandırma kullanır, onLayout ölçümüne gerek yok.
 */
export function PitchPreview({ positions }: Props) {
  return (
    <View style={styles.pitch}>
      <View pointerEvents="none" style={styles.goalTop} />
      <View pointerEvents="none" style={styles.goalBottom} />
      <View pointerEvents="none" style={styles.halfway} />
      <View pointerEvents="none" style={styles.centerCircle} />

      {positions.map((Position) => {
        const Occupied = Position.user_id != null || Position.guest_name != null;
        const DisplayName = Position.user_name ?? Position.guest_name;

        return (
          <View
            key={Position.id}
            style={[
              styles.puck,
              Occupied && styles.puckFilled,
              { left: `${Position.x * 100}%`, top: `${Position.y * 100}%` },
            ]}>
            <Text style={styles.puckLabel}>{Position.label ?? '?'}</Text>
            {DisplayName != null && (
              <Text numberOfLines={1} style={styles.puckName}>
                {DisplayName.split(' ')[0]}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    aspectRatio: 0.9,
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.line,
    overflow: 'hidden',
  },
  goalTop: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    width: '36%',
    height: 14,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    borderTopWidth: 0,
  },
  goalBottom: {
    position: 'absolute',
    bottom: -1,
    alignSelf: 'center',
    width: '36%',
    height: 14,
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
    width: 50,
    height: 50,
    marginTop: -25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  puck: {
    position: 'absolute',
    width: PUCK_SIZE,
    height: PUCK_SIZE,
    marginLeft: -PUCK_SIZE / 2,
    marginTop: -PUCK_SIZE / 2,
    borderRadius: PUCK_SIZE / 2,
    backgroundColor: Palette.turfRaised,
    borderWidth: 1,
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
    fontSize: 8,
    color: Palette.chalk,
  },
  puckName: {
    fontFamily: Type.bodyMedium,
    fontSize: 7,
    color: Palette.limeInk,
    maxWidth: PUCK_SIZE - 4,
  },
});
