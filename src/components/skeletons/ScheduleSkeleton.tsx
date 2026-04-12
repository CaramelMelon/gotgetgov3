import { Skeleton } from '@/components/ui/skeleton';

function ScheduleItemSkeleton() {
  return (
    <div style={{ 
      background: 'var(--color-surf)', 
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-4)',
      marginBottom: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Skeleton style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)' }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 18, width: '70%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 14, width: '50%', marginBottom: 'var(--space-1)' }} />
          <Skeleton style={{ height: 12, width: '40%' }} />
        </div>
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto',
      padding: 'var(--space-5)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Skeleton style={{ height: 24, width: 150, marginBottom: 'var(--space-3)' }} />
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Skeleton style={{ height: 32, width: 80, borderRadius: 'var(--radius-full)' }} />
          <Skeleton style={{ height: 32, width: 80, borderRadius: 'var(--radius-full)' }} />
          <Skeleton style={{ height: 32, width: 80, borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>

      {/* Items */}
      <ScheduleItemSkeleton />
      <ScheduleItemSkeleton />
      <ScheduleItemSkeleton />
      <ScheduleItemSkeleton />
    </div>
  );
}
