import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { PaletteTokens, Radius, space, useTheme } from '@/shared/ui/theme';

type Props = {
  uri: string;
};

/**
 * Gönderiye yüklenen videonun (BACKLOG #37) akış içi oynatıcısı —
 * otomatik oynatma yok, ses/oynatma kontrolü native player'da.
 */
export function PostVideoPlayer({ uri }: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Player = useVideoPlayer(uri, (Instance) => {
    Instance.loop = false;
  });

  return <VideoView player={Player} style={styles.video} nativeControls contentFit="cover" />;
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  video: {
    width: '100%',
    height: 220,
    borderRadius: Radius.m,
    backgroundColor: Palette.turfRaised,
    marginTop: space(3),
  },
});
