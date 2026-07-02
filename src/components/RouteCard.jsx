// RouteCard.jsx
// Props:
//   route        — route row from DB
//   userSendType — 'flash' | 'send' | 'attempt' | null
//   onSelect     — called when card is tapped (optional)

import { useState, useRef, useEffect } from 'react';
import { getSession, getRouteClips, uploadClipVideo, postClip, logSend, deleteClip } from '../services/supabase';

const HOLD_COLORS = {
  yellow: '#FFD600', green: '#4CAF50', blue: '#2196F3',
  red: '#F44336', black: '#424242', white: '#E0E0E0',
  pink: '#E91E63', orange: '#FF9800', purple: '#9C27B0',
};

const SEND_BADGE = {
  flash:   { label: 'Flash', style: { background: 'var(--bg-warning)', color: 'var(--text-warning)' } },
  send:    { label: 'Sent',  style: { background: 'var(--bg-success)', color: 'var(--text-success)' } },
  attempt: { label: 'Tried', style: { background: 'var(--surface-1)',  color: 'var(--text-muted)', border: '0.5px solid var(--border)' } },
};

function cleanGrade(grade) {
  if (typeof grade !== 'string') return grade;
  return grade.split(' ')[0];
}

function getPlatformMeta(url = '') {
  if (url.includes('youtube') || url.includes('youtu.be'))
    return { bg: 'var(--bg-danger)', color: 'var(--text-danger)', label: 'youtube.com' };
  if (url.includes('tiktok'))
    return { bg: 'var(--surface-1)', color: 'var(--text-primary)', label: 'tiktok.com' };
  if (url.includes('instagram'))
    return { bg: 'var(--bg-pro)', color: 'var(--text-pro)', label: 'instagram.com' };
  try { return { bg: 'var(--bg-accent)', color: 'var(--text-accent)', label: new URL(url).hostname.replace('www.', '') }; }
  catch { return { bg: 'var(--bg-accent)', color: 'var(--text-accent)', label: 'video' }; }
}

function Icon({ name, style }) {
  const s = { width: 18, height: 18, ...style };
  switch (name) {
    case 'chevron-right':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><path d="M9 18l6-6-6-6"/></svg>;
    case 'x':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><path d="M18 6 6 18M6 6 18 18"/></svg>;
    case 'check':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><path d="M5 13l4 4L19 7"/></svg>;
    case 'circle-check':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'video':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><rect x="3" y="5" width="14" height="14" rx="3"/><polygon points="14 9 20 12 14 15 14 9"/></svg>;
    case 'link':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><path d="M10 14a3.5 3.5 0 0 1 0-5L12 7a3.5 3.5 0 0 1 5 0l1 1a3.5 3.5 0 0 1 0 5"/><path d="M14 10a3.5 3.5 0 0 1 0 5L12 17a3.5 3.5 0 0 1-5 0l-1-1a3.5 3.5 0 0 1 0-5"/></svg>;
    case 'upload':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
    case 'external-link':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={s}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
    default:
      return null;
  }
}

