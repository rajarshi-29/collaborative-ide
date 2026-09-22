import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AVAILABLE_MODELS } from '../../services/aiService';

export const ModelSelector = ({
  selectedModelId,
  onSelectModel
}) => {
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '3px',
        padding: '4px 8px',
        cursor: 'pointer'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-bright)' }}>
            {selectedModel ? selectedModel.name : ''}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            ({selectedModel ? selectedModel.provider : ''})
          </span>
        </div>

        <select
          value={selectedModelId}
          onChange={(e) => onSelectModel(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
            height: '100%'
          }}
          title="Select AI Model"
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} — {model.provider}
            </option>
          ))}
        </select>

        <ChevronDown size={13} color="var(--text-muted)" />
      </div>
    </div>
  );
};
