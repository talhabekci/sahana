import { Api } from '@/shared/api/client';

export type AppNotification = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export type NotificationPreferences = {
  quiet_hours_enabled: boolean;
  categories: Record<string, boolean>;
};

export async function registerDevice(payload: {
  expo_push_token: string;
  platform: 'ios' | 'android';
}): Promise<void> {
  await Api.post('/me/devices', payload);
}

export async function getNotifications(cursor?: string): Promise<{
  data: AppNotification[];
  nextCursor: string | null;
}> {
  const { data } = await Api.get<{ data: AppNotification[]; meta: { next_cursor: string | null } }>(
    '/notifications',
    { params: cursor != null ? { cursor } : undefined },
  );

  return { data: data.data, nextCursor: data.meta.next_cursor };
}

export async function markNotificationRead(id: string): Promise<void> {
  await Api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await Api.post('/notifications/read-all');
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await Api.get<{ data: NotificationPreferences }>('/me/notification-preferences');

  return data.data;
}

export async function updateNotificationPreferences(payload: {
  quiet_hours_enabled?: boolean;
  categories?: Record<string, boolean>;
}): Promise<NotificationPreferences> {
  const { data } = await Api.patch<{ data: NotificationPreferences }>(
    '/me/notification-preferences',
    payload,
  );

  return data.data;
}
