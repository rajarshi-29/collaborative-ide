import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DropletButton } from './DropletButton';
import { ResearchPanel } from './ResearchPanel';
import { aiWidgetStore } from './aiWidgetStore';

export const AIResearchWidget = ({
  activeFileName = '',
  activeFileContent = '',
  onApplyCode,
  isDockedSlot = false
}) => {
  const [storeState, setStoreState] = useState(() => aiWidgetStore.getState());
  const buttonRef = useRef(null);

  // Subscribe to the centralized reactive store
  useEffect(() => {
    return aiWidgetStore.subscribe(nextState => {
      setStoreState({ ...nextState });
    });
  }, []);

  const { isDetached, position, isOpen, isResearching, history } = storeState;

  // Close research panel with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        aiWidgetStore.setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDetach = (initialPos) => {
    aiWidgetStore.setDetached(true, initialPos);
  };

  const handlePositionChange = (nextPos) => {
    aiWidgetStore.setPosition(nextPos);
  };

  const handleClick = () => {
    aiWidgetStore.toggleOpen();
  };

  const handleDock = () => {
    aiWidgetStore.dock();
  };

  const handleClose = () => {
    aiWidgetStore.setOpen(false);
  };

  const handleSendQuery = (queryText) => {
    aiWidgetStore.sendQuery(queryText, {
      activeFileName,
      activeFileContent
    });
  };

  const handleClearHistory = () => {
    aiWidgetStore.clearHistory();
  };

  // Case 1: Docked Slot (Inside Explorer -> Workspace section)
  if (isDockedSlot) {
    if (isDetached) return null;

    return (
      <div className="droplet-workspace-mount">
        <DropletButton
          isDetached={false}
          position={position}
          onPositionChange={handlePositionChange}
          onDetach={handleDetach}
          onClick={handleClick}
          isOpen={isOpen}
          containerRef={buttonRef}
        />
      </div>
    );
  }

  // Case 2: Floating Viewport Layer (Mounted at App root)
  // When detached: renders the floating droplet orb and adaptive panel.
  // When docked: if user clicks docked droplet, renders adaptive panel in document.body
  // so it is positioned relative to the docked button without being clipped by Explorer overflow.
  return ReactDOM.createPortal(
    <>
      {isDetached && (
        <DropletButton
          isDetached={true}
          position={position}
          onPositionChange={handlePositionChange}
          onDetach={handleDetach}
          onClick={handleClick}
          isOpen={isOpen}
          containerRef={buttonRef}
        />
      )}

      {isOpen && (
        <ResearchPanel
          isOpen={isOpen}
          onClose={handleClose}
          onDock={handleDock}
          isDetached={isDetached}
          buttonRef={buttonRef}
          history={history}
          onSendQuery={handleSendQuery}
          isResearching={isResearching}
          activeFileName={activeFileName}
          onApplyCode={onApplyCode}
          onClearHistory={handleClearHistory}
        />
      )}
    </>,
    document.body
  );
};
