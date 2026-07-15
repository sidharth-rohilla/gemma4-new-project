import React, { forwardRef } from "react";
import Message from "./Message";

const ChatThread = forwardRef(function ChatThread({ messages, modelName }, chatRef) {
  return (
    <div className="gw-chat" ref={chatRef}>
      <div className="gw-thread">
        {messages.length === 0 ? (
          <div className="gw-empty">
            <h2>Hello, I'm Gemma</h2>
            <p>Attach images or documents to begin a contextual session.</p>
          </div>
        ) : (
          messages.map((m, i) => <Message key={i} {...m} modelName={modelName} />)
        )}
      </div>
    </div>
  );
});

export default ChatThread;
