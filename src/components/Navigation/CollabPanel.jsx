import React, { useState } from 'react';
import { Radio, Copy, Check } from 'lucide-react';
import { CollaborationService } from '../../services/collaborationService';

export const CollabPanel = ({
  room,
  onJoinRoom
}) => {
  const [newRoomId, setNewRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const collabService = CollaborationService.getInstance();

  const handleCopy = () => {
    const idToCopy = room?.roomId || collabService.currentRoomId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (newRoomId.trim()) {
      if (onJoinRoom) {
        onJoinRoom(newRoomId.trim());
      } else {
        collabService.joinRoom(newRoomId.trim());
      }
      setNewRoomId('');
    }
  };

  // Get participants, ensuring self is shown if room has not yet populated remote peers
  const participants = (room?.collaborators && room.collaborators.length > 0)
    ? room.collaborators
    : [{ ...collabService.currentUser, isSelf: true }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        flexShrink: 0
      }}>
        <span>COLLABORATORS</span>
      </div>

      <div style={{
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
        flex: 1
      }}>
        {/* Room Box */}
        <div style={{
          padding: '8px 10px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ROOM</div>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-bright)',
              fontFamily: 'var(--font-mono)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {room?.roomId || collabService.currentRoomId || 'None'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '2px 6px', fontSize: '11px', gap: '4px', flexShrink: 0 }}
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
            style={{
              flex: 1,
              fontSize: '11px',
              padding: '4px 8px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              color: 'var(--text-bright)'
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
          >
            Join
          </button>
        </form>

        {/* Participants List */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Participants ({participants.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {participants.map((peer) => {
              const isSelf = peer.id === collabService.currentUser.id || peer.isSelf;
              return (
                <div
                  key={peer.id || 'self'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: 'var(--bg-panel)',
                    borderRadius: '3px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: peer.color || collabService.currentUser.color || 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {peer.avatar || peer.name?.charAt(0) || 'P'}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-bright)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {peer.name || 'Anonymous'}
                      {isSelf && ' (You)'}
                    </span>
                  </div>

                  <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 5px', flexShrink: 0 }}>
                    <Radio size={8} /> Online
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabPanel;
