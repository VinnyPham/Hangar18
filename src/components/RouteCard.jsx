// RouteCard.jsx
// Props:
//   route        — route row from DB
//   userSendType — 'flash' | 'send' | 'attempt' | null
//   onSelect     — called when card is tapped (optional)

import { useState, useRef, useEffect } from 'react';
import { getSession, uploadClipVideo, postClip, logSend } from '../services/supabase';

const HOLD_COLORS = {
  yellow: '#FFD600', green: '#4CAF50', blue: '#2196F3',
  red: '#F44336', black: '#424242', white: '#E0E0E0',
  pink: '#E91E63', orange: '#FF9800', purple: '#9C27B0',
};

const SEND_BADGE = {
  flash:   { label: 'Flash', cls: 'badge-flash' },
  send:    { label: 'Sent',  cls: 'badge-send' },
  attempt: { label: 'Tried', cls: 'badge-tried' },
};

function cleanGrade(grade) {
  if (typeof grade !== 'string') return grade;
  return grade.split(' ')[0];
}

function Icon({ name, style }) {
  const common = { width: 18, height: 18, ...style };
  switch (name) {
    case 'chevron-right':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <path d="M18 6 6 18M6 6 18 18" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'bolt':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <path d="M4 4v6h6M20 20v-6h-6" />
          <path d="M5 9a7 7 0 0 1 11-5M19 15a7 7 0 0 1-11 5" />
        </svg>
      );
    case 'video':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <rect x="3" y="5" width="14" height="14" rx="3" />
          <polygon points="14 9 20 12 14 15 14 9" />
        </svg>
      );
    case 'link':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <path d="M10 14a3.5 3.5 0 0 1 0-5L12 7a3.5 3.5 0 0 1 5 0l1 1a3.5 3.5 0 0 1 0 5" />
          <path d="M14 10a3.5 3.5 0 0 1 0 5L12 17a3.5 3.5 0 0 1-5 0l-1-1a3.5 3.5 0 0 1 0-5" />
        </svg>
      );
    case 'circle-check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Inline styles ────────────────────────────────────────────────────────────
