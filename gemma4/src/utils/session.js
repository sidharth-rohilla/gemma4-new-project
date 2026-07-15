export const FORMAT_DEFAULTS = {
  ollama: "http://localhost:11434/api/chat",
  openai: "http://localhost:1234/v1/chat/completions",
};

export function createSession() {
  return {
    id: "session_" + Date.now() + "_" + Math.random().toString(36).slice(2),
    title: "New conversation",
    messages: [],
  };
}

export function deriveTitle(text, maxLen = 26) {
  return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
}
