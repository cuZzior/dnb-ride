'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface MobileDrawerProps {
  children: ReactNode;
}

type SnapPoint = 'collapsed' | 'half';

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  collapsed: '120px',
  half: '55vh',
};

export default function MobileDrawer({ children }: MobileDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('collapsed');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleDrawer = () => {
    setSnapPoint((prev) => (prev === 'collapsed' ? 'half' : 'collapsed'));
  };

  if (!isMobile) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl flex flex-col safe-area-bottom glass-aurora"
      style={{
        height: SNAP_HEIGHTS[snapPoint],
        transition: 'height 0.3s ease-out',
        background: 'linear-gradient(180deg, rgba(22, 35, 55, 0.75) 0%, rgba(15, 25, 45, 0.85) 100%)',
      }}
    >
      <div
        className="flex flex-col items-center justify-center pt-3 pb-1 flex-shrink-0 cursor-pointer touch-none gap-1"
        onClick={toggleDrawer}
      >
        <div className="w-12 h-1.5 rounded-full bg-white/30" />
        {snapPoint === 'collapsed' ? (
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-1 animate-pulse">
            <span>Tap to expand</span>
            <ChevronUp className="w-3 h-3" />
          </div>
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] mt-1" />
        )}
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
