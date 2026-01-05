'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';

interface MobileDrawerProps {
  children: ReactNode;
}

type SnapPoint = 'collapsed' | 'half' | 'full';

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  collapsed: '180px',
  half: '55vh',
  full: '90vh',
};

export default function MobileDrawer({ children }: MobileDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('collapsed');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getHeightValue = (snap: SnapPoint): number => {
    const vh = window.innerHeight;
    switch (snap) {
      case 'collapsed': return 180;
      case 'half': return vh * 0.55;
      case 'full': return vh * 0.9;
    }
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartHeight(drawerRef.current?.offsetHeight || getHeightValue(snapPoint));
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY - clientY;
    const newHeight = Math.max(100, Math.min(window.innerHeight * 0.95, dragStartHeight + deltaY));
    setCurrentHeight(newHeight);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const vh = window.innerHeight;
    const height = currentHeight || getHeightValue(snapPoint);
    
    if (height < vh * 0.3) {
      setSnapPoint('collapsed');
    } else if (height < vh * 0.7) {
      setSnapPoint('half');
    } else {
      setSnapPoint('full');
    }
    setCurrentHeight(0);
  };

  if (!isMobile) return null;

  const drawerHeight = isDragging && currentHeight > 0 
    ? `${currentHeight}px` 
    : SNAP_HEIGHTS[snapPoint];

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl flex flex-col safe-area-bottom backdrop-blur-xl border-t border-white/10"
      style={{
        height: drawerHeight,
        transition: isDragging ? 'none' : 'height 0.3s ease-out',
        background: 'linear-gradient(180deg, rgba(10, 25, 41, 0.5) 0%, rgba(10, 25, 41, 0.6) 100%)',
      }}
    >
      <div
        className="flex justify-center py-3 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="w-12 h-1.5 rounded-full bg-white/30" />
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
