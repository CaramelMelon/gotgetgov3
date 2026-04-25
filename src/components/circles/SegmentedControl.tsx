import React from 'react';

export type CirclesSegment = 'MATCHES' | 'CIRCLES';

export interface SegmentedControlProps {
  activeSegment: CirclesSegment;
  onSegmentChange: (segment: CirclesSegment) => void;
}

export function SegmentedControl({ activeSegment, onSegmentChange }: SegmentedControlProps) {
  const handleSegmentClick = (segment: CirclesSegment) => {
    onSegmentChange(segment);
  };

  const handleKeyDown = (e: React.KeyboardEvent, segment: CirclesSegment) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSegmentChange(segment);
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--color-bg)',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {(['MATCHES', 'CIRCLES'] as CirclesSegment[]).map((seg) => {
        const active = activeSegment === seg;
        const label = seg === 'MATCHES' ? 'Matches' : 'Circles';
        return (
          <button
            key={seg}
            onClick={() => handleSegmentClick(seg)}
            onKeyDown={(e) => handleKeyDown(e, seg)}
            aria-label={seg === 'MATCHES' ? 'View matches feed' : 'View circles and social content'}
            aria-pressed={active}
            role="tab"
            tabIndex={0}
            style={{
              position: 'relative',
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              color: active ? 'var(--color-tab-on)' : 'var(--color-tab-off)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.01em',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {label}
            {/* Indicator sits at the very bottom of the button, fully inside bounds */}
            <span style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              borderRadius: '2px 2px 0 0',
              background: active ? 'var(--color-acc)' : 'transparent',
              transition: 'background 0.2s ease',
            }} />
          </button>
        );
      })}
      {/* Separator line sits behind the buttons */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'var(--color-bdr)',
      }} />
    </div>
  );
}
