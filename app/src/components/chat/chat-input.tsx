"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  stop,
  disabled,
  compareMode,
  onToggleCompare,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  stop: () => void;
  disabled?: boolean;
  compareMode?: boolean;
  onToggleCompare?: () => void;
}) {
  const t = useTranslations("chat");
  const tCompare = useTranslations("compare");

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-border bg-card/80 p-4 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-2xl gap-2">
        {onToggleCompare && (
          <button
            type="button"
            onClick={onToggleCompare}
            className={`shrink-0 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
              compareMode
                ? "border-purple-500 bg-purple-500/15 text-purple-400"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            title={tCompare("compareBtn")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5" />
            </svg>
          </button>
        )}
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={compareMode ? tCompare("comparePlaceholder") : t("placeholder")}
          className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500"
          disabled={disabled || isLoading}
        />
        {isLoading ? (
          <Button
            type="button"
            onClick={stop}
            variant="outline"
            className="border-border text-muted-foreground hover:bg-accent"
          >
            {t("stop")}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={disabled || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {compareMode ? tCompare("compareBtn") : t("send")}
          </Button>
        )}
      </div>
    </form>
  );
}
