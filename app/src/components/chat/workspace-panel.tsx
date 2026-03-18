"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function WorkspacePanel({
  open,
  onClose,
  children,
  activeTab,
  onTabChange,
  tabs,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { key: string; label: string; icon: string }[];
}) {
  const t = useTranslations("teaching");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!open) return null;

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-purple-500/15 text-purple-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    );
  }

  // Desktop: right-side panel
  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/30 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-purple-500/15 text-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
