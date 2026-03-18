"use client";

import { type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { getTutorByKey } from "@/lib/tutors";
import { ExerciseCard, type ExerciseData } from "./exercise-card";
import { TTSButton } from "./tts-button";

function getMessageText(msg: UIMessage): string {
  const raw = msg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  // Strip hidden metadata tags from display
  return raw
    .replace(/<!--KP:[\s\S]*?-->/g, "")
    .replace(/<!--TAUGHT:[\s\S]*?-->/g, "")
    .replace(/<!--STUCK:[\s\S]*?-->/g, "")
    .replace(/<!--ATTITUDE:[\s\S]*?-->/g, "")
    .replace(/<!--STAGE:[\s\S]*?-->/g, "")
    .replace(/<!--MOOD:[\s\S]*?-->/g, "")
    .replace(/<!--EXERCISE:[\s\S]*?-->/g, "")
    .replace(/<!--WHITEBOARD:[\s\S]*?-->/g, "")
    .replace(/<!--SLIDE:[\s\S]*?-->/g, "")
    .trim();
}

function hasWhiteboard(msg: UIMessage): boolean {
  const raw = msg.parts.filter((p) => p.type === "text").map((p) => p.text).join("");
  return /<!--WHITEBOARD:/.test(raw);
}

function hasSlides(msg: UIMessage): boolean {
  const raw = msg.parts.filter((p) => p.type === "text").map((p) => p.text).join("");
  return /<!--SLIDE:/.test(raw);
}

/** Extract exercise data from assistant message */
function getMessageExercise(msg: UIMessage): ExerciseData | null {
  const raw = msg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  const match = raw.match(/<!--EXERCISE:\s*(\{[\s\S]*?\})-->/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (data.type && data.question) return data as ExerciseData;
  } catch {
    // Invalid JSON
  }
  return null;
}

/** Extract mood emoji from the last assistant message */
function getMessageMood(msg: UIMessage): string | null {
  const raw = msg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  const match = raw.match(/<!--MOOD:\s*(.+?)-->/);
  return match ? match[1].trim() : null;
}

export function ChatMessages({
  messages,
  isLoading,
  persona,
  tutorKey,
  error,
  onExerciseAnswer,
  onTutorClick,
  onWhiteboardClick,
  onSlideClick,
}: {
  messages: UIMessage[];
  isLoading: boolean;
  persona?: string;
  tutorKey?: string;
  error?: boolean;
  onExerciseAnswer?: (question: string, answer: string | number, correct: boolean) => void;
  onTutorClick?: (key: string) => void;
  onWhiteboardClick?: (msgId: string) => void;
  onSlideClick?: (msgId: string) => void;
}) {
  const tutor = tutorKey ? getTutorByKey(tutorKey) : undefined;
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll within the container only (not the whole page)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-muted-foreground">{t("emptyState")}</p>
          {!persona && (
            <p className="text-xs text-muted-foreground/60">{t("personaTip")}</p>
          )}
          <p className="text-xs text-muted-foreground/60">{t("emptyHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {messages.map((msg) => {
          const text = getMessageText(msg);
          if (!text && msg.role !== "assistant") return null;
          const exercise = msg.role === "assistant" ? getMessageExercise(msg) : null;

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/20"
                    : "bg-card text-card-foreground border border-border/50 backdrop-blur-sm"
                }`}
              >
                {msg.role === "assistant" && tutor && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-amber-400/80 font-medium">
                    <button
                      onClick={() => onTutorClick?.(tutor.key)}
                      className="flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>{tutor.emoji}</span>
                      <span>{tutor.name}</span>
                    </button>
                    {(() => {
                      const mood = getMessageMood(msg);
                      return mood ? <span className="text-sm ml-0.5" title="mood">{mood}</span> : null;
                    })()}
                    <TTSButton text={text} tutorKey={tutorKey} />
                  </div>
                )}
                {msg.role === "assistant" && !tutor && text && (
                  <div className="flex items-center gap-1 mb-1">
                    <TTSButton text={text} />
                  </div>
                )}
                {msg.role === "assistant" ? (
                  <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-code:text-purple-500 dark:prose-code:text-purple-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text || "..."}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{text}</p>
                )}
                {exercise && (
                  <ExerciseCard
                    exercise={exercise}
                    onAnswer={(answer, correct) =>
                      onExerciseAnswer?.(exercise.question, answer, correct)
                    }
                  />
                )}
                {/* Whiteboard & Slide inline buttons */}
                {msg.role === "assistant" && (hasWhiteboard(msg) || hasSlides(msg)) && (
                  <div className="mt-2 flex items-center gap-2">
                    {hasWhiteboard(msg) && onWhiteboardClick && (
                      <button
                        onClick={() => onWhiteboardClick(msg.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        🎨 {t("viewWhiteboard")}
                      </button>
                    )}
                    {hasSlides(msg) && onSlideClick && (
                      <button
                        onClick={() => onSlideClick(msg.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        📊 {t("viewSlides")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
              {t("errorHint")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
