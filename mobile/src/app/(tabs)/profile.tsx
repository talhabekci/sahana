import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { deleteMe, getMe, logout } from '@/features/auth/api';
import { POSITIONS } from '@/features/auth/PitchPositionPicker';
import { useAuthStore } from '@/features/auth/store';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function positionLabel(Key: string): string {
  return POSITIONS.find((Position) => Position.key === Key)?.label ?? Key;
}

export default function Profile() {
  const setToken = useAuthStore((State) => State.setToken);
  const Me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const Logout = useMutation({
    mutationFn: logout,
    onSettled: () => setToken(null),
  });

  const DeleteAccount = useMutation({
    mutationFn: deleteMe,
    onSettled: () => setToken(null),
  });

  const confirmDelete = () => {
    Alert.alert(
      'Hesabını sil',
      'Profilin ve verilerin silinir; 30 gün içinde kalıcı olarak yok edilir. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Hesabımı sil', style: 'destructive', onPress: () => DeleteAccount.mutate() },
      ],
    );
  };

  if (Me.isPending) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Me.data;

  return (
    <Screen pitch pitchY={-220}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>PROFİL</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.flexShrink}>
              <Text style={styles.name}>{Data?.name ?? 'İsimsiz Oyuncu'}</Text>
              <Text style={styles.city}>
                {Data?.profile?.city ?? 'Şehir yok'}
                {Data?.profile?.district != null ? ` · ${Data.profile.district}` : ''}
              </Text>
            </View>

            <View style={styles.levelBadge}>
              <Text style={styles.levelDigit}>{Data?.profile?.level ?? '–'}</Text>
              <Text style={styles.levelLabel}>SEVİYE</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            {(Data?.profile?.positions ?? []).map((Key) => (
              <View key={Key} style={styles.chip}>
                <Text style={styles.chipText}>{positionLabel(Key)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contactBlock}>
          <Text style={styles.contactLabel}>HESAP</Text>
          <Text style={styles.contactValue}>{Data?.email ?? Data?.phone ?? '—'}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Çıkış yap"
            variant="ghost"
            onPress={() => Logout.mutate()}
            loading={Logout.isPending}
          />
          <Pressable accessibilityRole="button" onPress={confirmDelete} hitSlop={8}>
            <Text style={styles.deleteText}>Hesabımı sil</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: space(4),
    paddingBottom: space(10),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 5,
    color: Palette.lime,
    marginBottom: space(4),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(5),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space(3),
  },
  flexShrink: {
    flexShrink: 1,
  },
  name: {
    fontFamily: Type.display,
    fontSize: 38,
    lineHeight: 40,
    color: Palette.chalk,
  },
  city: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.m,
    paddingVertical: space(2),
    paddingHorizontal: space(4),
  },
  levelDigit: {
    fontFamily: Type.mono,
    fontSize: 30,
    color: Palette.lime,
  },
  levelLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.moss,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
    marginTop: space(4),
  },
  chip: {
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.pill,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
  },
  chipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
  },
  contactBlock: {
    marginTop: space(8),
  },
  contactLabel: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    color: Palette.moss,
    marginBottom: space(1),
  },
  contactValue: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  actions: {
    marginTop: space(10),
    gap: space(6),
    alignItems: 'stretch',
  },
  deleteText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.clay,
    textAlign: 'center',
  },
});
