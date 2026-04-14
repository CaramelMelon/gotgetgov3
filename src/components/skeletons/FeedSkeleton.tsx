import { Skeleton } from '@/components/ui/skeleton';

function FeedCardSkeleton() {
  return (
    <div style={{ 
      background: 'var(--color-surf)', 
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-4)',
      marginBottom: 'var(--space-3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 16, width: '60%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      
      {/* Content */}
      <Skeleton style={{ height: 14, width: '100%', marginBottom: 'var(--space-2)' }} />
      <Skeleton style={{ height: 14, width: '90%', marginBottom: 'var(--space-2)' }} />
      <Skeleton style={{ height: 14, width: '70%' }} />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-5)',
      paddingBottom: 'var(--page-pb)',
    }}>
      <FeedCardSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </div>
  );
}
