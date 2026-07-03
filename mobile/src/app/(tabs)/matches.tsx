import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';
import { Palette, Type, space } from '@/shared/ui/theme';

export default function Matches() {
  return (
    <Screen pitch pitchY={-100}>
      <View style={styles.body}>
        <Text style={styles.headline}>MAÇLAR YAKINDA</Text>
        <Text style={styles.sub}>
          Maç kurma, katılım takibi ve adam-eksik ilanları çok yakında burada olacak. Şimdilik
          profilini tamamla — eşleşmeler oradan besleniyor.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 40,
    color: Palette.chalk,
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
    marginTop: space(3),
    maxWidth: 320,
  },
});
