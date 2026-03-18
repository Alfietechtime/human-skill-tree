"use client";

import { useState, useEffect, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  emoji?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

let addToastFn: ((toast: Omit<Toast, "id">) => void) | null = null;

/** Show a toast notification from anywhere */
export function showToast(toast: Omit<Toast, "id">) {
  addToastFn?.(toast);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now().toString(36);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right fade-in duration-300 flex items-start gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-md"
        >
          {toast.emoji && <span className="text-lg mt-0.5">{toast.emoji}</span>}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{toast.message}</p>
            {toast.action && (
              <button
                onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
                className="mt-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
