import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { requestOtp } from '@/features/auth/api';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Palette, Type, space } from '@/shared/ui/theme';

export default function Identifier() {
  const Router = useRouter();
  const [Identifier_, setIdentifier] = useState('');
  const [Error_, setError] = useState<string | null>(null);

  const Send = useMutation({
    mutationFn: () => requestOtp(Identifier_.trim()),
    onSuccess: () => {
      Router.push({ pathname: '/(auth)/otp', params: { identifier: Identifier_.trim() } });
    },
    onError: (E) => {
      const Failure = toApiFailure(E);
      setError(Failure.errors?.identifier?.[0] ?? Failure.message);
    },
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.headline}>GİRİŞ YAP</Text>
          <Text style={styles.sub}>
            Numaranı ya da e-postanı yaz; sana 6 haneli tek kullanımlık kod gönderelim.
          </Text>

          <View style={styles.field}>
            <TextField
              label="Telefon veya e-posta"
              value={Identifier_}
              onChangeText={(Value) => {
                setIdentifier(Value);
                setError(null);
              }}
              placeholder="05xx ya da ad@ornek.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoFocus
              error={Error_}
              onSubmitEditing={() => Send.mutate()}
              returnKeyType="send"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Kod gönder"
            onPress={() => Send.mutate()}
            disabled={Identifier_.trim().length < 6}
            loading={Send.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    maxWidth: 320,
  },
  field: {
    marginTop: space(10),
  },
  footer: {
    paddingBottom: space(6),
  },
});
