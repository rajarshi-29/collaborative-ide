import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import { CollaborationService } from '../../services/collaborationService';

export const CollaborationModal = ({
  isOpen,
  onClose,
  room,
  onJoinRoom
}) => {
  const [targetRoomId, setTargetRoomId] = useState(room?.roomId || '');
  const [copied, setCopied] = useState(false);
  const collabService = CollaborationService.getInstance();

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (targetRoomId.trim()) {
      onJoinRoom(targetRoomId.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '100%', maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-bright)' }}>
              Collaboration Settings
            </span>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Active Room */}
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ACTIVE ROOM
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)', marginTop: '2px' }}>
                {room?.roomId || 'None'}
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
            >
              {copied ? <Check size={12} color="var(--accent-success)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-main)' }}>
              Switch or Join Room
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                placeholder="Enter room ID..."
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '4px 12px' }}
              >
                Join
              </button>
            </div>
          </form>

          {/* Collaborator List */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Active Participants ({room?.collaborators?.length || 0})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
              {room?.collaborators?.map((peer) => (
                <div
                  key={peer.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: 'var(--bg-panel)',
                    borderRadius: '3px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: peer.color || 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {peer.avatar || 'P'}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-bright)' }}>
                      {peer.name}
                      {peer.id === collabService.currentUser.id && ' (You)'}
                    </span>
                  </div>

                  <span className="badge badge-success">
                    <Radio size={9} /> Online
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px 12px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
