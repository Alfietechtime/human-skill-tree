"use client";

import { HelpCircle } from "lucide-react";

export function HelpButton() {
  const handleClick = () => {
    localStorage.removeItem("onboarding-completed");
    window.location.reload();
  };

  return (
    <button
      onClick={handleClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      title="Restart guide"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
