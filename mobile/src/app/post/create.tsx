import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createPost } from '@/features/social/api';
import { listTeams } from '@/features/team/api';
import { toApiFailure } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';

export default function CreatePost() {
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Teams = useQuery({ queryKey: ['teams'], queryFn: listTeams });

  const [Body, setBody] = useState('');
  const [TeamId, setTeamId] = useState<string | null>(null);
  const [Error_, setError] = useState<string | null>(null);

  const Create = useMutation({
    mutationFn: () => createPost({ body: Body.trim(), team_id: TeamId }),
    onSuccess: () => {
      void QueryClient.invalidateQueries({ queryKey: ['feed'] });
      Router.back();
    },
    onError: (E) => setError(toApiFailure(E).message),
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Geri</Text>
          </Pressable>

          <Text style={styles.headline}>GÖNDERİ PAYLAŞ</Text>

          <View style={styles.field}>
            <TextInput
              value={Body}
              onChangeText={(Value) => {
                setBody(Value);
                setError(null);
              }}
              placeholder="Ne oldu?"
              placeholderTextColor={Palette.moss}
              selectionColor={Palette.lime}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
              autoFocus
              style={styles.textArea}
            />
            <Text style={styles.charCount}>{Body.length}/500</Text>
          </View>

          {(Teams.data ?? []).length > 0 && (
            <>
              <Text style={styles.sectionLabel}>TAKIMA ETİKETLE (opsiyonel)</Text>
              <View style={styles.chipWrap}>
                {(Teams.data ?? []).map((Team) => {
                  const Active = TeamId === Team.id;

                  return (
                    <Pressable
                      key={Team.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: Active }}
                      onPress={() => setTeamId(Active ? null : Team.id)}
                      style={[styles.chip, Active && styles.chipActive]}>
                      <Text style={[styles.chipText, Active && styles.chipTextActive]}>
                        {Team.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {Error_ != null && <Text style={styles.error}>{Error_}</Text>}

          <View style={styles.footer}>
            <Button
              label="Paylaş"
              onPress={() => Create.mutate()}
              disabled={Body.trim().length < 2}
              loading={Create.isPending}
            />
          </View>
        </ScrollView>
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
  headline: {
    fontFamily: Type.display,
    fontSize: 36,
    color: Palette.chalk,
    marginBottom: space(4),
  },
  field: {
    marginBottom: space(2),
  },
  textArea: {
    minHeight: 140,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    padding: space(4),
    fontFamily: Type.body,
    fontSize: 16,
    lineHeight: 22,
    color: Palette.chalk,
  },
  charCount: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: Palette.moss,
    textAlign: 'right',
    marginTop: space(1),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(6),
    marginBottom: space(2),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
  },
  chip: {
    paddingVertical: space(2),
    paddingHorizontal: space(4),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
  },
  chipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  chipText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
  },
  chipTextActive: {
    color: Palette.limeInk,
  },
  error: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.clay,
    marginTop: space(4),
  },
  footer: {
    paddingVertical: space(6),
  },
});
