import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette, Radius, Type, space } from './theme';

type Props = {
  value: string;
  onChange: (Value: string) => void;
  length?: number;
  error?: boolean;
};

/**
 * Skorbord haneleri: 6 hücre, gerçek giriş görünmez tek TextInput'ta.
 */
export function OtpInput({ value, onChange, length = 6, error = false }: Props) {
  const InputRef = useRef<TextInput>(null);
  const Cells = Array.from({ length }, (_, Index) => value[Index] ?? '');
  const ActiveIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => InputRef.current?.focus()}>
      <View style={styles.row}>
        {Cells.map((Char, Index) => (
          <View
            key={Index}
            style={[
              styles.cell,
              Char !== '' && styles.cellFilled,
              Index === ActiveIndex && value.length < length && styles.cellActive,
              error && styles.cellError,
            ]}>
            <Text style={styles.digit}>{Char}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={InputRef}
        value={value}
        onChangeText={(Text_) => onChange(Text_.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        autoFocus
        maxLength={length}
        style={styles.hidden}
        accessibilityLabel="Doğrulama kodu"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space(2),
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 62,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: Palette.line,
  },
  cellActive: {
    borderColor: Palette.lime,
  },
  cellError: {
    borderColor: Palette.clay,
  },
  digit: {
    fontFamily: Type.mono,
    fontSize: 26,
    color: Palette.chalk,
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