const S = {
  // card list item
  card: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 11,
    padding: '13px 14px',
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-lg)',
    cursor: 'pointer', textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
    transition: 'border-color .15s',
  },
  hold: { width: 34, height: 34, borderRadius: '50%', flexShrink: 0 },
  grade: {
    fontSize: 12, fontWeight: 500,
    padding: '3px 8px', borderRadius: 6,
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-secondary)', flexShrink: 0,
  },
  routeName: {
    fontSize: 14, fontWeight: 500,
    color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  setter: { fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 1 },
  badge: {
    base: { fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, flexShrink: 0 },
    flash:   { background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' },
    send:    { background: 'var(--color-background-success)',  color: 'var(--color-text-success)' },
    attempt: { background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)', border: '0.5px solid var(--color-border-tertiary)' },
  },
  chevron: { color: 'var(--color-text-tertiary)', flexShrink: 0, fontSize: 16 },

  // overlay + sheet
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 900, display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    background: '#0F0F1A',
    borderRadius: '20px 20px 0 0',
    width: '100%', maxHeight: '88vh', overflowY: 'auto',
    paddingBottom: '2rem',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    background: 'var(--color-border-secondary)',
    margin: '12px auto 0',
  },
  sheetHeader: {
    padding: '16px 18px 14px',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  sheetHold: { width: 42, height: 42, borderRadius: '50%', flexShrink: 0 },
  sheetTitle: { fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' },
  sheetSub: { fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 },
  closeBtn: {
    marginLeft: 'auto',
    background: 'var(--color-background-secondary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: '50%', width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--color-text-secondary)',
    fontSize: 16, flexShrink: 0,
  },

  // tabs
  tabBar: {
    display: 'flex', margin: '14px 18px 0',
    background: 'var(--color-background-secondary)',
    borderRadius: 10, padding: 3, gap: 3,
  },
  tab: (active) => ({
    flex: 1, padding: '8px 0', textAlign: 'center',
    fontSize: 13, fontWeight: 500, borderRadius: 8,
    cursor: 'pointer', border: 'none', transition: 'all .15s',
    background: active ? '#2F80ED' : 'transparent',
    color: active ? '#FFFFFF' : 'var(--color-text-tertiary)',
    boxShadow: active ? '0 0 0 0.5px rgba(47, 128, 237, 0.35)' : 'none',
  }),

  // log panel
  panel: { padding: 18 },
  fieldLabel: { fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 8 },
  attemptsRow: {
    display: 'flex', alignItems: 'center',
    background: 'var(--color-background-secondary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-md)',
    overflow: 'hidden', width: 'fit-content', marginBottom: 20,
  },
  attBtn: {
    width: 44, height: 44, background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 22,
    color: 'var(--color-text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  attVal: {
    fontSize: 16, fontWeight: 500,
    color: 'var(--color-text-primary)',
    minWidth: 40, textAlign: 'center',
  },
  logBtn: (loading) => ({
    width: '100%', height: 46,
    background: 'var(--color-background-info)',
    color: 'var(--color-text-info)',
    border: '0.5px solid var(--color-border-info)',
    borderRadius: 'var(--border-radius-lg)',
    fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: loading ? 0.6 : 1,
  }),

  // clip panel
  uploadZone: {
    border: '0.5px dashed var(--color-border-secondary)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '28px 16px', textAlign: 'center',
    cursor: 'pointer', marginBottom: 16, transition: 'border-color .15s',
  },
  uploadIcon: { fontSize: 26, color: 'var(--color-text-tertiary)', marginBottom: 8, display: 'block' },
  uploadTitle: { fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 },
  uploadSub: { fontSize: 12, color: 'var(--color-text-tertiary)' },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  divLine: { flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' },
  divText: { fontSize: 12, color: 'var(--color-text-tertiary)' },
  linkRow: { display: 'flex', gap: 8 },
  attachBtn: {
    height: 36, padding: '0 14px',
    background: 'var(--color-background-secondary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: 14, fontWeight: 500,
    color: 'var(--color-text-primary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    whiteSpace: 'nowrap',
  },
  textInput: {
    width: '100%', padding: '12px 14px', borderRadius: '16px', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 14,
  },
  chips: { display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  chip: {
    fontSize: 11, padding: '4px 10px', borderRadius: 20,
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-tertiary)',
    border: '0.5px solid var(--color-border-tertiary)',
  },
  error: { fontSize: 13, color: 'var(--color-text-danger)', marginTop: 10 },
  success: { fontSize: 13, color: 'var(--color-text-success)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function RouteCard({ route, userSendType = null, onSelect }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('log');

  // log send state
  const [attempts, setAttempts] = useState(1);
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState(null);
  const [logSuccess, setLogSuccess] = useState(false);

  // clip state
  const [clipFile, setClipFile] = useState(null);
  const [clipLink, setClipLink] = useState('');
  const [clipSaving, setClipSaving] = useState(false);
  const [clipError, setClipError] = useState(null);
  const [clipSuccess, setClipSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const holdColor = HOLD_COLORS[route.color?.toLowerCase()] ?? '#888';
  const displayGrade = cleanGrade(route.grade);
  const badge = userSendType ? SEND_BADGE[userSendType] : null;

  // lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const openSheet = () => {
    setAttempts(1);
    setLogError(null); setLogSuccess(false);
    setClipFile(null); setClipLink(''); setClipError(null); setClipSuccess(false);
    setActiveTab('log');
    setOpen(true);
    onSelect?.(route);
  };

  const closeSheet = () => setOpen(false);

  // ── Log send ───────────────────────────────────────────────────────────────
  const handleLogSend = async () => {
    setLogSaving(true); setLogError(null); setLogSuccess(false);
    try {
      const { data: sessionData } = await getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Sign in to log a send.');
      const result = await logSend({ userId, routeId: route.id, attempts });
      if (result.error) {
        console.error('logSend error', result.error, result.data);
        throw new Error(result.error.message || 'Failed to log send');
      }
      setLogSuccess(true);
      setTimeout(closeSheet, 1200);
    } catch (err) {
      console.error('handleLogSend catch', err);
      setLogError(err.message || 'Something went wrong.');
    } finally {
      setLogSaving(false);
    }
  };

  // ── Upload video ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!clipFile) { setClipError('Pick a video first.'); return; }
    setClipSaving(true); setClipError(null); setClipSuccess(false);
    try {
      const { data: sessionData } = await getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Sign in to upload a clip.');
      const videoUrl = await uploadClipVideo(userId, clipFile);
      await postClip({ userId, routeId: route.id, videoUrl, caption: '' });
      setClipSuccess(true);
      setTimeout(closeSheet, 1200);
    } catch (err) {
      setClipError(err.message || 'Upload failed.');
    } finally {
      setClipSaving(false);
    }
  };

  // ── Attach link ────────────────────────────────────────────────────────────
  const handleAttachLink = async () => {
    if (!clipLink.trim()) { setClipError('Paste a link first.'); return; }
    setClipSaving(true); setClipError(null); setClipSuccess(false);
    try {
      const { data: sessionData } = await getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Sign in to attach a clip.');
      await postClip({ userId, routeId: route.id, videoUrl: clipLink.trim(), caption: '' });
      setClipSuccess(true);
      setTimeout(closeSheet, 1200);
    } catch (err) {
      setClipError(err.message || 'Something went wrong.');
    } finally {
      setClipSaving(false);
    }
  };

  return (
    <>
      {/* ── Card ── */}
      <button
        onClick={openSheet}
        style={S.card}
        onTouchStart={e => e.currentTarget.style.borderColor = 'var(--color-border-secondary)'}
        onTouchEnd={e => e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'}
      >
        <div style={{ ...S.hold, background: holdColor }} />
        <span style={S.grade}>{displayGrade}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.routeName}>{route.name}</div>
          {route.setter && <div style={S.setter}>Set by {route.setter}</div>}
        </div>
        {badge && (
          <span style={{ ...S.badge.base, ...S.badge[userSendType] }}>
            {badge.label}
          </span>
        )}
        <Icon name="chevron-right" style={S.chevron} />
      </button>

      {/* ── Bottom sheet ── */}
      {open && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && closeSheet()}>
          <div style={S.sheet}>
            <div style={S.handle} />

            {/* Header */}
            <div style={S.sheetHeader}>
              <div style={{ ...S.sheetHold, background: holdColor }} />
              <div>
                <div style={S.sheetTitle}>{route.name}</div>
                <div style={S.sheetSub}>{displayGrade}{route.setter ? ` · Set by ${route.setter}` : ''}</div>
              </div>
              <button style={S.closeBtn} onClick={closeSheet} aria-label="Close">
                <Icon name="x" style={{ color: 'currentColor' }} />
              </button>
            </div>

            {/* Tabs */}
            <div style={S.tabBar}>
              <button style={S.tab(activeTab === 'log')} onClick={() => setActiveTab('log')}>
                Log send
              </button>
              <button style={S.tab(activeTab === 'clip')} onClick={() => setActiveTab('clip')}>
                Add clip
              </button>
            </div>

            {/* ── Log send tab ── */}
            {activeTab === 'log' && (
              <div style={S.panel}>
                <div style={S.fieldLabel}>Attempts</div>
                <div style={S.attemptsRow}>
                  <button
                    style={S.attBtn}
                    onClick={() => setAttempts(a => Math.max(1, a - 1))}
                    aria-label="Decrease attempts"
                  >
                    −
                  </button>
                  <span style={S.attVal}>{attempts}</span>
                  <button
                    style={S.attBtn}
                    onClick={() => setAttempts(a => a + 1)}
                    aria-label="Increase attempts"
                  >
                    +
                  </button>
                </div>

                <button style={S.logBtn(logSaving)} onClick={handleLogSend} disabled={logSaving}>
                  <Icon name="check" style={{ width: 18, height: 18 }} />
                  {logSaving ? 'Logging…' : 'Log send'}
                </button>

                {logError && <div style={S.error}>{logError}</div>}
                {logSuccess && (
                  <div style={S.success}>
                    <Icon name="circle-check" style={{ width: 18, height: 18 }} />
                    Logged!
                  </div>
                )}
              </div>
            )}

            {/* ── Add clip tab ── */}
            {activeTab === 'clip' && (
              <div style={S.panel}>
                {/* Upload zone */}
                <div
                  style={{
                    ...S.uploadZone,
                    borderColor: clipFile ? 'var(--color-border-success)' : 'var(--color-border-secondary)',
                    background: clipFile ? 'var(--color-background-success)' : 'transparent',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon
                    name={clipFile ? 'circle-check' : 'video'}
                    style={{
                      width: 28,
                      height: 28,
                      color: clipFile ? 'var(--color-text-success)' : 'var(--color-text-tertiary)',
                      marginBottom: 10,
                    }}
                  />
                  <div style={S.uploadTitle}>
                    {clipFile ? clipFile.name : 'Upload a video'}
                  </div>
                  <div style={S.uploadSub}>
                    {clipFile ? 'Tap to change' : 'Tap to pick from your camera roll'}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={e => setClipFile(e.target.files?.[0] ?? null)}
                />
                {clipFile && (
                  <button
                    style={{ ...S.logBtn(clipSaving), marginBottom: 16 }}
                    onClick={handleUpload}
                    disabled={clipSaving}
                  >
                    <Icon name="check" style={{ width: 18, height: 18 }} />
                    {clipSaving ? 'Uploading…' : 'Upload video'}
                  </button>
                )}

                {/* Divider */}
                <div style={S.dividerRow}>
                  <div style={S.divLine} />
                  <span style={S.divText}>or paste a link</span>
                  <div style={S.divLine} />
                </div>

                {/* Link input */}
                <div style={S.linkRow}>
                  <input
                    type="url"
                    value={clipLink}
                    onChange={e => setClipLink(e.target.value)}
                    placeholder="https://instagram.com/reel/..."
                    style={S.textInput}
                  />
                  <button
                    style={{ ...S.attachBtn, opacity: clipSaving || !clipLink.trim() ? 0.5 : 1 }}
                    onClick={handleAttachLink}
                    disabled={clipSaving || !clipLink.trim()}
                  >
                    <Icon name="link" style={{ width: 16, height: 16 }} />
                    Attach
                  </button>
                </div>
                <div style={S.chips}>
                  <span style={S.chip}>Instagram</span>
                  <span style={S.chip}>TikTok</span>
                  <span style={S.chip}>YouTube</span>
                </div>

                {clipError && <div style={S.error}>{clipError}</div>}
                {clipSuccess && (
                  <div style={S.success}>
                    <Icon name="circle-check" style={{ width: 18, height: 18 }} />
                    Clip attached!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}