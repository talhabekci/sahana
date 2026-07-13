import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { PaletteTokens, Type, space, useTheme } from './theme';

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message = 'Bir şeyler ters gitti.', onRetry }: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={36} color={Palette.moss} />
      <Text style={styles.message}>{message}</Text>
      <View style={styles.button}>
        <Button label="Tekrar dene" onPress={onRetry} variant="ghost" />
      </View>
    </View>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(4),
    paddingHorizontal: space(8),
  },
  message: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.moss,
    textAlign: 'center',
  },
  button: {
    marginTop: space(2),
    minWidth: 160,
  },
});
