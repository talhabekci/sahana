/**
 * Bir bildirimin (uygulama içi liste VEYA ham push payload'ı) `type` +
 * `data`sına göre gideceği rota (BACKLOG #73/#79). `type` iki farklı
 * biçimde gelebilir: uygulama içi listede (`GET /notifications`) Laravel
 * bildirim sınıfının PascalCase adı (`MatchCreatedNotification`), ham push
 * bildiriminde ise her `toExpo()`'nun `expoCategory()`'sinden gelen
 * snake_case kısaltma (`match_created`) — ikisi de aynı fonksiyonda kabul
 * edilir ki liste ekranı ve arka plan/kilit ekranı bildirim tıklaması aynı
 * eşleme mantığını kullansın.
 */
export function routeFor(Type: string, Data: Record<string, unknown>): string | null {
  switch (Type) {
    case 'MatchCreatedNotification':
    case 'match_created':
    case 'MatchConfirmedNotification':
    case 'match_confirmed':
    case 'RsvpReminderNotification':
    case 'rsvp_reminder':
    case 'MatchReminderNotification':
    case 'match_reminder':
      return typeof Data.match_id === 'string' ? `/match/${Data.match_id}` : null;
    case 'ListingApplicationNotification':
    case 'listing_application':
      return typeof Data.listing_id === 'string' ? `/listing/${Data.listing_id}` : null;
    case 'OpponentFoundNotification':
    case 'opponent_found':
      return typeof Data.listing_id === 'string' ? `/opponent-listing/${Data.listing_id}` : null;
    case 'InviteAcceptedNotification':
    case 'invite_accepted':
      return typeof Data.team_id === 'string' ? `/team/${Data.team_id}` : null;
    case 'FollowedNotification':
    case 'followed':
      return typeof Data.follower_id === 'string' ? `/player/${Data.follower_id}` : null;
    case 'PostLikedNotification':
    case 'post_liked':
    case 'PostCommentedNotification':
    case 'post_commented':
    case 'MentionedNotification':
    case 'mentioned':
      return typeof Data.post_id === 'string' ? `/post/${Data.post_id}` : null;
    case 'SocialSummaryNotification':
    case 'social_summary':
      return '/(tabs)/profile';
    case 'chat_message':
      if (typeof Data.team_id === 'string') {
        return `/team/${Data.team_id}/chat`;
      }

      return typeof Data.dm_user_id === 'string' ? `/dm/${Data.dm_user_id}` : null;
    default:
      return null;
  }
}
