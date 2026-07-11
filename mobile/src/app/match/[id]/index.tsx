import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import {
  addMatchVideo,
  approvePlayerStat,
  cancelMatch,
  confirmMatch,
  confirmMatchResult,
  createOpponentListing,
  disputeMatchResult,
  enterMatchResult,
  getMatch,
  listMatchVideos,
  listPlayerStats,
  Rsvp,
  submitPlayerStat,
  submitRsvp,
  uploadMatchVideo,
} from '@/features/match/api';
import {
  formatDayLabel,
  formatTimeLabel,
  MATCH_STATUS_LABELS,
  RSVP_LABELS,
} from '@/features/match/constants';
import VideoDefaultCover from '@/assets/images/video-default-cover.png';
import { PostVideoPlayer } from '@/features/social/PostVideoPlayer';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { GlassView } from '@/shared/ui/GlassView';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const RSVP_OPTIONS: Rsvp[] = ['yes', 'maybe', 'no'];

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Match_ = useQuery({ queryKey: ['matches', id], queryFn: () => getMatch(id) });

  const [VideoModalVisible, setVideoModalVisible] = useState(false);
  const [VideoUrl, setVideoUrl] = useState('');
  // Yüklenen videolar uygulama içinde oynar (BACKLOG #46); harici linkler tarayıcıda.
  const [PlayingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const Videos = useQuery({
    queryKey: ['matches', id, 'videos'],
    queryFn: () => listMatchVideos(id),
    enabled: Match_.data?.status !== undefined && Match_.data.status !== 'cancelled',
  });

  const invalidate = () => {
    void QueryClient.invalidateQueries({ queryKey: ['matches'] });
  };

  const AddVideo = useMutation({
    mutationFn: () => addMatchVideo(id, VideoUrl.trim()),
    onSuccess: () => {
      setVideoModalVisible(false);
      setVideoUrl('');
      void QueryClient.invalidateQueries({ queryKey: ['matches', id, 'videos'] });
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const [UploadProgress, setUploadProgress] = useState<number | null>(null);

  const UploadVideo = useMutation({
    mutationFn: ({
      file,
      durationSeconds,
    }: {
      file: { uri: string; name: string; type: string };
      durationSeconds: number | null;
    }) => uploadMatchVideo(id, file, durationSeconds, setUploadProgress),
    onSuccess: () => {
      setUploadProgress(null);
      void QueryClient.invalidateQueries({ queryKey: ['matches', id, 'videos'] });
    },
    onError: (E) => {
      setUploadProgress(null);
      Alert.alert('Olmadı', toApiFailure(E).message);
    },
  });

  const pickVideoFile = async () => {
    // 720p H.264'e yeniden encode (iOS): tam çözünürlüklü telefon videosu yüzlerce MB
    // olabiliyor; sunucu upload limitine takılmaması için boyut kaynağında düşürülür.
    // allowsEditing + videoMaxDuration: iOS'ta 90 sn üstü videolar seçimde kırptırılır.
    const Result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 90,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    });

    if (Result.canceled) {
      return;
    }

    const Asset = Result.assets[0];
    const DurationSeconds = Asset.duration != null ? Math.round(Asset.duration / 1000) : null;

    if (DurationSeconds != null && DurationSeconds > 90) {
      Alert.alert('Video çok uzun', 'En fazla 90 saniyelik video yükleyebilirsin.');

      return;
    }

    setUploadProgress(0);
    UploadVideo.mutate({
      file: { uri: Asset.uri, name: 'video.mp4', type: Asset.mimeType ?? 'video/mp4' },
      durationSeconds: DurationSeconds,
    });
  };

  const promptAddVideo = () => {
    Alert.alert('Video ekle', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Cihazdan yükle (max 90 sn)', onPress: () => void pickVideoFile() },
      { text: 'Link yapıştır', onPress: () => setVideoModalVisible(true) },
    ]);
  };

  const [ResultModalVisible, setResultModalVisible] = useState(false);
  const [HomeScore, setHomeScore] = useState('');
  const [AwayScore, setAwayScore] = useState('');
  const [NoShowIds, setNoShowIds] = useState<string[]>([]);

  const [StatModalVisible, setStatModalVisible] = useState(false);
  const [StatTarget, setStatTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [StatGoals, setStatGoals] = useState(0);
  const [StatAssists, setStatAssists] = useState(0);

  const Stats = useQuery({
    queryKey: ['matches', id, 'player-stats'],
    queryFn: () => listPlayerStats(id),
    enabled: Match_.data?.i_am_participant === true && Match_.data.status !== 'cancelled',
  });

  const EnterResult = useMutation({
    mutationFn: () =>
      enterMatchResult(id, {
        home_score: Number(HomeScore),
        away_score: Number(AwayScore),
        no_show_user_ids: NoShowIds,
      }),
    onSuccess: () => {
      setResultModalVisible(false);
      setHomeScore('');
      setAwayScore('');
      setNoShowIds([]);
      invalidate();
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const ConfirmResult = useMutation({
    mutationFn: () => confirmMatchResult(id),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const DisputeResult = useMutation({
    mutationFn: () => disputeMatchResult(id),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const SubmitStat = useMutation({
    mutationFn: () => {
      if (StatTarget == null) {
        return Promise.reject(new Error('Oyuncu seçilmedi.'));
      }

      return submitPlayerStat(id, { user_id: StatTarget.id, goals: StatGoals, assists: StatAssists });
    },
    onSuccess: () => {
      setStatModalVisible(false);
      void QueryClient.invalidateQueries({ queryKey: ['matches', id, 'player-stats'] });
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const ApproveStat = useMutation({
    mutationFn: (StatId: string) => approvePlayerStat(StatId),
    onSuccess: () => void QueryClient.invalidateQueries({ queryKey: ['matches', id, 'player-stats'] }),
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

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

  const StartsAtMs = new Date(Data.starts_at).getTime();
  const RatingWindowOpen = Date.now() >= StartsAtMs && Date.now() <= StartsAtMs + 48 * 60 * 60 * 1000;

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

        {Data.opponent_team != null && Data.status !== 'cancelled' && (
          <>
            <Text style={styles.sectionLabel}>SKOR</Text>

            {Data.result == null ? (
              Data.i_am_captain === true ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setResultModalVisible(true)}
                  style={styles.addVideoButton}
                  hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={18} color={Palette.lime} />
                  <Text style={styles.addVideoText}>Skoru gir</Text>
                </Pressable>
              ) : (
                <Text style={styles.emptyVideoText}>Skor henüz girilmedi.</Text>
              )
            ) : (
              <View style={styles.resultCard}>
                <Text style={styles.resultScore}>
                  {Data.result.home_score} — {Data.result.away_score}
                </Text>
                <Text style={styles.resultStatus}>
                  {Data.result.status === 'pending'
                    ? 'Rakip onayı bekleniyor'
                    : Data.result.status === 'confirmed'
                      ? 'Onaylandı'
                      : 'İtiraz edildi'}
                </Text>

                {Data.result.status === 'pending' && Data.i_am_opponent_captain === true && (
                  <View style={styles.resultActions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => ConfirmResult.mutate()}
                      style={styles.resultActionButton}>
                      <Text style={styles.addVideoText}>Onayla</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        Alert.alert('Skora itiraz et', 'Rakip kaptan bu skoru itiraza açacak. Emin misin?', [
                          { text: 'Vazgeç', style: 'cancel' },
                          { text: 'İtiraz et', style: 'destructive', onPress: () => DisputeResult.mutate() },
                        ])
                      }
                      style={styles.resultActionButton}>
                      <Text style={styles.cancelText}>İtiraz et</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {Data.i_am_participant === true && Data.status !== 'cancelled' && (
          <>
            <Text style={styles.sectionLabel}>İSTATİSTİKLER</Text>
            <View style={styles.card}>
              {(Data.participants ?? []).map((Participant, Index) => {
                const Stat = (Stats.data ?? []).find((Item) => Item.player?.id === Participant.id);
                const CanEdit = Data.i_am_captain === true || Participant.is_me;

                return (
                  <Pressable
                    key={Participant.id}
                    disabled={!CanEdit}
                    onPress={() => {
                      setStatTarget({ id: Participant.id, name: Participant.name });
                      setStatGoals(Stat?.goals ?? 0);
                      setStatAssists(Stat?.assists ?? 0);
                      setStatModalVisible(true);
                    }}
                    style={[styles.participantRow, Index === 0 && styles.participantRowFirst]}>
                    <Text style={styles.participantName}>{Participant.name ?? 'İsimsiz'}</Text>
                    <View style={styles.statRowRight}>
                      <Text style={styles.statValueText}>
                        ⚽ {Stat?.goals ?? 0} · 🅰️ {Stat?.assists ?? 0}
                      </Text>
                      {Stat != null && !Stat.approved && (
                        <Text style={styles.statPending}>onay bekliyor</Text>
                      )}
                      {Stat != null && !Stat.approved && Data.i_am_captain === true && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => ApproveStat.mutate(Stat.id)}
                          hitSlop={8}>
                          <Ionicons name="checkmark-circle-outline" size={20} color={Palette.lime} />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {RatingWindowOpen && (
              <Pressable
                accessibilityRole="button"
                onPress={() => Router.push(`/match/${id}/rate`)}
                style={styles.addVideoButton}
                hitSlop={8}>
                <Ionicons name="star-outline" size={18} color={Palette.lime} />
                <Text style={styles.addVideoText}>Takım arkadaşlarını puanla</Text>
              </Pressable>
            )}
          </>
        )}

        {Data.status !== 'cancelled' && (
          <>
            <Text style={styles.sectionLabel}>VİDEOLAR</Text>

            {Videos.isPending ? (
              <ActivityIndicator color={Palette.lime} style={styles.videoSpinner} />
            ) : (Videos.data ?? []).length === 0 ? (
              <Text style={styles.emptyVideoText}>Henüz video eklenmedi.</Text>
            ) : (
              <View style={styles.videoList}>
                {(Videos.data ?? []).map((Video_) => (
                  <Pressable
                    key={Video_.id}
                    accessibilityRole="button"
                    onPress={() => {
                      if (Video_.video_url != null) {
                        setPlayingVideoUrl(Video_.video_url);
                      } else if (Video_.url != null) {
                        void WebBrowser.openBrowserAsync(Video_.url);
                      }
                    }}
                    style={styles.videoRow}>
                    <Image
                      source={Video_.thumbnail_url != null ? { uri: Video_.thumbnail_url } : VideoDefaultCover}
                      style={styles.videoThumb}
                    />
                    <Text style={styles.videoTitle} numberOfLines={1}>
                      {Video_.title ?? 'Maç videosu'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {UploadProgress != null && (
              <View style={styles.uploadProgressRow}>
                <ActivityIndicator color={Palette.lime} size="small" />
                <Text style={styles.uploadProgressText}>Video yükleniyor... %{UploadProgress}</Text>
              </View>
            )}

            {Data.i_am_participant === true && UploadProgress == null && (
              <Pressable
                accessibilityRole="button"
                onPress={promptAddVideo}
                style={styles.addVideoButton}
                hitSlop={8}>
                <Ionicons name="add-circle-outline" size={18} color={Palette.lime} />
                <Text style={styles.addVideoText}>Video ekle</Text>
              </Pressable>
            )}
          </>
        )}

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

      <Modal visible={VideoModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setVideoModalVisible(false)} />
          <GlassView style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Video ekle</Text>
            <Text style={styles.modalSub}>YouTube veya sosyalhalisaha video linkini yapıştır.</Text>

            <TextInput
              value={VideoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://..."
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.videoInput}
            />

            <Button
              label="Ekle"
              onPress={() => AddVideo.mutate()}
              disabled={VideoUrl.trim().length < 8}
              loading={AddVideo.isPending}
            />
          </GlassView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={ResultModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setResultModalVisible(false)} />
          <GlassView style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Skoru gir</Text>
            <Text style={styles.modalSub}>Rakip kaptan onaylayana (ya da 48 saat geçene) kadar bekler.</Text>

            <View style={styles.scoreRow}>
              <TextInput
                value={HomeScore}
                onChangeText={setHomeScore}
                placeholder="0"
                placeholderTextColor={Palette.moss}
                selectionColor={Palette.lime}
                keyboardType="number-pad"
                style={styles.scoreInput}
              />
              <Text style={styles.scoreDash}>—</Text>
              <TextInput
                value={AwayScore}
                onChangeText={setAwayScore}
                placeholder="0"
                placeholderTextColor={Palette.moss}
                selectionColor={Palette.lime}
                keyboardType="number-pad"
                style={styles.scoreInput}
              />
            </View>

            {(Data.participants ?? []).filter((P) => P.rsvp === 'yes').length > 0 && (
              <>
                <Text style={styles.modalSub}>Gelmeyenler var mı? (RSVP evet olup gelmeyenler)</Text>
                <View style={styles.noShowList}>
                  {(Data.participants ?? [])
                    .filter((P) => P.rsvp === 'yes')
                    .map((P) => {
                      const Selected = NoShowIds.includes(P.id);

                      return (
                        <Pressable
                          key={P.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: Selected }}
                          onPress={() =>
                            setNoShowIds((Current) =>
                              Selected ? Current.filter((Id) => Id !== P.id) : [...Current, P.id],
                            )
                          }
                          style={styles.noShowRow}>
                          <Ionicons
                            name={Selected ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={Selected ? Palette.clay : Palette.moss}
                          />
                          <Text style={styles.participantName}>{P.name ?? 'İsimsiz'}</Text>
                        </Pressable>
                      );
                    })}
                </View>
              </>
            )}

            <Button
              label="Skoru kaydet"
              onPress={() => EnterResult.mutate()}
              disabled={HomeScore.trim() === '' || AwayScore.trim() === ''}
              loading={EnterResult.isPending}
            />
          </GlassView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={StatModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setStatModalVisible(false)} />
        <GlassView style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{StatTarget?.name ?? 'Oyuncu'}</Text>
          <Text style={styles.modalSub}>Gol ve asist sayısını gir.</Text>

          <View style={styles.stepperGroup}>
            <View style={styles.stepperBlock}>
              <Text style={styles.statPending}>GOL</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStatGoals((Value) => Math.max(0, Value - 1))}
                  style={styles.stepperButton}>
                  <Text style={styles.stepperSymbol}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{StatGoals}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStatGoals((Value) => Math.min(20, Value + 1))}
                  style={styles.stepperButton}>
                  <Text style={styles.stepperSymbol}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.stepperBlock}>
              <Text style={styles.statPending}>ASİST</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStatAssists((Value) => Math.max(0, Value - 1))}
                  style={styles.stepperButton}>
                  <Text style={styles.stepperSymbol}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{StatAssists}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStatAssists((Value) => Math.min(20, Value + 1))}
                  style={styles.stepperButton}>
                  <Text style={styles.stepperSymbol}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Button label="Kaydet" onPress={() => SubmitStat.mutate()} loading={SubmitStat.isPending} />
        </GlassView>
      </Modal>

      <Modal visible={PlayingVideoUrl != null} transparent animationType="fade">
        <Pressable style={styles.playerBackdrop} onPress={() => setPlayingVideoUrl(null)} />
        <View style={styles.playerWrap} pointerEvents="box-none">
          {PlayingVideoUrl != null && <PostVideoPlayer uri={PlayingVideoUrl} />}
          <Pressable
            accessibilityRole="button"
            onPress={() => setPlayingVideoUrl(null)}
            style={styles.playerClose}
            hitSlop={8}>
            <Ionicons name="close" size={22} color={Palette.chalk} />
          </Pressable>
        </View>
      </Modal>
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
  videoSpinner: {
    marginVertical: space(2),
  },
  emptyVideoText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  videoList: {
    gap: space(2),
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(2),
  },
  videoThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.s,
    backgroundColor: Palette.turfRaised,
  },
  videoTitle: {
    flex: 1,
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  addVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginTop: space(3),
  },
  addVideoText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.lime,
  },
  playerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  playerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space(4),
  },
  playerClose: {
    position: 'absolute',
    top: space(14),
    right: space(6),
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(18,48,31,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginTop: space(3),
  },
  uploadProgressText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingHorizontal: space(5),
    paddingTop: space(3),
    paddingBottom: space(8),
    gap: space(3),
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lineFaint,
    marginBottom: space(2),
  },
  modalTitle: {
    fontFamily: Type.displaySemi,
    fontSize: 22,
    color: Palette.chalk,
  },
  modalSub: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  videoInput: {
    height: 48,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turfRaised,
    paddingHorizontal: space(4),
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
  },
  resultCard: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
    alignItems: 'center',
  },
  resultScore: {
    fontFamily: Type.mono,
    fontSize: 32,
    color: Palette.chalk,
  },
  resultStatus: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.moss,
    marginTop: space(1),
  },
  resultActions: {
    flexDirection: 'row',
    gap: space(5),
    marginTop: space(4),
  },
  resultActionButton: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
  },
  statRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
  },
  statValueText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
  },
  statPending: {
    fontFamily: Type.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Palette.moss,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(4),
  },
  scoreInput: {
    width: 64,
    height: 64,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turfRaised,
    textAlign: 'center',
    fontFamily: Type.mono,
    fontSize: 28,
    color: Palette.chalk,
  },
  scoreDash: {
    fontFamily: Type.mono,
    fontSize: 24,
    color: Palette.moss,
  },
  noShowList: {
    gap: space(2),
  },
  noShowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
  },
  stepperGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepperBlock: {
    alignItems: 'center',
    gap: space(2),
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(4),
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontFamily: Type.displaySemi,
    fontSize: 20,
    color: Palette.chalk,
  },
  stepperValue: {
    fontFamily: Type.mono,
    fontSize: 22,
    color: Palette.chalk,
    minWidth: 28,
    textAlign: 'center',
  },
});
