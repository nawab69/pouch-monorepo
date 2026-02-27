export interface NotificationItem {
  _id: string;
  deviceId: string;
  address: string;
  type: string;
  direction: 'send' | 'receive';
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface NotificationHistoryResponse {
  notifications: NotificationItem[];
  hasMore: boolean;
  nextCursor: string | null;
}
