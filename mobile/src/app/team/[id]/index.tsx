import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getMe } from '@/features/auth/api';
import {
  createLineup,
  getTeam,
  LineupPosition,
  listLineups,
  removeMember,
  TeamMember,
  transferCaptaincy,
} from '@/features/team/api';
import { badgeIonicon, FORMATION_PRESETS } from '@/features/team/constants';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

const MIN_CUSTOM_SLOTS = 3;
const MAX_CUSTOM_SLOTS = 14;

/** "Özel" kadro: preset'e bağlı kalmadan N puku sahaya ızgara halinde diziyor
 * — kullanıcı sonra sürükleyerek serbestçe konumlandırır (bkz. BACKLOG.md #1). */
function generateCustomSlots(Count: number): Pick<LineupPosition, 'id' | 'x' | 'y' | 'label'>[] {
  const PerRow = 4;
  const Rows = Math.ceil(Count / PerRow);
  const Slots: Pick<LineupPosition, 'id' | 'x' | 'y' | 'label'>[] = [];
  let Placed = 0;

  for (let Row = 0; Row < Rows; Row++) {
    const ItemsInRow = Math.min(PerRow, Count - Row * PerRow);
    const Y = Rows === 1 ? 0.5 : 0.85 - Row * (0.7 / (Rows - 1));

    for (let Col = 0; Col < ItemsInRow; Col++) {
      Placed += 1;
      Slots.push({
        id: `p${Placed}`,
        x: (Col + 1) / (ItemsInRow + 1),
        y: Y,
        label: String(Placed),
      });
    }
  }

  return Slots;
}

