import { CACHE_SERVER_URL } from '@/constants/api';
import type { NotificationHistoryResponse } from '@/types/notifications';

export async function fetchNotificationHistory(
  deviceId: string,
  { limit, before }: { limit?: number; before?: string } = {}
): Promise<NotificationHistoryResponse> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (before) params.set('before', before);

  const qs = params.toString();
  const url = `${CACHE_SERVER_URL}/notifications/history/${deviceId}${qs ? `?${qs}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return response.json();
}

export async function markNotificationsAsRead(
  deviceId: string,
  notificationIds?: string[]
): Promise<{ success: boolean; modified: number }> {
  const response = await fetch(`${CACHE_SERVER_URL}/notifications/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, notificationIds }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return response.json();
}

export async function fetchUnreadCount(deviceId: string): Promise<number> {
  const response = await fetch(
    `${CACHE_SERVER_URL}/notifications/unread-count/${deviceId}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  const data = await response.json();
  return data.count;
}
