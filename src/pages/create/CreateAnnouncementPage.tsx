import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';

interface Club {
  id: string;
  name: string;
  sport?: string;
  memberCount?: number;
}

export function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [taggedSport, setTaggedSport] = useState<SportType | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserClubs();
    }
  }, [user]);

  const fetchUserClubs = async () => {
    const { data } = await supabase
      .from('user_clubs')
      .select('club_id, clubs(id, name)')
      .eq('user_id', user!.id);

    if (data) {
      const clubList = data
        .filter((d) => d.clubs)
        .map((d) => ({
          id: (d.clubs as unknown as { id: string; name: string }).id,
          name: (d.clubs as unknown as { id: string; name: string }).name,
        }));
      setClubs(clubList);
      if (clubList.length === 1) {
        setSelectedClub(clubList[0]);
      }
    }
  };

  const canSubmit = selectedClub && title.trim() && body.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feed_items').insert({
        type: 'announcement',
        club_id: selectedClub!.id,
        author_id: user!.id,
        title,
        content: body,
        image_url: imageUrl || null,
        audience_type: 'club',
        audience_id: selectedClub!.id,
        metadata: taggedSport ? { tagged_sport: taggedSport } : {},
      });

      if (error) throw error;

      navigate(-1);
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSports = Object.keys(SPORTS) as SportType[];

  // ─── shared style helpers ────────────────────────────────────────────────────
  const fieldLabel: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    color: 'var(--color-t1)', marginBottom: 8,
  };
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
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8, color: 'var(--color-t2)', display: 'flex' }}>
            <X size={22} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>Create Announcement</h1>
          <div style={{ width: 38 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* Select Club */}
        <div>
          <label style={fieldLabel}>Select Club</label>
          {clubs.length === 0 ? (
            <p style={caption}>Join a club to post announcements.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                    borderRadius: 'var(--radius-xl)',
                    background: selectedClub?.id === club.id ? 'color-mix(in srgb, var(--color-acc) 10%, transparent)' : 'var(--color-surf-2)',
                    border: selectedClub?.id === club.id ? '2px solid var(--color-acc)' : '2px solid transparent',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--color-acc) 15%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-acc)' }}>
                      {club.name.charAt(0)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--color-t1)', margin: 0 }}>{club.name}</p>
                    {club.memberCount && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0 }}>{club.memberCount} members</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        {selectedClub && (
          <>
            <div>
              <label style={fieldLabel}>Title *</label>
              <input
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Body */}
            <div>
              <label style={fieldLabel}>Body *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What would you like to share with the club?"
                rows={5}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              />
            </div>

            {/* Attach Image */}
            <div>
              <label style={fieldLabel}>Attach Image (Optional)</label>
              {imageUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imageUrl}
                    alt="Attachment"
                    style={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
                  />
                  <button
                    onClick={() => setImageUrl('')}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      padding: 8, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                      border: 'none', cursor: 'pointer', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    placeholder="Paste image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={inputStyle}
                  />
                  <p style={caption}>Enter an image URL to attach to your announcement.</p>
                </>
              )}
            </div>

            {/* Tag a Sport */}
            <div>
              <label style={fieldLabel}>Tag a Sport (Optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allSports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setTaggedSport(taggedSport === sport ? null : sport)}
                    style={chip(taggedSport === sport)}
                  >
                    {SPORTS[sport]?.name || sport}
                  </button>
                ))}
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
              {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </button>
          </>
        )}

        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>
    </div>
  );
}
