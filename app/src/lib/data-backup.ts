/**
 * Export/Import all learning data (localStorage) as JSON.
 */

export interface BackupData {
  version: 2;
  exportedAt: string;
  chatMemory: unknown;
  learningProgress: unknown;
  selectedModel: string | null;
  groupChat?: unknown;
  diaryEntries?: unknown;
  tutorMemory?: unknown;
  tutorAttitudes?: unknown;
  tutorStory?: unknown;
}

function safeGet(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function exportAllData(): BackupData {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    chatMemory: safeGet("chat-memory") || {},
    learningProgress: safeGet("learning-progress") || {},
    selectedModel: localStorage.getItem("selected-model"),
    groupChat: safeGet("group-chat"),
    diaryEntries: safeGet("diary-entries"),
    tutorMemory: safeGet("tutor-memory"),
    tutorAttitudes: safeGet("tutor-attitudes"),
    tutorStory: safeGet("tutor-story"),
  };
}

export function downloadBackup() {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `human-skill-tree-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (!data.version || !data.chatMemory || !data.learningProgress) {
          resolve({ success: false, error: "Invalid backup file format" });
          return;
        }
        localStorage.setItem("chat-memory", JSON.stringify(data.chatMemory));
        localStorage.setItem("learning-progress", JSON.stringify(data.learningProgress));
        if (data.selectedModel) {
          localStorage.setItem("selected-model", data.selectedModel);
        }
        // v2 fields — restore if present
        if (data.groupChat) localStorage.setItem("group-chat", JSON.stringify(data.groupChat));
        if (data.diaryEntries) localStorage.setItem("diary-entries", JSON.stringify(data.diaryEntries));
        if (data.tutorMemory) localStorage.setItem("tutor-memory", JSON.stringify(data.tutorMemory));
        if (data.tutorAttitudes) localStorage.setItem("tutor-attitudes", JSON.stringify(data.tutorAttitudes));
        if (data.tutorStory) localStorage.setItem("tutor-story", JSON.stringify(data.tutorStory));
        resolve({ success: true });
      } catch {
        resolve({ success: false, error: "Failed to parse backup file" });
      }
    };
    reader.readAsText(file);
  });
}
