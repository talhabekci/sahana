import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPost } from '@/features/social/api';
import { useMentionAutocomplete } from '@/features/social/useMentionAutocomplete';
import { listLineups, listTeams } from '@/features/team/api';
import { toApiFailure } from '@/shared/api/client';
import { ensureJpeg } from '@/shared/media/ensureJpeg';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

export default function CreatePost() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });

  const [Body, setBody] = useState('');
  const [TeamId, setTeamId] = useState<string | null>(null);
  const [LineupId, setLineupId] = useState<string | null>(null);
  const [Image_, setImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [Video_, setVideo] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [Converting, setConverting] = useState(false);
  const [UploadProgress, setUploadProgress] = useState<number | null>(null);
  const [Error_, setError] = useState<string | null>(null);

  const Mentions = useMentionAutocomplete(Body, setBody);

  const Lineups = useQuery({
    queryKey: ['teams', TeamId, 'lineups'],
    queryFn: () => listLineups(TeamId ?? ''),
    enabled: TeamId != null,
  });

  const convertAndSetImage = async (Asset: ImagePicker.ImagePickerAsset) => {
    setConverting(true);

    try {
      setImage(await ensureJpeg(Asset.uri, { width: Asset.width, height: Asset.height }));
      setVideo(null);
    } catch {
      Alert.alert('Olmadı', 'Görsel işlenemedi, başka bir fotoğraf dene.');
    } finally {
      setConverting(false);
    }
  };

  const pickVideo = async () => {
    // Maç videosuyla aynı sınırlar (BACKLOG #37): 720p re-encode + 90 sn kırpma.
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

    setVideo({ uri: Asset.uri, name: 'video.mp4', type: Asset.mimeType ?? 'video/mp4' });
    setImage(null);
  };

  const pickFromLibrary = async () => {
    const Result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!Result.canceled) {
      await convertAndSetImage(Result.assets[0]);
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
      await convertAndSetImage(Result.assets[0]);
    }
  };

  const promptPickImage = () => {
    Alert.alert('Medya ekle', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kamerayla çek', onPress: () => void takePhoto() },
      { text: 'Galeriden fotoğraf', onPress: () => void pickFromLibrary() },
      { text: 'Galeriden video (max 90 sn)', onPress: () => void pickVideo() },
    ]);
  };

  const Create = useMutation({
    mutationFn: () =>
      createPost(
        {
          body: Body.trim(),
          team_id: TeamId,
          lineup_id: LineupId,
          image: Image_,
          video: Video_,
          mentioned_user_ids: Mentions.resolveMentionedUserIds(Body),
        },
        Video_ != null ? setUploadProgress : undefined,
      ),
    onSuccess: () => {
      setUploadProgress(null);
      void QueryClient.invalidateQueries({ queryKey: ['feed'] });
      Router.back();
    },
    onError: (E) => {
      setUploadProgress(null);
      setError(toApiFailure(E).message);
    },
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>

          <Text style={styles.headline}>GÖNDERİ PAYLAŞ</Text>

          <View style={styles.field}>
            <TextInput
              value={Body}
              onChangeText={(Value) => {
                Mentions.onChangeText(Value);
                setError(null);
              }}
              onSelectionChange={Mentions.onSelectionChange}
              placeholder="Ne oldu? @ ile birini etiketleyebilirsin"
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
              autoFocus
              style={styles.textArea}
            />
            <Text style={styles.charCount}>{Body.length}/500</Text>

            {Mentions.Suggestions.length > 0 && (
              <View style={styles.mentionList}>
                {Mentions.Suggestions.map((Player) => (
                  <Pressable
                    key={Player.id}
                    accessibilityRole="button"
                    onPress={() => Mentions.selectSuggestion(Player)}
                    style={styles.mentionRow}>
                    <Avatar uri={Player.avatar_path} name={Player.name} size={28} />
                    <Text style={styles.mentionName}>{Player.name ?? 'İsimsiz'}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {(Teams.data ?? []).length > 0 && (
            <>
              <Text style={styles.sectionLabel}>TAKIMA ETİKETLE (opsiyonel)</Text>
              <View style={styles.chipWrap}>
                {(Teams.data ?? []).map((Team) => {
                  const Active = TeamId === Team.id;

                  return (
                    <Pressable
                      key={Team.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: Active }}
                      onPress={() => {
                        setTeamId(Active ? null : Team.id);
                        setLineupId(null);
                      }}
                      style={[styles.chip, Active && styles.chipActive]}>
                      <Text style={[styles.chipText, Active && styles.chipTextActive]}>
                        {Team.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>FOTOĞRAF / VİDEO (opsiyonel)</Text>
          {Image_ != null ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: Image_.uri }} style={styles.photoPreview} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setImage(null)}
                style={styles.photoRemove}
                hitSlop={8}>
                <Ionicons name="close" size={16} color={Palette.chalk} />
              </Pressable>
            </View>
          ) : Video_ != null ? (
            <View style={styles.videoSelectedRow}>
              <Ionicons name="videocam" size={20} color={Palette.lime} />
              <Text style={styles.videoSelectedText}>Video seçildi</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setVideo(null)}
                hitSlop={8}
                style={styles.videoRemove}>
                <Ionicons name="close" size={16} color={Palette.chalk} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={promptPickImage}
              disabled={Converting}
              style={styles.photoPicker}>
              {Converting ? (
                <ActivityIndicator color={Palette.moss} size="small" />
              ) : (
                <Ionicons name="image-outline" size={20} color={Palette.moss} />
              )}
              <Text style={styles.photoPickerText}>
                {Converting ? 'İşleniyor...' : 'Fotoğraf ya da video ekle'}
              </Text>
            </Pressable>
          )}

          {TeamId != null && (Lineups.data ?? []).length > 0 && (
            <>
              <Text style={styles.sectionLabel}>KADRO EKLE (opsiyonel)</Text>
              <View style={styles.chipWrap}>
                {(Lineups.data ?? []).map((Lineup_) => {
                  const Active = LineupId === Lineup_.id;

                  return (
                    <Pressable
                      key={Lineup_.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: Active }}
                      onPress={() => setLineupId(Active ? null : Lineup_.id)}
                      style={[styles.chip, Active && styles.chipActive]}>
                      <Text style={[styles.chipText, Active && styles.chipTextActive]}>
                        {Lineup_.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

          {UploadProgress != null && Create.isPending && (
            <Text style={styles.progressText}>Video yükleniyor... %{UploadProgress}</Text>
          )}

          <View style={styles.footer}>
            <Button
              label="Paylaş"
              onPress={() => Create.mutate()}
              disabled={Body.trim().length < 2}
              loading={Create.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  photoPicker: {
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
  photoPickerText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  photoPreviewWrap: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: Radius.m,
    backgroundColor: Palette.turf,
  },
  photoRemove: {
    position: 'absolute',
    top: space(2),
    right: space(2),
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(11,26,15,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingVertical: space(3),
    paddingHorizontal: space(4),
  },
  videoSelectedText: {
    flex: 1,
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  videoRemove: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(3),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 36,
    color: Palette.chalk,
    marginBottom: space(4),
  },
  field: {
    marginBottom: space(2),
  },
  textArea: {
    minHeight: 140,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    padding: space(4),
    fontFamily: Type.body,
    fontSize: 16,
    lineHeight: 22,
    color: Palette.chalk,
  },
  mentionList: {
    marginTop: space(2),
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    overflow: 'hidden',
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    padding: space(3),
  },
  mentionName: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  charCount: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: Palette.moss,
    textAlign: 'right',
    marginTop: space(1),
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
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginTop: space(4),
  },
  footer: {
    paddingVertical: space(6),
  },
});
