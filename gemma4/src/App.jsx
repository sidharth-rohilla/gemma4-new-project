import React, { useCallback, useEffect, useRef, useState } from "react";
import "./styles/gemma.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ConfigPanel from "./components/ConfigPanel";
import ChatThread from "./components/ChatThread";
import Composer from "./components/Composer";
import StarfieldBg from "./components/StarfieldBg";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { streamCompletion } from "./utils/api";
import { createSession, deriveTitle, FORMAT_DEFAULTS } from "./utils/session";

// ---------------------------------------------------------------------------
// Gemma Workspace — a full chat page for talking to a local or hosted
// Gemma model over an Ollama- or OpenAI-compatible streaming endpoint.
//
// Sessions live in React state only (no localStorage / browser storage),
// so history resets on reload. Swap `sessions`/`setSessions` for a real
// persistence layer (backend, IndexedDB, etc.) if you need it to stick.
// ---------------------------------------------------------------------------

export default function App() {
  const [sessions, setSessions] = useState(() => [createSession()]);
  const [currentId, setCurrentId] = useState(() => sessions[0].id);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [format, setFormat] = useState("ollama");
  const [endpoint, setEndpoint] = useState(FORMAT_DEFAULTS.ollama);
  const [modelName, setModelName] = useState("gemma3");
  const [apiKey, setApiKey] = useState("");
  const [lang, setLang] = useState("en");

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("idle");

  const chatRef = useRef(null);
  const session = sessions.find((s) => s.id === currentId) ?? sessions[0];

  const { listening, toggleMic, supported: micSupported } = useSpeechRecognition(lang, (transcript) => {
    setInput((cur) => (cur ? cur + " " + transcript : transcript));
  });

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [session?.messages, busy]);

  function updateSession(id, updater) {
    setSessions((cur) => cur.map((s) => (s.id === id ? updater(s) : s)));
  }

  function handleNewChat() {
    const s = createSession();
    setSessions((cur) => [s, ...cur]);
    setCurrentId(s.id);
    setAttachments([]);
  }

  function handleDeleteSession(id, e) {
    e.stopPropagation();
    setSessions((cur) => {
      const next = cur.filter((s) => s.id !== id);
      if (next.length === 0) {
        const s = createSession();
        setCurrentId(s.id);
        return [s];
      }
      if (id === currentId) setCurrentId(next[0].id);
      return next;
    });
  }

  function handleFormatChange(next) {
    setFormat(next);
    setEndpoint(FORMAT_DEFAULTS[next]);
  }

  function handleAddFiles(fileList) {
    Array.from(fileList || []).forEach((file) => {
      const reader = new FileReader();
      if (file.type.startsWith("image/")) {
        reader.onload = (ev) => {
          setAttachments((cur) => [
            ...cur,
            {
              id: Math.random().toString(36).slice(2),
              type: "image",
              name: file.name,
              raw: ev.target.result,
              base64: ev.target.result.split(",")[1],
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          setAttachments((cur) => [
            ...cur,
            { id: Math.random().toString(36).slice(2), type: "document", name: file.name, textContent: ev.target.result },
          ]);
        };
        reader.readAsText(file);
      }
    });
  }

  function handleRemoveAttachment(id) {
    setAttachments((cur) => cur.filter((a) => a.id !== id));
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || busy) return;

    let injections = "";
    attachments.forEach((f) => {
      if (f.type === "document") {
        injections += `\n\n--- Content from file: ${f.name} ---\n${f.textContent}\n--- End of File ---`;
      }
    });
    if (lang !== "en") {
      injections += `\n\n[System directive: respond entirely in language code: ${lang}]`;
    }

    const images = attachments.filter((a) => a.type === "image").map((a) => a.base64);
    const userMsg = {
      role: "user",
      content: text + injections,
      displayText: text,
      attachments,
      ...(images.length ? { images } : {}),
    };

    const id = currentId;
    setInput("");
    setAttachments([]);

    updateSession(id, (s) => ({
      ...s,
      title: s.messages.length === 0 ? deriveTitle(text) : s.title,
      messages: [...s.messages, userMsg],
    }));

    setBusy(true);
    setStatus("generating…");

    // placeholder assistant message we stream tokens into
    updateSession(id, (s) => ({
      ...s,
      messages: [...s.messages, { role: "assistant", content: "", streaming: true }],
    }));

    try {
      const history = [...session.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.images && { images: m.images }),
      }));

      let acc = "";
      await streamCompletion({
        format,
        endpoint,
        modelName,
        apiKey,
        messages: history,
        onChunk: (chunk) => {
          acc += chunk;
          updateSession(id, (s) => {
            const msgs = [...s.messages];
            msgs[msgs.length - 1] = { role: "assistant", content: acc, streaming: true };
            return { ...s, messages: msgs };
          });
        },
      });

      updateSession(id, (s) => {
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = { role: "assistant", content: acc };
        return { ...s, messages: msgs };
      });
      setStatus("ok");
    } catch (err) {
      updateSession(id, (s) => {
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = { role: "assistant", content: "Request failed: " + err.message, error: true };
        return { ...s, messages: msgs };
      });
      setStatus("err");
    } finally {
      setBusy(false);
    }
  }, [input, attachments, busy, currentId, session, format, endpoint, modelName, apiKey, lang]);

  return (
    <div className="gw">
      <StarfieldBg />
      <Sidebar
        open={sidebarOpen}
        sessions={sessions}
        currentId={currentId}
        onSelect={setCurrentId}
        onNewChat={handleNewChat}
        onDelete={handleDeleteSession}
      />

      <main className="gw-main">
        <Header
          modelName={modelName}
          format={format}
          busy={busy}
          status={status}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleConfig={() => setConfigOpen((v) => !v)}
        />

        <ConfigPanel
          open={configOpen}
          format={format}
          endpoint={endpoint}
          modelName={modelName}
          apiKey={apiKey}
          lang={lang}
          onFormatChange={handleFormatChange}
          onEndpointChange={setEndpoint}
          onModelNameChange={setModelName}
          onApiKeyChange={setApiKey}
          onLangChange={setLang}
        />

        <ChatThread ref={chatRef} messages={session.messages} modelName={modelName} />

        <Composer
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          attachments={attachments}
          onAddFiles={handleAddFiles}
          onRemoveAttachment={handleRemoveAttachment}
          busy={busy}
          listening={listening}
          onToggleMic={toggleMic}
          micSupported={micSupported}
        />
      </main>
    </div>
  );
}
