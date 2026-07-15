import React from "react";

export default function Message({ role, content, displayText, attachments, error, streaming, modelName }) {
  const isUser = role === "user";
  return (
    <div className={`gw-msg ${isUser ? "user" : "model"}`}>
      <div className={`gw-avatar ${isUser ? "user" : "model"}`}>{isUser ? "U" : "G"}</div>
      <div className={`gw-bubble ${isUser ? "user" : "model"}${error ? " gw-error-bubble" : ""}`}>
        <span className="gw-meta">{isUser ? "you" : modelName}</span>
        {attachments?.length > 0 && (
          <div className="gw-attachments">
            {attachments.map((a) =>
              a.type === "image" ? (
                <img key={a.id} src={a.raw} alt={a.name} />
              ) : (
                <span key={a.id} className="gw-doc-badge">
                  📄 {a.name}
                </span>
              )
            )}
          </div>
        )}
        {isUser ? displayText : content}
        {streaming && <span className="gw-cursor" />}
      </div>
    </div>
  );
}
