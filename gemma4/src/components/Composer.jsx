import React, { useRef } from "react";

export default function Composer({
  input,
  onInputChange,
  onSend,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  busy,
  listening,
  onToggleMic,
  micSupported,
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  }

  function handleSendClick() {
    onSend();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  return (
    <div className="gw-composer">
      <div className="gw-composer-wrap">
        {attachments.length > 0 && (
          <div className="gw-preview-bar">
            {attachments.map((a) => (
              <div key={a.id} className="gw-preview-item">
                {a.type === "image" ? (
                  <img src={a.raw} alt={a.name} />
                ) : (
                  <span style={{ fontSize: 18, color: "var(--amethyst)" }}>📄</span>
                )}
                <button className="gw-remove-btn" onClick={() => onRemoveAttachment(a.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="gw-input-row">
          <button className="gw-attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach files">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          {micSupported && (
            <button className={`gw-mic-btn${listening ? " active" : ""}`} onClick={onToggleMic} title="Voice input">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            accept="image/*,.txt,.md,.json,.js,.csv"
            onChange={(e) => {
              onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            placeholder="Ask Gemma…"
            onChange={(e) => {
              onInputChange(e.target.value);
              autoGrow();
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            className="gw-send-btn"
            disabled={(!input.trim() && attachments.length === 0) || busy}
            onClick={handleSendClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
      <div className="gw-hint">Enter to send · Shift+Enter for a new line</div>
    </div>
  );
}
