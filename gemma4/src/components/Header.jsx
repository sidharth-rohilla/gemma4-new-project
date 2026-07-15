import React from "react";
import GemIcon from "./GemIcon";

export default function Header({ modelName, format, busy, status, onToggleSidebar, onToggleConfig }) {
  const statusDotClass = status === "ok" ? "ok" : status === "err" ? "err" : "";
  const statusLabel = status === "ok" ? "connected" : status === "err" ? "error" : status;

  return (
    <header className="gw-header">
      <div className="gw-brand">
        <button className="gw-menu-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <GemIcon thinking={busy} />
        <div>
          <h1>Gemma Console</h1>
          <div className="gw-sub">
            {modelName || "model"} · {format}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="gw-status">
          <span className={`gw-dot ${statusDotClass}`} />
          {statusLabel}
        </div>
        <button className="gw-icon-btn" onClick={onToggleConfig}>
          ⚙ Settings
        </button>
      </div>
    </header>
  );
}
