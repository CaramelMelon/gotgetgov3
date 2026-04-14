import { Skeleton } from '@/components/ui/skeleton';

function NewsCardSkeleton() {
  return (
    <div style={{ 
      background: 'var(--color-surf)', 
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      marginBottom: 'var(--space-3)',
    }}>
      <Skeleton style={{ height: 180, width: '100%', borderRadius: 0 }} />
      <div style={{ padding: 'var(--space-4)' }}>
        <Skeleton style={{ height: 20, width: '90%', marginBottom: 'var(--space-2)' }} />
        <Skeleton style={{ height: 14, width: '100%', marginBottom: 'var(--space-1)' }} />
        <Skeleton style={{ height: 14, width: '70%', marginBottom: 'var(--space-3)' }} />
        <Skeleton style={{ height: 12, width: '40%' }} />
      </div>
    </div>
  );
}

export function NewsSkeleton() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-5)',
      paddingBottom: 'var(--page-pb)',
    }}>
      {/* Greeting header skeleton */}
      <div style={{ paddingBottom: 'var(--space-4)' }}>
        <Skeleton style={{ height: 30, width: 200, marginBottom: 'var(--space-2)' }} />
        <Skeleton style={{ height: 14, width: 240 }} />
      </div>
      <NewsCardSkeleton />
      <NewsCardSkeleton />
      <NewsCardSkeleton />
    </div>
  );
}
