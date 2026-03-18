"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";

// Global auto-read state (shared across all TTS buttons)
const AUTO_READ_KEY = "tts-auto-read";

function getAutoRead(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTO_READ_KEY) === "true";
}

function setAutoRead(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTO_READ_KEY, value ? "true" : "false");
}

/**
 * Clean text for natural speech:
 * - Remove emojis
 * - Remove markdown formatting (**, *, #, ```, etc.)
 * - Remove URLs
 * - Collapse extra whitespace
 * - Add natural pauses (periods after headings)
 */
function cleanTextForSpeech(text: string): string {
  return text
    // Remove action/emotion descriptions in various formats:
    // *从椅子上弹跳起来* / *bounces excitedly*
    .replace(/\*[^*]{2,80}\*/g, "")
    // （搓手手，跃跃欲试） / (leans forward with interest)
    .replace(/[（(][^）)]{2,60}[）)]/g, "")
    // 「动作描写」
    .replace(/「[^」]{2,60}」/g, "")
    // Lines that are purely action descriptions (Chinese pattern: start with CJK verb, short line)
    .replace(/^[\u4e00-\u9fff]{1,2}[\u4e00-\u9fff，、]{2,20}$/gm, "")
    // Remove emoji (Unicode emoji ranges)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, " (code block) ")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown bold/italic
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Remove markdown headings — add a pause after
    .replace(/^#{1,6}\s+(.+)$/gm, "$1.")
    // Remove markdown links — keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, "")
    // Remove markdown list bullets
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Collapse multiple spaces/newlines
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Speak text using browser Web Speech API */
function speakWebSpeech(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (typeof speechSynthesis === "undefined") return null;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) { onEnd?.(); return null; }

  const utterance = new SpeechSynthesisUtterance(cleanedText);

  // Detect language and pick voice
  const voices = speechSynthesis.getVoices();
  const cjkRatio = (cleanedText.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length / cleanedText.length;
  const lang = cjkRatio > 0.1 ? "zh" : "en";

  // Prefer Microsoft Neural voices (much more natural than standard ones)
  const preferred = voices.find((v) =>
    lang === "zh"
      ? v.lang.startsWith("zh") && v.name.includes("Xiaoxiao")
      : v.lang.startsWith("en") && v.name.includes("Zira")
  ) || voices.find((v) =>
    lang === "zh"
      ? v.lang.startsWith("zh") && v.name.includes("Microsoft")
      : v.lang.startsWith("en") && v.name.includes("Microsoft")
  ) || voices.find((v) =>
    v.lang.startsWith(lang) && v.name.includes("Google")
  ) || voices.find((v) => v.lang.startsWith(lang)) || voices[0];

  if (preferred) utterance.voice = preferred;
  // Slightly slower rate sounds more natural
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  speechSynthesis.speak(utterance);
  return utterance;
}

export function TTSButton({
  text,
  tutorKey,
}: {
  text: string;
  tutorKey?: string;
}) {
  const t = useTranslations("tts");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  const handlePlay = useCallback(async () => {
    if (playing) {
      stopAll();
      return;
    }

    if (!text.trim()) return;

    setLoading(true);
    try {
      // Try API-based TTS first (OpenAI or Edge TTS)
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 4096), tutorKey }),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("audio")) {
          // Got audio back — play it
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
          }
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
          audio.onerror = () => { setPlaying(false); URL.revokeObjectURL(url); };
          await audio.play();
          setPlaying(true);
          return;
        }

        // Got JSON fallback — use Web Speech API
        const data = await res.json();
        if (data.fallback === "webspeech") {
          speakWebSpeech(text.slice(0, 4096), () => setPlaying(false));
          setPlaying(true);
          return;
        }
      }

      // Direct fallback to Web Speech
      speakWebSpeech(text.slice(0, 4096), () => setPlaying(false));
      setPlaying(true);
    } catch {
      // Last resort: Web Speech API
      speakWebSpeech(text.slice(0, 4096), () => setPlaying(false));
      setPlaying(true);
    } finally {
      setLoading(false);
    }
  }, [text, tutorKey, playing, stopAll]);

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${
        playing
          ? "bg-purple-500/20 text-purple-400"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      } ${loading ? "animate-pulse" : ""}`}
      title={playing ? t("stop") : t("play")}
    >
      {loading ? (
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      ) : playing ? (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}

/**
 * Auto-read toggle button — when enabled, every new AI message is auto-read aloud.
 */
export function AutoReadToggle() {
  const t = useTranslations("tts");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getAutoRead());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setAutoRead(next);
    if (!next && typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
        enabled
          ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
          : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
      title={enabled ? t("autoReadOn") : t("autoReadOff")}
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      <span className="hidden sm:inline">{enabled ? t("autoOn") : t("autoOff")}</span>
    </button>
  );
}

/**
 * Call this when a new AI message arrives to auto-read it.
 */
export function autoReadMessage(text: string) {
  if (!getAutoRead()) return;
  if (!text.trim()) return;
  speakWebSpeech(text.slice(0, 4096));
}
