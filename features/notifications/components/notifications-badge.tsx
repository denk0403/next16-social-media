import { getUnreadNotificationCount } from '@/features/notifications/notifications-queries';

export async function NotificationsBadge() {
  const count = await getUnreadNotificationCount();
  if (count === 0) {
    return null;
  }
  return (
    <span
      aria-label={`${count} unread notifications`}
      className="bg-accent ml-auto inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
