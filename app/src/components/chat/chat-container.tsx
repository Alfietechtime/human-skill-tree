"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Skill } from "@/types/skill";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { PersonaSelector } from "./persona-selector";
import { ModelSelector } from "./model-selector";
import { TutorSelector } from "./tutor-selector";
import { ShareCard } from "./share-card";
import { TeachingProgress, type TeachingStage } from "./teaching-progress";
import { KpLiveMap } from "./kp-live-map";
import { WorkspacePanel } from "./workspace-panel";
import { KpKnowledgeGraph } from "./kp-knowledge-graph";
import { TutorProfileCard } from "./tutor-profile-card";
import { ComparisonCard } from "./comparison-card";
import { CompareTutorPicker } from "./compare-tutor-picker";
import { ClassroomMode } from "./classroom-mode";
import { WhiteboardPanel } from "./whiteboard-panel";
import { SlidePanel } from "./slide-panel";
import { SimulationPanel } from "./simulation-panel";
import { PBLPanel } from "./pbl-panel";
import { UploadPanel } from "./upload-panel";
import { ExportButton } from "./export-button";
import { StreakBar } from "@/components/ui/streak-bar";
import { showToast } from "@/components/ui/toast";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { autoReadMessage } from "./tts-button";
import { AutoReadToggle } from "./tts-button";
import { parseWhiteboardTags, type WhiteboardItem } from "@/lib/whiteboard-parser";
import { parseSlideTags, type Slide, saveSlideSet } from "@/lib/slide-generator";
import { useTranslations } from "next-intl";
import { getTutorByKey, getTutorMode, getActiveTutorKey, setActiveTutorKey, setTutorMode, PRESET_TUTORS } from "@/lib/tutors";
import { getActiveStoryPrompt } from "@/lib/story-backgrounds";
import {
  addTaughtTopics,
  addStuckPoints,
  addTutorAttitude,
  buildCrossTutorContext,
} from "@/lib/tutor-memory";
import {
  canGenerateSocial,
  markSocialGenerated,
  addGroupChatMessages,
  addDiaryEntry,
} from "@/lib/social-content";
import {
  extractKeyPoint,
  addMemoryEntry,
  saveSession,
  type ChatSession,
} from "@/lib/chat-memory";
import { getSavedModel, DEFAULT_MODEL } from "@/lib/models";
import { addKnowledgePoints, incrementRounds, earnXP, XP_REWARDS, updateKPsFromQuiz } from "@/lib/learning-tracker";
import { addLearningEvent } from "@/lib/learning-events";


