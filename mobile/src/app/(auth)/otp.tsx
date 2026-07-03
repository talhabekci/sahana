import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestOtp, verifyOtp } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { toApiFailure } from '@/shared/api/client';
import { OtpInput } from '@/shared/ui/OtpInput';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Type, space } from '@/shared/ui/theme';

const RESEND_SECONDS = 120;

function formatCountdown(Total: number): string {
  const Minutes = Math.floor(Total / 60);
  const Seconds = Total % 60;

  return `${Minutes}:${String(Seconds).padStart(2, '0')}`;
}

export default function Otp() {
  const Router = useRouter();
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const setToken = useAuthStore((State) => State.setToken);

  const [Code, setCode] = useState('');
  const [Error_, setError] = useState<string | null>(null);
  const [SecondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const SubmittedCode = useRef<string | null>(null);

  useEffect(() => {
    const Timer = setInterval(() => {
      setSecondsLeft((Current) => (Current > 0 ? Current - 1 : 0));
    }, 1000);

    return () => clearInterval(Timer);
  }, []);

  const Verify = useMutation({
    mutationFn: (Value: string) => verifyOtp(identifier ?? '', Value),
    onSuccess: async ({ token, is_new_user }) => {
      await setToken(token);

      if (is_new_user) {
        Router.replace('/(auth)/onboarding');
      } else {
        Router.replace('/(tabs)/profile');
      }
    },
    onError: (E) => {
      const Failure = toApiFailure(E);
      setError(Failure.message);
      setCode('');
      SubmittedCode.current = null;
    },
  });

  const Resend = useMutation({
    mutationFn: () => requestOtp(identifier ?? ''),
    onSuccess: () => {
      setSecondsLeft(RESEND_SECONDS);
      setError(null);
      setCode('');
      SubmittedCode.current = null;
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  useEffect(() => {
    if (Code.length === 6 && SubmittedCode.current !== Code && !Verify.isPending) {
      SubmittedCode.current = Code;
      Verify.mutate(Code);
    }
  }, [Code, Verify]);

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Geri</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.headline}>KODU GİR</Text>
        <Text style={styles.sub}>
          <Text style={styles.identifier}>{identifier}</Text> adresine gönderdik. Kod 2 dakika
          geçerli.
        </Text>

        <View style={styles.otp}>
          <OtpInput value={Code} onChange={(Value) => {
            setCode(Value);
            setError(null);
          }} error={Error_ != null} />
        </View>

        {Error_ != null && <Text style={styles.error}>{Error_}</Text>}
        {Verify.isPending && <Text style={styles.pending}>Kontrol ediliyor…</Text>}

        <View style={styles.resendRow}>
          {SecondsLeft > 0 ? (
            <Text style={styles.resendWait}>
              Tekrar gönder <Text style={styles.mono}>{formatCountdown(SecondsLeft)}</Text>
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => Resend.mutate()}
              disabled={Resend.isPending}>
              <Text style={styles.resendAction}>Kodu tekrar gönder</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
    paddingVertical: space(3),
  },
  body: {
    flex: 1,
    paddingTop: space(8),
  },
  headline: {
    fontFamily: Type.display,
    fontSize: 44,
    color: Palette.chalk,
  },
  sub: {
    fontFamily: Type.body,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.moss,
    marginTop: space(3),
  },
  identifier: {
    fontFamily: Type.bodyBold,
    color: Palette.chalk,
  },
  otp: {
    marginTop: space(10),
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    textAlign: 'center',
    marginTop: space(4),
  },
  pending: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
    textAlign: 'center',
    marginTop: space(4),
  },
  resendRow: {
    alignItems: 'center',
    marginTop: space(8),
  },
  resendWait: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  mono: {
    fontFamily: Type.mono,
    color: Palette.chalk,
  },
  resendAction: {
    fontFamily: Type.bodyBold,
    fontSize: 15,
    color: Palette.lime,
  },
});
