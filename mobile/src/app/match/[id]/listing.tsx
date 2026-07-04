import * as Location from 'expo-location';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { POSITIONS } from '@/features/auth/PitchPositionPicker';
import {
  createListing,
  decideApplication,
  getListing,
  getMatch,
} from '@/features/match/api';
import { FALLBACK_CENTER } from '@/features/match/constants';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const LEVELS = [1, 2, 3, 4, 5] as const;

export default function MatchListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Match_ = useQuery({ queryKey: ['matches', id], queryFn: () => getMatch(id) });
  const OpenListingId = (Match_.data?.listings ?? []).find((L) => L.status === 'open')?.id ?? null;

  const Listing = useQuery({
    queryKey: ['listings', OpenListingId],
    queryFn: () => getListing(OpenListingId ?? ''),
    enabled: OpenListingId != null,
  });

  const [Positions, setPositions] = useState<string[]>([]);
  const [NeededCount, setNeededCount] = useState(1);
  const [LevelMin, setLevelMin] = useState(1);
  const [LevelMax, setLevelMax] = useState(5);
  const [Error_, setError] = useState<string | null>(null);

  const invalidate = () => {
    void QueryClient.invalidateQueries({ queryKey: ['matches'] });
    void QueryClient.invalidateQueries({ queryKey: ['listings'] });
  };

  const Create = useMutation({
    mutationFn: async () => {
      let Lat = Match_.data?.venue_lat ?? null;
      let Lng = Match_.data?.venue_lng ?? null;

      if (Lat == null || Lng == null) {
        const Permission = await Location.requestForegroundPermissionsAsync();

        if (Permission.status === 'granted') {
          const Position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          Lat = Position.coords.latitude;
          Lng = Position.coords.longitude;
        } else {
          Lat = FALLBACK_CENTER.lat;
          Lng = FALLBACK_CENTER.lng;
        }
      }

      return createListing(id, {
        positions_needed: Positions,
        needed_count: NeededCount,
        level_min: LevelMin,
        level_max: LevelMax,
        lat: Lat,
        lng: Lng,
      });
    },
    onSuccess: invalidate,
    onError: (E) => setError(toApiFailure(E).message),
  });

  const Decide = useMutation({
    mutationFn: ({ applicationId, decision }: { applicationId: string; decision: 'approve' | 'reject' }) =>
      decideApplication(applicationId, decision),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  if (Match_.isPending) {
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        {OpenListingId == null ? (
          <>
            <Text style={styles.headline}>ADAM EKSİK</Text>
            <Text style={styles.sub}>Hangi mevkilere, kaç oyuncuya ihtiyacın var?</Text>

            <Text style={styles.sectionLabel}>MEVKİLER</Text>
            <View style={styles.chipWrap}>
              {POSITIONS.map((Position) => {
                const Active = Positions.includes(Position.key);

                return (
                  <Pressable
                    key={Position.key}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: Active }}
                    onPress={() =>
                      setPositions((Current) =>
                        Active ? Current.filter((P) => P !== Position.key) : [...Current, Position.key],
                      )
                    }
                    style={[styles.chip, Active && styles.chipActive]}>
                    <Text style={[styles.chipText, Active && styles.chipTextActive]}>
                      {Position.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>KAÇ KİŞİ?</Text>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setNeededCount(Math.max(1, NeededCount - 1))}
                style={styles.stepperButton}>
                <Text style={styles.stepperSymbol}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{NeededCount}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setNeededCount(Math.min(10, NeededCount + 1))}
                style={styles.stepperButton}>
                <Text style={styles.stepperSymbol}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>SEVİYE ARALIĞI</Text>
            <View style={styles.levelBlock}>
              <Text style={styles.levelHint}>En az</Text>
              <View style={styles.chipWrap}>
                {LEVELS.map((Level) => (
                  <Pressable
                    key={`min-${Level}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: LevelMin === Level }}
                    onPress={() => {
                      setLevelMin(Level);
                      if (Level > LevelMax) setLevelMax(Level);
                    }}
                    style={[styles.levelCell, LevelMin === Level && styles.chipActive]}>
                    <Text style={[styles.levelText, LevelMin === Level && styles.chipTextActive]}>
                      {Level}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.levelHint}>En çok</Text>
              <View style={styles.chipWrap}>
                {LEVELS.map((Level) => (
                  <Pressable
                    key={`max-${Level}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: LevelMax === Level }}
                    onPress={() => {
                      setLevelMax(Level);
                      if (Level < LevelMin) setLevelMin(Level);
                    }}
                    style={[styles.levelCell, LevelMax === Level && styles.chipActive]}>
                    <Text style={[styles.levelText, LevelMax === Level && styles.chipTextActive]}>
                      {Level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

            <View style={styles.footer}>
              <Button
                label="İlanı yayınla"
                onPress={() => Create.mutate()}
                disabled={Positions.length === 0}
                loading={Create.isPending}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headline}>İLAN AÇIK</Text>
            <Text style={styles.sub}>
              {Listing.data != null
                ? `${Listing.data.needed_count} oyuncu bekleniyor · Seviye ${Listing.data.level_min}-${Listing.data.level_max}`
                : ''}
            </Text>

            <Text style={styles.sectionLabel}>BAŞVURULAR</Text>

            {Listing.isPending && <ActivityIndicator color={Palette.lime} />}

            {(Listing.data?.applications ?? []).length === 0 && !Listing.isPending && (
              <Text style={styles.emptyText}>Henüz başvuru yok. İlan keşif listesinde görünüyor.</Text>
            )}

            {(Listing.data?.applications ?? []).map((Application) => (
              <View key={Application.id} style={styles.applicationCard}>
                <View style={styles.flexShrink}>
                  <Text style={styles.applicantName}>{Application.applicant?.name ?? 'İsimsiz'}</Text>
                  {Application.note != null && (
                    <Text style={styles.applicantNote}>{Application.note}</Text>
                  )}
                </View>

                {Application.status === 'pending' ? (
                  <View style={styles.decisionRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        Decide.mutate({ applicationId: Application.id, decision: 'approve' })
                      }
                      style={[styles.decisionButton, styles.approveButton]}>
                      <Text style={styles.approveText}>Onayla</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        Decide.mutate({ applicationId: Application.id, decision: 'reject' })
                      }
                      style={styles.decisionButton}>
                      <Text style={styles.rejectText}>Reddet</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.decidedText}>
                    {Application.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
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
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(6),
    marginBottom: space(2),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
  },
  chip: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  chipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  chipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  chipTextActive: {
    color: Palette.limeInk,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(4),
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontFamily: Type.mono,
    fontSize: 22,
    color: Palette.chalk,
  },
  stepperValue: {
    fontFamily: Type.mono,
    fontSize: 28,
    color: Palette.lime,
    minWidth: 40,
    textAlign: 'center',
  },
  levelBlock: {
    gap: space(2),
  },
  levelHint: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
  },
  levelCell: {
    width: 48,
    height: 44,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontFamily: Type.mono,
    fontSize: 16,
    color: Palette.chalk,
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
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.moss,
  },
  applicationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
    marginBottom: space(2),
  },
  flexShrink: {
    flexShrink: 1,
  },
  applicantName: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.chalk,
  },
  applicantNote: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: space(2),
  },
  decisionButton: {
    paddingVertical: space(2),
    paddingHorizontal: space(3),
    borderRadius: Radius.s,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  approveButton: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  approveText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.limeInk,
  },
  rejectText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.clay,
  },
  decidedText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.moss,
  },
});
