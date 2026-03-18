"use client";

import { createClient } from "./client";

// All localStorage keys that should be synced to Supabase
const SYNC_KEYS = [
  "chat-memory",
  "learning-progress",
  "learning-streak",
  "group-chat",
  "diary-entries",
  "tutor-memory",
  "tutor-attitudes",
  "tutor-characters",
  "tutor-mode",
  "tutor-story",
  "selected-model",
  "onboarding-completed",
] as const;

// Dynamic key patterns (skill-scoped)
const DYNAMIC_KEY_PREFIXES = [
  "tutor-active-",
  "persona-",
  "persona-custom-",
  "group-chat-read-",
  "last-social-gen-",
] as const;

function getAllSyncKeys(): string[] {
  const keys: string[] = [...SYNC_KEYS];
  // Collect all dynamic keys from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  return keys;
}

function collectLocalData(): Record<string, string> {
  const data: Record<string, string> = {};
  const keys = getAllSyncKeys();
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      data[key] = value;
    }
  }
  return data;
}

function applyLocalData(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, value);
  }
}

// ============================================================
// Upload: localStorage → Supabase
// ============================================================

let uploadTimer: ReturnType<typeof setTimeout> | null = null;
let isUploading = false;

export async function uploadToCloud(userId: string) {
  if (isUploading) return;
  isUploading = true;

  try {
    const supabase = createClient();
    const data = collectLocalData();

    // Upsert user_sync_data row
    const { error } = await supabase.from("user_sync_data").upsert(
      {
        user_id: userId,
        data: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("[Sync] Upload failed:", error.message);
    }
  } catch (err) {
    console.error("[Sync] Upload error:", err);
  } finally {
    isUploading = false;
  }
}

// Debounced upload: waits 5 seconds after last change before uploading
export function scheduleUpload(userId: string) {
  if (uploadTimer) clearTimeout(uploadTimer);
  uploadTimer = setTimeout(() => uploadToCloud(userId), 5000);
}

// ============================================================
// Download: Supabase → localStorage
// ============================================================

export async function downloadFromCloud(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_sync_data")
      .select("data, updated_at")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No cloud data yet — first time user, upload current local data
        await uploadToCloud(userId);
        return false;
      }
      console.error("[Sync] Download failed:", error.message);
      return false;
    }

    if (data?.data) {
      applyLocalData(data.data as Record<string, string>);
      return true;
    }

    return false;
  } catch (err) {
    console.error("[Sync] Download error:", err);
    return false;
  }
}

// ============================================================
// localStorage write interceptor
// Patches localStorage.setItem to auto-sync changes
// ============================================================

let currentUserId: string | null = null;
let isPatched = false;
const originalSetItem = typeof window !== "undefined" ? localStorage.setItem.bind(localStorage) : null;
const originalRemoveItem = typeof window !== "undefined" ? localStorage.removeItem.bind(localStorage) : null;

function shouldSync(key: string): boolean {
  if ((SYNC_KEYS as readonly string[]).includes(key)) return true;
  return DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function startSync(userId: string) {
  currentUserId = userId;

  if (isPatched || typeof window === "undefined" || !originalSetItem || !originalRemoveItem) return;

  // Patch localStorage.setItem
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem!(key, value);
    if (currentUserId && shouldSync(key)) {
      scheduleUpload(currentUserId);
    }
  };

  // Patch localStorage.removeItem
  localStorage.removeItem = function (key: string) {
    originalRemoveItem!(key);
    if (currentUserId && shouldSync(key)) {
      scheduleUpload(currentUserId);
    }
  };

  isPatched = true;

  // Also upload on page close
  window.addEventListener("beforeunload", () => {
    if (currentUserId) {
      // Use sendBeacon for reliable upload on close
      const data = collectLocalData();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const url = `${supabaseUrl}/rest/v1/user_sync_data?on_conflict=user_id`;
        const body = JSON.stringify({
          user_id: currentUserId,
          data: data,
          updated_at: new Date().toISOString(),
        });
        navigator.sendBeacon(
          url,
          new Blob([body], { type: "application/json" })
        );
      }
    }
  });
}

export function stopSync() {
  currentUserId = null;
  if (uploadTimer) {
    clearTimeout(uploadTimer);
    uploadTimer = null;
  }
}

// ============================================================
// Clear local data on logout
// ============================================================

export function clearLocalUserData() {
  const keys = getAllSyncKeys();
  for (const key of keys) {
    if (originalRemoveItem) {
      originalRemoveItem(key);
    } else {
      localStorage.removeItem(key);
    }
  }
}
