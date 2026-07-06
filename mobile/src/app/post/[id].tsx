import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { badgeIonicon } from '@/features/team/constants';
import {
  Comment,
  createComment,
  deletePost,
  getComments,
  getPost,
  likePost,
  reportSubject,
  unlikePost,
} from '@/features/social/api';
import { toApiFailure } from '@/shared/api/client';
import { Palette, Radius, Type, space } from '@/shared/ui/theme';
import { Screen } from '@/shared/ui/Screen';

function formatWhen(iso: string): string {
  const Date_ = new Date(iso);

  return Date_.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const [CommentBody, setCommentBody] = useState('');

  const Post_ = useQuery({ queryKey: ['posts', id], queryFn: () => getPost(id) });
  const Comments = useQuery({ queryKey: ['posts', id, 'comments'], queryFn: () => getComments(id) });

  const ToggleLike = useMutation({
    mutationFn: () => (Post_.data?.i_liked === true ? unlikePost(id) : likePost(id)),
    onSuccess: () => void QueryClient.invalidateQueries({ queryKey: ['posts', id] }),
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const AddComment = useMutation({
    mutationFn: () => createComment(id, CommentBody.trim()),
    onSuccess: () => {
      setCommentBody('');
      void QueryClient.invalidateQueries({ queryKey: ['posts', id, 'comments'] });
      void QueryClient.invalidateQueries({ queryKey: ['posts', id] });
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const DeletePost_ = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      void QueryClient.invalidateQueries({ queryKey: ['feed'] });
      Router.back();
    },
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const ReportPost = useMutation({
    mutationFn: (Reason: string) => reportSubject({ subject_type: 'post', subject_id: id, reason: Reason }),
    onSuccess: () => Alert.alert('Teşekkürler', 'Şikayetin alındı.'),
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const promptReport = () => {
    Alert.alert('Gönderiyi şikayet et', 'Sebep seç', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Spam', onPress: () => ReportPost.mutate('spam') },
      { text: 'Uygunsuz içerik', onPress: () => ReportPost.mutate('uygunsuz_icerik') },
      { text: 'Taciz', onPress: () => ReportPost.mutate('taciz') },
    ]);
  };

  const promptDelete = () => {
    Alert.alert('Gönderiyi sil', 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => DeletePost_.mutate() },
    ]);
  };

  if (Post_.isPending || Post_.data == null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lime} />
        </View>
      </Screen>
    );
  }

  const Data = Post_.data;

  return (
    <Screen bare>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" onPress={() => Router.back()} hitSlop={12}>
              <Text style={styles.back}>‹ Geri</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                Alert.alert('Gönderi', undefined, [
                  { text: 'Vazgeç', style: 'cancel' },
                  { text: 'Şikayet et', onPress: promptReport },
                  ...(Data.author != null ? [{ text: 'Sil', style: 'destructive' as const, onPress: promptDelete }] : []),
                ])
              }
              hitSlop={12}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Palette.moss} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.flexShrink}>
                <Pressable
                  accessibilityRole="button"
                  disabled={Data.author == null}
                  onPress={() => Router.push(`/player/${Data.author?.id}`)}
                  hitSlop={4}>
                  <Text style={styles.authorName}>{Data.author?.name ?? 'İsimsiz'}</Text>
                </Pressable>
                {Data.team != null && (
                  <View style={styles.teamRow}>
                    <Ionicons name={badgeIonicon(Data.team.badge_icon)} size={12} color={Palette.lime} />
                    <Text style={styles.teamName}>{Data.team.name}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.when}>{formatWhen(Data.created_at)}</Text>
            </View>

            {Data.type === 'text' && Data.body != null && <Text style={styles.body}>{Data.body}</Text>}

            {Data.type === 'match_played' && Data.match != null && (
              <View style={styles.autoCard}>
                <Text style={styles.autoKicker}>⚽ MAÇ OYNANDI</Text>
                <Text style={styles.autoText}>
                  {Data.match.venue_text}
                  {Data.match.opponent_team_name != null ? ` · ${Data.match.opponent_team_name}'e karşı` : ''}
                </Text>
              </View>
            )}

            {Data.type === 'lineup_shared' && Data.lineup != null && (
              <View style={styles.autoCard}>
                <Text style={styles.autoKicker}>📋 KADRO PAYLAŞILDI</Text>
                <Text style={styles.autoText}>{Data.lineup.name}</Text>
              </View>
            )}

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                onPress={() => ToggleLike.mutate()}
                style={styles.actionButton}
                hitSlop={8}>
                <Ionicons
                  name={Data.i_liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={Data.i_liked ? Palette.lime : Palette.moss}
                />
                <Text style={[styles.actionText, Data.i_liked && styles.actionTextActive]}>
                  {Data.likes_count}
                </Text>
              </Pressable>

              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color={Palette.moss} />
                <Text style={styles.actionText}>{Data.comments_count}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>YORUMLAR</Text>

          {Comments.isPending ? (
            <ActivityIndicator color={Palette.lime} style={styles.commentsSpinner} />
          ) : (Comments.data ?? []).length === 0 ? (
            <Text style={styles.emptyText}>İlk yorumu sen yaz.</Text>
          ) : (
            <View style={styles.commentList}>
              {(Comments.data as Comment[]).map((Item) => (
                <View key={Item.id} style={styles.commentRow}>
                  <Text style={styles.commentAuthor}>{Item.author?.name ?? 'İsimsiz'}</Text>
                  <Text style={styles.commentBody}>{Item.body}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={CommentBody}
            onChangeText={setCommentBody}
            placeholder="Yorum yaz..."
            placeholderTextColor={Palette.moss}
            selectionColor={Palette.lime}
            style={styles.commentInput}
          />
          <Pressable
            accessibilityRole="button"
            disabled={CommentBody.trim().length < 1 || AddComment.isPending}
            onPress={() => AddComment.mutate()}
            style={[
              styles.sendButton,
              (CommentBody.trim().length < 1 || AddComment.isPending) && styles.sendButtonDisabled,
            ]}>
            <Ionicons name="arrow-up" size={18} color={Palette.limeInk} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: space(6),
    paddingTop: space(4),
    paddingBottom: space(8),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space(3),
  },
  back: {
    fontFamily: Type.bodyMedium,
    fontSize: 16,
    color: Palette.moss,
  },
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space(3),
  },
  flexShrink: {
    flexShrink: 1,
  },
  authorName: {
    fontFamily: Type.bodyBold,
    fontSize: 16,
    color: Palette.chalk,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  teamName: {
    fontFamily: Type.bodyMedium,
    fontSize: 12,
    color: Palette.moss,
  },
  when: {
    fontFamily: Type.body,
    fontSize: 12,
    color: Palette.moss,
  },
  body: {
    fontFamily: Type.body,
    fontSize: 16,
    lineHeight: 23,
    color: Palette.chalk,
    marginTop: space(3),
  },
  autoCard: {
    marginTop: space(3),
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.m,
    padding: space(3),
  },
  autoKicker: {
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: Palette.lime,
  },
  autoText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: space(5),
    marginTop: space(4),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.moss,
  },
  actionTextActive: {
    color: Palette.lime,
  },
  sectionLabel: {
    fontFamily: Type.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.moss,
    marginTop: space(7),
    marginBottom: space(3),
  },
  commentsSpinner: {
    marginTop: space(4),
  },
  emptyText: {
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.moss,
  },
  commentList: {
    gap: space(3),
  },
  commentRow: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(3),
  },
  commentAuthor: {
    fontFamily: Type.bodyBold,
    fontSize: 13,
    color: Palette.chalk,
  },
  commentBody: {
    fontFamily: Type.body,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.chalk,
    marginTop: 2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    paddingHorizontal: space(6),
    paddingVertical: space(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineFaint,
  },
  commentInput: {
    flex: 1,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    paddingHorizontal: space(4),
    fontFamily: Type.body,
    fontSize: 14,
    color: Palette.chalk,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
