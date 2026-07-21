import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { PaletteTokens, Radius, Type, useTheme } from '@/shared/ui/theme';

export function initials(name: string | null | undefined): string {
  if (name == null || name.trim() === '') {
    return '?';
  }

  const Parts = name.trim().split(/\s+/);
  const First = Parts[0]?.[0] ?? '';
  const Last = Parts.length > 1 ? (Parts[Parts.length - 1]?.[0] ?? '') : '';

  return (First + Last).toUpperCase();
}

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  onPress?: () => void;
};

/** Ortak avatar: gerçek görsel varsa onu, yoksa isim baş harflerini gösterir. */
export function Avatar({ uri, name, size = 36, onPress }: Props) {
  const Palette = useTheme();
  const styles = createStyles(Palette, size);
  const Content =
    uri != null ? (
      <Image source={{ uri }} style={styles.image} />
    ) : (
      <Text style={styles.initials}>{initials(name)}</Text>
    );

  if (onPress == null) {
    return <View style={styles.circle}>{Content}</View>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.circle} hitSlop={4}>
      {Content}
    </Pressable>
  );
}

function createStyles(Palette: PaletteTokens, size: number) {
  return StyleSheet.create({
    circle: {
      width: size,
      height: size,
      borderRadius: Radius.pill,
      backgroundColor: Palette.turfRaised,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    initials: {
      fontFamily: Type.bodyBold,
      fontSize: size * 0.36,
      color: Palette.lime,
    },
  });
}
