import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  cancelMatch,
  confirmMatch,
  createOpponentListing,
  getMatch,
  Rsvp,
  submitRsvp,
} from '@/features/match/api';
import {
  formatDayLabel,
  formatTimeLabel,
  MATCH_STATUS_LABELS,
  RSVP_LABELS,
} from '@/features/match/constants';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const RSVP_OPTIONS: Rsvp[] = ['yes', 'maybe', 'no'];

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Match_ = useQuery({ queryKey: ['matches', id], queryFn: () => getMatch(id) });

  const invalidate = () => {
    void QueryClient.invalidateQueries({ queryKey: ['matches'] });
  };

  const Rsvp_ = useMutation({
    mutationFn: (Status: Rsvp) => submitRsvp(id, Status),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const Confirm = useMutation({
    mutationFn: () => confirmMatch(id),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const Cancel = useMutation({
    mutationFn: () => cancelMatch(id),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const OpponentAd = useMutation({
    mutationFn: () =>
      createOpponentListing({
        team_id: Match_.data?.team?.id ?? '',
        match_id: id,
        lat: Match_.data?.venue_lat,
        lng: Match_.data?.venue_lng,
      }),
    onSuccess: () => Alert.alert('İlan açıldı', 'Rakip arayanlar listesinde görünüyorsun.'),
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  if (Match_.isPending || Match_.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Match_.data;
  const IsOpen = Data.status === 'draft' || Data.status === 'confirmed';
  const OpenListing = (Data.listings ?? []).find((Listing) => Listing.status === 'open');

  const promptCancel = () => {
    Alert.alert('Maçı iptal et', 'Tüm katılımcılar için iptal edilir. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal et', style: 'destructive', onPress: () => Cancel.mutate() },
    ]);
  };

  return (
    <Screen pitch pitchY={-240}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <Text style={styles.teamName}>
            {Data.team?.name}
            {Data.opponent_team != null ? `  —  ${Data.opponent_team.name}` : ''}
          </Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>{MATCH_STATUS_LABELS[Data.status]}</Text>
          </View>
        </View>

        <Text style={styles.when}>
          {formatDayLabel(Data.starts_at)} · <Text style={styles.time}>{formatTimeLabel(Data.starts_at)}</Text>
        </Text>
        <Text style={styles.venue}>
          {Data.venue_text} · {Data.format}v{Data.format}
          {Data.price_per_player != null ? ` · ${Data.price_per_player} TL` : ''}
        </Text>

        {IsOpen && (
          <>
            <Text style={styles.sectionLabel}>GELİYOR MUSUN?</Text>
            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map((Option) => {
                const Active = Data.my_rsvp === Option;

                return (
                  <Pressable
                    key={Option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: Active }}
                    onPress={() => Rsvp_.mutate(Option)}
                    style={[styles.rsvpButton, Active && styles.rsvpButtonActive]}>
                    <Text style={[styles.rsvpText, Active && styles.rsvpTextActive]}>
                      {RSVP_LABELS[Option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {Data.rsvp_summary != null && (
          <Text style={styles.summary}>
            {Data.rsvp_summary.yes} geliyor · {Data.rsvp_summary.maybe} belki ·{' '}
            {Data.rsvp_summary.no} gelmiyor · {Data.rsvp_summary.pending} yanıtsız
          </Text>
        )}

        <Text style={styles.sectionLabel}>KADRO</Text>
        <View style={styles.card}>
          {(Data.participants ?? []).map((Participant, Index) => (
            <View
              key={Participant.id}
              style={[styles.participantRow, Index === 0 && styles.participantRowFirst]}>
              <Text style={styles.participantName}>
                {Participant.name ?? 'İsimsiz'}
                {Participant.source === 'listing' ? '  · ilandan' : ''}
              </Text>
              <Text
                style={[
                  styles.participantRsvp,
                  Participant.rsvp === 'yes' && styles.rsvpYes,
                  Participant.rsvp === 'no' && styles.rsvpNo,
                ]}>
                {Participant.rsvp != null ? RSVP_LABELS[Participant.rsvp] : 'Yanıtsız'}
              </Text>
            </View>
          ))}
        </View>

        {Data.i_am_captain === true && IsOpen && (
          <View style={styles.captainBlock}>
            <Text style={styles.sectionLabel}>KAPTAN</Text>

            {Data.status === 'draft' && (
              <Button label="Maçı onayla" onPress={() => Confirm.mutate()} loading={Confirm.isPending} />
            )}

            <Button
              label={OpenListing != null ? 'Adam eksik ilanını yönet' : 'Adam eksik ilanı aç'}
              variant={Data.status === 'draft' ? 'ghost' : 'primary'}
              onPress={() => Router.push(`/match/${id}/listing`)}
            />

            {Data.opponent_team == null && (
              <Button
                label="Rakip ilanı ver"
                variant="ghost"
                onPress={() =>
                  Alert.alert('Rakip ilanı', 'Bu maç için rakip arayanlar listesine ilan verilsin mi?', [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'İlan ver', onPress: () => OpponentAd.mutate() },
                  ])
                }
                loading={OpponentAd.isPending}
              />
            )}

            <Pressable accessibilityRole="button" onPress={promptCancel} hitSlop={8}>
              <Text style={styles.cancelText}>Maçı iptal et</Text>
            </Pressable>
          </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space(3),
  },
  teamName: {
    fontFamily: Type.display,
    fontSize: 30,
    lineHeight: 32,
    color: Palette.chalk,
    flexShrink: 1,
  },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: space(3),
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
  },
  statusText: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.chalk,
  },
  when: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.moss,
    marginTop: space(2),
  },
  time: {
    fontFamily: Type.mono,
    color: Palette.lime,
  },
  venue: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(7),
    marginBottom: space(2),
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: space(2),
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: space(3),
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  rsvpText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  rsvpTextActive: {
    color: Palette.limeInk,
  },
  summary: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: space(3),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    paddingHorizontal: space(4),
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  participantRowFirst: {
    borderTopWidth: 0,
  },
  participantName: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.chalk,
  },
  participantRsvp: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
  },
  rsvpYes: {
    color: Palette.lime,
  },
  rsvpNo: {
    color: Palette.clay,
  },
  captainBlock: {
    marginTop: space(4),
    gap: space(3),
  },
  cancelText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.clay,
    textAlign: 'center',
    paddingVertical: space(2),
  },
});
