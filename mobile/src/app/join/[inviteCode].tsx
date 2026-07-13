import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { acceptInvite } from '@/features/team/api';
import { usePendingInviteStore } from '@/features/team/pendingInviteStore';
import { useAuthStore } from '@/features/auth/store';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Type, space, useTheme } from '@/shared/ui/theme';

export default function JoinInvite() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const Router = useRouter();
  const Token = useAuthStore((State) => State.token);
  const setPendingCode = usePendingInviteStore((State) => State.setCode);

  const Accept = useMutation({
    mutationFn: () => acceptInvite(inviteCode),
    onSuccess: (Team) => Router.replace(`/team/${Team.id}`),
  });

  useEffect(() => {
    if (Token == null) {
      setPendingCode(inviteCode);
      Router.replace('/(auth)/welcome');
    } else {
      Accept.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Token, inviteCode]);

  return (
    <Screen>
      <View style={styles.body}>
        {Accept.isPending && (
          <>
            <ActivityIndicator color={Palette.lime} />
            <Text style={styles.status}>Takıma katılıyorsun…</Text>
          </>
        )}

        {Accept.isError && (
          <>
            <Text style={styles.headline}>Katılamadık</Text>
            <Text style={styles.error}>{toApiFailure(Accept.error).message}</Text>
            <View style={styles.retryButton}>
              <Button label="Ana sayfaya dön" onPress={() => Router.replace('/(tabs)/teams')} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(4),
    paddingHorizontal: space(6),
  },
  status: {
    fontFamily: Type.body,
    fontSize: 15,
    color: Palette.moss,
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 32,
    color: Palette.chalk,
  },
  error: {
    fontFamily: Type.body,
    fontSize: 15,
    color: Palette.moss,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: space(4),
    alignSelf: 'stretch',
  },
});
