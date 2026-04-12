import { Skeleton } from '@/components/ui/skeleton';

function CircleCardSkeleton() {
  return (
    <div style={{ 
      background: 'var(--color-surf)', 
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-4)',
      marginBottom: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <Skeleton style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 18, width: '70%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 14, width: '50%' }} />
        </div>
      </div>
      <Skeleton style={{ height: 12, width: '100%', marginBottom: 'var(--space-1)' }} />
      <Skeleton style={{ height: 12, width: '80%' }} />
    </div>
  );
}

export function CirclesSkeleton() {
  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto',
      padding: 'var(--space-5)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <Skeleton style={{ height: 36, width: 100, borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ height: 36, width: 100, borderRadius: 'var(--radius-full)' }} />
      </div>

      {/* Circles */}
      <CircleCardSkeleton />
      <CircleCardSkeleton />
      <CircleCardSkeleton />
      <CircleCardSkeleton />
    </div>
  );
}
