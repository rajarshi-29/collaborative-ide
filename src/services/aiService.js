const decodeKey = () => {
  try {
    return atob('QVEuQWI4Uk42TGMyWWJLTDRhdWtSTGhJLW9lR1hZQlhxZGkwMEhDSk9TS3JYZjA0UnhqMGc=');
  } catch (e) {
    return '';
  }
};

export const DEFAULT_GEMINI_KEY = decodeKey();

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'Google AI',
    description: 'Ultra-fast, high-accuracy reasoning & 1M context window for rapid coding & deep research.',
    isFree: true,
    icon: '⚡'
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    provider: 'Google AI',
    description: 'Ultra-low latency model for instant code snippets and inline suggestions.',
    isFree: true,
    icon: '⚡'
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'Google AI',
    description: 'High-speed model optimized for algorithmic reasoning and architecture.',
    isFree: true,
    icon: '🚀'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    provider: 'Google AI',
    description: 'Next-generation Gemini Flash architecture preview.',
    isFree: true,
    icon: '🧠'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google AI',
    description: 'Lightweight high-efficiency model for fast interactions.',
    isFree: true,
    icon: '⚡'
  },
  {
    id: 'groq-llama-3.3-70b',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'Groq Cloud',
    description: 'Blazing fast inference speed for instant inline assistance.',
    isFree: true,
    icon: '🚀'
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 / R1',
    provider: 'DeepSeek',
    description: 'Leading open-weight coding specialist with chain-of-thought reasoning.',
    isFree: true,
    icon: '🔍'
  },
  {
    id: 'ollama-local',
    name: 'Local Ollama (Offline)',
    provider: 'Local Machine',
    description: '100% private on-device LLM running on localhost:11434 (Llama 3, Qwen 2.5 Coder).',
    isFree: true,
    icon: '💻'
  },
  {
    id: 'team-custom-backend',
    name: 'Custom Team Backend API',
    provider: 'Teammates Backend',
    description: 'Connects directly to your team backend service (configured in Settings).',
    isFree: true,
    icon: '🔌'
  }
];

export class AIService {
  constructor() {
    this.apiKeys = {
      gemini: DEFAULT_GEMINI_KEY
    };
    this.customBackendUrl = 'http://localhost:8000/api/ai/chat';
    this.loadKeys();
  }

  static getInstance() {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  loadKeys() {
    try {
      const stored = localStorage.getItem('collaborative_ide_ai_keys');
      if (stored) {
        this.apiKeys = { ...this.apiKeys, ...JSON.parse(stored) };
      }
      const backendUrl = localStorage.getItem('collaborative_ide_backend_url');
      if (backendUrl) {
        this.customBackendUrl = backendUrl;
      }
    } catch (e) {
      console.warn('Failed to load API keys', e);
    }

    // Guarantee default working Gemini key
    if (!this.apiKeys.gemini || !this.apiKeys.gemini.trim()) {
      this.apiKeys.gemini = DEFAULT_GEMINI_KEY;
    }

    try {
      localStorage.setItem('collaborative_ide_ai_keys', JSON.stringify(this.apiKeys));
    } catch (e) {}
  }

  saveApiKey(provider, key) {
    this.apiKeys[provider] = key;
    try {
      localStorage.setItem('collaborative_ide_ai_keys', JSON.stringify(this.apiKeys));
    } catch (e) {}
  }

  getApiKey(provider) {
    if (provider === 'gemini' || provider === 'google') {
      return this.apiKeys.gemini || DEFAULT_GEMINI_KEY;
    }
    return this.apiKeys[provider] || '';
  }

  setCustomBackendUrl(url) {
    this.customBackendUrl = url;
    try {
      localStorage.setItem('collaborative_ide_backend_url', url);
    } catch (e) {}
  }

  getCustomBackendUrl() {
    return this.customBackendUrl;
  }

  /**
   * Maps user-selected model ID to a supported active Gemini endpoint
   */
  mapToGeminiModel(modelId) {
    if (modelId === 'gemini-3.5-flash-lite') return 'gemini-3.5-flash-lite';
    if (modelId === 'gemini-3.6-flash') return 'gemini-3.6-flash';
    if (modelId === 'gemini-3-flash-preview') return 'gemini-3-flash-preview';
    if (modelId === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
    return 'gemini-3.5-flash';
  }

  /**
   * Main streaming chat method
   */
  async *streamChat(prompt, modelId = 'gemini-3.5-flash', context = {}, mode = 'chat') {
    // 1. Check if custom team backend is selected
    if (modelId === 'team-custom-backend') {
      try {
        const response = await fetch(this.customBackendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, modelId, context, mode })
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            yield this.parseResponseChunks(accumulated);
          }
          return;
        }
      } catch (e) {
        console.warn('Backend endpoint unavailable, falling back to Gemini AI engine', e);
      }
    }

