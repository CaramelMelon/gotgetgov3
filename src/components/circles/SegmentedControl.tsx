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
        borderBottom: '1px solid var(--color-bdr)',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      <button
        onClick={() => handleSegmentClick('MATCHES')}
        onKeyDown={(e) => handleKeyDown(e, 'MATCHES')}
        aria-label="View matches feed"
        aria-pressed={activeSegment === 'MATCHES'}
        role="tab"
        tabIndex={0}
        style={{
          padding: '12px 20px',
          border: 'none',
          borderBottom: activeSegment === 'MATCHES'
            ? '2px solid var(--color-acc)'
            : '2px solid transparent',
          background: 'transparent',
          color: activeSegment === 'MATCHES' ? 'var(--color-tab-on)' : 'var(--color-tab-off)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          transition: 'color 0.2s ease, border-color 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          marginBottom: -1,
        }}
      >
        Matches
      </button>

      <button
        onClick={() => handleSegmentClick('CIRCLES')}
        onKeyDown={(e) => handleKeyDown(e, 'CIRCLES')}
        aria-label="View circles and social content"
        aria-pressed={activeSegment === 'CIRCLES'}
        role="tab"
        tabIndex={0}
        style={{
          padding: '12px 20px',
          border: 'none',
          borderBottom: activeSegment === 'CIRCLES'
            ? '2px solid var(--color-acc)'
            : '2px solid transparent',
          background: 'transparent',
          color: activeSegment === 'CIRCLES' ? 'var(--color-tab-on)' : 'var(--color-tab-off)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.01em',
          cursor: 'pointer',
          transition: 'color 0.2s ease, border-color 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          marginBottom: -1,
        }}
      >
        Circles
      </button>
    </div>
  );
}
