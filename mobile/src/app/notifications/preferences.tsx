import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  NotificationPreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api';
import { Screen } from '@/shared/ui/Screen';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

const CATEGORY_LABELS: Record<string, string> = {
  match_created: 'Yeni maç kuruldu',
  match_confirmed: 'Maç onaylandı',
  rsvp_reminder: 'Katılım hatırlatması',
  match_reminder: 'Maç yaklaşıyor',
  listing_application: 'İlana başvuru',
  application_decision: 'Başvuru kararı',
  invite_accepted: 'Davet kabul edildi',
  opponent_found: 'Rakip bulundu',
  social_summary: 'Akış özeti',
  chat_message: 'Takım sohbeti',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export default function NotificationPreferencesScreen() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const Query = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
  });

  const [Draft, setDraft] = useState<NotificationPreferences | null>(null);
  const [Saving, setSaving] = useState(false);

  useEffect(() => {
    if (Query.data != null && Draft === null) {
      setDraft(Query.data);
    }
  }, [Query.data, Draft]);

  async function persist(Next: NotificationPreferences) {
    setDraft(Next);
    setSaving(true);

    try {
      const Saved = await updateNotificationPreferences(Next);
      setDraft(Saved);
      QueryClient.setQueryData(['notification-preferences'], Saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bare>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        {Saving && <ActivityIndicator color={Palette.lime} size="small" />}
      </View>

      <Text style={styles.headline}>BİLDİRİM TERCİHLERİ</Text>

      {Draft === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Sessiz saatler</Text>
                <Text style={styles.rowSubtitle}>00:00–08:00 arası bildirimler ertelenir</Text>
              </View>
              <Switch
                value={Draft.quiet_hours_enabled}
                onValueChange={(Value) => void persist({ ...Draft, quiet_hours_enabled: Value })}
                trackColor={{ false: Palette.lineFaint, true: Palette.lime }}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>KATEGORİLER</Text>

          <View style={styles.card}>
            {CATEGORY_ORDER.map((Category, Index) => (
              <View
                key={Category}
                style={[styles.row, Index < CATEGORY_ORDER.length - 1 && styles.rowBorder]}>
                <Text style={styles.rowTitle}>{CATEGORY_LABELS[Category]}</Text>
                <Switch
                  value={Draft.categories[Category] ?? true}
                  onValueChange={(Value) =>
                    void persist({
                      ...Draft,
                      categories: { ...Draft.categories, [Category]: Value },
                    })
                  }
                  trackColor={{ false: Palette.lineFaint, true: Palette.lime }}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(6),
    paddingTop: space(4),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  headline: {
    fontFamily: Type.mono,
    fontSize: 13,
    letterSpacing: 3,
    color: Palette.lime,
    paddingHorizontal: space(6),
    marginTop: space(3),
    marginBottom: space(4),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: space(6),
    paddingBottom: space(8),
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(6),
    marginBottom: space(2),
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(4),
    paddingVertical: space(4),
    gap: space(3),
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.lineFaint,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Type.bodyMedium,
    fontSize: 15,
    color: Palette.chalk,
  },
  rowSubtitle: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
    marginTop: space(1),
  },
});
