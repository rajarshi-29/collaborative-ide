import { AIService } from '../../services/aiService';

class AIWidgetStore {
  constructor() {
    this.state = {
      isDetached: false,
      position: { x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 80) : 1000, y: 140 },
      isOpen: false,
      isResearching: false,
      history: [
        {
          id: 'welcome-init',
          sender: 'assistant',
          text: 'Hello! I am AI Research, powered by Gemini. Ask me anything about your project architecture, algorithms, or code.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    this.listeners = new Set();
    this.aiService = AIService.getInstance();
  }

  getState = () => this.state;

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  notify = () => {
    this.listeners.forEach(fn => fn(this.state));
  };

  setDetached = (isDetached, initialPos) => {
    this.state = {
      ...this.state,
      isDetached,
      position: initialPos ? { x: initialPos.x, y: initialPos.y } : this.state.position
    };
    this.notify();
  };

  setPosition = (posOrUpdater) => {
    const nextPos = typeof posOrUpdater === 'function' ? posOrUpdater(this.state.position) : posOrUpdater;
    this.state = { ...this.state, position: nextPos };
    this.notify();
  };

  setOpen = (isOpenOrUpdater) => {
    const nextOpen = typeof isOpenOrUpdater === 'function' ? isOpenOrUpdater(this.state.isOpen) : isOpenOrUpdater;
    this.state = { ...this.state, isOpen: nextOpen };
    this.notify();
  };

  toggleOpen = () => {
    this.setOpen(!this.state.isOpen);
  };

  dock = () => {
    this.state = { ...this.state, isDetached: false, isOpen: false };
    this.notify();
  };

  clearHistory = () => {
    this.state = { ...this.state, history: [] };
    this.notify();
  };

  // Deep AI Research Pipeline Powered by Gemini API
  sendQuery = async (queryText, context = {}) => {
    const { activeFileName = '', activeFileContent = '' } = context;
    if (!queryText || !queryText.trim()) return;

    const userMsg = {
      id: 'query-' + Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantId = 'res-' + Date.now();
    const assistantMsg = {
      id: assistantId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phases: [
        { label: 'Parsing query & intent', status: 'done' },
        { label: 'Scanning workspace AST & dependencies', status: 'active' },
        { label: 'Connecting to Gemini AI Engine', status: 'waiting' },
        { label: 'Synthesizing research & code blocks', status: 'waiting' }
      ]
    };

    this.state = {
      ...this.state,
      isResearching: true,
      history: [...this.state.history, userMsg, assistantMsg]
    };
    this.notify();

    // Helper to update phases and text
    const updatePhase = (phaseIndex, status, nextText = null) => {
      this.state = {
        ...this.state,
        history: this.state.history.map(msg => {
          if (msg.id !== assistantId) return msg;
          const nextPhases = msg.phases.map((p, idx) => idx === phaseIndex ? { ...p, status } : p);
          return {
            ...msg,
            text: nextText !== null ? nextText : msg.text,
            phases: nextPhases
          };
        })
      };
      this.notify();
    };

    try {
      await new Promise(r => setTimeout(r, 200));
      updatePhase(1, 'done');
      updatePhase(2, 'active');

      const stream = this.aiService.streamChat(
        queryText,
        'gemini-3.5-flash',
        {
          activeFileName,
          activeFileContent,
          selectedCode: context.selectedCode
        },
        'research'
      );

      let firstChunk = true;
      let finalAccumulated = '';
      let finalBlocks = [];

      for await (const chunk of stream) {
        if (firstChunk) {
          updatePhase(2, 'done');
          updatePhase(3, 'active');
          firstChunk = false;
        }

        finalAccumulated = chunk.text;
        finalBlocks = chunk.codeBlocks;

        this.state = {
          ...this.state,
          history: this.state.history.map(msg => {
            if (msg.id !== assistantId) return msg;
            return {
              ...msg,
              text: chunk.text,
              codeBlocks: chunk.codeBlocks
            };
          })
        };
        this.notify();
      }

      updatePhase(3, 'done');
    
      // Extract technical sources/citations if explicitly present
      let citations = [];
      const sourcesMatch = finalAccumulated.match(/(?:###?\s*(?:Sources|References|Citations)[\s\S]*)/i);
      if (sourcesMatch) {
        const lines = sourcesMatch[0].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()));
        citations = lines.map(l => l.replace(/^[-*\d.]+\s*/, '').replace(/\[(.*?)\]\(.*?\)/, '$1').trim()).filter(Boolean).slice(0, 4);
      }

      this.state = {
        ...this.state,
        history: this.state.history.map(msg => {
          if (msg.id !== assistantId) return msg;
          return {
            ...msg,
            sources: citations
          };
        })
      };
    } catch (err) {
      console.error('AI Research Error:', err);
      this.state = {
        ...this.state,
        history: this.state.history.map(msg => {
          if (msg.id !== assistantId) return msg;
          return {
            ...msg,
            text: `Research failed: ${err.message || 'Unable to connect to Gemini API'}. Please verify your API key or network connection.`
          };
        })
      };
    } finally {
      this.state = { ...this.state, isResearching: false };
      this.notify();
    }
  };
}

export const aiWidgetStore = new AIWidgetStore();

if (typeof window !== 'undefined') {
  window.__aiWidgetStore = aiWidgetStore;
}
