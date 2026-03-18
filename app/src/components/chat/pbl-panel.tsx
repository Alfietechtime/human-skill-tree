"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getTemplatesForSkill,
  getPBLProjects,
  savePBLProject,
  createPBLProject,
  type PBLTemplate,
  type PBLProject,
} from "@/lib/pbl-templates";
import { earnXP } from "@/lib/learning-tracker";

export function PBLPanel({
  skillSlug,
  model,
  onClose,
}: {
  skillSlug: string;
  model: string;
  onClose: () => void;
}) {
  const t = useTranslations("pbl");
  const [project, setProject] = useState<PBLProject | null>(() => {
    const projects = getPBLProjects(skillSlug);
    return projects[0] || null;
  });
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const templates = getTemplatesForSkill(skillSlug);

  const handleStartProject = useCallback((template: PBLTemplate, role: string) => {
    const newProject = createPBLProject(skillSlug, template, role);
    savePBLProject(newProject);
    setProject(newProject);
    setChatMessages([]);
  }, [skillSlug]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !project) return;
    const userMsg = { role: "user", content: input.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/pbl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillSlug,
          userMessage: input.trim(),
          projectTitle: project.templateTitle,
          currentMilestone: project.currentMilestone,
          milestones: project.milestones,
          userRole: project.userRole,
          conversationHistory: chatMessages.slice(-8),
          userModel: model,
        }),
      });

      if (!res.ok) throw new Error("PBL API failed");
      const data = await res.json();

      if (data.content) {
        setChatMessages((prev) => [...prev, { role: "mentor", content: data.content }]);
      }

      // Handle milestone completion
      if (data.milestoneCompleted !== null && data.milestoneCompleted !== undefined) {
        const updated = { ...project };
        if (updated.milestones[data.milestoneCompleted]) {
          const xp = updated.milestones[data.milestoneCompleted].xpReward;
          updated.milestones[data.milestoneCompleted].status = "completed";
          updated.currentMilestone = Math.min(data.milestoneCompleted + 1, updated.milestones.length - 1);
          updated.updatedAt = new Date().toISOString();
          savePBLProject(updated);
          setProject(updated);
          earnXP(xp, "pbl_milestone");
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [input, loading, project, skillSlug, model, chatMessages]);

  const handleCompleteMilestone = useCallback(() => {
    if (!project) return;
    const updated = { ...project };
    const idx = updated.currentMilestone;
    if (updated.milestones[idx]) {
      const xp = updated.milestones[idx].xpReward;
      updated.milestones[idx].status = "completed";
      updated.currentMilestone = Math.min(idx + 1, updated.milestones.length - 1);
      updated.updatedAt = new Date().toISOString();
      savePBLProject(updated);
      setProject(updated);
      earnXP(xp, "pbl_milestone");
    }
  }, [project]);

  // Template selection screen
  if (!project) {
    return (
      <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/50">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span className="text-xs font-semibold text-foreground">{t("title")}</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <p className="text-xs text-muted-foreground">{t("selectTemplate")}</p>
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl border border-border p-3">
              <h4 className="text-sm font-medium text-foreground mb-1">{template.title}</h4>
              <p className="text-[10px] text-muted-foreground mb-2">{template.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded px-1.5 py-0.5 text-[9px] ${
                  template.difficulty === "beginner" ? "bg-green-500/15 text-green-400"
                  : template.difficulty === "intermediate" ? "bg-blue-500/15 text-blue-400"
                  : "bg-red-500/15 text-red-400"
                }`}>{template.difficulty}</span>
                <span className="text-[9px] text-muted-foreground">~{template.estimatedHours}h</span>
              </div>
              <div className="space-y-1 mb-2">
                {template.milestones.map((m, i) => (
                  <p key={m.id} className="text-[10px] text-muted-foreground">
                    {i + 1}. {m.title} (+{m.xpReward} XP)
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {template.roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => handleStartProject(template, role.key)}
                    className="rounded-lg border border-border px-2 py-1 text-[10px] text-foreground hover:bg-accent transition-colors"
                  >
                    {role.emoji} {t("playAs")} {role.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active project view
  const completedCount = project.milestones.filter((m) => m.status === "completed").length;
  const progress = Math.round((completedCount / project.milestones.length) * 100);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card/50">
      {/* Header */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span className="text-xs font-semibold text-foreground truncate">{project.templateTitle}</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        {/* Progress */}
        <div className="mt-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{completedCount}/{project.milestones.length} {t("milestones")}</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="border-b border-border px-3 py-2 space-y-1">
        {project.milestones.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-2 text-[10px] ${i === project.currentMilestone ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            <span>{m.status === "completed" ? "✅" : i === project.currentMilestone ? "→" : "○"}</span>
            <span className="truncate">{m.title}</span>
            {i === project.currentMilestone && m.status !== "completed" && (
              <button onClick={handleCompleteMilestone} className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                {t("complete")}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`rounded-xl px-3 py-2 ${
            msg.role === "user"
              ? "bg-purple-600/10 border border-purple-500/20 ml-4"
              : "bg-card border border-border/50 mr-4"
          }`}>
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
              {msg.role === "user" ? t("you") : "🧑‍🏫 " + t("mentor")}
            </p>
            <div className="prose dark:prose-invert prose-xs max-w-none text-[11px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 py-2 px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-2">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("askMentor")}
            className="flex-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading} className="shrink-0 rounded-lg bg-purple-600 px-2.5 py-1.5 text-[10px] text-white disabled:opacity-40">
            {t("send")}
          </button>
        </form>
      </div>
    </div>
  );
}
