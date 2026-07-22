import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { memo, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Post } from './api';
import VideoDefaultCover from '@/assets/images/video-default-cover.png';
import { PostVideoPlayer } from './PostVideoPlayer';
import { OpponentListingCard, PlayerListingCard } from '@/features/match/ListingCards';
import { useListingActions } from '@/features/match/useListingActions';
import { badgeIonicon } from '@/features/team/constants';
import { PitchPreview } from '@/features/team/PitchPreview';
import { saveToDevice } from '@/shared/media/saveToDevice';
import { ImageViewerModal } from '@/shared/ui/ImageViewerModal';
import { PaletteTokens, Radius, Type, space, useTheme } from '@/shared/ui/theme';

function formatWhen(iso: string): string {
  const Date_ = new Date(iso);

  return Date_.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function initials(name: string | null | undefined): string {
  if (name == null || name.trim() === '') {
    return '?';
  }

  const Parts = name.trim().split(/\s+/);
  const First = Parts[0]?.[0] ?? '';
  const Last = Parts.length > 1 ? (Parts[Parts.length - 1]?.[0] ?? '') : '';

  return (First + Last).toUpperCase();
}

type Props = {
  post: Post;
  /** Stabil referans ver (useCallback) — post.id ile çağrılır. */
  onPress?: (postId: string) => void;
  /** Stabil referans ver (useCallback) — güncel post nesnesiyle çağrılır. */
  onToggleLike: (post: Post) => void;
  /** Stabil referans ver (useCallback) — yazar ID'siyle çağrılır. */
  onPressAuthor?: (authorId: string) => void;
  /** Gönderi detay sayfasında true — kadro için görsel saha önizlemesi gösterir. Feed/liste bağlamında sade metin kartı yeterli. */
  detailed?: boolean;
};

/**
 * BACKLOG #63: memo — feed/profil listelerinde her yeniden render'da tüm
 * satırların yeniden çizilmesini önler. Bunun işe yaraması için ebeveynler
 * `onPress`/`onToggleLike`/`onPressAuthor`'ı useCallback ile SABİT referans
 * olarak vermeli — her satıra özel closure'ı burada, post/id ile içeride
 * kuruyoruz.
 */
export const PostCard = memo(function PostCard({
  post,
  onPress,
  onToggleLike,
  onPressAuthor,
  detailed = false,
}: Props) {
  const Palette = useTheme();
  const styles = useMemo(() => createStyles(Palette), [Palette]);
  const { apply, promptOpponentMatch } = useListingActions();
  const [ViewerOpen, setViewerOpen] = useState(false);

  const handlePress = onPress != null ? () => onPress(post.id) : undefined;
  const handleToggleLike = () => onToggleLike(post);
  const handlePressAuthor =
    onPressAuthor != null && post.author != null ? () => onPressAuthor(post.author!.id) : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      disabled={handlePress == null}
      style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            onPress={handlePressAuthor}
            disabled={handlePressAuthor == null}
            style={styles.avatar}
            hitSlop={4}>
            {post.author?.avatar_path != null ? (
              <Image source={{ uri: post.author.avatar_path }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials(post.author?.name)}</Text>
            )}
          </Pressable>

          <View style={styles.flexShrink}>
            <Pressable
              accessibilityRole="button"
              onPress={handlePressAuthor}
              disabled={handlePressAuthor == null}
              hitSlop={4}>
              <Text style={styles.authorName}>{post.author?.name ?? 'İsimsiz'}</Text>
            </Pressable>
            {post.team != null && (
              <View style={styles.teamRow}>
                <Ionicons name={badgeIonicon(post.team.badge_icon)} size={12} color={Palette.lime} />
                <Text style={styles.teamName}>{post.team.name}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.when}>{formatWhen(post.created_at)}</Text>
      </View>

      {post.type === 'text' && post.body != null && <Text style={styles.body}>{post.body}</Text>}

      {post.image_url != null &&
        (detailed ? (
          <Pressable accessibilityRole="button" onPress={() => setViewerOpen(true)}>
            <Image source={{ uri: post.image_url }} style={styles.photo} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={handlePress}
            onLongPress={() =>
              Alert.alert('Gönderi görseli', undefined, [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Cihaza kaydet', onPress: () => void saveToDevice(post.image_url as string) },
              ])
            }>
            <Image source={{ uri: post.image_url }} style={styles.photo} />
          </Pressable>
        ))}

      {detailed && (
        <ImageViewerModal uri={ViewerOpen ? post.image_url ?? null : null} onClose={() => setViewerOpen(false)} />
      )}

      {post.video_url != null && (
        detailed ? (
          <PostVideoPlayer uri={post.video_url} />
        ) : (
          // BACKLOG #63: liste bağlamında native oynatıcıyı eagerly kurmuyoruz
          // (VirtualizedList perf uyarısı) — statik kapak + kartın kendi
          // onPress'i (detay sayfasına gider, orada gerçek oynatıcı kurulur).
          <Pressable accessibilityRole="button" onPress={handlePress} style={styles.videoCard}>
            <Image source={VideoDefaultCover} style={styles.videoThumbnail} />
            <View style={styles.videoPlayBadge}>
              <Ionicons name="play" size={14} color={Palette.limeInk} />
            </View>
          </Pressable>
        )
      )}

      {post.type === 'match_played' && post.match != null && (
        <View style={styles.autoCard}>
          <Text style={styles.autoKicker}>⚽ MAÇ OYNANDI</Text>
          <Text style={styles.autoText}>
            {post.match.venue_text}
            {post.match.opponent_team_name != null ? ` · ${post.match.opponent_team_name}'e karşı` : ''}
          </Text>
        </View>
      )}

      {post.type === 'badge_earned' && post.badge != null && (
        <View style={styles.badgeCard}>
          <View style={styles.badgeIconWrap}>
            <Ionicons name={post.badge.icon as never} size={22} color={Palette.limeInk} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.autoKicker}>🏆 ROZET KAZANDI</Text>
            <Text style={styles.autoText}>{post.badge.label}</Text>
          </View>
        </View>
      )}

      {post.type === 'weekly_recap' && post.recap != null && (
        <View style={styles.autoCard}>
          <Text style={styles.autoKicker}>📊 HAFTALIK ÖZET</Text>
          <Text style={styles.autoText}>
            {post.recap.matches} maç · {post.recap.goals} gol · {post.recap.assists} asist
            {post.recap.avg_rating != null ? ` · ${post.recap.avg_rating.toFixed(1)} puan` : ''}
          </Text>
        </View>
      )}

      {post.lineup != null && (
        <View style={styles.lineupCard}>
          <Text style={styles.autoKicker}>📋 {post.lineup.name}</Text>
          {detailed && (
            <View style={styles.lineupBoard}>
              <PitchPreview positions={post.lineup.positions} />
            </View>
          )}
        </View>
      )}

      {post.type === 'player_listing' && post.player_listing != null && (
        <View style={styles.listingWrap}>
          <PlayerListingCard
            listing={post.player_listing}
            onApply={() => post.player_listing != null && apply(post.player_listing.id)}
          />
        </View>
      )}

      {post.type === 'opponent_listing' && post.opponent_listing != null && (
        <View style={styles.listingWrap}>
          <OpponentListingCard
            listing={post.opponent_listing}
            onMatch={() => post.opponent_listing != null && promptOpponentMatch(post.opponent_listing)}
          />
        </View>
      )}

      {post.type === 'video_shared' && post.video != null && (
        post.video.video_url != null ? (
          // Yüklenen maç videosu (BACKLOG #46): tarayıcıya gitmeden akış
          // içinde oynatılır — harici linklerde (YouTube vb.) tarayıcı kalır.
          // BACKLOG #63: liste bağlamında oynatıcı eagerly kurulmuyor, aynı
          // statik kapak deseni (aşağıdaki harici link dalıyla birebir).
          detailed ? (
            <View>
              <Text style={[styles.autoKicker, styles.videoUploadedKicker]}>🎬 VİDEO PAYLAŞILDI</Text>
              <PostVideoPlayer uri={post.video.video_url} />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={handlePress} style={styles.videoCard}>
              <Image
                source={post.video.thumbnail_url != null ? { uri: post.video.thumbnail_url } : VideoDefaultCover}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoPlayBadge}>
                <Ionicons name="play" size={14} color={Palette.limeInk} />
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.autoKicker}>🎬 VİDEO PAYLAŞILDI</Text>
                <Text style={styles.autoText} numberOfLines={1}>
                  {post.video.title ?? 'Maç videosunu izle'}
                </Text>
              </View>
            </Pressable>
          )
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (post.video?.url != null) {
                void WebBrowser.openBrowserAsync(post.video.url);
              }
            }}
            style={styles.videoCard}>
            <Image
              source={post.video.thumbnail_url != null ? { uri: post.video.thumbnail_url } : VideoDefaultCover}
              style={styles.videoThumbnail}
            />
            <View style={styles.videoPlayBadge}>
              <Ionicons name="play" size={14} color={Palette.limeInk} />
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.autoKicker}>🎬 VİDEO PAYLAŞILDI</Text>
              <Text style={styles.autoText} numberOfLines={1}>
                {post.video.title ?? 'Maç videosunu izle'}
              </Text>
            </View>
          </Pressable>
        )
      )}

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={handleToggleLike} style={styles.actionButton} hitSlop={8}>
          <Ionicons
            name={post.i_liked ? 'heart' : 'heart-outline'}
            size={18}
            color={post.i_liked ? Palette.lime : Palette.moss}
          />
          <Text style={[styles.actionText, post.i_liked && styles.actionTextActive]}>
            {post.likes_count}
          </Text>
        </Pressable>

        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={16} color={Palette.moss} />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const createStyles = (Palette: PaletteTokens) => StyleSheet.create({
  card: {
    backgroundColor: Palette.turf,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Palette.lineFaint,
    padding: space(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space(3),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    flexShrink: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Palette.turfRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: Type.bodyBold,
    fontSize: 13,
    color: Palette.lime,
  },
  flexShrink: {
    flexShrink: 1,
  },
  authorName: {
    fontFamily: Type.bodyBold,
    fontSize: 15,
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
    fontSize: 15,
    lineHeight: 22,
    color: Palette.chalk,
    marginTop: space(3),
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: Radius.m,
    backgroundColor: Palette.turfRaised,
    marginTop: space(3),
  },
  autoCard: {
    marginTop: space(3),
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.m,
    padding: space(3),
  },
  badgeCard: {
    marginTop: space(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.m,
    padding: space(3),
  },
  badgeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineupCard: {
    marginTop: space(3),
    backgroundColor: Palette.turfRaised,
    borderRadius: Radius.m,
    padding: space(3),
  },
  lineupBoard: {
    marginTop: space(2),
    width: 140,
    alignSelf: 'center',
  },
  listingWrap: {
    marginTop: space(3),
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
  videoUploadedKicker: {
    marginTop: space(3),
  },
  videoCard: {
    marginTop: space(3),
  },
  videoThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: Radius.m,
    backgroundColor: Palette.turfRaised,
  },
  videoPlayBadge: {
    position: 'absolute',
    top: space(3),
    right: space(3),
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    marginTop: space(2),
  },
  footer: {
    flexDirection: 'row',
    gap: space(5),
    marginTop: space(3),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: Type.bodyMedium,
    fontSize: 13,
    color: Palette.moss,
  },
  actionTextActive: {
    color: Palette.lime,
  },
});
