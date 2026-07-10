import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { listTeams, Team } from '@/features/team/api';
import { badgeIonicon } from '@/features/team/constants';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

function TeamRow({ team, onPress }: { team: Team; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {team.logo_url != null ? (
        <Image source={{ uri: team.logo_url }} style={styles.badge} />
      ) : (
        <View style={[styles.badge, { backgroundColor: team.color_home }]}>
          <Ionicons name={badgeIonicon(team.badge_icon)} size={22} color={Palette.limeInk} />
        </View>
      )}

      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{team.name}</Text>
        <Text style={styles.rowMeta}>
          {team.members_count} üye{team.my_role === 'captain' ? ' · Kaptan' : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={Palette.moss} />
    </Pressable>
  );
}

export default function Teams() {
  const Router = useRouter();
  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });

  return (
    <Screen pitch pitchY={-140}>
      <View style={styles.header}>
        <Text style={styles.kicker}>TAKIMLARIM</Text>
        <Text style={styles.headline}>Kadron burada</Text>
      </View>

      {Teams.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : Teams.isError ? (
        <ErrorState onRetry={() => void Teams.refetch()} />
      ) : (
        <FlatList
          data={Teams.data}
          keyExtractor={(Team_) => Team_.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TeamRow team={item} onPress={() => Router.push(`/team/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              message="Henüz bir takımın yok. Kur ve arkadaşlarını davet et."
            />
          }
        />
      )}

      <View style={styles.footer}>
        <Button label="Takım kur" onPress={() => Router.push('/team/create')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: space(4),
    marginBottom: space(5),
  },
  kicker: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 5,
    color: Palette.lime,
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 34,
    color: Palette.chalk,
    marginTop: space(1),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: space(6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingVertical: space(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.lineFaint,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontFamily: Type.displaySemi,
    fontSize: 19,
    color: Palette.chalk,
  },
  rowMeta: {
    fontFamily: Type.body,
    fontSize: 13,
    color: Palette.moss,
    marginTop: 2,
  },
  footer: {
    paddingBottom: space(6),
    paddingTop: space(3),
  },
});
