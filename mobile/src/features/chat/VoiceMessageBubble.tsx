import Ionicons from '@expo/vector-icons/Ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, Type, space } from '@/shared/ui/theme';

export function formatDuration(seconds: number): string {
  const Minutes = Math.floor(seconds / 60);
  const Seconds = Math.floor(seconds % 60);

  return `${Minutes}:${String(Seconds).padStart(2, '0')}`;
}

type Props = {
  uri: string;
  durationSeconds: number | null;
};

export function VoiceMessageBubble({ uri, durationSeconds }: Props) {
  const Player = useAudioPlayer(uri);
  const Status = useAudioPlayerStatus(Player);

  useEffect(() => {
    if (Status.didJustFinish) {
      void Player.seekTo(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Status.didJustFinish]);

  const Remaining =
    Status.isLoaded && Status.duration > 0
      ? Math.max(0, Status.duration - Status.currentTime)
      : (durationSeconds ?? 0);

  const togglePlayback = async () => {
    if (Status.playing) {
      Player.pause();

      return;
    }

    // iOS'ta sessiz anahtar açıkken ses varsayılan olarak KISILIR — kullanıcı
    // "oynatılmıyor" sanıyor (BACKLOG #47). Çalmadan önce moda izin verilir.
    await setAudioModeAsync({ playsInSilentMode: true });
    Player.play();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void togglePlayback()}
      style={styles.row}>
      <Ionicons name={Status.playing ? 'pause-circle' : 'play-circle'} size={32} color={Palette.lime} />
      <Text style={styles.duration}>{formatDuration(Remaining)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginTop: 2,
  },
  duration: {
    fontFamily: Type.mono,
    fontSize: 13,
    color: Palette.chalk,
  },
});
