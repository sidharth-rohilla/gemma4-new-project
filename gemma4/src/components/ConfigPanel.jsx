import React from "react";

export default function ConfigPanel({
  open,
  format,
  endpoint,
  modelName,
  apiKey,
  lang,
  onFormatChange,
  onEndpointChange,
  onModelNameChange,
  onApiKeyChange,
  onLangChange,
}) {
  return (
    <div className={`gw-config${open ? " open" : ""}`}>
      <div className="gw-config-inner">
        <div className="gw-field">
          <label>Backend format</label>
          <select value={format} onChange={(e) => onFormatChange(e.target.value)}>
            <option value="ollama">Ollama (/api/chat)</option>
            <option value="openai">OpenAI-compatible (/v1/chat/completions)</option>
          </select>
        </div>
        <div className="gw-field">
          <label>Endpoint URL</label>
          <input value={endpoint} onChange={(e) => onEndpointChange(e.target.value)} />
        </div>
        <div className="gw-field">
          <label>Model name</label>
          <input value={modelName} onChange={(e) => onModelNameChange(e.target.value)} />
        </div>
        <div className="gw-field">
          <label>Language preference</label>
          <select value={lang} onChange={(e) => onLangChange(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="mr">Marathi (मराठी)</option>
          </select>
        </div>
        <div className="gw-field">
          <label>API key (optional)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Bearer token"
          />
        </div>
      </div>
    </div>
  );
}
