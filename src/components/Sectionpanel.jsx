// SectionPanel.jsx
// A bottom sheet that slides up when a wall section pin cluster is tapped.
// Shows all routes in that section as RouteCards.
//
// Props:
//   section      — string section name, or null (panel is hidden)
//   routes       — all active routes array
//   userSends    — map of route_id → send_type for the current user
//   onClose      — called when the sheet is dismissed
//   onRouteSelect — called with a route when a RouteCard is tapped

import { useEffect, useRef } from 'react';
import RouteCard from './RouteCard';

export default function SectionPanel({ section, routes, userSends = {}, onClose, onRouteSelect }) {
  const sheetRef = useRef(null);

  const sectionRoutes = routes.filter(
    r => r.wall_section?.toLowerCase() === section?.toLowerCase()
  );

  // Close on backdrop tap
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Swipe-down to close
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e) => { startY = e.touches[0].clientY; };
    const onTouchEnd   = (e) => { if (e.changedTouches[0].clientY - startY > 60) onClose(); };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onClose]);

  const isOpen = !!section;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(0,0,0,0.5)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 400,
          background: 'var(--surface)',
          borderRadius: '18px 18px 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '70dvh',
          display: 'flex',
          flexDirection: 'column',
          // account for iPhone home bar
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 0 0.25rem' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border-2)' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1.1rem 0.75rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              {section}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {sectionRoutes.length} active {sectionRoutes.length === 1 ? 'route' : 'routes'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Route list */}
        <div style={{ overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sectionRoutes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              No active routes in this section.
            </p>
          ) : (
            sectionRoutes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                userSendType={userSends[route.id] ?? null}
                onSelect={onRouteSelect}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}