import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { PostCard } from '@/features/social/PostCard';
import { useMentionAutocomplete } from '@/features/social/useMentionAutocomplete';
import { toApiFailure } from '@/shared/api/client';
import { Avatar } from '@/shared/ui/Avatar';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';
import { Screen } from '@/shared/ui/Screen';

export default function PostDetail() {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const Router = useRouter();
  const QueryClient = useQueryClient();

  const [CommentBody, setCommentBody] = useState('');
  const Mentions = useMentionAutocomplete(CommentBody, setCommentBody);

  const Post_ = useQuery({ queryKey: ['posts', id], queryFn: () => getPost(id) });
  const Comments = useQuery({ queryKey: ['posts', id, 'comments'], queryFn: () => getComments(id) });

  const ToggleLike = useMutation({
    mutationFn: () => (Post_.data?.i_liked === true ? unlikePost(id) : likePost(id)),
    onSuccess: () => void QueryClient.invalidateQueries({ queryKey: ['posts', id] }),
    onError: (E) => Alert.alert('Olmadı', toApiFailure(E).message),
  });

  const AddComment = useMutation({
    mutationFn: () =>
      createComment(id, CommentBody.trim(), Mentions.resolveMentionedUserIds(CommentBody)),
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
        keyboardVerticalOffset={0}>
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

          <PostCard
            post={Data}
            onToggleLike={() => ToggleLike.mutate()}
            onPressAuthor={Data.author != null ? () => Router.push(`/player/${Data.author?.id}`) : undefined}
            detailed
          />

          <Text style={styles.sectionLabel}>YORUMLAR</Text>

          {Comments.isPending ? (
            <ActivityIndicator color={Palette.lime} style={styles.commentsSpinner} />
          ) : (Comments.data ?? []).length === 0 ? (
            <Text style={styles.emptyText}>İlk yorumu sen yaz.</Text>
          ) : (
            <View style={styles.commentList}>
              {(Comments.data as Comment[]).map((Item) => (
                <View key={Item.id} style={styles.commentRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={Item.author != null ? () => Router.push(`/player/${Item.author?.id}`) : undefined}
                    disabled={Item.author == null}
                    hitSlop={4}>
                    <Text style={styles.commentAuthor}>{Item.author?.name ?? 'İsimsiz'}</Text>
                  </Pressable>
                  <Text style={styles.commentBody}>{Item.body}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {Mentions.Suggestions.length > 0 && (
          <View style={styles.mentionList}>
            {Mentions.Suggestions.map((Player) => (
              <Pressable
                key={Player.id}
                accessibilityRole="button"
                onPress={() => Mentions.selectSuggestion(Player)}
                style={styles.mentionRow}>
                <Avatar uri={Player.avatar_path} name={Player.name} size={28} />
                <Text style={styles.mentionName}>{Player.name ?? 'İsimsiz'}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            value={CommentBody}
            onChangeText={Mentions.onChangeText}
            onSelectionChange={Mentions.onSelectionChange}
            placeholder="Yorum yaz... @ ile etiketleyebilirsin"
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

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
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
  mentionList: {
    marginHorizontal: space(6),
    marginBottom: space(2),
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    backgroundColor: Palette.turf,
    overflow: 'hidden',
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    padding: space(3),
  },
  mentionName: {
    fontFamily: Type.bodyMedium,
    fontSize: 14,
    color: Palette.chalk,
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
