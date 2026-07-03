import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Type, space } from '@/shared/ui/theme';

export const POSITIONS = [
  { key: 'forvet', label: 'Forvet' },
  { key: 'orta_saha', label: 'Orta Saha' },
  { key: 'defans', label: 'Defans' },
  { key: 'kaleci', label: 'Kaleci' },
] as const;

type Props = {
  selected: string[];
  onToggle: (Key: string) => void;
};

/**
 * İmza etkileşim: mevki, listeden değil sahanın üstünden seçilir.
 * Dikey mini saha — üstte rakip kalesi, altta kendi kalen. Birden çok
 * bölge seçilebilir.
 */
export function PitchPositionPicker({ selected, onToggle }: Props) {
  return (
    <View style={styles.pitch}>
      <View pointerEvents="none" style={styles.goalBoxTop} />
      <View pointerEvents="none" style={styles.goalBoxBottom} />
      <View pointerEvents="none" style={styles.halfwayLine} />
      <View pointerEvents="none" style={styles.centerCircle} />

      {POSITIONS.map(({ key, label }, Index) => {
        const Active = selected.includes(key);

        return (
          <Pressable
            key={key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: Active }}
            onPress={() => onToggle(key)}
            style={[styles.zone, Index < POSITIONS.length - 1 && styles.zoneDivider]}>
            <View style={[styles.marker, Active && styles.markerActive]} />
            <Text style={[styles.zoneLabel, Active && styles.zoneLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.m,
    overflow: 'hidden',
    backgroundColor: Palette.turf,
  },
  goalBoxTop: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    width: 120,
    height: 26,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    borderTopWidth: 0,
  },
  goalBoxBottom: {
    position: 'absolute',
    bottom: -1,
    alignSelf: 'center',
    width: 120,
    height: 26,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    borderBottomWidth: 0,
  },
  halfwayLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.line,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    width: 72,
    height: 72,
    marginTop: -36,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  zone: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space(5),
    gap: space(3),
  },
  zoneDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineFaint,
  },
  marker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Palette.moss,
  },
  markerActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  zoneLabel: {
    fontFamily: Type.displaySemi,
    fontSize: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Palette.moss,
  },
  zoneLabelActive: {
    color: Palette.chalk,
  },
});