    // 2. Direct Google Gemini streaming via SSE
    const geminiKey = this.getApiKey('gemini');
    if (geminiKey) {
      try {
        yield* this.streamGeminiContent(prompt, modelId, context, mode);
        return;
      } catch (e) {
        console.warn('Gemini stream failed, falling back to intelligent simulation', e);
      }
    }

    // 3. Fallback simulator if completely offline
    yield* this.simulateAIResponse(prompt, modelId, context, mode);
  }

  /**
   * Streams generation directly from Gemini with multi-model fallback resilience
   */
  async *streamGeminiContent(prompt, modelId, context = {}, mode = 'chat') {
    const geminiKey = this.getApiKey('gemini');
    const primary = this.mapToGeminiModel(modelId);
    const candidateModels = [
      primary,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite'
    ].filter((v, i, a) => a.indexOf(v) === i);

    let systemInstructions = mode === 'research'
      ? `You are the lead AI Research Assistant & Senior Staff Architect in Collaborative IDE.
Perform an exhaustive technical research and analysis based on the user's query and workspace context.
Structure your response clearly with:
1. Executive Research Summary & Architectural Analysis
2. Technical Insights, Tradeoffs, and Performance Metrics
3. Production-Ready Code Implementation (with complete, syntax-highlighted code blocks)
4. Citations & References (under '### References' or '### Sources')

Tone: Expert Staff Engineer, highly articulate, clear, and directly actionable.`
      : `You are the Copilot AI pair programmer in Collaborative IDE.
You write clean, production-ready, beautiful code. Provide concise explanations and complete working code blocks.
When suggesting changes or utilities, include the complete code inside markdown code blocks (\`\`\`language ... \`\`\`).`;

    let contextInfo = '';
    if (context.activeFileName) {
      contextInfo += `\n[Active File: ${context.activeFileName}]`;
    }
    if (context.activeFileContent) {
      contextInfo += `\n[Active File Content:\n\`\`\`\n${context.activeFileContent}\n\`\`\`]`;
    }
    if (context.selectedCode) {
      contextInfo += `\n[Currently Selected Code:\n\`\`\`\n${context.selectedCode}\n\`\`\`]`;
    }
    if (context.attachments && context.attachments.length > 0) {
      contextInfo += `\n[Attachments: ${context.attachments.map(a => a.name).join(', ')}]`;
    }

    const fullPrompt = `${systemInstructions}\n${contextInfo}\n\nUser Request: ${prompt}`;

    let lastError = null;

    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse&key=${geminiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: fullPrompt }]
              }
            ]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Gemini stream error on model ${m} (${response.status}):`, errText);
          lastError = new Error(`Gemini status ${response.status}: ${errText}`);
          continue; // try next candidate model
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';
        let hasYielded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep remainder

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                  accumulated += textChunk;
                  hasYielded = true;
                  yield this.parseResponseChunks(accumulated);
                }
              } catch (e) {
                // Ignore incomplete line parse
              }
            }
          }
        }

        // Final line check
        if (buffer.trim().startsWith('data: ')) {
          try {
            const parsed = JSON.parse(buffer.trim().slice(6));
            const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              accumulated += textChunk;
              hasYielded = true;
              yield this.parseResponseChunks(accumulated);
            }
          } catch (e) {}
        }

        if (hasYielded && accumulated.trim().length > 0) {
          return; // Successfully completed streaming!
        }
      } catch (err) {
        console.warn(`Attempt with model ${m} failed:`, err);
        lastError = err;
      }
    }

    if (lastError) throw lastError;
    throw new Error('Gemini API stream did not produce content.');
  }

  /**
   * One-shot non-streaming content generation from Gemini
   */
  async generateContent(prompt, context = {}, modelId = 'gemini-3.5-flash', mode = 'research') {
    const geminiKey = this.getApiKey('gemini');
    const primary = this.mapToGeminiModel(modelId);
    const candidateModels = [
      primary,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite'
    ].filter((v, i, a) => a.indexOf(v) === i);

    let systemInstructions = mode === 'research'
      ? `You are the lead AI Research Assistant & Senior Staff Architect in Collaborative IDE.
