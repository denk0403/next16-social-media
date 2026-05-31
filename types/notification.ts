export type NotificationKind = 'like' | 'repost' | 'follow' | 'reply';

export type Notification = {
  id: string;
  kind: NotificationKind;
  actorHandle: string;
  createdAt: Date;
  dropId?: string;
  body?: string;
  read: boolean;
};
