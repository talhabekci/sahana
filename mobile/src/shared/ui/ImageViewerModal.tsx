import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Modal, Pressable, StyleSheet } from 'react-native';

import { saveToDevice } from '@/shared/media/saveToDevice';
import { Radius, space, useTheme } from '@/shared/ui/theme';

type Props = {
  /** null iken modal kapalı — bir görsele dokununca uri set edilir. */
  uri: string | null;
  onClose: () => void;
};

/** Tam ekran görsel görüntüleyici (BACKLOG #71/#75) + cihaza kaydet (#74). */
export function ImageViewerModal({ uri, onClose }: Props) {
  const Palette = useTheme();
  const styles = createStyles();

  return (
    <Modal visible={uri != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri != null && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}
        {uri != null && (
          <Pressable
            accessibilityRole="button"
            onPress={() => void saveToDevice(uri)}
            style={[styles.saveButton, { backgroundColor: Palette.lime }]}
            hitSlop={8}>
            <Ionicons name="download-outline" size={22} color={Palette.limeInk} />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

function createStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.95)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    saveButton: {
      position: 'absolute',
      bottom: space(10),
      alignSelf: 'center',
      borderRadius: Radius.pill,
      padding: space(3),
    },
  });
}
