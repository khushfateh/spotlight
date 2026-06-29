// Persistent fixed canvas — sits between body background (#0A0A0A)
// and the sparkle layer (z: -1). Only radial gold glows; no solid fill
// so sparkes are visible through transparent areas.
export default function FixedBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Key glow — warm amber, upper right (echoes saxophone position) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 900px 720px at 72% 28%, rgba(201,168,76,0.10) 0%, transparent 70%)',
      }} />
      {/* Fill glow — deep gold, lower left */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 700px 600px at 8% 82%, rgba(180,130,50,0.06) 0%, transparent 65%)',
      }} />
      {/* Centre breath — barely-there warm pulse */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 500px 400px at 50% 55%, rgba(201,168,76,0.028) 0%, transparent 70%)',
      }} />
    </div>
  )
}
