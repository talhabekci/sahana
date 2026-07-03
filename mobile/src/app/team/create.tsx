import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createTeam } from '@/features/team/api';
import { BADGE_ICONS, TEAM_COLORS } from '@/features/team/constants';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const STEPS = ['name', 'badge', 'color'] as const;

export default function CreateTeam() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const [StepIndex, setStepIndex] = useState(0);
  const [Name, setName] = useState('');
  const [BadgeIcon, setBadgeIcon] = useState<string>(BADGE_ICONS[0].key);
  const [ColorHome, setColorHome] = useState<string>(TEAM_COLORS[0]);
  const [Error_, setError] = useState<string | null>(null);

  const Step = STEPS[StepIndex];

  const Create = useMutation({
    mutationFn: () => createTeam({ name: Name.trim(), badge_icon: BadgeIcon, color_home: ColorHome }),
    onSuccess: async (Team) => {
      await QueryClient.invalidateQueries({ queryKey: ['teams'] });
      Router.replace(`/team/${Team.id}`);
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  const CanContinue = Step === 'name' ? Name.trim().length >= 2 : true;

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
          <>
            <Text style={styles.headline}>ARMA SEÇ</Text>
            <Text style={styles.sub}>Sonra değiştirebilirsin.</Text>
            <View style={styles.badgeGrid}>
              {BADGE_ICONS.map((Icon) => {
                const Active = Icon.key === BadgeIcon;

                return (
                  <Pressable
                    key={Icon.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: Active }}
                    onPress={() => setBadgeIcon(Icon.key)}
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
          </>
        )}

        {Step === 'color' && (
          <>
            <Text style={styles.headline}>FORMA RENGİ</Text>
            <Text style={styles.sub}>Takımının rengini seç.</Text>
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

            <View style={styles.preview}>
              <View style={[styles.previewBadge, { backgroundColor: ColorHome }]}>
                <Ionicons name={BADGE_ICONS.find((I) => I.key === BadgeIcon)?.ionicon ?? 'shield-checkmark'} size={30} color={Palette.limeInk} />
              </View>
              <Text style={styles.previewName}>{Name || 'Takımın'}</Text>
            </View>
          </>
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

const styles = StyleSheet.create({
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
