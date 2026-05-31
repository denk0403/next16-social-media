'use client';

import { useEffect } from 'react';
import { markAllNotificationsRead } from '@/features/notifications/notifications-actions';

export function MarkNotificationsRead() {
  useEffect(() => {
    void markAllNotificationsRead();
  }, []);
  return null;
}
