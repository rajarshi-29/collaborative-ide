import React, { useState } from 'react';
import { Users, Radio, Copy, Check } from 'lucide-react';
import { CollaborationService } from '../../services/collaborationService';

export const CollabPanel = ({
  room,
  onJoinRoom
}) => {
  const [newRoomId, setNewRoomId] = useState(room?.roomId || '');
  const [copied, setCopied] = useState(false);
  const collabService = CollaborationService.getInstance();

  const handleCopy = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (newRoomId.trim()) {
      onJoinRoom(newRoomId.trim());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)'
      }}>
        <span>COLLABORATORS</span>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Room Box */}
        <div style={{
          padding: '8px 10px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ROOM</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
              {room?.roomId || 'None'}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '2px 6px', fontSize: '11px', gap: '4px' }}
            title="Copy Room ID"
          >
            {copied ? <Check size={11} color="var(--accent-success)" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            placeholder="Room ID..."
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
            style={{ flex: 1, fontSize: '11px', padding: '3px 6px' }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            Join
          </button>
        </form>

        {/* Participants List */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            Participants ({room?.collaborators?.length || 0})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {room?.collaborators?.map((peer) => (
              <div
                key={peer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  background: 'var(--bg-panel)',
                  borderRadius: '2px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: peer.color || 'var(--accent-primary)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {peer.avatar || 'P'}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-bright)' }}>
                    {peer.name}
                    {peer.id === collabService.currentUser.id && ' (You)'}
                  </span>
                </div>

                <span className="badge badge-success" style={{ fontSize: '9px' }}>
                  <Radio size={8} /> Online
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
