import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';

const USER_COLORS = [
  '#61afef', // Blue
  '#98c379', // Green
  '#c678dd', // Purple
  '#e5c07b', // Yellow
  '#e06c75', // Red
  '#56b6c2', // Cyan
  '#ff9e64', // Orange
  '#bb9af7'  // Lavender
];

const USER_NAMES = [
  'Alex Rivera',
  'Taylor Swift',
  'Jordan Chen',
  'Morgan Lee',
  'Casey Smith',
  'Devin Vance',
  'Riley Quinn',
  'Samira Khan'
];

export class CollaborationService {
  constructor() {
    this.ydoc = new Y.Doc();
    this.provider = null;
    this.binding = null;
    this.currentRoomId = 'collab-room-alpha';
    this.listeners = [];

    // Generate distinct random user identity
    const randomName = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
    const randomColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const initials = randomName.split(' ').map(n => n[0]).join('');

    this.currentUser = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      name: randomName,
      color: randomColor,
      avatar: initials,
      status: 'online'
    };
  }

  static getInstance() {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  joinRoom(roomId) {
    if (this.provider) {
      this.provider.destroy();
    }

    this.currentRoomId = roomId;

    try {
      this.provider = new WebrtcProvider(roomId, this.ydoc, {
        signaling: [
          'wss://signaling.yjs.dev',
          'wss://y-webrtc-signaling-eu.herokuapp.com',
          'wss://y-webrtc-signaling-us.herokuapp.com'
        ],
        password: null
      });

      // Set user awareness state
      this.provider.awareness.setLocalStateField('user', {
        name: this.currentUser.name,
        color: this.currentUser.color,
        avatar: this.currentUser.avatar
      });

      this.provider.awareness.on('change', () => {
        this.notifyListeners();
      });

      this.notifyListeners();
    } catch (e) {
      console.warn('WebRTC Provider init note:', e);
    }
  }

  bindToMonaco(editor, fileId, initialContent = '') {
    if (this.binding) {
      this.binding.destroy();
      this.binding = null;
    }

    if (!editor || !this.provider) return;

    try {
      const ytext = this.ydoc.getText(`file-${fileId}`);
      const model = editor.getModel();
      if (model) {
        // CRITICAL: Initialize ytext with the file's content before binding.
        // Otherwise, y-monaco constructor calls model.setValue(ytext.toString())
        // which wipes out the local file content to ""!
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

  updateCursor(lineNumber, column, fileId) {
    if (this.provider && this.provider.awareness) {
      this.provider.awareness.setLocalStateField('cursor', {
        lineNumber,
        column,
        fileId
      });
    }
  }

  getCollaborators() {
    const list = [this.currentUser];
    if (this.provider && this.provider.awareness) {
      const states = this.provider.awareness.getStates();
      states.forEach((state, clientID) => {
        if (clientID !== this.ydoc.clientID && state.user) {
          list.push({
            id: 'peer-' + clientID,
            name: state.user.name || 'Anonymous Peer',
            color: state.user.color || '#61afef',
            avatar: state.user.avatar || 'P',
            cursor: state.cursor,
            status: 'online'
          });
        }
      });
    }
    return list;
  }

  getRoomState() {
    return {
      roomId: this.currentRoomId,
      isHost: true,
      connected: !!this.provider,
      collaborators: this.getCollaborators()
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
    this.listeners.forEach(l => l(state));
  }
}
