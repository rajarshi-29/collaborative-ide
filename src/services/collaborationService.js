import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';

export const USER_COLORS = [
  '#61afef', // Atom Blue
  '#98c379', // Green
  '#c678dd', // Purple
  '#e5c07b', // Yellow
  '#e06c75', // Red
  '#56b6c2', // Cyan
  '#ff9e64', // Orange
  '#bb9af7'  // Lavender
];

export const USER_NAMES = [
  'Alex Rivera',
  'Jordan Chen',
  'Morgan Lee',
  'Casey Smith',
  'Devin Vance',
  'Riley Quinn',
  'Samira Khan',
  'Taylor Swift'
];

const PROFILE_STORAGE_KEY = 'collaborative_ide_user_profile';

export class CollaborationService {
  constructor() {
    this.ydoc = new Y.Doc();
    this.provider = null;
    this.binding = null;
    this.currentRoomId = 'collab-room-alpha';
    this.status = 'connecting'; // 'connected' | 'connecting' | 'disconnected'
    this.isSynced = false;
    this.listeners = [];
    this.chatArray = this.ydoc.getArray('collab-room-chat');
    this.currentEditorInfo = null;

    // Load or generate distinct user profile
    this.currentUser = this.loadOrGenerateProfile();
  }

  static getInstance() {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  loadOrGenerateProfile() {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.color) {
          return {
            id: parsed.id || 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: parsed.name,
            color: parsed.color,
            avatar: parsed.avatar || parsed.name.slice(0, 2).toUpperCase(),
            status: 'online'
          };
        }
      }
    } catch (e) {
      console.warn('Error loading profile from storage', e);
    }

    const randomName = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
    const randomColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const initials = randomName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const profile = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: randomName,
      color: randomColor,
      avatar: initials,
      status: 'online'
    };

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {}

    return profile;
  }

  updateProfile({ name, color }) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) return;

    const initials = trimmedName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    this.currentUser = {
      ...this.currentUser,
      name: trimmedName,
      color: color || this.currentUser.color,
      avatar: initials || 'P'
    };

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.currentUser));
    } catch (e) {}

    if (this.provider && this.provider.awareness) {
      this.provider.awareness.setLocalStateField('user', {
        name: this.currentUser.name,
        color: this.currentUser.color,
        avatar: this.currentUser.avatar
      });
    }

    this.notifyListeners();
  }

  joinRoom(roomId, password = null) {
    if (!roomId || !roomId.trim()) return;
    const cleanRoomId = roomId.trim();

    // If currently bound, destroy old binding
    if (this.binding) {
      try {
        this.binding.destroy();
      } catch (e) {}
      this.binding = null;
    }

    // Destroy existing WebRTC provider
    if (this.provider) {
      try {
        this.provider.destroy();
      } catch (e) {}
      this.provider = null;
    }

    // Clean Y.Doc for the new room session to avoid cross-room CRDT state pollution
    if (this.currentRoomId !== cleanRoomId) {
      try {
        this.ydoc.destroy();
      } catch (e) {}
      this.ydoc = new Y.Doc();
    }

    this.currentRoomId = cleanRoomId;
    this.currentPassword = password;
    this.status = 'connecting';
    this.isSynced = false;

    try {
      this.provider = new WebrtcProvider(cleanRoomId, this.ydoc, {
        signaling: [
          'wss://signaling.yjs.dev',
          'wss://y-webrtc-signaling.fly.dev'
        ],
        password: password || null
      });

      // Update local awareness state
      this.provider.awareness.setLocalStateField('user', {
        name: this.currentUser.name,
        color: this.currentUser.color,
        avatar: this.currentUser.avatar
      });

      // Status updates
      this.provider.on('status', ({ status }) => {
        this.status = status;
        this.notifyListeners();
      });

      this.provider.on('synced', ({ synced }) => {
        this.isSynced = synced;
        if (synced) {
          this.status = 'connected';
        }
        this.notifyListeners();
      });

      this.provider.awareness.on('change', () => {
        this.notifyListeners();
      });

      // Initialize collaborative chat stream
      this.chatArray = this.ydoc.getArray('collab-room-chat');
      this.chatArray.observe(() => {
        this.notifyListeners();
      });

      // If there was an active editor, re-bind it to the new room provider
      if (this.currentEditorInfo && this.currentEditorInfo.editor) {
        const { editor, fileId, initialContent } = this.currentEditorInfo;
        this.bindToMonaco(editor, fileId, initialContent);
      }

      this.notifyListeners();
    } catch (e) {
      console.warn('WebRTC Provider initialization warning:', e);
      this.status = 'disconnected';
      this.notifyListeners();
    }
  }

  leaveRoom() {
    if (this.binding) {
      try {
        this.binding.destroy();
      } catch (e) {}
      this.binding = null;
    }

    if (this.provider) {
      try {
        this.provider.destroy();
      } catch (e) {}
      this.provider = null;
    }

    this.status = 'disconnected';
    this.isSynced = false;
    this.notifyListeners();
  }

  reconnect() {
    if (this.currentRoomId) {
      this.joinRoom(this.currentRoomId);
    }
  }

  bindToMonaco(editor, fileId, initialContent = '') {
    // Record current editor for auto-rebinding on room switch
    this.currentEditorInfo = { editor, fileId, initialContent };

    if (this.binding) {
      try {
        this.binding.destroy();
      } catch (e) {}
      this.binding = null;
    }

    if (!editor || !this.provider) return;

    try {
      const ytext = this.ydoc.getText(`file-${fileId}`);
      const model = editor.getModel();
      if (model) {
        // Crucial: Pre-populate ytext with file content before MonacoBinding constructor
        // to prevent y-monaco from wiping model content with empty string.
        if (ytext.length === 0) {
          const contentToSync = model.getValue() || initialContent || '';
          if (contentToSync) {
            ytext.insert(0, contentToSync);
          }
        }

        this.binding = new MonacoBinding(
          ytext,
          model,
          new Set([editor]),
          this.provider.awareness
        );
      }
    } catch (e) {
      console.warn('MonacoBinding note:', e);
    }
  }

  updateCursor(lineNumber, column, fileId, fileName = '') {
    if (this.provider && this.provider.awareness) {
      this.provider.awareness.setLocalStateField('cursor', {
        lineNumber,
        column,
        fileId,
        fileName
      });
    }
  }

  sendChatMessage(text) {
    if (!text || !text.trim()) return;

    if (!this.chatArray) {
      this.chatArray = this.ydoc.getArray('collab-room-chat');
    }

    const message = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      senderColor: this.currentUser.color,
      senderAvatar: this.currentUser.avatar,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.chatArray.push([message]);
    this.notifyListeners();
  }

  getChatMessages() {
    if (!this.chatArray) return [];
    try {
      return this.chatArray.toArray();
    } catch (e) {
      return [];
    }
  }

  getCollaborators() {
    const list = [
      {
        ...this.currentUser,
        isSelf: true
      }
    ];

    if (this.provider && this.provider.awareness) {
      const states = this.provider.awareness.getStates();
      states.forEach((state, clientID) => {
        if (clientID !== this.ydoc.clientID && state.user) {
          list.push({
            id: 'peer-' + clientID,
            name: state.user.name || 'Anonymous Peer',
            color: state.user.color || '#61afef',
            avatar: state.user.avatar || (state.user.name ? state.user.name.slice(0, 2).toUpperCase() : 'P'),
            cursor: state.cursor,
            status: 'online',
            isSelf: false
          });
        }
      });
    }
    return list;
  }

  getRoomState() {
    return {
      roomId: this.currentRoomId,
      status: this.status, // 'connected' | 'connecting' | 'disconnected'
      isSynced: this.isSynced,
      connected: !!this.provider && this.status !== 'disconnected',
      currentUser: this.currentUser,
      collaborators: this.getCollaborators(),
      messages: this.getChatMessages()
    };
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getRoomState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    const state = this.getRoomState();
    this.listeners.forEach(l => {
      try {
        l(state);
      } catch (err) {
        console.error('Error in collab listener:', err);
      }
    });
  }
}
