import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LineupPosition, TeamMember } from './api';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

type Props = {
  visible: boolean;
  slot: LineupPosition | null;
  members: TeamMember[];
  onAssignMember: (userId: string, name: string) => void;
  onAssignGuest: (name: string) => void;
  onClear: () => void;
  onClose: () => void;
};

/**
 * Bir kadro pozisyonuna dokunulunca açılan atama sayfası: takım üyesi seç,
 * misafir adı yaz, ya da boşalt. Spec: "boş pozisyona takım üyesi listesinden
 * atama; üye olmayan için misafir pulu".
 */
export function RosterSheet({ visible, slot, members, onAssignMember, onAssignGuest, onClear, onClose }: Props) {
  const [GuestName, setGuestName] = useState('');

  if (slot == null) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{slot.label ?? 'Pozisyon'} — kim oynuyor?</Text>

        <FlatList
          data={members}
          keyExtractor={(Member) => Member.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => item.name != null && onAssignMember(item.id, item.name)}
              style={styles.memberRow}>
              <Text style={styles.memberName}>{item.name ?? 'İsimsiz'}</Text>
              {item.jersey_number != null && (
                <Text style={styles.memberJersey}>#{item.jersey_number}</Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Takımda başka üye yok.</Text>}
        />

        <View style={styles.guestRow}>
          <View style={styles.guestField}>
            <TextField
              label="Misafir oyuncu"
              value={GuestName}
              onChangeText={setGuestName}
              placeholder="Ör. Ahmet (misafir)"
            />
          </View>
          <Button
            label="Ekle"
            variant="ghost"
            onPress={() => {
              if (GuestName.trim() !== '') {
                onAssignGuest(GuestName.trim());
                setGuestName('');
              }
            }}
          />
        </View>

        {(slot.user_id != null || slot.guest_name != null) && (
          <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Pozisyonu boşalt</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Palette.turf,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingHorizontal: space(5),
    paddingTop: space(3),
    paddingBottom: space(8),
    maxHeight: '75%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lineFaint,
    marginBottom: space(4),
  },
  title: {
    fontFamily: Type.displaySemi,
    fontSize: 20,
    color: Palette.chalk,
    marginBottom: space(3),
  },
  list: {
    maxHeight: 260,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineFaint,
  },
  memberName: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  memberJersey: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: Palette.moss,
  },
  empty: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    paddingVertical: space(4),
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space(3),
    marginTop: space(4),
  },
  guestField: {
    flex: 1,
  },
  clearButton: {
    marginTop: space(4),
    alignItems: 'center',
  },
  clearText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.clay,
  },
});
