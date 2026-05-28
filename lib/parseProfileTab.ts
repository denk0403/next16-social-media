import type { ProfileTab } from '@/features/user/components/profile-tabs';

export function parseProfileTab(value: string): ProfileTab {
  return value === 'replies' ? 'replies' : 'drops';
}
