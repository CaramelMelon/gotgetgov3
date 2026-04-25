import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { getInitials } from '@/lib/avatar-utils';

type GroupType = 'circle' | 'team';

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function CreateCirclePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('circle');
  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invitedMembers, setInvitedMembers] = useState<Connection[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    const [sportsRes, connectionsRes] = await Promise.all([
      supabase.from('user_sport_profiles').select('sport').eq('user_id', user!.id),
      supabase.from('connections').select(`
        id,
        connected_user_id,
        profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)
      `).eq('user_id', user!.id).eq('status', 'accepted'),
    ]);

    if (sportsRes.data) {
      setUserSports(sportsRes.data.map((d) => d.sport as SportType));
    }

    if (connectionsRes.data) {
      const connectionList = connectionsRes.data
        .filter((d) => d.profiles)
        .map((d) => {
          const profile = d.profiles as unknown as { id: string; full_name: string; avatar_url?: string };
          return {
            id: profile.id,
            name: profile.full_name,
            avatarUrl: profile.avatar_url,
          };
        });
      setConnections(connectionList);
    }
  };

  const selectMember = (member: Connection) => {
    if (!invitedMembers.find((m) => m.id === member.id)) {
      setInvitedMembers([...invitedMembers, member]);
    }
    setShowMemberPicker(false);
  };

  const removeMember = (id: string) => {
    setInvitedMembers(invitedMembers.filter((m) => m.id !== id));
  };

  const filteredConnections = connections.filter((c) =>
    c.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
    !invitedMembers.find((m) => m.id === c.id)
  );

  const canSubmit = name.trim() &&
    (groupType === 'circle' || (groupType === 'team' && selectedSport));

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setIsSubmitting(true);

    try {
      if (groupType === 'circle') {
        const { data: circle, error: circleError } = await supabase.from('circles').insert({
          name: name.trim(),
          created_by: user.id,
        }).select().single();

        if (circleError) {
          console.error('Circle creation error:', circleError);
          throw circleError;
        }

        const { error: memberError } = await supabase.from('circle_members').insert({
          circle_id: circle.id,
          user_id: user.id,
          role: 'admin',
        });

        if (memberError) {
          console.error('Circle member insert error:', memberError);
        }

        for (const member of invitedMembers) {
          const { error: inviteError } = await supabase.from('circle_members').insert({
            circle_id: circle.id,
            user_id: member.id,
            role: 'member',
          });
          if (inviteError) {
            console.error('Invite member error:', inviteError);
          }
        }
      } else {
        const { data: team, error: teamError } = await (supabase.from('teams') as any).insert({
          name: name.trim(),
          sport: selectedSport,
          created_by: user.id,
        }).select().single();

        if (teamError) {
          console.error('Team creation error:', teamError);
          throw teamError;
        }

        const { error: memberError } = await supabase.from('team_members').insert({
          team_id: team.id,
          user_id: user.id,
        });

        if (memberError) {
          console.error('Team member insert error:', memberError);
        }

        for (const member of invitedMembers) {
          const { error: inviteError } = await supabase.from('team_members').insert({
            team_id: team.id,
            user_id: member.id,
          });
          if (inviteError) {
            console.error('Team invite member error:', inviteError);
          }
        }
      }

      navigate('/circles');
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── shared style helpers ────────────────────────────────────────────────────
  const fieldLabel: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    color: 'var(--color-t1)', marginBottom: 8,
  };
  const pill = (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '12px 0', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
    border: 'none', cursor: 'pointer',
    background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
    color: active ? '#fff' : 'var(--color-t2)',
    transition: 'background 0.15s, color 0.15s',
  });
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    border: active ? 'none' : '1px solid var(--color-bdr)',
    cursor: 'pointer',
    background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
    color: active ? '#fff' : 'var(--color-t2)',
    transition: 'background 0.15s',
  });
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    borderRadius: 'var(--radius-xl)',
    fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)',
    background: 'var(--color-surf-2)',
    border: '1px solid var(--color-bdr)',
    outline: 'none', boxSizing: 'border-box',
  };
  const caption: React.CSSProperties = {
    fontFamily: 'var(--font-body)', fontSize: 12,
    color: 'var(--color-t3)', marginTop: 6,
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-bdr)',
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px var(--space-5)', maxWidth: 480, margin: '0 auto' }}>
          <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8, color: 'var(--color-t2)', display: 'flex' }}>
            <X size={22} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>Create Circle / Team</h1>
          <div style={{ width: 38 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* Name */}
        <div>
          <label style={fieldLabel}>Name *</label>
          <input
            placeholder={groupType === 'circle' ? 'e.g. Tuesday Night Crew' : 'e.g. Smith & Jones'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Type */}
        <div>
          <label style={fieldLabel}>Type *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setGroupType('circle'); setInvitedMembers(invitedMembers.slice(0, 10)); }}
              style={pill(groupType === 'circle')}
            >
              Circle
            </button>
            <button
              onClick={() => { setGroupType('team'); setInvitedMembers(invitedMembers.slice(0, 1)); }}
              style={pill(groupType === 'team')}
            >
              Team
            </button>
          </div>
          <p style={caption}>
            {groupType === 'circle'
              ? 'A group for organizing play sessions with multiple people.'
              : 'A doubles pair for competing together.'}
          </p>
        </div>

        {/* Sport (for teams) */}
        {groupType === 'team' && (
          <div>
            <label style={fieldLabel}>Sport *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {userSports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  style={chip(selectedSport === sport)}
                >
                  {SPORTS[sport]?.name || sport}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Invite Members */}
        <div>
          <label style={fieldLabel}>Invite Members (Optional)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invitedMembers.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-xl)', background: 'var(--color-surf-2)' }}>
                <PlayerAvatar name={member.name} avatarUrl={member.avatarUrl} size={34} />
                <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)' }}>{member.name}</span>
                <button onClick={() => removeMember(member.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)', padding: 4, display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowMemberPicker(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 'var(--radius-xl)', border: '1.5px dashed var(--color-bdr)', background: 'none', color: 'var(--color-t3)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}
            >
              <Plus size={18} /> Invite
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={{
            width: '100%', padding: '15px', borderRadius: 'var(--radius-full)',
            border: 'none', cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            background: canSubmit && !isSubmitting ? 'var(--color-acc)' : 'var(--color-surf-2)',
            color: canSubmit && !isSubmitting ? '#fff' : 'var(--color-t3)',
            transition: 'background 0.15s',
            boxShadow: canSubmit && !isSubmitting ? '0 4px 16px rgba(22,212,106,0.3)' : 'none',
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>

        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>

      {/* Member Picker sheet */}
      <AnimatePresence>
        {showMemberPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
              onClick={() => setShowMemberPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, borderRadius: '20px 20px 0 0', maxHeight: '70dvh', overflow: 'hidden', background: 'var(--color-surf)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr-s)' }} />
              </div>
              <div style={{ padding: '0 var(--space-5) var(--space-5)', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>Select Members</h3>
                <div style={{ position: 'relative' }}>
                  <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                  <input
                    placeholder="Search connections..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: '40dvh' }}>
                  {filteredConnections.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}>No connections found</p>
                  ) : (
                    filteredConnections.map((connection) => (
                      <button
                        key={connection.id}
                        onClick={() => selectMember(connection)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-xl)', border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      >
                        <PlayerAvatar name={connection.name} avatarUrl={connection.avatarUrl} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--color-t1)', margin: 0 }}>{connection.name}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Small avatar helper ───────────────────────────────────────────────────────
function PlayerAvatar({ name, avatarUrl, size }: { name: string; avatarUrl?: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-acc-bg)', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.35, fontWeight: 700, color: 'var(--color-acc)' }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
