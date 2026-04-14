import { Skeleton } from '@/components/ui/skeleton';

function NotificationItemSkeleton() {
  return (
    <div style={{ 
      background: 'var(--color-surf)', 
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-4)',
      marginBottom: 'var(--space-2)',
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 14, width: '100%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 14, width: '80%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 12, width: '40%' }} />
        </div>
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-5)',
      paddingBottom: 'var(--page-pb)',
    }}>
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
    </div>
  );
}
