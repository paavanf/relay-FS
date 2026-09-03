// AuroraBackground - the living backdrop behind every screen.
//
// Large blurred colour fields drift slowly against void black, over a faint
// masked grid, finished with a vignette so foreground content keeps contrast.
// Purely decorative: fixed, pointer-events off, and aria-hidden.

export function AuroraBackground() {
  return (
    <div className="aurora-field" aria-hidden="true">
      <div
        className="aurora-blob"
        style={{
          top: '-18%',
          left: '-10%',
          width: '58vw',
          height: '58vw',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.85), rgba(99,102,241,0) 68%)',
          animation: 'aurora-drift-a 26s ease-in-out infinite',
        }}
      />

      <div
        className="aurora-blob"
        style={{
          top: '-6%',
          right: '-14%',
          width: '52vw',
          height: '52vw',
          background:
            'radial-gradient(circle, rgba(168,85,247,0.72), rgba(168,85,247,0) 68%)',
          animation: 'aurora-drift-b 34s ease-in-out infinite',
          animationDelay: '-6s',
        }}
      />

      <div
        className="aurora-blob"
        style={{
          bottom: '-24%',
          left: '18%',
          width: '62vw',
          height: '62vw',
          background:
            'radial-gradient(circle, rgba(34,211,238,0.45), rgba(34,211,238,0) 70%)',
          animation: 'aurora-drift-c 42s ease-in-out infinite',
          animationDelay: '-14s',
        }}
      />

      <div
        className="aurora-blob"
        style={{
          bottom: '-10%',
          right: '6%',
          width: '38vw',
          height: '38vw',
          background:
            'radial-gradient(circle, rgba(251,113,133,0.32), rgba(251,113,133,0) 70%)',
          animation: 'aurora-drift-a 38s ease-in-out infinite',
          animationDelay: '-22s',
        }}
      />

      <div className="aurora-grid" />
      <div className="aurora-vignette" />
    </div>
  );
}

export default AuroraBackground;
