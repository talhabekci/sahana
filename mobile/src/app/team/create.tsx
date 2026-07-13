import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createTeam } from '@/features/team/api';
import { BADGE_ICONS, TEAM_COLORS } from '@/features/team/constants';
import { toApiFailure } from '@/shared/api/client';
import { ensureJpeg } from '@/shared/media/ensureJpeg';
import { Button } from '@/shared/ui/Button';
import { HueColorPicker } from '@/shared/ui/HueColorPicker';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const STEPS = ['name', 'badge', 'color'] as const;

export default function CreateTeam() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const [StepIndex, setStepIndex] = useState(0);
  const [Name, setName] = useState('');
  const [BadgeIcon, setBadgeIcon] = useState<string | null>(BADGE_ICONS[0].key);
  const [Logo, setLogo] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [ConvertingLogo, setConvertingLogo] = useState(false);
  const [ColorHome, setColorHome] = useState<string>(TEAM_COLORS[0]);
  const [Error_, setError] = useState<string | null>(null);

  const Step = STEPS[StepIndex];

  const pickLogo = async () => {
    const Result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (Result.canceled) {
      return;
    }

    setConvertingLogo(true);

    try {
      const Asset = Result.assets[0];
      setLogo(await ensureJpeg(Asset.uri, { width: Asset.width, height: Asset.height }));
      setBadgeIcon(null);
    } catch {
      setError('Görsel işlenemedi, başka bir fotoğraf dene.');
    } finally {
      setConvertingLogo(false);
    }
  };

  const selectBadgeIcon = (Key: string) => {
    setBadgeIcon(Key);
    setLogo(null);
  };

  const Create = useMutation({
    mutationFn: () =>
      createTeam({
        name: Name.trim(),
        badge_icon: BadgeIcon,
        color_home: ColorHome,
        logo: Logo,
      }),
    onSuccess: async (Team) => {
      await QueryClient.invalidateQueries({ queryKey: ['teams'] });
      Router.replace(`/team/${Team.id}`);
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  const CanContinue =
    Step === 'name' ? Name.trim().length >= 2 : Step === 'badge' ? BadgeIcon != null || Logo != null : true;

  const advance = () => {
    setError(null);

    if (StepIndex < STEPS.length - 1) {
      setStepIndex(StepIndex + 1);
    } else {
      Create.mutate();
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.progressRow}>
          {STEPS.map((Key, Index) => (
            <View
              key={Key}
              style={[styles.progressSegment, Index <= StepIndex && styles.progressDone]}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => (StepIndex > 0 ? setStepIndex(StepIndex - 1) : Router.back())}
          hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        {Step === 'name' && (
          <>
            <Text style={styles.headline}>TAKIMIN ADI NE?</Text>
            <Text style={styles.sub}>Perşembe grubu, Kartallar FK... ne olursa.</Text>
            <View style={styles.content}>
              <TextField
                label="Takım adı"
                value={Name}
                onChangeText={setName}
                placeholder="Kartallar FK"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => CanContinue && advance()}
              />
            </View>
          </>
        )}

        {Step === 'badge' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.headline}>ARMA SEÇ</Text>
            <Text style={styles.sub}>Sonra değiştirebilirsin.</Text>
            <View style={styles.badgeGrid}>
              {BADGE_ICONS.map((Icon) => {
                const Active = Icon.key === BadgeIcon && Logo == null;

                return (
                  <Pressable
                    key={Icon.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: Active }}
                    onPress={() => selectBadgeIcon(Icon.key)}
                    style={[styles.badgeCell, Active && styles.badgeCellActive]}>
                    <Ionicons
                      name={Icon.ionicon}
                      size={28}
                      color={Active ? Palette.limeInk : Palette.chalk}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>YA DA KENDİ GÖRSELİNİ YÜKLE</Text>
            {Logo != null ? (
              <View style={styles.logoPreviewWrap}>
                <Image source={{ uri: Logo.uri }} style={styles.logoPreview} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLogo(null)}
                  style={styles.logoRemove}
                  hitSlop={8}>
                  <Ionicons name="close" size={16} color={Palette.chalk} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void pickLogo()}
                disabled={ConvertingLogo}
                style={styles.logoPicker}>
                {ConvertingLogo ? (
                  <ActivityIndicator color={Palette.moss} size="small" />
                ) : (
                  <Ionicons name="image-outline" size={20} color={Palette.moss} />
                )}
                <Text style={styles.logoPickerText}>
                  {ConvertingLogo ? 'İşleniyor...' : 'Galeriden arma fotoğrafı seç'}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {Step === 'color' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.headline}>FORMA RENGİ</Text>
            <Text style={styles.sub}>Önerilen renklerden seç, ya da paletten kendi rengini bul.</Text>
            <Text style={styles.sectionLabel}>ÖNERİLEN</Text>
            <View style={styles.colorGrid}>
              {TEAM_COLORS.map((Color) => {
                const Active = Color === ColorHome;

                return (
                  <Pressable
                    key={Color}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: Active }}
                    onPress={() => setColorHome(Color)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: Color },
                      Active && styles.colorSwatchActive,
                    ]}
                  />
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>YA DA PALETTEN SEÇ</Text>
            <HueColorPicker value={ColorHome} onChange={setColorHome} />

            <View style={styles.preview}>
              {Logo != null ? (
                <Image source={{ uri: Logo.uri }} style={styles.previewLogo} />
              ) : (
                <View style={[styles.previewBadge, { backgroundColor: ColorHome }]}>
                  <Ionicons
                    name={BADGE_ICONS.find((I) => I.key === BadgeIcon)?.ionicon ?? 'shield-checkmark'}
                    size={30}
                    color={Palette.limeInk}
                  />
                </View>
              )}
              <Text style={styles.previewName}>{Name || 'Takımın'}</Text>
            </View>
          </ScrollView>
        )}

        {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

        <View style={styles.footer}>
          <Button
            label={StepIndex === STEPS.length - 1 ? 'Takımı kur' : 'Devam'}
            onPress={advance}
            disabled={!CanContinue}
            loading={Create.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: space(2),
    paddingTop: space(3),
    marginBottom: space(3),
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.lineFaint,
  },
  progressDone: {
    backgroundColor: Palette.lime,
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingBottom: space(3),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 38,
    color: Palette.chalk,
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.moss,
    marginTop: space(2),
  },
  content: {
    marginTop: space(8),
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(3),
    marginTop: space(8),
  },
  badgeCell: {
    width: 68,
    height: 68,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCellActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(7),
    marginBottom: space(2),
  },
  logoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    borderRadius: Radius.m,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.lineFaint,
    paddingVertical: space(4),
    paddingHorizontal: space(4),
  },
  logoPickerText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  logoPreviewWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  logoPreview: {
    width: 96,
    height: 96,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
  },
  logoRemove: {
    position: 'absolute',
    top: -space(2),
    right: -space(2),
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(11,26,15,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLogo: {
    width: 56,
    height: 56,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(3),
    marginTop: space(8),
  },
  colorSwatch: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: Palette.chalk,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    marginTop: space(10),
  },
  previewBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontFamily: Type.displaySemi,
    fontSize: 22,
    color: Palette.chalk,
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginTop: space(4),
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: space(6),
    paddingTop: space(4),
  },
});
