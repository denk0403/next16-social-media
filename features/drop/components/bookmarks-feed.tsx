import { EmptyState } from '@/components/ui/empty-state';
import { DropList } from '@/features/drop/components/drop';
import { getBookmarkedDrops } from '@/features/drop/drop-queries';

export async function BookmarksFeed() {
  const drops = await getBookmarkedDrops();

  if (drops.length === 0) {
    return <EmptyState title="Nothing saved yet" body="Bookmark a drop to find it here later." />;
  }

  return <DropList drops={drops} />;
}
