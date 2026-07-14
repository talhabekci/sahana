import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEGAL_DOCUMENTS } from '@/features/settings/legalContent';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Type, space, useTheme } from '@/shared/ui/theme';

export default function LegalDocument() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const Document = LEGAL_DOCUMENTS[slug];

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
        {Document != null ? (
          <>
            <Text style={styles.headline}>{Document.title.toLocaleUpperCase('tr')}</Text>
            <Text style={styles.updatedAt}>Son güncelleme: {Document.updatedAt}</Text>
            {Document.sections.map((Section, Index) => (
              <View key={Index} style={styles.section}>
                {Section.heading != null && <Text style={styles.sectionHeading}>{Section.heading}</Text>}
                <Text style={styles.body}>{Section.body}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.body}>Belge bulunamadı.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
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
    marginBottom: space(2),
  },
  updatedAt: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginBottom: space(6),
  },
  section: {
    marginBottom: space(5),
  },
  sectionHeading: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
    marginBottom: space(2),
  },
  body: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
  },
});
