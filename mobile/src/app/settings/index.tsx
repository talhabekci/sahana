import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { deleteMe, logout } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const LEGAL_LINKS = [
  { slug: 'privacy', label: 'Gizlilik Politikası' },
  { slug: 'terms', label: 'Kullanım Şartları' },
  { slug: 'kvkk', label: 'KVKK Aydınlatma Metni' },
] as const;

export default function Settings() {
  const Router = useRouter();
  const setToken = useAuthStore((State) => State.setToken);

  const Logout = useMutation({
    mutationFn: logout,
    onSettled: () => setToken(null),
  });

  const DeleteAccount = useMutation({
    mutationFn: deleteMe,
    onSettled: () => setToken(null),
  });

  const confirmLogout = () => {
    Alert.alert('Çıkış yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => Logout.mutate() },
    ]);
  };

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

  return (
    <Screen bare>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <Text style={styles.headline}>AYARLAR</Text>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionLabel}>HESAP</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => Router.push('/profile-edit')}
            style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowTitle}>Profili düzenle</Text>
            <Ionicons name="chevron-forward" size={18} color={Palette.moss} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Router.push('/notifications/preferences')}
            style={styles.row}>
            <Text style={styles.rowTitle}>Bildirim tercihleri</Text>
            <Ionicons name="chevron-forward" size={18} color={Palette.moss} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>YASAL</Text>
        <View style={styles.card}>
          {LEGAL_LINKS.map((Link, Index) => (
            <Pressable
              key={Link.slug}
              accessibilityRole="button"
              onPress={() => Router.push(`/settings/legal/${Link.slug}`)}
              style={[styles.row, Index < LEGAL_LINKS.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowTitle}>{Link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Palette.moss} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>HESAP İŞLEMLERİ</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={confirmLogout}
            disabled={Logout.isPending}
            style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowTitle}>Çıkış yap</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={confirmDelete}
            disabled={DeleteAccount.isPending}
            style={styles.row}>
            <Text style={styles.rowDanger}>Hesabımı sil</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  headline: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 3,
    color: Palette.lime,
    paddingHorizontal: space(6),
    marginTop: space(3),
    marginBottom: space(4),
  },
  list: {
    paddingHorizontal: space(6),
    paddingBottom: space(10),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(6),
    marginBottom: space(2),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(4),
    paddingVertical: space(4),
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.lineFaint,
  },
  rowTitle: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.chalk,
  },
  rowDanger: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.clay,
  },
});
