import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Palette, Type, space } from './theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ icon, message, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={32} color={Palette.moss} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(3),
    paddingVertical: space(10),
    paddingHorizontal: space(8),
  },
  message: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.moss,
    textAlign: 'center',
  },
});
