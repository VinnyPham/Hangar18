export default function MapLabel({ label, x, y, onClick = null }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: onClick ? 'auto' : 'none',
        zIndex: 30,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          color: '#fff',
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '0.35rem 0.7rem',
          borderRadius: '999px',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          marginTop: '0.25rem',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(232, 255, 71, 0.95)',
          boxShadow: '0 0 6px rgba(232,255,71,0.35)'
        }}
      />
    </div>
  );
}
