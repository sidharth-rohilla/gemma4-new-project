/**
 * Stream a chat completion from an Ollama or OpenAI-compatible endpoint.
 *
 * @param {object} opts
 * @param {"ollama"|"openai"} opts.format
 * @param {string} opts.endpoint
 * @param {string} opts.modelName
 * @param {string} [opts.apiKey]
 * @param {Array<{role: string, content: string, images?: string[]}>} opts.messages
 * @param {(chunk: string) => void} opts.onChunk called with each new text delta
 * @returns {Promise<string>} the full accumulated response text
 */
export async function streamCompletion({ format, endpoint, modelName, apiKey, messages, onChunk }) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = "Bearer " + apiKey;

  let body;
  if (format === "ollama") {
    body = JSON.stringify({ model: modelName, messages, stream: true });
  } else {
    const adapted = messages.map((m) =>
      m.images?.length
        ? {
            role: m.role,
            content: [
              { type: "text", text: m.content },
              ...m.images.map((b64) => ({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${b64}` },
              })),
            ],
          }
        : m
    );
    body = JSON.stringify({ model: modelName, messages: adapted, stream: true });
  }

  const res = await fetch(endpoint, { method: "POST", headers, body });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${t ? " — " + t.slice(0, 200) : ""}`);
  }

  // Some backends may not stream; fall back to a single JSON payload.
  if (!res.body) {
    const data = await res.json();
    const content =
      format === "ollama" ? data.message?.content || "" : data.choices?.[0]?.message?.content || "";
    onChunk(content);
    return content;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (format === "openai") {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const delta = JSON.parse(payload).choices?.[0]?.delta?.content || "";
          if (delta) {
            full += delta;
            onChunk(delta);
          }
        } catch {
          // ignore malformed SSE frames
        }
      } else {
        try {
          const delta = JSON.parse(line).message?.content || "";
          if (delta) {
            full += delta;
            onChunk(delta);
          }
        } catch {
          // ignore malformed JSONL frames
        }
      }
    }
  }
  return full;
}
