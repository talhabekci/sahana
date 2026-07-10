import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getCities, getMe, updateMe } from '@/features/auth/api';
import { PitchPositionPicker } from '@/features/auth/PitchPositionPicker';
import { toApiFailure } from '@/shared/api/client';
import { ensureJpeg } from '@/shared/media/ensureJpeg';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function initials(name: string | null | undefined): string {
  if (name == null || name.trim() === '') {
    return '?';
  }

  const Parts = name.trim().split(/\s+/);
  const First = Parts[0]?.[0] ?? '';
  const Last = Parts.length > 1 ? (Parts[Parts.length - 1]?.[0] ?? '') : '';

  return (First + Last).toUpperCase();
}

export default function ProfileEdit() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const Cities = useQuery({ queryKey: ['cities'], queryFn: getCities });

  const [Hydrated, setHydrated] = useState(false);
  const [Name, setName] = useState('');
  const [Positions, setPositions] = useState<string[]>([]);
  const [Level, setLevel] = useState<number | null>(null);
  const [CityId, setCityId] = useState<number | null>(null);
  const [CityName, setCityName] = useState<string | null>(null);
  const [District, setDistrict] = useState('');
  const [Bio, setBio] = useState('');
  const [BirthDay, setBirthDay] = useState('');
  const [BirthMonth, setBirthMonth] = useState('');
  const [BirthYear, setBirthYear] = useState('');
  const [Avatar, setAvatar] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [ConvertingAvatar, setConvertingAvatar] = useState(false);
  const [CityPickerVisible, setCityPickerVisible] = useState(false);
  const [CitySearch, setCitySearch] = useState('');
  const [Error_, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Hydrated || Me.data == null) {
      return;
    }

    setName(Me.data.name ?? '');
    setPositions(Me.data.profile?.positions ?? []);
    setLevel(Me.data.profile?.level ?? null);
    setCityId(Me.data.profile?.city_id ?? null);
    setCityName(Me.data.profile?.city ?? null);
    setDistrict(Me.data.profile?.district ?? '');
    setBio(Me.data.profile?.bio ?? '');

    const BirthDate = Me.data.profile?.birth_date;

    if (BirthDate != null) {
      const [Year, Month, Day] = BirthDate.split('-');
      setBirthYear(Year ?? '');
      setBirthMonth(Month ?? '');
      setBirthDay(Day ?? '');
    }

    setHydrated(true);
  }, [Hydrated, Me.data]);

  const FilteredCities = useMemo(() => {
    const Query = CitySearch.trim().toLocaleLowerCase('tr');
    const All = Cities.data ?? [];

    return Query === ''
      ? All
      : All.filter((City) => City.name.toLocaleLowerCase('tr').includes(Query));
  }, [Cities.data, CitySearch]);

  const convertAndSetAvatar = async (Uri: string) => {
    setConvertingAvatar(true);

    try {
      setAvatar(await ensureJpeg(Uri));
    } catch {
      Alert.alert('Olmadı', 'Görsel işlenemedi, başka bir fotoğraf dene.');
    } finally {
      setConvertingAvatar(false);
    }
  };

  const pickFromLibrary = async () => {
    const Result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!Result.canceled) {
      await convertAndSetAvatar(Result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const Permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!Permission.granted) {
      Alert.alert('İzin gerekli', 'Fotoğraf çekmek için kamera izni vermen gerekiyor.');

      return;
    }

    const Result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

    if (!Result.canceled) {
      await convertAndSetAvatar(Result.assets[0].uri);
    }
  };

  const promptPickAvatar = () => {
    Alert.alert('Profil fotoğrafı', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kamerayla çek', onPress: () => void takePhoto() },
      { text: 'Galeriden seç', onPress: () => void pickFromLibrary() },
    ]);
  };

  const BirthFieldsFilled = BirthDay.trim().length > 0 || BirthMonth.trim().length > 0 || BirthYear.trim().length > 0;
  const BirthFieldsComplete =
    BirthDay.trim().length > 0 && BirthMonth.trim().length > 0 && BirthYear.trim().length === 4;

  const Save = useMutation({
    mutationFn: () => {
      let BirthDate: string | undefined;

      if (BirthFieldsComplete) {
        BirthDate = `${BirthYear}-${BirthMonth.padStart(2, '0')}-${BirthDay.padStart(2, '0')}`;
      }

      return updateMe({
        name: Name.trim(),
        positions: Positions,
        level: Level ?? undefined,
        city_id: CityId ?? undefined,
        district: District.trim() === '' ? null : District.trim(),
        bio: Bio.trim() === '' ? null : Bio.trim(),
        birth_date: BirthDate,
        avatar: Avatar,
      });
    },
    onSuccess: async (UpdatedMe) => {
      QueryClient.setQueryData(['me'], UpdatedMe);
      await QueryClient.invalidateQueries({ queryKey: ['me'] });
      Router.back();
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  const CanSave =
    Name.trim().length >= 2 &&
    Positions.length > 0 &&
    Level != null &&
    CityId != null &&
    (!BirthFieldsFilled || BirthFieldsComplete);

  if (Me.isPending) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>

          <Text style={styles.headline}>PROFİLİNİ DÜZENLE</Text>

          <Pressable
            accessibilityRole="button"
            onPress={promptPickAvatar}
            disabled={ConvertingAvatar}
            style={styles.avatarWrap}>
            {ConvertingAvatar ? (
              <View style={styles.avatar}>
                <ActivityIndicator color={Palette.lime} />
              </View>
            ) : Avatar != null ? (
              <Image source={{ uri: Avatar.uri }} style={styles.avatar} />
            ) : Me.data?.avatar_path != null ? (
              <Image source={{ uri: Me.data.avatar_path }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials(Me.data?.name)}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={Palette.limeInk} />
            </View>
          </Pressable>

          <View style={styles.field}>
            <TextField label="Adın" value={Name} onChangeText={setName} placeholder="Adın Soyadın" />
          </View>

          <Text style={styles.sectionLabel}>MEVKİ</Text>
          <PitchPositionPicker
            selected={Positions}
            onToggle={(Key) =>
              setPositions((Current) =>
                Current.includes(Key) ? Current.filter((P) => P !== Key) : [...Current, Key],
              )
            }
          />

          <Text style={styles.sectionLabel}>SEVİYE</Text>
          <View style={styles.levelRow}>
            {[1, 2, 3, 4, 5].map((Value) => (
              <Pressable
                key={Value}
                accessibilityRole="radio"
                accessibilityState={{ selected: Level === Value }}
                onPress={() => setLevel(Value)}
                style={[styles.levelCell, Level === Value && styles.levelCellActive]}>
                <Text style={[styles.levelDigit, Level === Value && styles.levelDigitActive]}>{Value}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>ŞEHİR</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCityPickerVisible(true)}
            style={styles.citySelect}>
            <Text style={styles.citySelectText}>{CityName ?? 'Şehir seç'}</Text>
            <Ionicons name="chevron-forward" size={18} color={Palette.moss} />
          </Pressable>

          <View style={styles.field}>
            <TextField
              label="İlçe (opsiyonel)"
              value={District}
              onChangeText={setDistrict}
              placeholder="Kadıköy"
            />
          </View>

          <Text style={styles.sectionLabel}>DOĞUM TARİHİ (opsiyonel)</Text>
          <View style={styles.birthRow}>
            <TextInput
              value={BirthDay}
              onChangeText={(Value) => setBirthDay(Value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="GG"
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.birthInput, styles.birthInputSmall]}
            />
            <TextInput
              value={BirthMonth}
              onChangeText={(Value) => setBirthMonth(Value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="AA"
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.birthInput, styles.birthInputSmall]}
            />
            <TextInput
              value={BirthYear}
              onChangeText={(Value) => setBirthYear(Value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="YYYY"
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.birthInput, styles.birthInputLarge]}
            />
          </View>

          <Text style={styles.sectionLabel}>HAKKINDA (opsiyonel)</Text>
          <TextInput
            value={Bio}
            onChangeText={setBio}
            placeholder="Kendinden bahset..."
            placeholderTextColor={Palette.moss}
            selectionColor={Palette.lime}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={160}
            style={styles.textArea}
          />
          <Text style={styles.charCount}>{Bio.length}/160</Text>

          {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

          <View style={styles.footer}>
            <Button label="Kaydet" onPress={() => Save.mutate()} disabled={!CanSave} loading={Save.isPending} />
          </View>
        </ScrollView>

        <Modal visible={CityPickerVisible} transparent animationType="slide">
          <Pressable style={styles.cityBackdrop} onPress={() => setCityPickerVisible(false)} />
          <View style={styles.citySheet}>
            <View style={styles.cityHandle} />
            <Text style={styles.citySheetTitle}>ŞEHİR SEÇ</Text>
            <TextField
              label="Şehir ara"
              value={CitySearch}
              onChangeText={setCitySearch}
              placeholder="İstanbul, Ankara…"
              autoCorrect={false}
            />
            <FlatList
              data={FilteredCities}
              keyExtractor={(City) => String(City.id)}
              style={styles.cityList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: CityId === item.id }}
                  onPress={() => {
                    setCityId(item.id);
                    setCityName(item.name);
                    setCityPickerVisible(false);
                  }}
                  style={styles.cityRow}>
                  <Text style={[styles.cityRowText, CityId === item.id && styles.cityRowTextActive]}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 34,
    color: Palette.chalk,
    marginBottom: space(5),
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: space(6),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    fontFamily: Type.bodyBold,
    fontSize: 30,
    color: Palette.lime,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.turf,
  },
  field: {
    marginBottom: space(5),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(3),
    marginBottom: space(3),
  },
  levelRow: {
    flexDirection: 'row',
    gap: space(2),
    marginBottom: space(2),
  },
  levelCell: {
    flex: 1,
    height: 60,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCellActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  levelDigit: {
    fontFamily: Type.mono,
    fontSize: 22,
    color: Palette.chalk,
  },
  levelDigitActive: {
    color: Palette.limeInk,
  },
  citySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingVertical: space(4),
    paddingHorizontal: space(4),
    marginBottom: space(2),
  },
  citySelectText: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  birthRow: {
    flexDirection: 'row',
    gap: space(2),
    marginBottom: space(2),
  },
  birthInput: {
    fontFamily: Type.mono,
    fontSize: 18,
    color: Palette.chalk,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingVertical: space(3),
    textAlign: 'center',
  },
  birthInputSmall: {
    width: 64,
  },
  birthInputLarge: {
    width: 90,
  },
  textArea: {
    minHeight: 90,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    padding: space(4),
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 21,
    color: Palette.chalk,
  },
  charCount: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: Palette.moss,
    textAlign: 'right',
    marginTop: space(1),
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginTop: space(4),
  },
  footer: {
    paddingVertical: space(6),
  },
  cityBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,26,15,0.6)',
  },
  citySheet: {
    backgroundColor: Palette.turf,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingHorizontal: space(6),
    paddingTop: space(3),
    paddingBottom: space(8),
    maxHeight: '75%',
  },
  cityHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lineFaint,
    alignSelf: 'center',
    marginBottom: space(4),
  },
  citySheetTitle: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginBottom: space(3),
  },
  cityList: {
    marginTop: space(3),
  },
  cityRow: {
    paddingVertical: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineFaint,
  },
  cityRowText: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  cityRowTextActive: {
    color: Palette.lime,
  },
});
