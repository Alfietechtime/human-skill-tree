"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export interface ExerciseData {
  type: "choice" | "trueFalse" | "fillBlank" | "shortAnswer";
  question: string;
  options?: string[];
  answer: number | string;
}

export function ExerciseCard({
  exercise,
  onAnswer,
}: {
  exercise: ExerciseData;
  onAnswer: (answer: string | number, correct: boolean) => void;
}) {
  const t = useTranslations("exercise");
  const [selected, setSelected] = useState<number | null>(null);
  const [fillText, setFillText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [grading, setGrading] = useState(false);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  const handleSubmit = async () => {
    if (submitted) return;
    let answer: string | number;
    let correct: boolean;

    if (exercise.type === "choice") {
      if (selected === null) return;
      answer = selected;
      correct = selected === exercise.answer;
    } else if (exercise.type === "trueFalse") {
      if (selected === null) return;
      answer = selected;
      correct = selected === exercise.answer;
    } else if (exercise.type === "shortAnswer") {
      if (!fillText.trim()) return;
      answer = fillText.trim();
      // AI grading for short answers
      setGrading(true);
      try {
        const res = await fetch("/api/chat/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: exercise.question,
            expectedAnswer: exercise.answer,
            studentAnswer: fillText.trim(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          correct = data.correct;
          setGradeFeedback(data.feedback || "");
        } else {
          // Fallback to string match
          correct = fillText.trim().toLowerCase() === String(exercise.answer).toLowerCase();
        }
      } catch {
        correct = fillText.trim().toLowerCase() === String(exercise.answer).toLowerCase();
      } finally {
        setGrading(false);
      }
    } else {
      if (!fillText.trim()) return;
      answer = fillText.trim();
      correct = fillText.trim().toLowerCase() === String(exercise.answer).toLowerCase();
    }

    setIsCorrect(correct!);
    setSubmitted(true);
    onAnswer(answer!, correct!);
  };

  return (
    <div className="mt-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">📝</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
          {t("title")}
        </span>
      </div>

      <p className="text-sm text-foreground font-medium mb-3">{exercise.question}</p>

      {exercise.type === "choice" && exercise.options && (
        <div className="space-y-1.5">
          {exercise.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm border transition-all ${
                submitted
                  ? i === exercise.answer
                    ? "border-green-500 bg-green-500/15 text-green-400"
                    : i === selected
                      ? "border-red-500 bg-red-500/15 text-red-400"
                      : "border-border/30 text-muted-foreground"
                  : selected === i
                    ? "border-purple-500 bg-purple-500/15 text-purple-400"
                    : "border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5 text-foreground"
              }`}
            >
              <span className="font-medium mr-2 text-xs">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {exercise.type === "trueFalse" && (
        <div className="flex gap-2">
          {[{ label: t("true"), val: 1 }, { label: t("false"), val: 0 }].map(({ label, val }) => (
            <button
              key={val}
              onClick={() => !submitted && setSelected(val)}
              disabled={submitted}
              className={`flex-1 rounded-xl py-3 text-sm font-medium border transition-all ${
                submitted
                  ? val === exercise.answer
                    ? "border-green-500 bg-green-500/15 text-green-400"
                    : val === selected
                      ? "border-red-500 bg-red-500/15 text-red-400"
                      : "border-border/30 text-muted-foreground"
                  : selected === val
                    ? "border-purple-500 bg-purple-500/15 text-purple-400"
                    : "border-border/50 hover:border-purple-500/50 text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {exercise.type === "fillBlank" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={fillText}
            onChange={(e) => !submitted && setFillText(e.target.value)}
            disabled={submitted}
            placeholder={t("fillPlaceholder")}
            className="flex-1 rounded-xl border border-border/50 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
      )}

      {exercise.type === "shortAnswer" && (
        <div>
          <textarea
            value={fillText}
            onChange={(e) => !submitted && setFillText(e.target.value)}
            disabled={submitted || grading}
            placeholder={t("shortAnswerPlaceholder")}
            rows={3}
            className="w-full rounded-xl border border-border/50 bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60 resize-none"
          />
          {gradeFeedback && (
            <p className="mt-1.5 text-xs text-muted-foreground">{gradeFeedback}</p>
          )}
        </div>
      )}

      {/* Submit / Result */}
      <div className="mt-3 flex items-center justify-between">
        {submitted ? (
          <div className={`flex items-center gap-1.5 text-sm font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
            <span>{isCorrect ? "✓" : "✗"}</span>
            <span>{isCorrect ? t("correct") : t("incorrect")}</span>
          </div>
        ) : (
          <div />
        )}
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={grading || (exercise.type === "fillBlank" || exercise.type === "shortAnswer" ? !fillText.trim() : selected === null)}
            className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-40 transition-colors"
          >
            {grading ? t("grading") : t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}
