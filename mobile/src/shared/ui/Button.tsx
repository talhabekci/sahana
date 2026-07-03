import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Palette, Radius, Type, space } from './theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false }: Props) {
  const Inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Inactive }}
      onPress={onPress}
      disabled={Inactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && styles.pressed,
        Inactive && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Palette.limeInk : Palette.chalk} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(8),
  },
  primary: {
    backgroundColor: Palette.lime,
  },
  ghost: {
    borderWidth: 1,
    borderColor: Palette.line,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: Type.displaySemi,
    fontSize: 19,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Palette.limeInk,
  },
  ghostLabel: {
    color: Palette.chalk,
  },
});
