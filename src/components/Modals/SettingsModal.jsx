import React, { useState } from 'react';
import {
  X,
  Settings,
  Key,
  Sliders,
  Server,
  Save,
  Check
} from 'lucide-react';
import { AIService } from '../../services/aiService';

export const SettingsModal = ({
  isOpen,
  onClose,
  theme,
  onThemeChange
}) => {
  const aiService = AIService.getInstance();
  const [activeTab, setActiveTab] = useState('ai');
  const [geminiKey, setGeminiKey] = useState(aiService.getApiKey('gemini'));
  const [groqKey, setGroqKey] = useState(aiService.getApiKey('groq'));
  const [openRouterKey, setOpenRouterKey] = useState(aiService.getApiKey('openrouter'));
  const [backendUrl, setBackendUrl] = useState(aiService.getCustomBackendUrl());
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    aiService.saveApiKey('gemini', geminiKey.trim());
    aiService.saveApiKey('groq', groqKey.trim());
    aiService.saveApiKey('openrouter', openRouterKey.trim());
    aiService.setCustomBackendUrl(backendUrl.trim());

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '100%', maxWidth: '540px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-bright)' }}>
              Preferences
            </span>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-panel)'
        }}>
          <button
            onClick={() => setActiveTab('ai')}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: '11px',
              fontWeight: 500,
              color: activeTab === 'ai' ? 'var(--text-bright)' : 'var(--text-muted)',
              borderBottom: activeTab === 'ai' ? '2px solid var(--accent-primary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Key size={13} />
            API Keys
          </button>

          <button
            onClick={() => setActiveTab('backend')}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: '11px',
              fontWeight: 500,
              color: activeTab === 'backend' ? 'var(--text-bright)' : 'var(--text-muted)',
              borderBottom: activeTab === 'backend' ? '2px solid var(--accent-primary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Server size={13} />
            Backend
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: '11px',
              fontWeight: 500,
              color: activeTab === 'editor' ? 'var(--text-bright)' : 'var(--text-muted)',
              borderBottom: activeTab === 'editor' ? '2px solid var(--accent-primary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Sliders size={13} />
            Appearance
          </button>
        </div>

        {/* Content */}
        <div className="modal-body" style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {activeTab === 'ai' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter API key..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                  Groq API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter API key..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter API key..."
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'backend' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                Custom Team Backend URL
              </label>
              <input
                type="text"
                placeholder="http://localhost:8000/api/ai/chat"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
              />
            </div>
          )}

          {activeTab === 'editor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value)}
                >
                  <option value="atom-one-dark">Atom One Dark</option>
                  <option value="tokyo-night">Tokyo Night</option>
                  <option value="midnight-slate">Midnight Slate</option>
                  <option value="light-modern">Light Modern</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
                  Editor Font
                </label>
                <input
                  type="text"
                  readOnly
                  value="'Fira Code', Consolas, Monaco, monospace"
                  style={{ opacity: 0.8 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px 12px' }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '4px 14px', gap: '5px' }}
          >
            {savedToast ? <Check size={13} /> : <Save size={13} />}
            <span>{savedToast ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
