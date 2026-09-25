import React, { useState } from 'react';
import {
  Users,
  Radio,
  Copy,
  Check,
  Link,
  Plus,
  LogOut,
  RefreshCw,
  MessageSquare,
  Send,
  UserCheck,
  Compass
} from 'lucide-react';
import { CollaborationService, USER_COLORS } from '../../services/collaborationService';

export const CollabPanel = ({
  room,
  onJoinRoom,
  onLeaveRoom,
  onReconnect,
  onSelectFile,
  files = []
}) => {
  const collabService = CollaborationService.getInstance();
  const [newRoomId, setNewRoomId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('participants'); // 'participants' | 'chat'
  const [chatInput, setChatInput] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(room?.currentUser?.name || collabService.currentUser.name);

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

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      collabService.sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleJumpToCollaborator = (peer) => {
    if (!peer.cursor?.fileId || !onSelectFile) return;

    // Search workspace for file by id or name
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
    }
  };

  const isConnected = room?.status === 'connected';
  const isConnecting = room?.status === 'connecting';
  const isDisconnected = room?.status === 'disconnected';

  const currentUser = room?.currentUser || collabService.currentUser;
  const collaborators = room?.collaborators || [];
  const messages = room?.messages || [];

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>COLLABORATORS</span>
        
        {/* Real-time Status Badge */}
        <span
          className={`badge ${isConnected ? 'badge-success' : isConnecting ? 'badge-warning' : 'badge-danger'}`}
          style={{ fontSize: '10px', textTransform: 'capitalize' }}
        >
          <Radio size={9} />
          {room?.status || 'Offline'}
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Room Card */}
        <div style={{
          padding: '8px 10px',
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
                CURRENT ROOM
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)', wordBreak: 'break-all' }}>
                {room?.roomId || 'None'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleCopyId}
                className="btn-secondary"
                style={{ padding: '3px 6px', fontSize: '11px', gap: '3px' }}
                title="Copy Room ID"
              >
                {copiedId ? <Check size={11} color="var(--accent-success)" /> : <Copy size={11} />}
                <span>{copiedId ? 'Copied' : 'ID'}</span>
              </button>

              <button
                onClick={handleCopyInviteLink}
                className="btn-secondary"
                style={{ padding: '3px 6px', fontSize: '11px', gap: '3px' }}
                title="Copy Shareable Invite Link"
              >
                {copiedLink ? <Check size={11} color="var(--accent-success)" /> : <Link size={11} />}
                <span>{copiedLink ? 'Copied' : 'Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Actions (New Room / Disconnect / Reconnect) */}
          <div style={{ display: 'flex', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={handleCreateNewRoom}
              className="btn-secondary"
              style={{ flex: 1, padding: '3px 6px', fontSize: '10px', gap: '4px' }}
              title="Generate a new room"
            >
              <Plus size={11} />
              <span>New Room</span>
            </button>

            {isDisconnected ? (
              <button
                onClick={() => (onReconnect ? onReconnect() : collabService.reconnect())}
                className="btn-primary"
                style={{ flex: 1, padding: '3px 6px', fontSize: '10px', gap: '4px' }}
                title="Reconnect to room"
              >
                <RefreshCw size={11} />
                <span>Reconnect</span>
              </button>
            ) : (
              <button
                onClick={() => (onLeaveRoom ? onLeaveRoom() : collabService.leaveRoom())}
                className="btn-secondary"
                style={{ flex: 1, padding: '3px 6px', fontSize: '10px', gap: '4px', color: 'var(--accent-danger)' }}
                title="Leave room and go offline"
              >
                <LogOut size={11} />
                <span>Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            placeholder="Enter room ID to join..."
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
            style={{ flex: 1, fontSize: '11px', padding: '4px 6px' }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!newRoomId.trim()}
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            Join
          </button>
        </form>

        {/* User Identity / Profile Customization */}
        <div className="collab-profile-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              MY PROFILE
            </div>
            <button
              onClick={() => {
                if (isEditingProfile) {
                  handleSaveProfile();
                } else {
                  setIsEditingProfile(true);
                }
              }}
              style={{ fontSize: '10px', color: 'var(--accent-primary)', padding: '1px 4px' }}
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
                  style={{ width: '100%', fontSize: '11px', padding: '2px 6px' }}
                  placeholder="Your Name..."
                  autoFocus
                />
              </form>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Active Collaborator
                </div>
              </div>
            )}
          </div>

          {/* Color Picker Swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Color:</span>
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

        {/* Tab Switcher: Participants vs Team Chat */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-panel)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setActiveTab('participants')}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: '11px',
              fontWeight: 500,
              color: activeTab === 'participants' ? 'var(--text-bright)' : 'var(--text-muted)',
              background: activeTab === 'participants' ? 'var(--bg-active)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Users size={12} />
            <span>Peers ({collaborators.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: '11px',
              fontWeight: 500,
              color: activeTab === 'chat' ? 'var(--text-bright)' : 'var(--text-muted)',
              background: activeTab === 'chat' ? 'var(--bg-active)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <MessageSquare size={12} />
            <span>Room Chat</span>
            {messages.length > 0 && (
              <span style={{
                background: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '9px',
                padding: '0 4px',
                borderRadius: '8px'
              }}>
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Participants List */}
        {activeTab === 'participants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {collaborators.map((peer) => (
              <div
                key={peer.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '6px 8px',
                  background: 'var(--bg-panel)',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: peer.color || 'var(--accent-primary)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {peer.avatar || 'P'}
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                      {peer.name}
                      {peer.isSelf && ' (You)'}
                    </span>
                  </div>

                  <span className="badge badge-success" style={{ fontSize: '9px' }}>
                    <Radio size={8} /> Online
                  </span>
                </div>

                {/* Peer Location & Jump Action */}
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {peer.cursor.fileName}
                      {peer.cursor.lineNumber && ` : Ln ${peer.cursor.lineNumber}`}
                    </span>

                    {!peer.isSelf && (
                      <button
                        onClick={() => handleJumpToCollaborator(peer)}
                        style={{
                          fontSize: '10px',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                        title="Jump to collaborator's cursor"
                      >
                        <Compass size={10} />
                        <span>Follow</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: In-Room Live Chat */}
        {activeTab === 'chat' && (
          <div className="collab-chat-container">
            <div className="collab-chat-messages">
              {messages.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No messages yet. Send a message to team members in this room!
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="collab-chat-bubble">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: msg.senderColor || 'var(--accent-primary)' }}>
                        {msg.senderName}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-bright)', wordBreak: 'break-word', marginTop: '1px' }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message room..."
                style={{ flex: 1, fontSize: '11px', padding: '4px 6px' }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn-primary"
                style={{ padding: '4px 8px' }}
                title="Send message"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
