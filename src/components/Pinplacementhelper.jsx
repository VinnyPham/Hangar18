// PinPlacementHelper.jsx
// DEV-ONLY tool. Renders over the map and outputs pin_x / pin_y percentages
// when you tap, so you can populate route rows in your DB without guessing.
//
// Usage in GymMap.jsx (dev only):
//   import PinPlacementHelper from './PinPlacementHelper';
//   <PinPlacementHelper routes={routes} />
//
// When you're done placing pins, remove this component and its import.

import { useState } from 'react';

export default function PinPlacementHelper({ routes = [] }) {
  const [pins, setPins] = useState([]); // [{ routeId, name, x, y }]
  const [selected, setSelected] = useState(null); // route to place next
  const [copied, setCopied] = useState(false);

  const handleMapClick = (e) => {
    if (!selected) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    setPins(prev => {
      const existing = prev.findIndex(p => p.routeId === selected.id);
      const next = { routeId: selected.id, name: selected.name, grade: selected.grade, x: +x.toFixed(2), y: +y.toFixed(2) };
      if (existing >= 0) { const a = [...prev]; a[existing] = next; return a; }
      return [...prev, next];
    });
    setSelected(null);
  };

  const sqlOutput = pins.map(p =>
    `UPDATE routes SET pin_x = ${p.x}, pin_y = ${p.y} WHERE id = '${p.routeId}'; -- ${p.name}`
  ).join('\n');

  const copySQL = () => {
    navigator.clipboard.writeText(sqlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const unplaced = routes.filter(r => !pins.find(p => p.routeId === r.id));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 900 }}>
      {/* Tap catcher */}
      <div
        onClick={handleMapClick}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: selected ? 'crosshair' : 'default',
        }}
      />

      {/* Existing pin markers */}
      {pins.map(p => (
        <div
          key={p.routeId}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'var(--accent)',
            border: '2px solid #0D0D0D',
            pointerEvents: 'none',
          }}
          title={`${p.name} (${p.x}, ${p.y})`}
        />
      ))}

      {/* Side panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 220,
          background: 'rgba(13,13,13,0.95)',
          borderLeft: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.8rem' }}>
            📍 Pin Placement
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
            {selected
              ? `Tap the map to place: ${selected.grade} ${selected.name}`
              : 'Select a route below, then tap its location on the map.'}
          </p>
        </div>

        {/* Unplaced routes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.65rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Unplaced ({unplaced.length})
          </p>
          {unplaced.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.4rem 0.6rem',
                marginBottom: '0.25rem',
                borderRadius: 'var(--radius-sm)',
                background: selected?.id === r.id ? 'var(--accent)' : 'var(--surface-2)',
                color: selected?.id === r.id ? '#0D0D0D' : 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {r.grade} — {r.name}
            </button>
          ))}

          {pins.length > 0 && (
            <>
              <p style={{ color: 'var(--text-faint)', fontSize: '0.65rem', margin: '0.75rem 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Placed ({pins.length})
              </p>
              {pins.map(p => (
                <div
                  key={p.routeId}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}
                >
                  <span>{p.grade} {p.name}</span>
                  <span style={{ color: 'var(--accent)' }}>{p.x},{p.y}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* SQL output */}
        {pins.length > 0 && (
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={copySQL}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--accent)',
                color: '#0D0D0D',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy SQL'}
            </button>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.65rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
              Paste into Supabase SQL editor to save pin positions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}