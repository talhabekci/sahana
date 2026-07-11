import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChatMessage, SendMessagePayload } from '@/features/chat/api';
import { MAX_VOICE_MESSAGE_SECONDS, useVoiceRecorder } from '@/features/chat/useVoiceRecorder';
import { formatDuration, VoiceMessageBubble } from '@/features/chat/VoiceMessageBubble';
import { ensureJpeg } from '@/shared/media/ensureJpeg';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

type Props = {
  title: string;
  messages: ChatMessage[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEndReached: () => void;
  sending: boolean;
  onSend: (payload: SendMessagePayload) => void;
  /** Verilirse mesajlar benim/karşı taraf olarak hizalanır (DM). */
  myUserId?: string | null;
  /** Takım sohbetinde balon üstünde yazar adı gösterilir. */
  showAuthorName?: boolean;
  /** match_ref/lineup_ref balonlarının rotaları için (sadece takım sohbeti). */
  teamId?: string;
};

/**
 * Takım sohbeti ve DM'in ortak gövdesi (BACKLOG #39): mesaj listesi +
 * metin/fotoğraf(galeri+kamera)/sesli mesaj composer'ı. Veri katmanı
 * (query, mutation, WS aboneliği) ekranlarda kalır — bu component salt UI.
 */
export function ChatConversation({
  title,
  messages,
  loading,
  error,
  onRetry,
  onEndReached,
  sending,
  onSend,
  myUserId,
  showAuthorName = false,
  teamId,
}: Props) {
  const Router = useRouter();
  const [Body, setBody] = useState('');
  const [Converting, setConverting] = useState(false);
  const Voice = useVoiceRecorder();

  function submit() {
    const Trimmed = Body.trim();

    if (Trimmed.length < 1 || sending) {
      return;
    }

    setBody('');
    onSend({ type: 'text', body: Trimmed });
  }

  async function attachAndSendImage(Asset: ImagePicker.ImagePickerAsset) {
    setConverting(true);

    try {
      const File = await ensureJpeg(Asset.uri, { width: Asset.width, height: Asset.height });
      onSend({ type: 'image', image: File });
    } catch {
      Alert.alert('Olmadı', 'Görsel işlenemedi, başka bir fotoğraf dene.');
    } finally {
      setConverting(false);
    }
  }

  const pickFromLibrary = async () => {
    const Result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!Result.canceled) {
      await attachAndSendImage(Result.assets[0]);
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
      await attachAndSendImage(Result.assets[0]);
    }
  };

  const promptPickImage = () => {
    Alert.alert('Fotoğraf ekle', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kamerayla çek', onPress: () => void takePhoto() },
      { text: 'Galeriden seç', onPress: () => void pickFromLibrary() },
    ]);
  };

  const startRecording = async () => {
    const Ok = await Voice.start();

    if (!Ok) {
      Alert.alert('İzin gerekli', 'Sesli mesaj göndermek için mikrofon izni vermen gerekiyor.');
    }
  };

  const stopAndSend = async () => {
    const Result = await Voice.stop();

    if (Result != null) {
      onSend({
        type: 'audio',
        audio: { uri: Result.uri, name: 'voice.m4a', type: 'audio/m4a' },
        audio_duration: Result.durationSeconds,
      });
    }
  };

  const stopAndDiscard = async () => {
    await Voice.stop();
  };

  useEffect(() => {
    if (Voice.isRecording && Voice.durationSeconds >= MAX_VOICE_MESSAGE_SECONDS) {
      void stopAndSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Voice.isRecording, Voice.durationSeconds]);

  function renderContent(Item: ChatMessage, IsMine: boolean) {
    if (Item.type === 'image') {
      return Item.image_path != null ? (
        <Image source={{ uri: Item.image_path }} style={styles.messageImage} />
      ) : (
        <Text style={[styles.refText, IsMine && styles.textMine]}>🖼️ Görsel</Text>
      );
    }

    if (Item.type === 'audio') {
      return Item.audio_path != null ? (
        <VoiceMessageBubble uri={Item.audio_path} durationSeconds={Item.audio_duration} />
      ) : (
        <Text style={[styles.refText, IsMine && styles.textMine]}>🎤 Sesli mesaj</Text>
      );
    }

    if (Item.type === 'match_ref') {
      return (
        <Pressable onPress={() => Router.push(`/match/${Item.match_id}`)}>
          <Text style={styles.refText}>⚽ Maç paylaşıldı</Text>
        </Pressable>
      );
    }

    if (Item.type === 'lineup_ref') {
      return (
        <Pressable onPress={() => Router.push(`/team/${teamId}/lineup/${Item.lineup_id}`)}>
          <Text style={styles.refText}>📋 Kadro paylaşıldı</Text>
        </Pressable>
      );
    }

    return <Text style={[styles.bubbleBody, IsMine && styles.textMine]}>{Item.body}</Text>;
  }

  return (
    <Screen bare>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.backSpacer} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.lime} />
          </View>
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(Item) => Item.id}
            inverted
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.4}
            onEndReached={onEndReached}
            renderItem={({ item }) => {
              const IsMine = myUserId != null && item.author?.id === myUserId;
              // Medya balonları (görsel/ses) hizalama dışında her zaman koyu
              // yüzeyde kalır — lime zemin üstünde oynatıcı/foto okunmuyor.
              const MediaBubble = item.type === 'image' || item.type === 'audio';

              return (
                <View style={styles.messageRow}>
                  <View
                    style={[
                      styles.bubble,
                      IsMine && !MediaBubble ? styles.bubbleMine : styles.bubbleTheirs,
                      IsMine && styles.alignMine,
                    ]}>
                    {showAuthorName && (
                      <Text style={styles.bubbleAuthor}>{item.author?.name ?? 'İsimsiz'}</Text>
                    )}
                    {renderContent(item, IsMine && !MediaBubble)}
                    <Text style={[styles.bubbleWhen, IsMine && !MediaBubble && styles.textMine]}>
                      {formatWhen(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-ellipses-outline"
                message="Henüz mesaj yok. İlk mesajı sen yaz."
                style={styles.emptyFlip}
              />
            }
          />
        )}

        <View style={styles.composer}>
          {Voice.isRecording ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => void stopAndDiscard()}
                style={styles.attachButton}
                hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={Palette.clay} />
              </Pressable>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>{formatDuration(Voice.durationSeconds)}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => void stopAndSend()}
                style={styles.sendButton}
                hitSlop={8}>
                <Ionicons name="checkmark" size={20} color={Palette.limeInk} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={promptPickImage}
                disabled={Converting}
                style={styles.attachButton}
                hitSlop={8}>
                {Converting ? (
                  <ActivityIndicator color={Palette.moss} size="small" />
                ) : (
                  <Ionicons name="image-outline" size={22} color={Palette.moss} />
                )}
              </Pressable>
              <TextInput
                value={Body}
                onChangeText={setBody}
                placeholder="Mesaj yaz..."
                placeholderTextColor={Palette.moss}
                selectionColor={Palette.lime}
                style={styles.input}
                multiline
              />
              {Body.trim().length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={sending}
                  onPress={submit}
                  style={[styles.sendButton, sending && styles.sendButtonDisabled]}>
                  <Ionicons name="arrow-up" size={18} color={Palette.limeInk} />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void startRecording()}
                  style={styles.sendButton}
                  hitSlop={8}>
                  <Ionicons name="mic-outline" size={20} color={Palette.limeInk} />
                </Pressable>
              )}
            </>
          )}
        </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(3),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  backSpacer: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.lime,
  },
  list: {
    paddingHorizontal: space(6),
    paddingVertical: space(3),
    gap: space(2),
  },
  messageRow: {
    marginVertical: space(1),
  },
  bubble: {
    borderRadius: Radius.l,
    borderWidth: 1,
    padding: space(3),
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  bubbleMine: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  bubbleTheirs: {
    backgroundColor: Palette.turf,
    borderColor: Palette.lineFaint,
  },
  alignMine: {
    alignSelf: 'flex-end',
  },
  bubbleAuthor: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.lime,
  },
  bubbleBody: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 21,
    color: Palette.chalk,
    marginTop: 2,
  },
  refText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
    marginTop: 2,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: Radius.m,
    backgroundColor: Palette.turfRaised,
    marginTop: 2,
  },
  bubbleWhen: {
    fontFamily: Type.mono,
    fontSize: 10,
    color: Palette.moss,
    marginTop: space(1),
  },
  textMine: {
    color: Palette.limeInk,
  },
  emptyFlip: {
    transform: [{ scaleY: -1 }],
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space(2),
    paddingHorizontal: space(6),
    paddingVertical: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingHorizontal: space(4),
    paddingVertical: space(2),
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
  },
  attachButton: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    height: 44,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingHorizontal: space(4),
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: Palette.clay,
  },
  recordingTime: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: Palette.chalk,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
