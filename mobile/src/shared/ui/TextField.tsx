import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Palette, Type, space } from './theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, ...InputProps }: Props) {
  const [Focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Palette.moss}
        selectionColor={Palette.lime}
        {...InputProps}
        onFocus={(E) => {
          setFocused(true);
          InputProps.onFocus?.(E);
        }}
        onBlur={(E) => {
          setFocused(false);
          InputProps.onBlur?.(E);
        }}
        style={[
          styles.input,
          Focused && styles.inputFocused,
          error != null && styles.inputError,
        ]}
      />
      {error != null && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Palette.moss,
    marginBottom: space(2),
  },
  input: {
    fontFamily: Type.bodyMedium,
    fontSize: 18,
    color: Palette.chalk,
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: Palette.lineFaint,
  },
  inputFocused: {
    borderBottomColor: Palette.lime,
  },
  inputError: {
    borderBottomColor: Palette.clay,
  },
  error: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.clay,
    marginTop: space(2),
  },
});
