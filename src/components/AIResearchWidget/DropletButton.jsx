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
  const [ripples, setRipples] = useState([]);
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

      // Spawn organic fluid ripple ring originating from contact point
      const rippleId = 'ripple-' + Date.now();
      setRipples(prev => [...prev, { id: rippleId, x: clickX, y: clickY }]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 700);

      // Trigger elastic surface tension squash-and-stretch
      setIsSquashing(true);
      setTimeout(() => setIsSquashing(false), 460);
    }
  };

  // 1. DOCKED STATE (In Explorer -> Workspace section)
  if (!isDetached) {
    return (
      <div
        ref={buttonRef}
        className="droplet-docked-container"
        onPointerDown={handlePointerDown}
        title="AI Research Assistant - Click to open, or drag to float anywhere!"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`droplet-orb ${isSquashing ? 'squashing' : ''}`} style={{ width: '32px', height: '32px' }}>
            <Sparkles size={16} strokeWidth={2.2} />
            {ripples.map(r => (
              <span
                key={r.id}
                className="droplet-ripple-ring"
                style={{
                  left: `${r.x}px`,
                  top: `${r.y}px`,
                  width: '28px',
                  height: '28px'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-bright)' }}>
              AI Research Droplet
            </span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              Click or drag to detach
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
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
      title="AI Research Assistant - Drag to move, click to toggle research panel"
    >
      <div className={`droplet-orb ${isSquashing ? 'squashing' : ''}`}>
        <Sparkles size={20} strokeWidth={2.2} />

        {/* Pulse Dot if unread or active */}
        {(hasUnread || isOpen) && <span className="droplet-pulse-indicator" />}

        {/* Fluid Splat Ripples */}
        {ripples.map(r => (
          <span
            key={r.id}
            className="droplet-ripple-ring"
            style={{
              left: `${r.x}px`,
              top: `${r.y}px`,
              width: '38px',
              height: '38px'
            }}
          />
        ))}
      </div>
    </div>
  );
};
