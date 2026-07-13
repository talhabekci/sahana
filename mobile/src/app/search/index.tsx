import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PublicPlayer, searchPlayers, searchTeams, TeamSearchResult } from '@/features/social/api';
import { badgeIonicon } from '@/features/team/constants';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

type Tab = 'player' | 'team';

export default function Search() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();

  const [Query, setQuery] = useState('');
  const [ActiveTab, setActiveTab] = useState<Tab>('player');

  const Players = useQuery({
    queryKey: ['search', 'player', Query],
    queryFn: () => searchPlayers(Query),
    enabled: ActiveTab === 'player' && Query.trim().length >= 2,
  });

  const Teams = useQuery({
    queryKey: ['search', 'team', Query],
    queryFn: () => searchTeams(Query),
    enabled: ActiveTab === 'team' && Query.trim().length >= 2,
  });

  const Loading = ActiveTab === 'player' ? Players.isFetching : Teams.isFetching;
  const IsError = ActiveTab === 'player' ? Players.isError : Teams.isError;
  const TooShort = Query.trim().length < 2;

  const handleOpenPlayer = useCallback((Id: string) => Router.push(`/player/${Id}`), [Router]);
  const handleOpenTeam = useCallback((Id: string) => Router.push(`/team/${Id}`), [Router]);

  return (
    <Screen bare>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Palette.moss} />
        <TextInput
          value={Query}
          onChangeText={setQuery}
          placeholder="Oyuncu veya takım ara..."
          placeholderTextColor={Palette.moss}
          selectionColor={Palette.lime}
          autoFocus
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('player')}
          style={[styles.tabButton, ActiveTab === 'player' && styles.tabButtonActive]}>
          <Text style={[styles.tabText, ActiveTab === 'player' && styles.tabTextActive]}>Oyuncular</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('team')}
          style={[styles.tabButton, ActiveTab === 'team' && styles.tabButtonActive]}>
          <Text style={[styles.tabText, ActiveTab === 'team' && styles.tabTextActive]}>Takımlar</Text>
        </Pressable>
      </View>

      {TooShort ? (
        <View style={styles.center}>
          <Text style={styles.hintText}>Aramak için en az 2 karakter yaz.</Text>
        </View>
      ) : Loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : IsError ? (
        <ErrorState
          onRetry={() => void (ActiveTab === 'player' ? Players.refetch() : Teams.refetch())}
        />
      ) : ActiveTab === 'player' ? (
        <FlatList
          data={Players.data ?? []}
          keyExtractor={(Item) => Item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PlayerRow player={item} onPress={handleOpenPlayer} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState icon="search-outline" message="Sonuç bulunamadı." />}
        />
      ) : (
        <FlatList
          data={Teams.data ?? []}
          keyExtractor={(Item) => Item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <TeamRow team={item} onPress={handleOpenTeam} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState icon="search-outline" message="Sonuç bulunamadı." />}
        />
      )}
    </Screen>
  );
}

/** BACKLOG #63: memo — `onPress` ebeveynden SABİT referans olarak gelmeli (useCallback). */
const PlayerRow = memo(function PlayerRow({ player, onPress }: { player: PublicPlayer; onPress: (id: string) => void }) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(player.id)} style={styles.row}>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person-outline" size={18} color={Palette.moss} />
      </View>
      <View style={styles.flexShrink}>
        <Text style={styles.rowTitle}>{player.name ?? 'İsimsiz'}</Text>
        {player.profile != null && (
          <Text style={styles.rowSubtitle}>
            {[player.profile.city, player.profile.district].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

/** BACKLOG #63: memo — `onPress` ebeveynden SABİT referans olarak gelmeli (useCallback). */
const TeamRow = memo(function TeamRow({ team, onPress }: { team: TeamSearchResult; onPress: (id: string) => void }) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(team.id)} style={styles.row}>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name={badgeIonicon(team.badge_icon)} size={18} color={Palette.lime} />
      </View>
      <Text style={styles.rowTitle}>{team.name}</Text>
    </Pressable>
  );
});

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  topBar: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginHorizontal: space(6),
    marginTop: space(4),
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingHorizontal: space(4),
  },
  searchInput: {
    flex: 1,
    fontFamily: Type.body,
    fontSize: 15,
    color: Palette.chalk,
  },
  tabRow: {
    flexDirection: 'row',
    gap: space(2),
    marginHorizontal: space(6),
    marginTop: space(4),
  },
  tabButton: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  tabButtonActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  tabText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.chalk,
  },
  tabTextActive: {
    color: Palette.limeInk,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingTop: space(10),
  },
  hintText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: space(6),
    paddingTop: space(5),
    paddingBottom: space(8),
  },
  separator: {
    height: space(3),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexShrink: {
    flexShrink: 1,
  },
  rowTitle: {
    fontFamily: Type.bodyBold,
    fontSize: 15,
    color: Palette.chalk,
  },
  rowSubtitle: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
    marginTop: 2,
  },
});
