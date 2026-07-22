import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { generateInvite, getTeam } from '@/features/team/api';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

export default function TeamInvite() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const Team = useQuery({ queryKey: ['teams', id], queryFn: () => getTeam(id) });
  const [Copied, setCopied] = useState(false);

  const Invite = useMutation({ mutationFn: () => generateInvite(id) });

  useEffect(() => {
    Invite.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Universal Links (iOS)/App Links (Android) — BACKLOG #81: uygulama
  // yüklüyse bu HTTPS linki doğrudan uygulamayı açar, değilse
  // api/routes/web.php'deki /join/{code} mağaza yönlendirme sayfasına düşer.
  const InviteUrl = Invite.data != null ? `https://sahana-app.com/join/${Invite.data.code}` : null;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Geri</Text>
      </Pressable>

      <Text style={styles.headline}>DAVET ET</Text>
      <Text style={styles.sub}>
        {Team.data?.name ?? 'Takımın'} için linki paylaş ya da QR kodu okuttur.
      </Text>

      <View style={styles.body}>
        {Invite.isPending && <ActivityIndicator color={Palette.lime} />}

        {Invite.isError && (
          <Text style={styles.error}>{toApiFailure(Invite.error).message}</Text>
        )}

        {InviteUrl != null && Invite.data != null && (
          <>
            <View style={styles.qrCard}>
              <QRCode value={InviteUrl} size={220} backgroundColor={Palette.chalk} color={Palette.pitchNight} />
            </View>

            <Text style={styles.code}>{Invite.data.code}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                await Clipboard.setStringAsync(InviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              hitSlop={8}>
              <Text style={styles.copyLink}>{Copied ? 'Kopyalandı ✓' : 'Linki kopyala'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          label="Paylaş"
          onPress={() => InviteUrl != null && Share.share({ message: InviteUrl })}
          disabled={InviteUrl == null}
        />
      </View>
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 40,
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
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(4),
  },
  qrCard: {
    padding: space(4),
    backgroundColor: Palette.chalk,
    borderRadius: Radius.l,
  },
  code: {
    fontFamily: Type.mono,
    fontSize: 22,
    letterSpacing: 4,
    color: Palette.chalk,
  },
  copyLink: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.lime,
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: space(6),
  },
});
