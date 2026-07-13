import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type ViewShot from 'react-native-view-shot';

import { getLineup, getTeam, LineupPosition, updateLineup } from '@/features/team/api';
import { PitchBoard, PitchWatermark } from '@/features/team/PitchBoard';
import { RosterSheet } from '@/features/team/RosterSheet';
import { toApiFailure } from '@/shared/api/client';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Type, space, useTheme } from '@/shared/ui/theme';

export default function LineupBoard() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id: TeamId, lid: LineupId } = useLocalSearchParams<{ id: string; lid: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();
  const ShotRef = useRef<ViewShot>(null);
  const [ActiveSlotId, setActiveSlotId] = useState<string | null>(null);
  const [Exporting, setExporting] = useState(false);

  const Team = useQuery({ queryKey: ['teams', TeamId], queryFn: () => getTeam(TeamId) });
  const Lineup = useQuery({ queryKey: ['lineups', LineupId], queryFn: () => getLineup(LineupId) });

  const [Positions, setPositions] = useState<LineupPosition[] | null>(null);
  const WorkingPositions = Positions ?? Lineup.data?.positions ?? [];

  const Save = useMutation({
    mutationFn: (Next: LineupPosition[]) =>
      updateLineup(LineupId, {
        positions: Next.map((P) => ({
          id: P.id,
          x: P.x,
          y: P.y,
          label: P.label,
          user_id: P.user_id,
          guest_name: P.guest_name,
        })),
      }),
    onSuccess: () => {
      void QueryClient.invalidateQueries({ queryKey: ['lineups', LineupId] });
    },
    onError: (E) => Alert.alert('Kaydedilemedi', toApiFailure(E).message),
  });

  const commit = (Next: LineupPosition[]) => {
    setPositions(Next);
    Save.mutate(Next);
  };

  const ActiveSlot = WorkingPositions.find((P) => P.id === ActiveSlotId) ?? null;

  const exportPng = async () => {
    if (ShotRef.current?.capture == null) {
      return;
    }

    setExporting(true);

    try {
      const Uri = await ShotRef.current.capture();
      await Sharing.shareAsync(Uri, { mimeType: 'image/png' });
    } finally {
      setExporting(false);
    }
  };

  if (Lineup.isPending || Lineup.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Geri</Text>
      </Pressable>

      <Text style={styles.headline}>{Lineup.data.name}</Text>
      <Text style={styles.sub}>Pozisyona dokun oyuncu ata, sürükleyerek yerini değiştir.</Text>

      <View style={styles.boardWrap}>
        <PitchBoard
          ref={ShotRef}
          positions={WorkingPositions}
          onPositionsChange={commit}
          onSlotPress={setActiveSlotId}
        />
        <PitchWatermark />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={exportPng}
        disabled={Exporting}
        style={styles.exportButton}>
        {Exporting ? (
          <ActivityIndicator color={Palette.limeInk} />
        ) : (
          <Text style={styles.exportLabel}>WhatsApp&apos;a paylaş</Text>
        )}
      </Pressable>

      <RosterSheet
        visible={ActiveSlot != null}
        slot={ActiveSlot}
        members={Team.data?.members ?? []}
        onAssignMember={(UserId, Name) => {
          if (ActiveSlot == null) return;
          commit(
            WorkingPositions.map((P) =>
              P.id === ActiveSlot.id ? { ...P, user_id: UserId, user_name: Name, guest_name: null } : P,
            ),
          );
          setActiveSlotId(null);
        }}
        onAssignGuest={(Name) => {
          if (ActiveSlot == null) return;
          commit(
            WorkingPositions.map((P) =>
              P.id === ActiveSlot.id ? { ...P, guest_name: Name, user_id: null, user_name: null } : P,
            ),
          );
          setActiveSlotId(null);
        }}
        onClear={() => {
          if (ActiveSlot == null) return;
          commit(
            WorkingPositions.map((P) =>
              P.id === ActiveSlot.id
                ? { ...P, user_id: null, user_name: null, guest_name: null }
                : P,
            ),
          );
          setActiveSlotId(null);
        }}
        onClose={() => setActiveSlotId(null)}
      />
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  headline: {
    fontFamily: Type.displaySemi,
    fontSize: 28,
    color: Palette.chalk,
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    marginTop: space(1),
    marginBottom: space(4),
  },
  boardWrap: {
    flex: 1,
  },
  exportButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space(4),
    marginBottom: space(6),
  },
  exportLabel: {
    fontFamily: Type.displaySemi,
    fontSize: 17,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Palette.limeInk,
  },
});
