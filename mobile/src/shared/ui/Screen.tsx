import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PitchLines } from './PitchLines';
import { Palette, space } from './theme';

type Props = {
  children: ReactNode;
  /** Saha çizgisi motifi çizilsin mi */
  pitch?: boolean;
  /** Orta yuvarlağın dikey konumu */
  pitchY?: number;
  /** Yatay iç boşluk kapatılsın mı (liste ekranları için) */
  bare?: boolean;
};

export function Screen({ children, pitch = false, pitchY, bare = false }: Props) {
  return (
    <View style={styles.root}>
      {pitch && <PitchLines y={pitchY} />}
      <SafeAreaView style={[styles.safe, !bare && styles.padded]}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.pitchNight,
  },
  safe: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: space(6),
  },
});
