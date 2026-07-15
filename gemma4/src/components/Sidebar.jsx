import React from "react";

export default function Sidebar({ open, sessions, currentId, onSelect, onNewChat, onDelete }) {
  return (
    <aside className={`gw-aside${open ? "" : " closed"}`}>
      <div className="gw-sidebar-header">
        <button className="gw-new-chat-btn" onClick={onNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>
      <div className="gw-history-list">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`gw-history-item${s.id === currentId ? " active" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="gw-history-title">{s.title}</span>
            <button className="gw-del-btn" onClick={(e) => onDelete(s.id, e)} title="Delete chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
