import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Slider } from '../ui/slider';
import type { FilterSport, FilterSkill } from '../../types/discover';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: 'sport' | 'distance' | 'skill' | null;
  sport: FilterSport;
  distanceKm: number;
  skill: FilterSkill;
  onSportChange: (v: FilterSport) => void;
  onDistanceChange: (v: number) => void;
  onSkillChange: (v: FilterSkill) => void;
  onClubSelectionChange: (ids: string[]) => void;
  sports: FilterSport[];
  distances: number[];
  skills: FilterSkill[];
  anchorEl?: HTMLElement | null;
  myClubs: { id: string; name: string }[];
  selectedClubIds: string[];
}

const SPORT_LABEL: Record<string, string> = {
  all: 'All sports',
  tennis: 'Tennis',
  padel: 'Padel',
  squash: 'Squash',
  platform_tennis: 'Platform Tennis',
};

const SKILL_LABEL: Record<string, string> = {
  any: 'Any level',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
  professional: 'Professional',
};

export function FilterModal({
  isOpen,
  onClose,
  activeFilter,
  sport,
  distanceKm,
  skill,
  onSportChange,
  onDistanceChange,
  onSkillChange,
  onClubSelectionChange,
  sports,
  distances,
  skills,
  anchorEl,
  myClubs,
  selectedClubIds,
}: FilterModalProps) {
  // Continuous miles value for the distance slider (0–50 mi; 0 = Club only)
  const [distMiles, setDistMiles] = useState(() => Math.round(distanceKm * 0.621));
  const [localSelectedClubs, setLocalSelectedClubs] = useState<string[]>(selectedClubIds);
  // Sync when modal reopens with a different distanceKm
  useEffect(() => { setDistMiles(Math.round(distanceKm * 0.621)); }, [distanceKm]);
  useEffect(() => { setLocalSelectedClubs(selectedClubIds); }, [isOpen]);

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  const usePopover = isDesktop && !!anchorEl;

  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (usePopover && anchorEl && isOpen) {
      const rect = anchorEl.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, [isOpen, anchorEl, usePopover]);

  if (!activeFilter) return null;

  const getTitle = () => {
    switch (activeFilter) {
      case 'sport': return 'Select Sport';
      case 'distance': return 'Distance';
      case 'skill': return 'Skill Level';
      default: return '';
    }
  };

  const handleSelect = (value: string | number) => {
    switch (activeFilter) {
      case 'sport':
        onSportChange(value as FilterSport);
        onClose();
        break;
      case 'distance':
        onDistanceChange(value as number);
        break;
      case 'skill':
        onSkillChange(value as FilterSkill);
        break;
    }
  };

  const contentSections = (
    <>
      {activeFilter === 'sport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: sport === s ? 'var(--color-acc)' : 'var(--color-surf-2)',
                border: sport === s ? '2px solid var(--color-acc)' : '1px solid var(--color-bdr)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: sport === s ? '#fff' : 'var(--color-t1)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              {SPORT_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      )}

      {activeFilter === 'distance' && (() => {
        const MIN_MI = 0, MAX_MI = 50;
        const pct = (distMiles / MAX_MI) * 100;
        const isClubMode = distMiles === 0;
        return (
          <div style={{ paddingTop: 56, paddingBottom: 8 }}>
            {/* Slider track area */}
            <div style={{ position: 'relative', paddingBottom: 32 }}>
              {/* Floating bubble */}
              <div style={{
                position: 'absolute',
                left: `${Math.min(Math.max(pct, 5), 92)}%`,
                top: -50,
                transform: 'translateX(-50%)',
                background: 'var(--color-acc)', color: '#fff',
                borderRadius: 20, padding: '6px 14px',
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1,
                boxShadow: '0 2px 8px rgba(22,212,106,0.35)',
              }}>
                {isClubMode ? 'Club only' : `${distMiles} miles`}
                {/* Arrow */}
                <div style={{
                  position: 'absolute', bottom: -7, left: '50%',
                  transform: 'translateX(-50%)', width: 0, height: 0,
                  borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                  borderTop: '7px solid var(--color-acc)',
                }} />
              </div>

              {/* Custom track */}
              <div style={{ position: 'relative', height: 6, background: 'var(--color-surf-2)', borderRadius: 999, margin: '0 4px' }}>
                {/* Filled portion */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`, background: 'var(--color-acc)', borderRadius: 999,
                }} />
                {/* Thumb */}
                <input
                  type="range" min={MIN_MI} max={MAX_MI} step={1}
                  value={distMiles}
                  onChange={e => setDistMiles(Number(e.target.value))}
                  style={{
                    position: 'absolute', inset: 0, width: '100%',
                    opacity: 0, cursor: 'pointer', height: '100%', margin: 0,
                    zIndex: 2,
                  }}
                />
                {/* Thumb visual */}
                <div style={{
                  position: 'absolute', top: '50%',
                  left: `${pct}%`, transform: 'translate(-50%, -50%)',
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--color-acc)',
                  boxShadow: '0 2px 8px rgba(22,212,106,0.5)',
                  pointerEvents: 'none', zIndex: 3,
                }} />
              </div>

              {/* Min/Max labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 2px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>Club</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>50 mi</span>
              </div>
            </div>

            {/* Club picker — shown only at 0 miles */}
            {isClubMode && (
              <div style={{ marginTop: 4, marginBottom: 8 }}>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)',
                  marginBottom: 10, marginTop: 0,
                }}>
                  Select clubs to show players from:
                </p>
                {myClubs.length === 0 ? (
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)',
                    margin: 0, padding: '14px 0',
                  }}>
                    You haven't joined any clubs yet.
                  </p>
                ) : (
                  myClubs.map(club => {
                    const selected = localSelectedClubs.includes(club.id);
                    return (
                      <button
                        key={club.id}
                        onClick={() => setLocalSelectedClubs(prev =>
                          selected ? prev.filter(id => id !== club.id) : [...prev, club.id]
                        )}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '12px 14px', marginBottom: 8,
                          borderRadius: 12,
                          border: `1.5px solid ${selected ? 'var(--color-acc)' : 'var(--color-bdr)'}`,
                          background: selected ? 'var(--color-acc-bg)' : 'var(--color-surf)',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-body)', fontWeight: 600,
                          fontSize: 14, color: 'var(--color-t1)', flex: 1,
                        }}>
                          {club.name}
                        </span>
                        {selected && (
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--color-acc)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={() => {
                if (isClubMode) {
                  onDistanceChange(0);
                  onClubSelectionChange(localSelectedClubs);
                } else {
                  onDistanceChange(Math.round(distMiles / 0.621));
                  onClubSelectionChange([]);
                }
                onClose();
              }}
              style={{
                marginTop: 16, width: '100%', padding: '14px 0',
                borderRadius: 999, border: 'none',
                background: 'var(--color-acc)', color: '#fff',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        );
      })()}

      {activeFilter === 'skill' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {skills.map((s) => (
            <button
              key={s}
              onClick={() => { onSkillChange(s); onClose(); }}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: skill === s ? 'var(--color-acc)' : 'var(--color-surf-2)',
                border: skill === s ? '2px solid var(--color-acc)' : '1px solid var(--color-bdr)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: skill === s ? '#fff' : 'var(--color-t1)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              {SKILL_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: usePopover ? 'transparent' : 'rgba(0,0,0,0.5)',
              zIndex: 999,
            }}
            onClick={onClose}
          />

          {usePopover ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: popoverPos?.top ?? 80,
                left: popoverPos?.left ?? 0,
                width: 300,
                background: 'var(--color-surf)',
                border: '1px solid var(--color-bdr)',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--color-bdr)',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
                  color: 'var(--color-t1)', margin: 0,
                }}>
                  {getTitle()}
                </h3>
                <button onClick={onClose} style={{
                  width: 28, height: 28, borderRadius: 9999,
                  background: 'var(--color-surf-2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }} aria-label="Close">
                  <X size={14} style={{ color: 'var(--color-t2)' }} />
                </button>
              </div>
              {/* Content */}
              <div style={{ padding: 18, maxHeight: 400, overflowY: 'auto' }}>
                {contentSections}
              </div>
            </motion.div>
          ) : (
            /* Bottom Sheet */
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxWidth: 430,
                margin: '0 auto',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                background: 'var(--color-surf)',
                border: '1px solid var(--color-bdr)',
                borderBottom: 'none',
                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Handle bar */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <div style={{ width: 48, height: 4, borderRadius: 9999, background: 'var(--color-bdr)' }} />
              </div>

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--color-bdr)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 600,
                    color: 'var(--color-t1)',
                    margin: 0,
                  }}
                >
                  {getTitle()}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    background: 'var(--color-surf-2)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Close"
                >
                  <X size={18} style={{ color: 'var(--color-t2)' }} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {contentSections}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
