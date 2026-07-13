import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { listMatches } from '@/features/match/api';
import { createVenueReview, getVenue } from '@/features/venue/api';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const AMENITY_LABELS: Record<string, string> = {
  indoor: 'Kapalı',
  capacity: 'Kişi kapasitesi',
  shower: 'Duş',
  parking: 'Otopark',
  cafeteria: 'Kafeterya',
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VenueDetail() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Venue_ = useQuery({ queryKey: ['venues', id], queryFn: () => getVenue(id) });
  const PastMatches = useQuery({ queryKey: ['matches', 'past'], queryFn: () => listMatches('past') });

  const [ReviewModalVisible, setReviewModalVisible] = useState(false);
  const [SelectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [Score, setScore] = useState(5);
  const [Body, setBody] = useState('');

  const EligibleMatches = (PastMatches.data ?? []).filter(
    (Match) => Match.venue?.id === id && Match.status === 'played',
  );

  const SubmitReview = useMutation({
    mutationFn: () => createVenueReview(id, { match_id: SelectedMatchId ?? '', score: Score, body: Body.trim() || undefined }),
    onSuccess: () => {
      setReviewModalVisible(false);
      setBody('');
      void QueryClient.invalidateQueries({ queryKey: ['venues', id] });
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  if (Venue_.isPending || Venue_.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Venue_.data;

  return (
    <Screen bare>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>
        </View>

        <Text style={styles.name}>{Data.name}</Text>
        {Data.address != null && <Text style={styles.address}>{Data.address}</Text>}

        <View style={styles.statsRow}>
          {Data.average_score !== null && (
            <View style={styles.statBlock}>
              <View style={styles.scoreRow}>
                <Ionicons name="star" size={18} color={Palette.lime} />
                <Text style={styles.statValue}>{Data.average_score}</Text>
              </View>
              <Text style={styles.statLabel}>{Data.reviews_count} YORUM</Text>
            </View>
          )}
          {(Data.price_min != null || Data.price_max != null) && (
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>
                {Data.price_min ?? '?'}-{Data.price_max ?? '?'}
              </Text>
              <Text style={styles.statLabel}>TL/KİŞİ</Text>
            </View>
          )}
        </View>

        {Data.amenities != null && (
          <View style={styles.amenityWrap}>
            {Object.entries(Data.amenities)
              .filter(([, Value]) => Value !== false)
              .map(([Key, Value]) => (
                <View key={Key} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>
                    {AMENITY_LABELS[Key] ?? Key}
                    {typeof Value === 'number' ? `: ${Value}` : ''}
                  </Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.reviewHeader}>
          <Text style={styles.sectionLabel}>YORUMLAR</Text>
          {Data.my_review === null && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (EligibleMatches.length === 0) {
                  Alert.alert('Yorum yapamazsın', 'Bu sahada oynanmış bir maçın olmalı.');

                  return;
                }

                setSelectedMatchId(EligibleMatches[0].id);
                setReviewModalVisible(true);
              }}
              hitSlop={8}>
              <Text style={styles.reviewLink}>Yorum yap</Text>
            </Pressable>
          )}
        </View>

        {(Data.reviews ?? []).length === 0 ? (
          <Text style={styles.emptyText}>Henüz yorum yok.</Text>
        ) : (
          <View style={styles.reviewList}>
            {(Data.reviews ?? []).map((Review) => (
              <View key={Review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewAuthor}>{Review.author?.name ?? 'İsimsiz'}</Text>
                  <View style={styles.scoreRow}>
                    <Ionicons name="star" size={12} color={Palette.lime} />
                    <Text style={styles.reviewScore}>{Review.score}</Text>
                  </View>
                </View>
                {Review.body != null && <Text style={styles.reviewBody}>{Review.body}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={ReviewModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <Pressable style={styles.backdrop} onPress={() => setReviewModalVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Sahayı puanla</Text>

            {EligibleMatches.length > 1 && (
              <View style={styles.matchChipWrap}>
                {EligibleMatches.map((Match) => (
                  <Pressable
                    key={Match.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: SelectedMatchId === Match.id }}
                    onPress={() => setSelectedMatchId(Match.id)}
                    style={[styles.matchChip, SelectedMatchId === Match.id && styles.matchChipActive]}>
                    <Text
                      style={[
                        styles.matchChipText,
                        SelectedMatchId === Match.id && styles.matchChipTextActive,
                      ]}>
                      {formatWhen(Match.starts_at)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((Value) => (
                <Pressable key={Value} accessibilityRole="button" onPress={() => setScore(Value)} hitSlop={4}>
                  <Ionicons
                    name={Value <= Score ? 'star' : 'star-outline'}
                    size={32}
                    color={Palette.lime}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={Body}
              onChangeText={setBody}
              placeholder="Yorumun (opsiyonel)"
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              style={styles.reviewInput}
              multiline
            />

            <Button label="Gönder" onPress={() => SubmitReview.mutate()} loading={SubmitReview.isPending} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: space(6),
    paddingBottom: space(8),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    paddingTop: space(4),
    marginBottom: space(3),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  name: {
    fontFamily: Type.display,
    fontSize: 32,
    color: Palette.chalk,
  },
  address: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
  },
  statsRow: {
    flexDirection: 'row',
    gap: space(6),
    marginTop: space(5),
  },
  statBlock: {
    alignItems: 'flex-start',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: Type.mono,
    fontSize: 20,
    color: Palette.chalk,
  },
  statLabel: {
    fontFamily: Type.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Palette.moss,
    marginTop: 2,
  },
  amenityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
    marginTop: space(5),
  },
  amenityChip: {
    paddingVertical: space(1),
    paddingHorizontal: space(3),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  amenityText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space(7),
    marginBottom: space(3),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
  },
  reviewLink: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.lime,
  },
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  reviewList: {
    gap: space(3),
  },
  reviewCard: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(3),
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontFamily: Type.bodyBold,
    fontSize: 13,
    color: Palette.chalk,
  },
  reviewScore: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.chalk,
  },
  reviewBody: {
    fontFamily: Type.body,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.chalk,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Palette.turf,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    padding: space(6),
    gap: space(4),
  },
  sheetTitle: {
    fontFamily: Type.bodyBold,
    fontSize: 18,
    color: Palette.chalk,
  },
  matchChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
  },
  matchChip: {
    paddingVertical: space(1),
    paddingHorizontal: space(3),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.pitchNight,
  },
  matchChipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  matchChipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
  },
  matchChipTextActive: {
    color: Palette.limeInk,
  },
  starRow: {
    flexDirection: 'row',
    gap: space(2),
    justifyContent: 'center',
  },
  reviewInput: {
    minHeight: 80,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.pitchNight,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
    textAlignVertical: 'top',
  },
});
