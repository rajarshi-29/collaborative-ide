import React, { useState } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Link,
  Plus,
  Radio,
  LogOut,
  RefreshCw,
  Compass
} from 'lucide-react';
import { CollaborationService, USER_COLORS } from '../../services/collaborationService';

export const CollaborationModal = ({
  isOpen,
  onClose,
  room,
  onJoinRoom,
  onLeaveRoom,
  onReconnect,
  onSelectFile,
  files = []
}) => {
  const collabService = CollaborationService.getInstance();
  const [targetRoomId, setTargetRoomId] = useState(room?.roomId || '');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(room?.currentUser?.name || collabService.currentUser.name);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyInviteLink = () => {
    if (room?.roomId) {
      const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room.roomId)}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCreateNewRoom = () => {
    const randomId = 'room-' + Math.random().toString(36).substring(2, 6);
    if (onJoinRoom) {
      onJoinRoom(randomId);
    } else {
      collabService.joinRoom(randomId);
    }
    setTargetRoomId(randomId);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (targetRoomId.trim()) {
      if (onJoinRoom) {
        onJoinRoom(targetRoomId.trim());
      } else {
        collabService.joinRoom(targetRoomId.trim());
      }
    }
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    if (profileName.trim()) {
      collabService.updateProfile({ name: profileName.trim() });
      setIsEditingProfile(false);
    }
  };

  const handleColorChange = (color) => {
    collabService.updateProfile({ name: profileName.trim() || collabService.currentUser.name, color });
  };

  const handleJumpToCollaborator = (peer) => {
    if (!peer.cursor?.fileId || !onSelectFile) return;

    const findFile = (items) => {
      for (const item of items) {
        if (item.id === peer.cursor.fileId || item.name === peer.cursor.fileName) {
          return item;
        }
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const targetFile = findFile(files);
    if (targetFile) {
      onSelectFile(targetFile);
      onClose();
    }
  };

  const isConnected = room?.status === 'connected';
  const isConnecting = room?.status === 'connecting';
  const isDisconnected = room?.status === 'disconnected';

  const currentUser = room?.currentUser || collabService.currentUser;
  const collaborators = room?.collaborators || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '100%', maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-bright)' }}>
              Collaboration Settings
            </span>
            <span
              className={`badge ${isConnected ? 'badge-success' : isConnecting ? 'badge-warning' : 'badge-danger'}`}
              style={{ fontSize: '10px', textTransform: 'capitalize', marginLeft: '6px' }}
            >
              <Radio size={8} />
              {room?.status || 'Offline'}
            </span>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {/* Active Room Card */}
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  ACTIVE ROOM
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)', marginTop: '2px' }}>
                  {room?.roomId || 'None'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={handleCopyId}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                  title="Copy Room ID"
                >
                  {copiedId ? <Check size={12} color="var(--accent-success)" /> : <Copy size={12} />}
                  <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                </button>

                <button
                  onClick={handleCopyInviteLink}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                  title="Copy Invite Link"
                >
                  {copiedLink ? <Check size={12} color="var(--accent-success)" /> : <Link size={12} />}
                  <span>{copiedLink ? 'Copied' : 'Invite Link'}</span>
                </button>
              </div>
            </div>

            {/* Room Actions */}
            <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={handleCreateNewRoom}
                className="btn-secondary"
                style={{ flex: 1, padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                title="Create a fresh room"
              >
                <Plus size={12} />
                <span>Create New Room</span>
              </button>

              {isDisconnected ? (
                <button
                  onClick={() => (onReconnect ? onReconnect() : collabService.reconnect())}
                  className="btn-primary"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                >
                  <RefreshCw size={12} />
                  <span>Reconnect</span>
                </button>
              ) : (
                <button
                  onClick={() => (onLeaveRoom ? onLeaveRoom() : collabService.leaveRoom())}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '11px', gap: '4px', color: 'var(--accent-danger)' }}
                >
                  <LogOut size={12} />
                  <span>Disconnect</span>
                </button>
              )}
            </div>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
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
                disabled={!targetRoomId.trim()}
                style={{ padding: '4px 12px' }}
              >
                Join
              </button>
            </div>
          </form>

          {/* User Profile Card */}
          <div className="collab-profile-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                MY COLLABORATOR IDENTITY
              </span>
              <button
                onClick={() => {
                  if (isEditingProfile) {
                    handleSaveProfile();
                  } else {
                    setIsEditingProfile(true);
                  }
                }}
                style={{ fontSize: '11px', color: 'var(--accent-primary)', padding: '1px 4px' }}
              >
                {isEditingProfile ? 'Save' : 'Edit'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: currentUser.color || 'var(--accent-primary)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {currentUser.avatar || 'P'}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{ width: '100%', fontSize: '12px', padding: '2px 6px' }}
                    placeholder="Your Name..."
                    autoFocus
                  />
                </form>
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Visible to all collaborators in the room
                  </div>
                </div>
              )}
            </div>

            {/* Color Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cursor Color:</span>
              {USER_COLORS.map(c => (
                <div
                  key={c}
                  className={`collab-color-dot ${currentUser.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => handleColorChange(c)}
                  title={`Pick color: ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Active Participants List */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Active Participants ({collaborators.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
              {collaborators.map((peer) => (
                <div
                  key={peer.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '6px 10px',
                    background: 'var(--bg-panel)',
                    borderRadius: '3px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      <span style={{ fontSize: '12px', color: 'var(--text-bright)', fontWeight: 500 }}>
                        {peer.name}
                        {peer.isSelf && ' (You)'}
                      </span>
                    </div>

                    <span className="badge badge-success">
                      <Radio size={9} /> Online
                    </span>
                  </div>

                  {/* Peer location info & Follow action */}
                  {peer.cursor?.fileName && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '2px 6px',
                      background: 'var(--bg-editor)',
                      borderRadius: '2px',
                      fontSize: '10px',
                      color: 'var(--text-muted)'
                    }}>
                      <span>
                        {peer.cursor.fileName}
                        {peer.cursor.lineNumber && ` (Ln ${peer.cursor.lineNumber})`}
                      </span>

                      {!peer.isSelf && (
                        <button
                          onClick={() => handleJumpToCollaborator(peer)}
                          style={{
                            fontSize: '10px',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Open file and jump to collaborator"
                        >
                          <Compass size={11} />
                          <span>Follow</span>
                        </button>
                      )}
                    </div>
                  )}
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
            style={{ padding: '4px 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
