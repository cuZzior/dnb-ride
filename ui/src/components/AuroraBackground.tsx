'use client';

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="aurora-blob aurora-blob--emerald" />
      <div className="aurora-blob aurora-blob--blue" />
      <div className="aurora-blob aurora-blob--purple" />
    </div>
  );
}
