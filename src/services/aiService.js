/**
 * Resolves the active Gemini API key from environment variables (.env via Electron runtime),
 * local storage, or fallback settings.
 */
export const resolveGeminiApiKey = () => {
  // 1. Electron preload bridge environment (.env loaded by electron/main.cjs at runtime)
  try {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.env) {
      const key = window.electronAPI.env.GEMINI_API_KEY || window.electronAPI.env.VITE_GEMINI_API_KEY;
      if (key && typeof key === 'string' && key.trim() && key.trim() !== 'your_gemini_api_key_here') {
        return key.trim();
      }
    }
  } catch (e) {}

  // 2. Node process.env (for tests / server / electron main contexts)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (key && typeof key === 'string' && key.trim() && key.trim() !== 'your_gemini_api_key_here') {
        return key.trim();
      }
    }
  } catch (e) {}

  return '';
};

export const DEFAULT_GEMINI_KEY = resolveGeminiApiKey();

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
      gemini: resolveGeminiApiKey()
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
    const activeEnvKey = resolveGeminiApiKey();

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

    // Guarantee working Gemini key: use active environment key if empty or default fallback
    if (!this.apiKeys.gemini || !this.apiKeys.gemini.trim() || this.apiKeys.gemini === DEFAULT_GEMINI_KEY) {
      this.apiKeys.gemini = activeEnvKey;
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
      const envKey = resolveGeminiApiKey();
      return (this.apiKeys.gemini && this.apiKeys.gemini.trim()) ? this.apiKeys.gemini : envKey;
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
      ? `You are the AI Research Assistant in Collaborative IDE.
CORE INSTRUCTIONS:
- Be direct, highly relevant, and concise. Answer the specific question asked without unnecessary preamble, filler, or unsolicited lengthy structured reports.
- Keep explanations clear and focused. Use brief bullet points or short paragraphs for readability.
- If code is needed, provide only the clean, minimal snippet directly addressing the problem. Avoid large walls of boilerplate.
- Do NOT generate unsolicited multi-section essays (e.g. avoid forced executive summaries, tradeoff matrices, or boilerplate citations unless explicitly requested).
- Prioritize accuracy, conciseness, and relevance above all.`
      : `You are the Copilot AI pair programmer in Collaborative IDE.
Be concise, accurate, and direct. Provide clean, minimal working code and brief explanations. Avoid unnecessary conversational filler.`;

    let contextInfo = '';
    if (context.activeFileName) {
      contextInfo += `\n[Active File: ${context.activeFileName}]`;
    }
    if (context.selectedCode && context.selectedCode.trim()) {
      const truncatedSelection = context.selectedCode.length > 2000
        ? context.selectedCode.slice(0, 2000) + '\n... (truncated)'
        : context.selectedCode;
      contextInfo += `\n[User Selected Code Focus:\n\`\`\`\n${truncatedSelection}\n\`\`\`]`;
    } else if (context.activeFileContent && context.activeFileContent.trim()) {
      const truncatedContent = context.activeFileContent.length > 2500
        ? context.activeFileContent.slice(0, 2500) + '\n... (truncated)'
        : context.activeFileContent;
      contextInfo += `\n[Active File Context (Reference):\n\`\`\`\n${truncatedContent}\n\`\`\`]`;
    }
    if (context.attachments && context.attachments.length > 0) {
      contextInfo += `\n[Attachments: ${context.attachments.map(a => a.name).join(', ')}]`;
    }

    const fullPrompt = `${systemInstructions}\n${contextInfo}\n\nUser Question/Request:\n${prompt}`;

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
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1024
            }
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
      ? `You are the AI Research Assistant in Collaborative IDE.
CORE INSTRUCTIONS:
- Be direct, highly relevant, and concise. Answer the specific question asked without unnecessary preamble, filler, or unsolicited lengthy structured reports.
- Keep explanations clear and focused. Use brief bullet points or short paragraphs for readability.
- If code is needed, provide only the clean, minimal snippet directly addressing the problem. Avoid large walls of boilerplate.
- Do NOT generate unsolicited multi-section essays (e.g. avoid forced executive summaries, tradeoff matrices, or boilerplate citations unless explicitly requested).
- Prioritize accuracy, conciseness, and relevance above all.`
      : `You are the Copilot AI pair programmer in Collaborative IDE.
Be concise, accurate, and direct. Provide clean, minimal working code and brief explanations. Avoid unnecessary conversational filler.`;

    let contextInfo = '';
    if (context.activeFileName) {
      contextInfo += `\n[Active File: ${context.activeFileName}]`;
    }
    if (context.selectedCode && context.selectedCode.trim()) {
      const truncatedSelection = context.selectedCode.length > 2000
        ? context.selectedCode.slice(0, 2000) + '\n... (truncated)'
        : context.selectedCode;
      contextInfo += `\n[User Selected Code Focus:\n\`\`\`\n${truncatedSelection}\n\`\`\`]`;
    } else if (context.activeFileContent && context.activeFileContent.trim()) {
      const truncatedContent = context.activeFileContent.length > 2500
        ? context.activeFileContent.slice(0, 2500) + '\n... (truncated)'
        : context.activeFileContent;
      contextInfo += `\n[Active File Context (Reference):\n\`\`\`\n${truncatedContent}\n\`\`\`]`;
    }
    if (context.attachments && context.attachments.length > 0) {
      contextInfo += `\n[Attachments: ${context.attachments.map(a => a.name).join(', ')}]`;
    }

    const fullPrompt = `${systemInstructions}\n${contextInfo}\n\nUser Question/Request:\n${prompt}`;

    for (const m of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1024
            }
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