export function ChatContainer({ skill }: { skill: Skill }) {
  const [inputValue, setInputValue] = useState("");
  const [persona, setPersona] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const tShare = useTranslations("share");
  const tCompare = useTranslations("compare");

  // Sync model from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const saved = getSavedModel();
    if (saved !== DEFAULT_MODEL) setModel(saved);
  }, []);
  const [activeTutor, setActiveTutor] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);
  const [restoredMessages, setRestoredMessages] = useState<UIMessage[]>([]);
  const [showShareCard, setShowShareCard] = useState(false);
  const [teachingStage, setTeachingStage] = useState<TeachingStage | null>(null);
  const [tutorMood, setTutorMood] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<string>("graph");
  const [profileTutor, setProfileTutor] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showComparePicker, setShowComparePicker] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResponses, setCompareResponses] = useState<Array<{ tutorKey: string; tutorName: string; tutorEmoji: string; content: string }>>([]);
  const [selectedCompareTutors, setSelectedCompareTutors] = useState<string[]>([]);

  // ── New feature states ──
  const [classroomMode, setClassroomMode] = useState(false);
  const [whiteboardItems, setWhiteboardItems] = useState<WhiteboardItem[]>([]);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [slideItems, setSlideItems] = useState<Slide[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideTitle, setSlideTitle] = useState("");
  const [simulationHtml, setSimulationHtml] = useState<string | null>(null);
  const [simulationTopic, setSimulationTopic] = useState("");
  const [pblOpen, setPblOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const personaRef = useRef(persona);
  const customPromptRef = useRef(customPrompt);
  const modelRef = useRef(model);
  const activeTutorRef = useRef(activeTutor);
  personaRef.current = persona;
  customPromptRef.current = customPrompt;
  modelRef.current = model;
  activeTutorRef.current = activeTutor;

  // Zero-config: auto-assign default tutor (Aria) on first visit
  useEffect(() => {
    const saved = getActiveTutorKey(skill.slug);
    const tutorMode = getTutorMode();
    if (!saved && !tutorMode) {
      // First time user — auto-enable tutor mode with Aria
      setTutorMode(true);
      setActiveTutorKey(skill.slug, "aria");
      setActiveTutor("aria");
    }
  }, [skill.slug]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, stop, status, clearError, setMessages } = useChat({
    transport,
    onError(error) {
      console.error("[Chat Error]", error);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const canSend = status === "ready" || status === "error";
  const prevMessageCountRef = useRef(0);
  const prevUserCountRef = useRef(0);

  const displayMessages = restoredMessages.length > 0 && messages.length === 0
    ? restoredMessages
    : messages;

  // Auto-save session & extract notes when assistant message completes
  useEffect(() => {
    if (status !== "ready") return;
    if (messages.length === 0) return;
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    prevMessageCountRef.current = messages.length;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") {
      const text = lastMsg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      const keyPoint = extractKeyPoint(text);
      if (keyPoint) {
        addMemoryEntry(skill.slug, keyPoint, "auto");
      }
      const currentTutor = activeTutorRef.current || undefined;

      const kpMatch = text.match(/<!--KP:\s*(.+?)-->/);
      if (kpMatch) {
        const points = kpMatch[1].split("|").map((s) => s.trim()).filter(Boolean);
        if (points.length > 0) {
          addKnowledgePoints(skill.slug, points, currentTutor);
          // Earn XP for each new knowledge point
          earnXP(points.length * XP_REWARDS.knowledgePoint, "knowledge_point");
          // Record learning event
          const tutorObj = currentTutor ? getTutorByKey(currentTutor) : undefined;
          addLearningEvent("kp_learned", skill.slug, {
            points,
            tutorKey: currentTutor,
            tutorName: tutorObj?.name,
            tutorEmoji: tutorObj?.emoji,
            description: points.join(", "),
          });
        }
      }

      // Parse tutor-specific hidden tags
      if (currentTutor) {
        const taughtMatch = text.match(/<!--TAUGHT:\s*(.+?)-->/);
        if (taughtMatch) {
          const topics = taughtMatch[1].split("|").map((s) => s.trim()).filter(Boolean);
          addTaughtTopics(currentTutor, skill.slug, topics);
        }
        const stuckMatch = text.match(/<!--STUCK:\s*(.+?)-->/);
        if (stuckMatch) {
          const points = stuckMatch[1].split("|").map((s) => s.trim()).filter(Boolean);
          addStuckPoints(currentTutor, skill.slug, points);
          // Record stuck event
          const tutorObj = getTutorByKey(currentTutor);
          addLearningEvent("stuck", skill.slug, {
            points,
            tutorKey: currentTutor,
            tutorName: tutorObj?.name,
            tutorEmoji: tutorObj?.emoji,
            description: points.join(", "),
          });
        }
        const attitudeMatch = text.match(/<!--ATTITUDE:\s*(.+?)-->/);
        if (attitudeMatch) {
          addTutorAttitude(currentTutor, skill.slug, attitudeMatch[1].trim());
        }

        // Parse teaching stage
        const stageMatch = text.match(/<!--STAGE:\s*(.+?)-->/);
        if (stageMatch) {
          const stage = stageMatch[1].trim() as TeachingStage;
          const validStages: TeachingStage[] = ["questioning", "exploring", "hinting", "understanding", "summarizing"];
          if (validStages.includes(stage)) {
            setTeachingStage(stage);
          }
        }

        // Parse tutor mood
        const moodMatch = text.match(/<!--MOOD:\s*(.+?)-->/);
        if (moodMatch) {
          setTutorMood(moodMatch[1].trim());
        }
      }

      // Auto-read new assistant messages
      const cleanText = text
        .replace(/<!--[\s\S]*?-->/g, "")
        .trim();
      autoReadMessage(cleanText);

      // Parse whiteboard content
      const wbItems = parseWhiteboardTags(text);
      if (wbItems.length > 0) {
        setWhiteboardItems((prev) => [...prev, ...wbItems]);
        setWhiteboardOpen(true);
      }

      // Parse inline slides
      const newSlides = parseSlideTags(text);
      if (newSlides.length > 0) {
        setSlideItems((prev) => [...prev, ...newSlides]);
        setSlideOpen(true);
      }
    }

    const userMsgCount = messages.filter((m) => m.role === "user").length;
    if (userMsgCount > prevUserCountRef.current) {
      incrementRounds(skill.slug);
      // Earn XP for each message
      earnXP(XP_REWARDS.message, "message");
    }
    prevUserCountRef.current = userMsgCount;

    const chatMessages = messages.map((m) => ({
      role: m.role,
      text: m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(""),
    }));
    const newId = saveSession(skill.slug, sessionId, chatMessages, activeTutorRef.current || undefined);
    if (!sessionId) setSessionId(newId);

    setMemoryRefreshKey((k) => k + 1);
  }, [status, messages, skill.slug, sessionId]);

  // Trigger social content generation (group chat + diary) in background
  const triggerSocialGen = useCallback(async () => {
    const tutorKey = activeTutorRef.current;
    if (!tutorKey || !canGenerateSocial(skill.slug)) return;
    if (messages.length < 4) return; // Need at least a few exchanges

    // Build session summary from recent messages
    const recentMsgs = messages.slice(-6);
    const summary = recentMsgs
      .map((m) => {
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("")
          .replace(/<!--[\s\S]*?-->/g, "")
          .trim();
        return `${m.role}: ${text.slice(0, 100)}`;
      })
      .join("\n");

    const tutorTeam = PRESET_TUTORS.slice(0, 3).map((t) => ({
      key: t.key,
      name: t.name,
      emoji: t.emoji,
      personality: t.personality,
    }));

    try {
      const res = await fetch("/api/chat/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillSlug: skill.slug,
          tutorTeam,
          sessionSummary: summary,
          storyBackground: getActiveStoryPrompt() || undefined,
        }),
      });
      if (!res.ok) return;
      markSocialGenerated(skill.slug);
      const data = await res.json();
      if (data.groupChat?.length) {
        addGroupChatMessages(skill.slug, data.groupChat);
        // Toast notification for new group chat
        const firstTutor = data.groupChat[0];
        showToast({
          message: `${firstTutor?.tutorName || "Tutors"} are discussing your progress...`,
          emoji: firstTutor?.tutorEmoji || "\uD83D\uDCAC",
          duration: 6000,
        });
      }
      if (data.diary?.content) {
        addDiaryEntry(data.diary);
      }
      setMemoryRefreshKey((k) => k + 1);
    } catch {
      // Silently fail — social content is non-critical
    }
  }, [skill.slug, messages]);

  // Auto-trigger social gen when user seems to be done (5s after last assistant message)
  useEffect(() => {
    if (status !== "ready" || messages.length < 4) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role !== "assistant") return;
    const timer = setTimeout(() => triggerSocialGen(), 5000);
    return () => clearTimeout(timer);
  }, [status, messages.length, triggerSocialGen]);

  const handleExerciseAnswer = useCallback((question: string, answer: string | number, correct: boolean) => {
    const tutorObj = activeTutorRef.current ? getTutorByKey(activeTutorRef.current) : undefined;
    addLearningEvent("exercise_completed", skill.slug, {
      question,
      answer,
      correct,
      tutorKey: activeTutorRef.current,
      tutorName: tutorObj?.name,
      tutorEmoji: tutorObj?.emoji,
      description: `${correct ? "✓" : "✗"} ${question.slice(0, 50)}`,
    });
    if (correct) {
      earnXP(XP_REWARDS.knowledgePoint, "exercise");
    }
    // Update KP stages based on quiz result
    updateKPsFromQuiz(skill.slug, correct);
    // Send result as user message to AI
    const resultText = `[Exercise Result] Q: ${question}\nMy answer: ${answer}\n${correct ? "I got it right!" : "I got it wrong, please explain."}`;
    sendMessage(
      { text: resultText },
      {
        body: {
          skillSlug: skill.slug,
          persona: personaRef.current,
          customPrompt: customPromptRef.current,
          model: modelRef.current,
          ...(activeTutorRef.current
            ? { tutorKey: activeTutorRef.current, storyContext: getActiveStoryPrompt() }
            : {}),
        },
      }
    );
    setMemoryRefreshKey((k) => k + 1);
  }, [skill.slug, sendMessage]);

  const handleCompareSubmit = useCallback(async (question: string, tutorKeys: string[]) => {
    setCompareLoading(true);
    try {
      const res = await fetch("/api/chat/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          tutorKeys,
          skillSlug: skill.slug,
          model: modelRef.current,
        }),
      });
      if (!res.ok) throw new Error("Compare failed");
      const data = await res.json();
      setCompareResponses(data.responses);
    } catch {
      showToast({ message: "Compare failed", emoji: "❌", duration: 3000 });
    } finally {
      setCompareLoading(false);
    }
  }, [skill.slug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !canSend) return;
    if (status === "error") clearError();
    if (restoredMessages.length > 0 && messages.length === 0) {
      setRestoredMessages([]);
    }

    // Compare mode: send to compare API instead
    if (compareMode && selectedCompareTutors.length >= 2) {
      handleCompareSubmit(inputValue, selectedCompareTutors);
      setInputValue("");
      return;
    }

    const tutorKey = activeTutorRef.current;
    let crossTutorMemory: string | undefined;
    if (tutorKey) {
      const allKeys = PRESET_TUTORS.map((t) => t.key);
      const ctx = buildCrossTutorContext(tutorKey, skill.slug, allKeys);
      if (ctx) crossTutorMemory = ctx;
    }
    sendMessage(
      { text: inputValue },
      {
        body: {
          skillSlug: skill.slug,
          persona: personaRef.current,
          customPrompt: customPromptRef.current,
          model: modelRef.current,
          ...(tutorKey
            ? { tutorKey, storyContext: getActiveStoryPrompt(), crossTutorMemory }
            : {}),
        },
      }
    );
    setInputValue("");
  };

  const handlePersonaChange = useCallback(
    (key: string, custom?: string) => {
      setPersona(key);
      if (custom) setCustomPrompt(custom);
    },
    []
  );

  const handleLoadSession = useCallback((session: ChatSession) => {
    const restored: UIMessage[] = session.messages.map((m, i) => ({
      id: `restored-${session.id}-${i}`,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.text }],
      createdAt: new Date(session.updatedAt),
    }));
    setRestoredMessages(restored);
    setSessionId(session.id);
    setMessages([]);
    prevMessageCountRef.current = 0;
    prevUserCountRef.current = 0;
  }, [setMessages]);

  const handleNewChat = useCallback(() => {
    setRestoredMessages([]);
    setSessionId(null);
    setMessages([]);
    prevMessageCountRef.current = 0;
    prevUserCountRef.current = 0;
  }, [setMessages]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Left sidebar — history & notes, always visible */}
      <ChatSidebar
        slug={skill.slug}
        refreshKey={memoryRefreshKey}
        onLoadSession={handleLoadSession}
        onNewChat={handleNewChat}
        activeSessionId={sessionId}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeader
          skill={skill}
          workspaceOpen={workspaceOpen}
          onToggleWorkspace={() => setWorkspaceOpen((v) => !v)}
          classroomMode={classroomMode}
          onToggleClassroom={() => setClassroomMode((v) => !v)}
          onUploadDoc={() => setUploadOpen(true)}
          onGenerateSlides={async () => {
            showToast({ message: "Generating slides...", emoji: "📊", duration: 15000 });
            try {
              const res = await fetch("/api/generate/slides", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skillSlug: skill.slug, userModel: modelRef.current }),
              });
              if (!res.ok) throw new Error("Failed");
              const data = await res.json();
              if (data.slides?.length) {
                setSlideItems(data.slides);
                setSlideTitle(data.title || skill.title);
                setSlideOpen(true);
                saveSlideSet({
                  id: `ss-${Date.now()}`,
                  skillSlug: skill.slug,
                  title: data.title || skill.title,
                  slides: data.slides,
                  createdAt: new Date().toISOString(),
                });
              }
            } catch (e) {
              showToast({ message: `Slides failed: ${e instanceof Error ? e.message : "unknown error"}`, emoji: "❌", duration: 5000 });
            }
          }}
          onGenerateSimulation={async () => {
            showToast({ message: "Generating interactive simulation...", emoji: "🧪", duration: 15000 });
            try {
              const res = await fetch("/api/generate/simulation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skillSlug: skill.slug, userModel: modelRef.current }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed");
              }
              const data = await res.json();
              if (data.html) {
                setSimulationHtml(data.html);
                setSimulationTopic(data.topic || skill.title);
                showToast({ message: "Simulation ready!", emoji: "✅", duration: 3000 });
              }
            } catch (e) {
              showToast({ message: `Simulation failed: ${e instanceof Error ? e.message : "unknown error"}`, emoji: "❌", duration: 5000 });
            }
          }}
        >
          <TutorSelector
            skillSlug={skill.slug}
            value={activeTutor}
            onChange={setActiveTutor}
          />
          <PersonaSelector
            skillSlug={skill.slug}
            value={persona}
            onChange={handlePersonaChange}
          />
          <ModelSelector value={model} onChange={setModel} />
          <AutoReadToggle />
          <StreakBar refreshKey={memoryRefreshKey} />
          {/* Share button */}
          <button
            onClick={() => setShowShareCard(true)}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={tShare("shareBtn")}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="hidden sm:inline">{tShare("shareBtn")}</span>
          </button>
        </ChatHeader>
        {activeTutor && !classroomMode && (
          <TeachingProgress
            stage={teachingStage}
            mood={tutorMood}
            tutorEmoji={getTutorByKey(activeTutor)?.emoji}
          />
        )}
        {!classroomMode && (
          <KpLiveMap
            slug={skill.slug}
            refreshKey={memoryRefreshKey}
            onOpenWorkspace={() => { setWorkspaceTab("graph"); setWorkspaceOpen(true); }}
          />
        )}
        {classroomMode ? (
          <ClassroomMode
            skillSlug={skill.slug}
            teacherName={getTutorByKey(activeTutor)?.name || "Teacher"}
            teacherEmoji={getTutorByKey(activeTutor)?.emoji || "👨‍🏫"}
            teacherTutorKey={activeTutor || "aria"}
            assistantName={PRESET_TUTORS.find((t) => t.key !== activeTutor)?.name}
            assistantEmoji={PRESET_TUTORS.find((t) => t.key !== activeTutor)?.emoji}
            assistantTutorKey={PRESET_TUTORS.find((t) => t.key !== activeTutor)?.key}
            model={model}
            onExit={() => setClassroomMode(false)}
          />
        ) : (
        <>
        <ChatMessages
          messages={displayMessages}
          isLoading={isLoading}
          persona={persona}
          tutorKey={activeTutor}
          error={status === "error"}
          onExerciseAnswer={handleExerciseAnswer}
          onTutorClick={(key) => setProfileTutor(key)}
          onWhiteboardClick={() => setWhiteboardOpen(true)}
          onSlideClick={() => setSlideOpen(true)}
        />
        {/* Compare mode banner */}
        {compareMode && !compareLoading && compareResponses.length === 0 && (
          <div className="px-4 pb-2">
            <div className="mx-auto max-w-2xl flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-2">
              <span className="text-xs text-purple-400">
                {tCompare("comparePlaceholder")}
              </span>
              <button
                onClick={() => {
                  setCompareMode(false);
                  setSelectedCompareTutors([]);
                  setCompareResponses([]);
                }}
                className="ml-2 rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {tCompare("cancel")}
              </button>
            </div>
          </div>
        )}
        {/* Compare responses */}
        {compareResponses.length > 0 && (
          <div className="px-4 pb-2">
            <div className="mx-auto max-w-2xl">
              <ComparisonCard
                responses={compareResponses}
                onClose={() => {
                  setCompareMode(false);
                  setSelectedCompareTutors([]);
                  setCompareResponses([]);
                }}
              />
            </div>
          </div>
        )}
        {compareLoading && (
          <div className="px-4 pb-2">
            <div className="mx-auto max-w-2xl text-center text-xs text-muted-foreground py-4">
              {tCompare("loading")}
            </div>
          </div>
        )}
        <ChatInput
          input={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          isLoading={isLoading || compareLoading}
          stop={stop}
          disabled={!canSend || compareLoading}
          compareMode={compareMode}
          onToggleCompare={() => {
            if (!compareMode) {
              setShowComparePicker(true);
            } else {
              setCompareMode(false);
              setSelectedCompareTutors([]);
              setCompareResponses([]);
            }
          }}
        />
        </>
        )}
      </div>

      {/* Whiteboard panel */}
      {whiteboardOpen && whiteboardItems.length > 0 && (
        <WhiteboardPanel
          items={whiteboardItems}
          onClose={() => setWhiteboardOpen(false)}
        />
      )}

      {/* Slide panel */}
      {slideOpen && slideItems.length > 0 && (
        <SlidePanel
          slides={slideItems}
          title={slideTitle || skill.title}
          onClose={() => setSlideOpen(false)}
          onExport={async () => {
            try {
              const { exportToPPTX } = await import("@/lib/pptx-exporter");
              await exportToPPTX(slideItems, slideTitle || skill.title);
            } catch { /* silently fail */ }
          }}
        />
      )}

      {/* Simulation panel */}
      {simulationHtml && (
        <SimulationPanel
          html={simulationHtml}
          topic={simulationTopic}
          onClose={() => setSimulationHtml(null)}
        />
      )}

      {/* PBL panel */}
      {pblOpen && (
        <PBLPanel
          skillSlug={skill.slug}
          model={model}
          onClose={() => setPblOpen(false)}
        />
      )}

      {/* Workspace panel */}
      <WorkspacePanel
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        activeTab={workspaceTab}
        onTabChange={setWorkspaceTab}
        tabs={[
          { key: "graph", label: "Graph", icon: "🔮" },
          { key: "tutors", label: "Tutors", icon: "👥" },
          { key: "slides", label: "Slides", icon: "📊" },
          { key: "project", label: "Project", icon: "📋" },
        ]}
      >
        {workspaceTab === "graph" ? (
          <KpKnowledgeGraph slug={skill.slug} refreshKey={memoryRefreshKey} />
        ) : workspaceTab === "slides" ? (
          <div className="p-3">
            {slideItems.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{slideItems.length} slides</span>
                  <ExportButton slides={slideItems} title={slideTitle || skill.title} />
                </div>
                <button
                  onClick={() => setSlideOpen(true)}
                  className="w-full rounded-xl border border-border p-3 text-left hover:bg-accent transition-colors"
                >
                  <p className="text-xs font-medium text-foreground">{slideTitle || skill.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{slideItems.length} slides</p>
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground mb-2">No slides yet</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/generate/slides", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ skillSlug: skill.slug, userModel: modelRef.current }),
                      });
                      if (!res.ok) throw new Error("Failed");
                      const data = await res.json();
                      if (data.slides?.length) {
                        setSlideItems(data.slides);
                        setSlideTitle(data.title || skill.title);
                        setSlideOpen(true);
                      }
                    } catch { /* silently fail */ }
                  }}
                  className="rounded-xl bg-purple-600 px-3 py-1.5 text-[10px] text-white hover:bg-purple-700"
                >
                  Generate Slides
                </button>
              </div>
            )}
          </div>
        ) : workspaceTab === "project" ? (
          <div className="p-3">
            <button
              onClick={() => setPblOpen(true)}
              className="w-full rounded-xl border border-dashed border-border p-4 text-center hover:bg-accent transition-colors"
            >
              <p className="text-sm mb-1">📋</p>
              <p className="text-xs text-foreground font-medium">Start a Project</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Learn by doing with AI guidance</p>
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {PRESET_TUTORS.map((tutor) => (
              <button
                key={tutor.key}
                onClick={() => setProfileTutor(tutor.key)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  activeTutor === tutor.key
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-border/50 hover:border-purple-500/30"
                }`}
              >
                <span className="text-lg">{tutor.emoji}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{tutor.name}</p>
                  <p className="text-[9px] text-muted-foreground">{tutor.nameZh} · {tutor.nameJa}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </WorkspacePanel>

      {/* Share card modal */}
      {showShareCard && (
        <ShareCard
          skillSlug={skill.slug}
          skillTitle={skill.title}
          tutorKey={activeTutor || undefined}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Tutor profile card modal */}
      {profileTutor && (() => {
        const tutor = getTutorByKey(profileTutor);
        return tutor ? (
          <TutorProfileCard
            tutor={tutor}
            skillSlug={skill.slug}
            onClose={() => setProfileTutor(null)}
          />
        ) : null;
      })()}

      {/* Compare tutor picker modal */}
      {showComparePicker && (
        <CompareTutorPicker
          onConfirm={(keys) => {
            setSelectedCompareTutors(keys);
            setCompareMode(true);
            setShowComparePicker(false);
            setCompareResponses([]);
          }}
          onCancel={() => setShowComparePicker(false)}
        />
      )}

      {/* Upload document modal */}
      {uploadOpen && (
        <UploadPanel
          model={model}
          onCourseGenerated={(result) => {
            // Auto-generate slides from the uploaded document
            if (result.outline) {
              import("@/lib/course-generator").then(({ outlineToSlides }) => {
                const slides = outlineToSlides(result as unknown as import("@/lib/course-generator").CourseOutline);
                if (slides.length > 0) {
                  setSlideItems(slides);
                  setSlideTitle(result.title);
                  setSlideOpen(true);
                  showToast({ message: `Generated ${slides.length} slides from "${result.fileName}"`, emoji: "📊", duration: 4000 });
                }
              });
            }
          }}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </div>
  );
}
