import { Skeleton } from '@/components/ui/skeleton';

function ResultCardSkeleton() {
  return (
    <div style={{ 
      background: 'var(--color-surf)', 
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-4)',
      marginBottom: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 16, width: '60%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 14, width: '40%' }} />
        </div>
        <Skeleton style={{ width: 60, height: 32, borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-5)',
      paddingBottom: 'var(--page-pb)',
    }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <Skeleton style={{ height: 36, width: 100, borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ height: 36, width: 100, borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ height: 36, width: 100, borderRadius: 'var(--radius-full)' }} />
      </div>

      {/* Results */}
      <ResultCardSkeleton />
      <ResultCardSkeleton />
      <ResultCardSkeleton />
      <ResultCardSkeleton />
    </div>
  );
}