const S = {
  card: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 11,
    padding: '13px 14px',
    background: 'var(--surface-2)',
    border: '0.5px solid var(--border)',
    borderRadius: 12,
    cursor: 'pointer', textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
    transition: 'border-color .15s',
  },
  hold: { width: 34, height: 34, borderRadius: '50%', flexShrink: 0 },
  grade: {
    fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
    background: 'var(--surface-1)', color: 'var(--text-secondary)', flexShrink: 0,
  },
  routeName: {
    fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  setter: { fontSize: 12, color: 'var(--text-muted)', marginTop: 1 },
  badgeBase: { fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, flexShrink: 0 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 900, display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    background: 'var(--surface-2)',
    borderRadius: '20px 20px 0 0',
    width: '100%', maxHeight: '88vh', overflowY: 'auto',
    paddingBottom: '2rem',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    background: 'var(--border-strong)', margin: '12px auto 0',
  },
  sheetHeader: {
    padding: '14px 16px 12px',
    borderBottom: '0.5px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  sheetHold: { width: 40, height: 40, borderRadius: '50%', flexShrink: 0 },
  sheetTitle: { fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' },
  sheetSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  closeBtn: {
    marginLeft: 'auto',
    background: 'var(--surface-1)', border: '0.5px solid var(--border)',
    borderRadius: '50%', width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10,
  },
  clipLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px',
    background: 'var(--surface-1)', border: '0.5px solid var(--border)',
    borderRadius: 10, marginBottom: 8,
  },
  clipLinkAnchor: {
    display: 'flex', alignItems: 'center', gap: 10,
    flex: 1, minWidth: 0, textDecoration: 'none',
  },
  clipRemoveBtn: {
    background: 'transparent', border: '0.5px solid var(--border)',
    borderRadius: 8, padding: '6px 8px', fontSize: 11,
    color: 'var(--text-danger)', cursor: 'pointer', flexShrink: 0,
  },
  clipIcon: {
    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  clipTitle: {
    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  clipMeta: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  divider: { height: '0.5px', background: 'var(--border)', margin: '14px 16px' },
  attRow: {
    display: 'flex', alignItems: 'center',
    background: 'var(--surface-1)', border: '0.5px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
  },
  attBtn: {
    width: 36, height: 36, background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  attVal: { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', minWidth: 28, textAlign: 'center' },
  logBtn: (disabled) => ({
    flex: 1, height: 36,
    background: 'var(--bg-success)', color: 'var(--text-success)',
    border: '0.5px solid var(--border-success)',
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    opacity: disabled ? 0.6 : 1,
  }),
  addClipBtn: {
    width: '100%', height: 36, marginTop: 8,
    background: 'var(--surface-1)', border: '0.5px solid var(--border)',
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  uploadZone: (hasFile) => ({
    border: `0.5px dashed ${hasFile ? 'var(--border-success)' : 'var(--border-strong)'}`,
    background: hasFile ? 'var(--bg-success)' : 'transparent',
    borderRadius: 10, padding: '20px 16px', textAlign: 'center',
    cursor: 'pointer', marginBottom: 10,
  }),
  orRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  orLine: { flex: 1, height: '0.5px', background: 'var(--border)' },
  orText: { fontSize: 11, color: 'var(--text-muted)' },
  linkInput: {
    flex: 1, fontSize: 13, padding: '8px 10px',
    borderRadius: 8, border: '0.5px solid var(--border)',
    background: 'var(--surface-1)', color: 'var(--text-primary)',
  },
  attachBtn: (disabled) => ({
    height: 36, padding: '0 12px',
    background: 'var(--surface-1)', border: '0.5px solid var(--border)',
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    color: 'var(--text-primary)', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 5,
    whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1,
  }),
  chip: {
    fontSize: 10, padding: '3px 8px', borderRadius: 20,
    background: 'var(--surface-1)', color: 'var(--text-muted)',
    border: '0.5px solid var(--border)',
  },
  error: { fontSize: 13, color: 'var(--text-danger)', marginTop: 8 },
  success: {
    fontSize: 13, color: 'var(--text-success)', marginTop: 8,
    display: 'flex', alignItems: 'center', gap: 6,
  },
};

export default function RouteCard({ route, userSendType = null, onSelect }) {
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState(null);
  const [logSuccess, setLogSuccess] = useState(false);

  const [clipFormOpen, setClipFormOpen] = useState(false);
  const [clipFile, setClipFile] = useState(null);
  const [clipLink, setClipLink] = useState('');
  const [clipSaving, setClipSaving] = useState(false);
  const [clipError, setClipError] = useState(null);
  const [clipSuccess, setClipSuccess] = useState(false);

  const [routeClips, setRouteClips] = useState([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fileInputRef = useRef(null);
  const holdColor = HOLD_COLORS[route.color?.toLowerCase()] ?? '#888';
  const displayGrade = cleanGrade(route.grade);
  const badge = userSendType ? SEND_BADGE[userSendType] : null;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const loadClips = async () => {
    setClipsLoading(true);
    try {
      const { data: sessionData } = await getSession();
      setCurrentUserId(sessionData?.session?.user?.id ?? null);
      const { data, error } = await getRouteClips(route.id);
      if (error) throw error;
      setRouteClips(data ?? []);
    } catch {
      setRouteClips([]);
    } finally {
      setClipsLoading(false);
    }
  };

  const openSheet = () => {
    setAttempts(1);
    setLogError(null); setLogSuccess(false);
    setClipFile(null); setClipLink('');
    setClipError(null); setClipSuccess(false);
    setClipFormOpen(false);
    setOpen(true);
    onSelect?.(route);
    loadClips();
  };

  const closeSheet = () => setOpen(false);

  const handleLogSend = async () => {
    setLogSaving(true); setLogError(null); setLogSuccess(false);
    try {
      const { data: sessionData } = await getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Sign in to log a send.');
      const result = await logSend({ userId, routeId: route.id, attempts });
      if (result?.error) throw new Error(result.error.message);
      setLogSuccess(true);
      window.dispatchEvent(new Event('send-added'));
      setTimeout(closeSheet, 1200);
    } catch (err) {
      setLogError(err.message || 'Something went wrong.');
    } finally {
      setLogSaving(false);
    }
  };

  const handleRemoveClip = async (clipId) => {
    try {
      const { error } = await deleteClip(clipId);
      if (error) throw error;
      await loadClips();
    } catch (err) {
      setClipError(err.message || 'Unable to remove clip.');
    }
  };

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
      setClipFile(null);
      setClipFormOpen(false);
      window.dispatchEvent(new Event('clip-added'));
      await loadClips();
    } catch (err) {
      setClipError(err.message || 'Upload failed.');
    } finally {
      setClipSaving(false);
    }
  };

  const handleAttachLink = async () => {
    if (!clipLink.trim()) { setClipError('Paste a link first.'); return; }
    setClipSaving(true); setClipError(null); setClipSuccess(false);
    try {
      const { data: sessionData } = await getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Sign in to attach a clip.');
      await postClip({ userId, routeId: route.id, videoUrl: clipLink.trim(), caption: '' });
      setClipSuccess(true);
      setClipLink('');
      setClipFormOpen(false);
      window.dispatchEvent(new Event('clip-added'));
      await loadClips();
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
        onTouchStart={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        onTouchEnd={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ ...S.hold, background: holdColor }} />
        <span style={S.grade}>{displayGrade}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.routeName}>{route.name}</div>
          {route.setter && <div style={S.setter}>Set by {route.setter}</div>}
        </div>
        {badge && (
          <span style={{ ...S.badgeBase, ...badge.style }}>{badge.label}</span>
        )}
        <Icon name="chevron-right" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                <Icon name="x" style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* ── Clips ── */}
            <div style={{ padding: '14px 16px 0' }}>
              <div style={S.sectionLabel}>Clips</div>
              {clipsLoading ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 8 }}>Loading…</div>
              ) : routeClips.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 8 }}>
                  No clips yet — be the first to post one.
                </div>
              ) : (
                routeClips.map(clip => {
                  const pm = getPlatformMeta(clip.video_url);
                  const dateStr = new Date(clip.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const isOwnClip = clip.user_id === currentUserId;
                  return (
                    <div key={clip.id} style={S.clipLink}>
                      <a
                        href={clip.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={S.clipLinkAnchor}
                      >
                        <div style={{ ...S.clipIcon, background: pm.bg, color: pm.color }}>
                          <Icon name="video" style={{ width: 18, height: 18 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.clipTitle}>{clip.caption || pm.label}</div>
                          <div style={S.clipMeta}>
                            {dateStr}{clip.profiles?.username ? ` · @${clip.profiles.username}` : ''}
                          </div>
                        </div>
                        <Icon name="external-link" style={{ color: 'var(--text-muted)', flexShrink: 0, width: 15, height: 15 }} />
                      </a>
                      {isOwnClip && (
                        <button
                          style={S.clipRemoveBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveClip(clip.id);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={S.divider} />

            {/* ── Log send ── */}
            <div style={{ padding: '0 16px' }}>
              <div style={S.sectionLabel}>Log send</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={S.attRow}>
                  <button style={S.attBtn} onClick={() => setAttempts(a => Math.max(1, a - 1))} aria-label="Decrease">−</button>
                  <span style={S.attVal}>{attempts}</span>
                  <button style={S.attBtn} onClick={() => setAttempts(a => a + 1)} aria-label="Increase">+</button>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>attempts</span>
                <button style={S.logBtn(logSaving)} onClick={handleLogSend} disabled={logSaving}>
                  <Icon name="check" style={{ width: 15, height: 15 }} />
                  {logSaving ? 'Logging…' : 'Log send'}
                </button>
              </div>
              {logError && <div style={S.error}>{logError}</div>}
              {logSuccess && (
                <div style={S.success}>
                  <Icon name="circle-check" style={{ width: 16, height: 16 }} />
                  Logged!
                </div>
              )}

              <button
                style={S.addClipBtn}
                onClick={() => { setClipFormOpen(o => !o); setClipError(null); }}
              >
                <Icon name={clipFormOpen ? 'x' : 'video'} style={{ width: 15, height: 15 }} />
                {clipFormOpen ? 'Cancel' : 'Add a clip'}
              </button>
            </div>

            {/* ── Clip form ── */}
            {clipFormOpen && (
              <div style={{ padding: '10px 16px 0' }}>
                <div style={S.uploadZone(!!clipFile)} onClick={() => fileInputRef.current?.click()}>
                  <Icon
                    name={clipFile ? 'circle-check' : 'upload'}
                    style={{ width: 24, height: 24, color: clipFile ? 'var(--text-success)' : 'var(--text-muted)', margin: '0 auto 6px' }}
                  />
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {clipFile ? clipFile.name : 'Upload from camera roll'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {clipFile ? 'Tap to change' : 'Tap to pick a video'}
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
                    style={{ ...S.logBtn(clipSaving), marginBottom: 10 }}
                    onClick={handleUpload}
                    disabled={clipSaving}
                  >
                    <Icon name="upload" style={{ width: 15, height: 15 }} />
                    {clipSaving ? 'Uploading…' : 'Upload video'}
                  </button>
                )}

                <div style={S.orRow}>
                  <div style={S.orLine} />
                  <span style={S.orText}>or paste a link</span>
                  <div style={S.orLine} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    value={clipLink}
                    onChange={e => setClipLink(e.target.value)}
                    placeholder="https://instagram.com/reel/..."
                    style={S.linkInput}
                  />
                  <button
                    style={S.attachBtn(clipSaving || !clipLink.trim())}
                    onClick={handleAttachLink}
                    disabled={clipSaving || !clipLink.trim()}
                  >
                    <Icon name="link" style={{ width: 14, height: 14 }} />
                    Attach
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                  <span style={S.chip}>Instagram</span>
                  <span style={S.chip}>TikTok</span>
                  <span style={S.chip}>YouTube</span>
                </div>

                {clipError && <div style={S.error}>{clipError}</div>}
                {clipSuccess && (
                  <div style={S.success}>
                    <Icon name="circle-check" style={{ width: 16, height: 16 }} />
                    Clip added!
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