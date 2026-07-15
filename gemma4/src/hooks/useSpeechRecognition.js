import { useEffect, useRef, useState } from "react";

const LANG_MAP = { en: "en-US", hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN" };

/**
 * Wraps the browser's native SpeechRecognition API.
 * Returns { supported, listening, toggleMic } — call toggleMic to start/stop
 * a single recognition pass; the transcript is passed to onResult.
 */
export function useSpeechRecognition(lang, onResult) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => onResultRef.current(e.results[0][0].transcript);
    recognitionRef.current = rec;
    return () => rec.abort?.();
  }, []);

  function toggleMic() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
    } else {
      rec.lang = LANG_MAP[lang] || "en-US";
      rec.start();
    }
  }

  return { supported: Boolean(recognitionRef.current), listening, toggleMic };
}