export default function TeamDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Team = useQuery({ queryKey: ['teams', id], queryFn: () => getTeam(id) });
  const Me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const Lineups = useQuery({ queryKey: ['teams', id, 'lineups'], queryFn: () => listLineups(id) });

  const invalidate = () => {
    void QueryClient.invalidateQueries({ queryKey: ['teams'] });
  };

  const RemoveMember = useMutation({
    mutationFn: (UserId: string) => removeMember(id, UserId),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const TransferCaptaincy_ = useMutation({
    mutationFn: (UserId: string) => transferCaptaincy(id, UserId),
    onSuccess: invalidate,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const [CustomModalVisible, setCustomModalVisible] = useState(false);
  const [CustomCount, setCustomCount] = useState(7);

  const onLineupCreated = (Lineup: { id: string }) => {
    void QueryClient.invalidateQueries({ queryKey: ['teams', id, 'lineups'] });
    Router.push(`/team/${id}/lineup/${Lineup.id}`);
  };

  const CreateLineup_ = useMutation({
    mutationFn: (Size: keyof typeof FORMATION_PRESETS) => {
      const Preset = FORMATION_PRESETS[Size];

      return createLineup(id, {
        name: `${Preset.label} Kadrosu`,
        formation: Preset.label,
        positions: Preset.slots,
      });
    },
    onSuccess: onLineupCreated,
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const CreateCustomLineup = useMutation({
    mutationFn: (Count: number) =>
      createLineup(id, {
        name: `Özel Kadro (${Count} kişi)`,
        formation: null,
        positions: generateCustomSlots(Count),
      }),
    onSuccess: (Lineup) => {
      setCustomModalVisible(false);
      onLineupCreated(Lineup);
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  if (Team.isPending || Team.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Team.data;
  const IAmCaptain = Data.my_role === 'captain';
  const MyPublicId = Me.data?.id;

  const promptMemberActions = (Member: TeamMember) => {
    if (!IAmCaptain || Member.id === MyPublicId) {
      return;
    }

    Alert.alert(Member.name ?? 'Oyuncu', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaptanlığı devret',
        onPress: () => TransferCaptaincy_.mutate(Member.id),
      },
      {
        text: 'Takımdan çıkar',
        style: 'destructive',
        onPress: () => RemoveMember.mutate(Member.id),
      },
    ]);
  };

  const promptNewLineup = () => {
    Alert.alert('Kaç kişilik?', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      ...Object.entries(FORMATION_PRESETS).map(([Size, Preset]) => ({
        text: Preset.label,
        onPress: () => CreateLineup_.mutate(Size as keyof typeof FORMATION_PRESETS),
      })),
      { text: 'Özel…', onPress: () => setCustomModalVisible(true) },
    ]);
  };

  const leaveTeam = () => {
    if (MyPublicId == null) {
      return;
    }

    if (IAmCaptain) {
      Alert.alert(
        'Önce kaptanlığı devret',
        'Kaptan takımdan ayrılamaz. Bir üyeye kaptanlığı devrettikten sonra ayrılabilirsin.',
      );

      return;
    }

    Alert.alert('Takımdan ayrıl', `${Data.name} takımından ayrılmak istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: () => {
          RemoveMember.mutate(MyPublicId, {
            onSuccess: () => Router.replace('/(tabs)/teams'),
          });
        },
      },
    ]);
  };

  return (
    <Screen pitch pitchY={-220}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: Data.color_home }]}>
            <Ionicons name={badgeIonicon(Data.badge_icon)} size={30} color={Palette.limeInk} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.name}>{Data.name}</Text>
            <Text style={styles.meta}>{Data.members_count} üye</Text>
          </View>
        </View>

        <View style={styles.inviteRow}>
          <Button label="Takım sohbeti" onPress={() => Router.push(`/team/${id}/chat`)} />
        </View>

        {IAmCaptain && (
          <View style={styles.inviteRow}>
            <Button label="Arkadaş davet et" onPress={() => Router.push(`/team/${id}/invite`)} />
          </View>
        )}

        <Text style={styles.sectionTitle}>ÜYELER</Text>
        <View style={styles.card}>
          {Data.members.map((Member, Index) => (
            <Pressable
              key={Member.id}
              onLongPress={() => promptMemberActions(Member)}
              style={[styles.memberRow, Index === 0 && styles.memberRowFirst]}>
              <Text style={styles.memberName}>{Member.name ?? 'İsimsiz'}</Text>
              <Text style={styles.memberRole}>
                {Member.role === 'captain' ? 'Kaptan' : 'Üye'}
                {Member.jersey_number != null ? ` · #${Member.jersey_number}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.lineupHeader}>
          <Text style={styles.sectionTitle}>KADROLAR</Text>
          <Pressable accessibilityRole="button" onPress={promptNewLineup} hitSlop={8}>
            <Text style={styles.newLineup}>+ Yeni kadro</Text>
          </Pressable>
        </View>

        {Lineups.data == null || Lineups.data.length === 0 ? (
          <Text style={styles.emptyLineups}>Henüz kadro yok.</Text>
        ) : (
          <View style={styles.card}>
            {Lineups.data.map((Lineup, Index) => (
              <Pressable
                key={Lineup.id}
                onPress={() => Router.push(`/team/${id}/lineup/${Lineup.id}`)}
                style={[styles.memberRow, Index === 0 && styles.memberRowFirst]}>
                <Text style={styles.memberName}>{Lineup.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={Palette.moss} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Button label="Takımdan ayrıl" variant="ghost" onPress={leaveTeam} />
        </View>
      </ScrollView>

      <Modal visible={CustomModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setCustomModalVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Özel kadro</Text>
          <Text style={styles.modalSub}>Kaç puk yerleştirmek istiyorsun? Sahada serbestçe dizersin.</Text>

          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCustomCount(Math.max(MIN_CUSTOM_SLOTS, CustomCount - 1))}
              style={styles.stepperButton}>
              <Text style={styles.stepperSymbol}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{CustomCount}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCustomCount(Math.min(MAX_CUSTOM_SLOTS, CustomCount + 1))}
              style={styles.stepperButton}>
              <Text style={styles.stepperSymbol}>+</Text>
            </Pressable>
          </View>

          <Button
            label="Kadroyu oluştur"
            onPress={() => CreateCustomLineup.mutate(CustomCount)}
            loading={CreateCustomLineup.isPending}
          />
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
  },
  flexShrink: {
    flexShrink: 1,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: Type.display,
    fontSize: 30,
    color: Palette.chalk,
  },
  meta: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  inviteRow: {
    marginTop: space(5),
  },
  sectionTitle: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(8),
    marginBottom: space(2),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    paddingHorizontal: space(4),
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  memberRowFirst: {
    borderTopWidth: 0,
  },
  memberName: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.chalk,
  },
  memberRole: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
  },
  lineupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newLineup: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.lime,
  },
  emptyLineups: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  footer: {
    marginTop: space(10),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: Palette.turf,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingHorizontal: space(5),
    paddingTop: space(3),
    paddingBottom: space(8),
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lineFaint,
    marginBottom: space(4),
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
    marginTop: space(1),
    marginBottom: space(5),
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(5),
    marginBottom: space(6),
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.m,
    backgroundColor: Palette.turfRaised,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontFamily: Type.mono,
    fontSize: 22,
    color: Palette.chalk,
  },
  stepperValue: {
    fontFamily: Type.mono,
    fontSize: 32,
    color: Palette.lime,
    minWidth: 48,
    textAlign: 'center',
  },
});
