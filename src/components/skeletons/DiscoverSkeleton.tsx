import { Skeleton } from '@/components/ui/skeleton';

export function DiscoverSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Filter bar skeleton */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-2)', 
        padding: 'var(--space-4) var(--space-5)',
        background: 'var(--color-bg)',
      }}>
        <Skeleton style={{ height: 36, flex: 1, borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ height: 36, flex: 1, borderRadius: 'var(--radius-full)' }} />
        <Skeleton style={{ height: 36, flex: 1, borderRadius: 'var(--radius-full)' }} />
      </div>

      {/* Card skeleton */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 'var(--space-5)',
      }}>
        <Skeleton style={{
          width: '100%',
          maxWidth: 400,
          aspectRatio: '3/4',
          maxHeight: 'min(500px, calc(100dvh - 260px))',
          borderRadius: 'var(--radius-3xl)'
        }} />
      </div>

      {/* Interaction bar skeleton */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-4)', 
        padding: 'var(--space-5)',
        justifyContent: 'center',
      }}>
        <Skeleton style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <Skeleton style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <Skeleton style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <Skeleton style={{ width: 56, height: 56, borderRadius: '50%' }} />
      </div>
    </div>
  );
}
