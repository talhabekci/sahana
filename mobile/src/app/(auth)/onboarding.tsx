import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getCities, updateMe } from '@/features/auth/api';
import { PitchPositionPicker } from '@/features/auth/PitchPositionPicker';
import { acceptInvite } from '@/features/team/api';
import { usePendingInviteStore } from '@/features/team/pendingInviteStore';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const STEPS = ['name', 'positions', 'level', 'city'] as const;

const STEP_TITLES: Record<(typeof STEPS)[number], { title: string; sub: string }> = {
  name: { title: 'ADIN NE?', sub: 'Takım arkadaşların seni bu isimle görecek.' },
  positions: { title: 'NEREDE OYNARSIN?', sub: 'Sahaya dokun — birden fazla bölge seçebilirsin.' },
  level: {
    title: 'SEVİYEN?',
    sub: '1 yeni başlayan, 5 saha kurdu. Dürüst ol — eşleşmeler buna göre.',
  },
  city: { title: 'ŞEHRİN?', sub: 'Yakınındaki maçları ve ilanları buna göre göstereceğiz.' },
};

export default function Onboarding() {
  const Router = useRouter();
  const [StepIndex, setStepIndex] = useState(0);
  const [Name, setName] = useState('');
  const [Positions, setPositions] = useState<string[]>([]);
  const [Level, setLevel] = useState<number | null>(null);
  const [CityId, setCityId] = useState<number | null>(null);
  const [CitySearch, setCitySearch] = useState('');
  const [Error_, setError] = useState<string | null>(null);
  const PendingInviteCode = usePendingInviteStore((State) => State.code);
  const setPendingInviteCode = usePendingInviteStore((State) => State.setCode);

  const Step = STEPS[StepIndex];

  const Cities = useQuery({ queryKey: ['cities'], queryFn: getCities });

  const FilteredCities = useMemo(() => {
    const Query = CitySearch.trim().toLocaleLowerCase('tr');
    const All = Cities.data ?? [];

    return Query === ''
      ? All
      : All.filter((City) => City.name.toLocaleLowerCase('tr').includes(Query));
  }, [Cities.data, CitySearch]);

  const Save = useMutation({
    mutationFn: () =>
      updateMe({
        name: Name.trim(),
        positions: Positions,
        level: Level ?? 3,
        city_id: CityId ?? 34,
      }),
    onSuccess: async () => {
      if (PendingInviteCode != null) {
        try {
          const Team = await acceptInvite(PendingInviteCode);
          setPendingInviteCode(null);
          Router.replace(`/team/${Team.id}`);

          return;
        } catch {
          setPendingInviteCode(null);
        }
      }

      Router.replace('/(tabs)/profile');
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  const CanContinue =
    (Step === 'name' && Name.trim().length >= 2) ||
    (Step === 'positions' && Positions.length > 0) ||
    (Step === 'level' && Level != null) ||
    (Step === 'city' && CityId != null);

  const advance = () => {
    setError(null);

    if (StepIndex < STEPS.length - 1) {
      setStepIndex(StepIndex + 1);
    } else {
      Save.mutate();
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

        {StepIndex > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setStepIndex(StepIndex - 1)}
            hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>
        )}

        <Text style={styles.headline}>{STEP_TITLES[Step].title}</Text>
        <Text style={styles.sub}>{STEP_TITLES[Step].sub}</Text>

        <View style={styles.content}>
          {Step === 'name' && (
            <TextField
              label="Adın"
              value={Name}
              onChangeText={setName}
              placeholder="Adın Soyadın"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => CanContinue && advance()}
            />
          )}

          {Step === 'positions' && (
            <PitchPositionPicker
              selected={Positions}
              onToggle={(Key) =>
                setPositions((Current) =>
                  Current.includes(Key) ? Current.filter((P) => P !== Key) : [...Current, Key],
                )
              }
            />
          )}

          {Step === 'level' && (
            <View style={styles.levelRow}>
              {[1, 2, 3, 4, 5].map((Value) => (
                <Pressable
                  key={Value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: Level === Value }}
                  onPress={() => setLevel(Value)}
                  style={[styles.levelCell, Level === Value && styles.levelCellActive]}>
                  <Text style={[styles.levelDigit, Level === Value && styles.levelDigitActive]}>
                    {Value}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {Step === 'city' && (
            <View style={styles.flex}>
              <TextField
                label="Şehir ara"
                value={CitySearch}
                onChangeText={setCitySearch}
                placeholder="İstanbul, Ankara…"
                autoCorrect={false}
              />
              {Cities.isError ? (
                <ErrorState onRetry={() => void Cities.refetch()} />
              ) : (
                <FlatList
                  data={FilteredCities}
                  keyExtractor={(City) => String(City.id)}
                  style={styles.cityList}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const Active = CityId === item.id;

                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: Active }}
                        onPress={() => setCityId(item.id)}
                        style={styles.cityRow}>
                        <Text style={[styles.cityName, Active && styles.cityNameActive]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.cityPlate, Active && styles.cityPlateActive]}>
                          {String(item.id).padStart(2, '0')}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          )}
        </View>

        {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

        <View style={styles.footer}>
          <Button
            label={StepIndex === STEPS.length - 1 ? 'Sahaya çık' : 'Devam'}
            onPress={advance}
            disabled={!CanContinue}
            loading={Save.isPending}
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
    marginBottom: space(5),
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
    paddingBottom: space(2),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 40,
    color: Palette.chalk,
    marginTop: space(2),
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
    marginTop: space(2),
  },
  content: {
    flex: 1,
    marginTop: space(8),
  },
  levelRow: {
    flexDirection: 'row',
    gap: space(2),
  },
  levelCell: {
    flex: 1,
    height: 72,
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
    fontSize: 28,
    color: Palette.chalk,
  },
  levelDigitActive: {
    color: Palette.limeInk,
  },
  cityList: {
    marginTop: space(4),
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineFaint,
  },
  cityName: {
    fontFamily: Type.bodyMedium,
    fontSize: 17,
    color: Palette.chalk,
  },
  cityNameActive: {
    color: Palette.lime,
  },
  cityPlate: {
    fontFamily: Type.mono,
    fontSize: 15,
    color: Palette.moss,
  },
  cityPlateActive: {
    color: Palette.lime,
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginBottom: space(2),
  },
  footer: {
    paddingBottom: space(6),
    paddingTop: space(3),
  },
});
