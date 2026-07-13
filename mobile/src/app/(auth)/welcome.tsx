import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Type, space, useTheme } from '@/shared/ui/theme';

export default function Welcome() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();

  return (
    <Screen pitch pitchY={-150}>
      <View style={styles.body}>
        <Text style={styles.kicker}>SAHANA</Text>
        <Text style={styles.headline}>
          KADRONU KUR.{'\n'}EKSİĞİNİ BUL.{'\n'}
          <Text style={styles.headlineAccent}>SAHAYA ÇIK.</Text>
        </Text>
        <Text style={styles.sub}>
          Halı saha maçlarının tamamı tek yerde: kadro kurma, oyuncu arama, maç videoları.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button label="Devam et" onPress={() => Router.push('/(auth)/identifier')} />
        <Text style={styles.legal}>Devam ederek kullanım koşullarını kabul etmiş olursun.</Text>
      </View>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: space(10),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 14,
    letterSpacing: 6,
    color: Palette.lime,
    marginBottom: space(4),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 58,
    lineHeight: 58,
    color: Palette.chalk,
  },
  headlineAccent: {
    color: Palette.lime,
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
    marginTop: space(5),
    maxWidth: 300,
  },
  footer: {
    paddingBottom: space(6),
    gap: space(4),
  },
  legal: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
    textAlign: 'center',
  },
});
