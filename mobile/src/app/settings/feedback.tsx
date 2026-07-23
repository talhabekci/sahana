import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FeedbackImage, FeedbackType, submitFeedback } from '@/features/settings/api';
import { toApiFailure } from '@/shared/api/client';
import { ensureJpeg } from '@/shared/media/ensureJpeg';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const TYPE_OPTIONS: { key: FeedbackType; label: string }[] = [
  { key: 'bug', label: 'Hata bildir' },
  { key: 'suggestion', label: 'Öneri gönder' },
];

/** BACKLOG #85 — Ayarlar'dan hata/öneri gönderme. */
export default function Feedback() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const [SelectedType, setSelectedType] = useState<FeedbackType>('bug');
  const [Message, setMessage] = useState('');
  const [PendingImage, setPendingImage] = useState<FeedbackImage | null>(null);
  const [Converting, setConverting] = useState(false);

  const Submit = useMutation({
    mutationFn: () => submitFeedback(SelectedType, Message.trim(), PendingImage),
    onSuccess: () => {
      Alert.alert('Teşekkürler', 'Geri bildirimin bize ulaştı.', [
        { text: 'Tamam', onPress: () => Router.back() },
      ]);
    },
    onError: (E) => Alert.alert('Gönderilemedi', toApiFailure(E).message),
  });

  const CanSubmit = Message.trim().length > 0 && !Submit.isPending;

  // ensureJpeg (mesajlarda da kullanılan aynı yardımcı) görseli yeniden
  // JPEG'e encode ediyor; asıl EXIF/GPS temizliği ve gerçek-içerik
  // doğrulaması sunucudaki ImageUploader::store()'da yapılıyor.
  async function attachImage(Asset: ImagePicker.ImagePickerAsset) {
    setConverting(true);

    try {
      setPendingImage(await ensureJpeg(Asset.uri, { width: Asset.width, height: Asset.height }));
    } catch {
      Alert.alert('Olmadı', 'Görsel işlenemedi, başka bir ekran görüntüsü dene.');
    } finally {
      setConverting(false);
    }
  }

  const pickScreenshot = async () => {
    const Result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!Result.canceled) {
      await attachImage(Result.assets[0]);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        <Text style={styles.headline}>GERİ BİLDİRİM</Text>
        <Text style={styles.sub}>
          Bir hatayla mı karşılaştın, yoksa bir önerin mi var? Bize yaz, okuyoruz.
        </Text>

        <View style={styles.segmentRow}>
          {TYPE_OPTIONS.map((Option) => {
            const Active = SelectedType === Option.key;

            return (
              <Pressable
                key={Option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: Active }}
                onPress={() => setSelectedType(Option.key)}
                style={[styles.segment, Active && styles.segmentActive]}>
                <Text style={[styles.segmentText, Active && styles.segmentTextActive]}>
                  {Option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={Message}
          onChangeText={setMessage}
          placeholder={
            SelectedType === 'bug'
              ? 'Ne oldu, hangi ekrandaydın, ne bekliyordun?'
              : 'Aklındaki fikri anlat...'
          }
          placeholderTextColor={Palette.moss}
          selectionColor={Palette.lime}
          style={styles.input}
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />

        {PendingImage != null ? (
          <View style={styles.attachmentRow}>
            <Image source={{ uri: PendingImage.uri }} style={styles.attachmentPreview} />
            <Pressable
              accessibilityRole="button"
              onPress={() => setPendingImage(null)}
              style={styles.attachmentRemove}
              hitSlop={8}>
              <Ionicons name="close" size={16} color={Palette.chalk} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => void pickScreenshot()}
            disabled={Converting}
            style={styles.attachButton}>
            {Converting ? (
              <ActivityIndicator color={Palette.moss} size="small" />
            ) : (
              <Ionicons name="image-outline" size={18} color={Palette.moss} />
            )}
            <Text style={styles.attachButtonText}>Ekran görüntüsü ekle</Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          <Button label="Gönder" onPress={() => Submit.mutate()} disabled={!CanSubmit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  flex: {
    flex: 1,
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
    marginTop: space(4),
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.moss,
    marginTop: space(2),
  },
  segmentRow: {
    flexDirection: 'row',
    gap: space(2),
    marginTop: space(6),
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space(3),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  segmentActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  segmentText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  segmentTextActive: {
    color: Palette.limeInk,
  },
  input: {
    flex: 1,
    marginTop: space(6),
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    padding: space(4),
    fontFamily: Type.body,
    fontSize: 15,
    color: Palette.chalk,
    minHeight: 160,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginTop: space(3),
    paddingVertical: space(2),
  },
  attachButtonText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space(3),
  },
  attachmentPreview: {
    width: 64,
    height: 64,
    borderRadius: Radius.m,
    backgroundColor: Palette.turfRaised,
  },
  attachmentRemove: {
    marginLeft: space(2),
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: space(6),
  },
});