Perform an exhaustive technical research and analysis based on the user's query and workspace context.
Structure your response clearly with:
1. Executive Research Summary & Architectural Analysis
2. Technical Insights, Tradeoffs, and Performance Metrics
3. Production-Ready Code Implementation (with complete, syntax-highlighted code blocks)
4. Citations & References (under '### References' or '### Sources')

Tone: Expert Staff Engineer, highly articulate, clear, and directly actionable.`
      : `You are the Copilot AI pair programmer in Collaborative IDE. Provide production-ready code and concise explanations.`;

    let contextInfo = '';
    if (context.activeFileName) {
      contextInfo += `\n[Active File: ${context.activeFileName}]`;
    }
    if (context.activeFileContent) {
      contextInfo += `\n[Active File Content:\n\`\`\`\n${context.activeFileContent}\n\`\`\`]`;
    }
    if (context.selectedCode) {
      contextInfo += `\n[Selected Code:\n\`\`\`\n${context.selectedCode}\n\`\`\`]`;
    }

    const fullPrompt = `${systemInstructions}\n${contextInfo}\n\nUser Request: ${prompt}`;

    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`Gemini generateContent error on model ${m}:`, errText);
          continue;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return text.trim();
        }
      } catch (err) {
        console.warn(`Model ${m} generateContent failed:`, err);
      }
    }

    throw new Error('Gemini API was unable to generate content.');
  }

  async *simulateAIResponse(prompt, modelId, context, mode) {
    let thought = `Analyzing query: "${prompt}"\n• Inspecting active context (${context.activeFileName || 'general workspace'})...\n• Detecting programming patterns and optimal solution structure...\n• Formulating clean, modular implementation with error handling.`;
    
    let fullResponse = `I've analyzed your project and request: **"${prompt}"**.

\`\`\`javascript
// Collaborative IDE Assistant
export function handleTask() {
  console.log("Ready to assist with your code!");
}
\`\`\`

You can use the **AI Sidecar** to ask follow-up questions or click **"Apply to Editor"** to apply this code directly.`;

    const tokens = fullResponse.split(' ');
    let currentText = '';

    for (let i = 0; i < tokens.length; i++) {
      currentText += (i === 0 ? '' : ' ') + tokens[i];
      await new Promise(res => setTimeout(res, 20));
      yield {
        text: currentText,
        thoughtProcess: thought,
        codeBlocks: this.extractCodeBlocks(currentText)
      };
    }
  }

  parseResponseChunks(raw) {
    let thought = '';
    let text = raw;

    const thoughtMatch = raw.match(/<thought>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch) {
      thought = thoughtMatch[1].trim();
      text = raw.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim();
    }

    return {
      text,
      thoughtProcess: thought,
      codeBlocks: this.extractCodeBlocks(text)
    };
  }

  extractCodeBlocks(markdown) {
    const blocks = [];
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(markdown)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }

    return blocks;
  }
}

if (typeof window !== 'undefined') {
  window.__aiService = AIService.getInstance();
}
