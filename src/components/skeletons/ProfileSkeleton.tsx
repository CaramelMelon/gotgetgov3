import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto',
      background: 'var(--color-bg)',
    }}>
      {/* Hero section */}
      <div style={{ 
        padding: 'var(--space-6) var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}>
        <Skeleton style={{ width: 96, height: 96, borderRadius: '50%' }} />
        <Skeleton style={{ height: 24, width: 180 }} />
        <Skeleton style={{ height: 14, width: 140 }} />
        
        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-6)', 
          marginTop: 'var(--space-2)' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <Skeleton style={{ height: 20, width: 40, marginBottom: 'var(--space-1)' }} />
            <Skeleton style={{ height: 12, width: 60 }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Skeleton style={{ height: 20, width: 40, marginBottom: 'var(--space-1)' }} />
            <Skeleton style={{ height: 12, width: 60 }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Skeleton style={{ height: 20, width: 40, marginBottom: 'var(--space-1)' }} />
            <Skeleton style={{ height: 12, width: 60 }} />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-4)' }}>
        <Skeleton style={{ height: 18, width: 120, marginBottom: 'var(--space-3)' }} />
        <div style={{ 
          background: 'var(--color-surf)', 
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-4)',
        }}>
          <Skeleton style={{ height: 60, width: '100%', marginBottom: 'var(--space-2)' }} />
          <Skeleton style={{ height: 60, width: '100%' }} />
        </div>
      </div>

      <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-6)' }}>
        <Skeleton style={{ height: 18, width: 100, marginBottom: 'var(--space-3)' }} />
        <div style={{ 
          background: 'var(--color-surf)', 
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-4)',
        }}>
          <Skeleton style={{ height: 60, width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
