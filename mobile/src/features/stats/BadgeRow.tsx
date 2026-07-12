import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { PlayerBadge } from './api';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

type Props = {
  badges: PlayerBadge[];
};

/** Kazanılan rozetlerin yatay vitrini (BACKLOG #54) — profil ve oyuncu ekranında. */
export function BadgeRow({ badges }: Props) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>ROZETLER</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {badges.map((Badge) => (
            <Pressable
              key={Badge.key}
              accessibilityRole="button"
              onPress={() => Alert.alert(Badge.label, Badge.description)}
              style={styles.chip}>
              <Ionicons name={Badge.icon as never} size={20} color={Palette.lime} />
              <Text style={styles.label} numberOfLines={1}>
                {Badge.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space(5),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.moss,
    marginBottom: space(2),
  },
  row: {
    flexDirection: 'row',
    gap: space(2),
  },
  chip: {
    alignItems: 'center',
    gap: space(1),
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    paddingVertical: space(3),
    paddingHorizontal: space(3),
    width: 84,
  },
  label: {
    fontFamily: Type.bodyMedium,
    fontSize: 11,
    color: Palette.chalk,
    textAlign: 'center',
  },
});
