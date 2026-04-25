import { useState, useEffect } from 'react';
import { X, Search, Check, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createGroup } from '@/lib/messaging';
import { getInitials } from '@/lib/avatar-utils';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (conversationId: string) => void;
}

const AVATAR_COLORS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF5722',
  '#00BCD4', '#FF9800', '#E91E63', '#3F51B5',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user?.id) loadConnections();
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) {
      setGroupName('');
      setSelectedIds(new Set());
      setSearch('');
      setError('');
    }
  }, [open]);

  const loadConnections = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [outRes, inRes] = await Promise.all([
      (supabase.from('connections').select('profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)').eq('user_id', user.id).eq('status', 'accepted')) as any,
      (supabase.from('connections').select('profiles!connections_user_id_fkey(id, full_name, avatar_url)').eq('connected_user_id', user.id).eq('status', 'accepted')) as any,
    ]);
    const seen = new Set<string>();
    const list: Connection[] = [];
    for (const row of (outRes.data || [])) {
      const p = row.profiles;
      if (p && !seen.has(p.id)) { seen.add(p.id); list.push({ id: p.id, name: p.full_name, avatarUrl: p.avatar_url || undefined }); }
    }
    for (const row of (inRes.data || [])) {
      const p = row.profiles;
      if (p && !seen.has(p.id)) { seen.add(p.id); list.push({ id: p.id, name: p.full_name, avatarUrl: p.avatar_url || undefined }); }
    }
    setConnections(list.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 49) next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!user?.id || !groupName.trim() || selectedIds.size === 0) return;
    setSubmitting(true);
    setError('');
    const result = await createGroup({ name: groupName.trim(), creatorId: user.id, memberIds: [...selectedIds] });
    setSubmitting(false);
    if (result.error || !result.conversationId) { setError(result.error || 'Failed to create group'); return; }
    onGroupCreated(result.conversationId);
    onOpenChange(false);
  };

  const filtered = connections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const canCreate = groupName.trim().length > 0 && selectedIds.size >= 1;

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-bg)',
          borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90dvh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-acc-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={18} style={{ color: 'var(--color-acc)' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--color-t1)', margin: 0 }}>
                New Group
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0 }}>
                {selectedIds.size} of 49 members selected
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'var(--color-surf)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-t2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Group name input */}
        <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
          <input
            placeholder="Group name (required)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={100}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 16px',
              borderRadius: 14,
              border: '1.5px solid var(--color-bdr)',
              background: 'var(--color-surf)',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
              color: 'var(--color-t1)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-acc)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-bdr)'}
          />
        </div>

        {/* Selected chips */}
        {selectedIds.size > 0 && (
          <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[...selectedIds].map((id) => {
                const conn = connections.find((c) => c.id === id);
                if (!conn) return null;
                return (
                  <button
                    key={id}
                    onClick={() => toggleSelect(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px 5px 6px', borderRadius: 999, border: 'none',
                      background: 'var(--color-acc-bg)', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', overflow: 'hidden',
                      background: avatarColor(conn.name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {conn.avatarUrl
                        ? <img src={conn.avatarUrl} alt={conn.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, color: '#fff' }}>{getInitials(conn.name)}</span>
                      }
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-acc)' }}>
                      {conn.name}
                    </span>
                    <X size={10} style={{ color: 'var(--color-acc)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '0 20px 10px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search connections…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px 10px 36px',
                borderRadius: 12,
                border: '1.5px solid var(--color-bdr)',
                background: 'var(--color-surf)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--color-t1)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Connection list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 8px' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid var(--color-acc)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)' }}>
              {connections.length === 0 ? 'No connections yet' : 'No results'}
            </p>
          )}
          {!loading && filtered.map((conn) => {
            const isSelected = selectedIds.has(conn.id);
            return (
              <button
                key={conn.id}
                onClick={() => toggleSelect(conn.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 14, border: 'none',
                  background: isSelected ? 'var(--color-acc-bg)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'background 0.12s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: 13, flexShrink: 0, overflow: 'hidden',
                  background: avatarColor(conn.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {conn.avatarUrl
                    ? <img src={conn.avatarUrl} alt={conn.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#fff' }}>{getInitials(conn.name)}</span>
                  }
                </div>

                <span style={{
                  flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
                  color: 'var(--color-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {conn.name}
                </span>

                {/* Checkbox */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: isSelected ? 'none' : '1.5px solid var(--color-bdr)',
                  background: isSelected ? 'var(--color-acc)' : 'var(--color-surf)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.12s, border 0.12s',
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                }}>
                  {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ textAlign: 'center', padding: '4px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-red)', flexShrink: 0 }}>{error}</p>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px 32px', flexShrink: 0 }}>
          <button
            onClick={handleCreate}
            disabled={!canCreate || submitting}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 16, border: 'none',
              background: canCreate ? 'var(--color-acc)' : 'var(--color-surf)',
              color: canCreate ? '#fff' : 'var(--color-t3)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
              cursor: canCreate ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
              boxShadow: canCreate ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {submitting ? 'Creating…' : `Create Group${selectedIds.size > 0 ? ` (${selectedIds.size + 1} members)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
