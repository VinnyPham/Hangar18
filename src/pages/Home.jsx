import { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { getRecentSends, getActiveRoutes, getRecentClips } from '../services/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const HOLD_COLORS = {
  yellow: { bg: '#FFD600', text: '#000' },
  green:  { bg: '#4CAF50', text: '#fff' },
  blue:   { bg: '#2196F3', text: '#fff' },
  red:    { bg: '#F44336', text: '#fff' },
  black:  { bg: '#424242', text: '#fff' },
  white:  { bg: '#F5F5F5', text: '#000' },
  pink:   { bg: '#E91E63', text: '#fff' },
  orange: { bg: '#FF9800', text: '#000' },
  purple: { bg: '#9C27B0', text: '#fff' },
};

function GradePill({ grade, color }) {
  const c = HOLD_COLORS[color?.toLowerCase()] ?? { bg: '#555', text: '#fff' };
  return (
    <span className="grade-pill" style={{ background: c.bg, color: c.text }}>
      {grade}
    </span>
  );
}

function SendBadge({ type }) {
  return <span className={`send-badge send-badge--${type}`}>{type}</span>;
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Send card ─────────────────────────────────────────────────────────────────
function SendCard({ send }) {
  const { profiles: user, routes: route } = send;
  return (
    <div className="card" style={{ padding: '0.9rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <img
        src={user?.avatar_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${user?.username}`}
        alt={user?.username}
        className="avatar avatar--md"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="font-display" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {user?.username ?? 'Climber'}
          </span>
          <SendBadge type={send.send_type} />
          <span className="text-muted text-xs" style={{ marginLeft: 'auto' }}>{timeAgo(send.created_at)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
          <GradePill grade={route?.grade} color={route?.color} />
          <span className="truncate text-sm" style={{ fontWeight: 500 }}>{route?.name}</span>
          {route?.wall_section && (
            <span className="text-muted text-xs" style={{ flexShrink: 0 }}>{route.wall_section}</span>
          )}
        </div>
        {send.notes && (
          <p className="text-sm text-muted" style={{ marginTop: '0.35rem', lineHeight: 1.4 }}>{send.notes}</p>
        )}
      </div>
    </div>
  );
}

// ─── Route row ─────────────────────────────────────────────────────────────────
function RouteRow({ route }) {
  return (
    <div
      className="card"
      style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', minHeight: '60px' }}
    >
      <GradePill grade={route.grade} color={route.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-display truncate" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{route.name}</p>
        <p className="text-xs text-muted">{route.wall_section ?? 'Main wall'}</p>
      </div>
      {route.setter && (
        <span className="text-xs text-muted" style={{ flexShrink: 0 }}>by {route.setter}</span>
      )}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </div>
  );
}

// ─── Clip card ─────────────────────────────────────────────────────────────────
function ClipCard({ clip }) {
  const { profiles: user, routes: route } = clip;
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ aspectRatio: '9/16', background: 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
        {clip.thumbnail_url ? (
          <img src={clip.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem' }}>
          <GradePill grade={route?.grade} color={route?.color} />
        </div>
      </div>
      <div style={{ padding: '0.6rem 0.7rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <img
            src={user?.avatar_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${user?.username}`}
            alt={user?.username}
            className="avatar avatar--sm"
          />
          <span className="text-xs font-display truncate" style={{ fontWeight: 600 }}>{user?.username}</span>
        </div>
        {clip.caption && (
          <p className="text-xs text-muted truncate" style={{ marginTop: '0.25rem' }}>{clip.caption}</p>
        )}
      </div>
    </div>
  );
}

// ─── Hero (logged-out) ────────────────────────────────────────────────────────
function Hero({ login }) {
  return (
    <section style={{ padding: '2.5rem 0 2rem', textAlign: 'center' }}>
      <p className="section-label" style={{ marginBottom: '0.75rem' }}>Your local gym, tracked</p>
      <h1 style={{ letterSpacing: '-0.03em', marginBottom: '1rem' }}>
        Log your sends.<br />
        <span style={{ color: 'var(--accent)' }}>Own your progress.</span>
      </h1>
      <p className="text-muted text-sm" style={{ maxWidth: '320px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
        Track every route you've touched, clip your sends, and see what's fresh on the wall.
      </p>
      <button
        className="btn btn-primary btn-full"
        onClick={login}
        style={{ maxWidth: '280px', margin: '0 auto', fontSize: '0.95rem' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeletons({ count = 3, height = 80 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="skeleton" style={{ height, borderRadius: 'var(--radius)' }} />
  ));
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
      <h2 style={{ fontSize: '1rem' }}>{title}</h2>
      {meta && <span className="section-label">{meta}</span>}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { session, login } = useAuth();
  const [tab,    setTab]    = useState('sends'); // 'sends' | 'routes' | 'clips'
  const [sends,  setSends]  = useState(null);
  const [routes, setRoutes] = useState(null);
  const [clips,  setClips]  = useState(null);

  useEffect(() => {
    getRecentSends(20).then(({ data })  => setSends(data  ?? []));
    getActiveRoutes().then(({ data })   => setRoutes(data ?? []));
    getRecentClips(12).then(({ data })  => setClips(data  ?? []));
  }, []);

  return (
    <>
      <div className="container page-content">
        {!session && <Hero login={login} />}

        {/* In-page tabs — mobile-friendly single-column layout */}
        <div className="tabs">
          {[
            { id: 'sends',  label: 'Sends' },
            { id: 'routes', label: 'On the wall' },
            { id: 'clips',  label: 'Clips' },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Sends tab ── */}
        {tab === 'sends' && (
          <section>
            <SectionHead title="Recent sends" meta={sends ? `${sends.length} logged` : ''} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {sends === null
                ? <Skeletons count={5} height={88} />
                : sends.length === 0
                  ? <p className="text-muted text-sm">No sends yet — be the first!</p>
                  : sends.map(s => <SendCard key={s.id} send={s} />)
              }
            </div>
          </section>
        )}

        {/* ── Routes tab ── */}
        {tab === 'routes' && (
          <section>
            <SectionHead title="Active routes" meta={routes ? `${routes.length} routes` : ''} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {routes === null
                ? <Skeletons count={6} height={64} />
                : routes.length === 0
                  ? <p className="text-muted text-sm">No active routes.</p>
                  : routes.map(r => <RouteRow key={r.id} route={r} />)
              }
            </div>
          </section>
        )}

        {/* ── Clips tab ── */}
        {tab === 'clips' && (
          <section>
            <SectionHead title="Latest clips" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {clips === null
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ aspectRatio: '9/16', borderRadius: 'var(--radius)' }} />
                  ))
                : clips.length === 0
                  ? <p className="text-muted text-sm">No clips yet.</p>
                  : clips.map(c => <ClipCard key={c.id} clip={c} />)
              }
            </div>
          </section>
        )}
      </div>

      {/* FAB — log a send (only when logged in) */}
      {session && (
        <button className="fab" aria-label="Log a send">
          +
        </button>
      )}
    </>
  );
}