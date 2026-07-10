import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Screen } from '@/shared/ui/Screen';
import { Palette, Type, space } from '@/shared/ui/theme';

const TITLES: Record<string, string> = {
  privacy: 'Gizlilik Politikası',
  terms: 'Kullanım Şartları',
  kvkk: 'KVKK Aydınlatma Metni',
};

export default function LegalDocument() {
  const Router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const Title = TITLES[slug] ?? 'Belge';

  return (
    <Screen bare>
      <Pressable
        accessibilityRole="button"
        onPress={() => Router.back()}
        hitSlop={12}
        style={styles.back}>
        <Text style={styles.backText}>‹ Geri</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headline}>{Title.toLocaleUpperCase('tr')}</Text>
        <Text style={styles.body}>
          Bu metin şu anda hazırlanıyor. Yasal onay süreci tamamlanınca burada
          {'\n\n'}Sahana&apos;nın {Title.toLocaleLowerCase('tr')} metnini bulacaksın.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  backText: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  content: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(10),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 28,
    color: Palette.chalk,
    marginBottom: space(5),
  },
  body: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
  },
});
