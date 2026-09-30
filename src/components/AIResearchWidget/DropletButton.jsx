import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Brain, Bot, Compass, Move } from 'lucide-react';

const DRAG_THRESHOLD = 5; // Pixels of pointer movement to distinguish drag vs click

export const DropletButton = ({
  isDetached,
  position,
  onPositionChange,
  onDetach,
  onClick,
  isOpen,
  hasUnread = false,
  containerRef
}) => {
  const [isSquashing, setIsSquashing] = useState(false);
  const [clickRipples, setClickRipples] = useState([]);
  const [containerRipples, setContainerRipples] = useState([]);
  const internalRef = useRef(null);
  const buttonRef = containerRef || internalRef;

  const dragSession = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
    active: false
  });

  // Clamp position to visible IDE viewport
  const clampCoordinates = (targetX, targetY) => {
    const btnWidth = 44;
    const btnHeight = 44;
    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - btnWidth - 8);
    const minY = 38; // Below Top Header
    const maxY = Math.max(minY, window.innerHeight - 26 - btnHeight); // Above Status Bar

    return {
      x: Math.max(minX, Math.min(maxX, targetX)),
      y: Math.max(minY, Math.min(maxY, targetY))
    };
  };

  // Recalculate and clamp on window resize
  useEffect(() => {
    if (!isDetached) return;

    const handleResize = () => {
      onPositionChange(prev => clampCoordinates(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDetached]);

  const handlePointerDown = (e) => {
    // Only respond to main left click
    if (e.button !== 0) return;

    const node = buttonRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = isDetached ? position.x : rect.left;
    const initialY = isDetached ? position.y : rect.top;
    let hasMoved = false;
    let active = true;

    const handlePointerMove = (moveEvent) => {
      if (!active) return;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const distance = Math.hypot(dx, dy);

      if (distance > DRAG_THRESHOLD) {
        hasMoved = true;

        // If currently docked in Explorer, trigger detachment into floating layer
        if (!isDetached && onDetach) {
          onDetach({
            x: initialX,
            y: initialY
          });
        }

        const nextX = initialX + dx;
        const nextY = initialY + dy;
        const clamped = clampCoordinates(nextX, nextY);

        if (onPositionChange) {
          onPositionChange(clamped);
        }
      }
    };

    const handlePointerUp = (upEvent) => {
      active = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // If user moved less than threshold, treat as a legitimate Click!
      if (!hasMoved) {
        triggerClickAnimation(upEvent);
        if (onClick) {
          onClick();
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Water Droplet Splat / Ripple & Elastic Squash Animation
  const triggerClickAnimation = (e) => {
    const node = buttonRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const clickX = e && typeof e.clientX === 'number' ? e.clientX - rect.left : rect.width / 2;
      const clickY = e && typeof e.clientY === 'number' ? e.clientY - rect.top : rect.height / 2;

      // Spawn container water ripple from click location
      const containerRippleId = 'c-ripple-' + Date.now();
      setContainerRipples(prev => [...prev, { id: containerRippleId, x: clickX, y: clickY }]);
      setTimeout(() => {
        setContainerRipples(prev => prev.filter(r => r.id !== containerRippleId));
      }, 750);
    }

    // Spawn orb splash ripples
    const orbRippleId = 'orb-ripple-' + Date.now();
    setClickRipples(prev => [...prev, { id: orbRippleId }]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== orbRippleId));
    }, 700);

    // Trigger elastic surface tension squash-and-stretch
    setIsSquashing(true);
    setTimeout(() => setIsSquashing(false), 460);
  };

  // 1. DOCKED STATE (In Explorer -> Workspace section)
  if (!isDetached) {
    return (
      <div
        ref={buttonRef}
        className="droplet-docked-container"
        onPointerDown={handlePointerDown}
        title="AI Research - Click to open, or drag to float anywhere!"
      >
        {/* Dynamic Water Ripple on Click */}
        {containerRipples.map(r => (
          <span
            key={r.id}
            className="droplet-container-ripple"
            style={{
              left: `${r.x}px`,
              top: `${r.y}px`,
              width: '60px',
              height: '60px'
            }}
          />
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
            {/* Ambient Water Ripples */}
            <div className="droplet-ambient-ripple-layer">
              <span className="droplet-ambient-ripple wave-1" />
              <span className="droplet-ambient-ripple wave-2" />
              <span className="droplet-ambient-ripple wave-3" />
            </div>

            {/* Click Splash Ripples */}
            {clickRipples.map(r => (
              <span key={r.id} className="droplet-click-ripple" />
            ))}

            <div className={`droplet-orb ${isSquashing ? 'squashing' : ''}`} style={{ width: '32px', height: '32px' }}>
              <Sparkles size={16} strokeWidth={2.2} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-bright)' }}>
              AI Research
            </span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              Click or drag to detach
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
          <Move size={12} style={{ opacity: 0.6 }} />
        </div>
      </div>
    );
  }

  // 2. DETACHED STATE (Floating anywhere across IDE Viewport)
  return (
    <div
      ref={buttonRef}
      className="droplet-floating"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onPointerDown={handlePointerDown}
      title="AI Research - Drag to move, click to toggle research panel"
    >
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        {/* Ambient Water Ripples */}
        <div className="droplet-ambient-ripple-layer">
          <span className="droplet-ambient-ripple wave-1" />
          <span className="droplet-ambient-ripple wave-2" />
          <span className="droplet-ambient-ripple wave-3" />
        </div>

        {/* Click Splash Ripples */}
        {clickRipples.map(r => (
          <span key={r.id} className="droplet-click-ripple" />
        ))}

        <div className={`droplet-orb ${isSquashing ? 'squashing' : ''}`}>
          <Sparkles size={20} strokeWidth={2.2} />
          {(hasUnread || isOpen) && <span className="droplet-pulse-indicator" />}
        </div>
      </div>
    </div>
  );
};
