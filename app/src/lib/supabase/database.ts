import { createClient } from "./client";

// ============================================================
// User Progress
// ============================================================

export async function getUserProgress(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No row found — create initial progress
    const { data: newData } = await supabase
      .from("user_progress")
      .insert({ user_id: userId })
      .select()
      .single();
    return newData;
  }

  return data;
}

export async function updateUserProgress(
  userId: string,
  updates: {
    xp?: number;
    level?: number;
    current_streak?: number;
    longest_streak?: number;
    last_active_date?: string;
    skill_progress?: Record<string, number>;
  }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Chat Sessions & Messages
// ============================================================

export async function getChatSessions(userId: string, skillSlug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("skill_slug", skillSlug)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function createChatSession(
  userId: string,
  skillSlug: string,
  tutorKey?: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      skill_slug: skillSlug,
      tutor_key: tutorKey,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionMessages(sessionId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function saveMessage(
  sessionId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  tutorKey?: string
) {
  const supabase = createClient();

  // Insert message
  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    user_id: userId,
    role,
    content,
    tutor_key: tutorKey,
  });

  if (error) throw error;

  // Update session message count and timestamp
  await supabase
    .from("chat_sessions")
    .update({
      message_count: (await supabase
        .from("chat_messages")
        .select("id", { count: "exact" })
        .eq("session_id", sessionId)
      ).count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

// ============================================================
// Knowledge Points
// ============================================================

export async function getKnowledgePoints(userId: string, skillSlug?: string) {
  const supabase = createClient();
  let query = supabase
    .from("knowledge_points")
    .select("*")
    .eq("user_id", userId);

  if (skillSlug) {
    query = query.eq("skill_slug", skillSlug);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return data ?? [];
}

export async function upsertKnowledgePoint(
  userId: string,
  skillSlug: string,
  concept: string,
  taughtBy?: string
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_points")
    .upsert(
      {
        user_id: userId,
        skill_slug: skillSlug,
        concept,
        taught_by: taughtBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,skill_slug,concept" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Tutor Memory
// ============================================================

export async function getTutorMemory(
  userId: string,
  tutorKey: string,
  skillSlug: string
) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tutor_memory")
    .select("*")
    .eq("user_id", userId)
    .eq("tutor_key", tutorKey)
    .eq("skill_slug", skillSlug)
    .single();

  return data;
}

export async function updateTutorMemory(
  userId: string,
  tutorKey: string,
  skillSlug: string,
  updates: { taught_topics?: string[]; stuck_points?: string[] }
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tutor_memory")
    .upsert(
      {
        user_id: userId,
        tutor_key: tutorKey,
        skill_slug: skillSlug,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tutor_key,skill_slug" }
    );

  if (error) throw error;
}

// ============================================================
// Usage Logging & Rate Limiting
// ============================================================

export async function logUsage(
  userId: string,
  action: "message" | "login" | "review" | "social_gen",
  skillSlug?: string,
  tokensUsed?: number
) {
  const supabase = createClient();
  await supabase.from("usage_logs").insert({
    user_id: userId,
    action,
    skill_slug: skillSlug,
    tokens_used: tokensUsed,
  });
}

export async function getTodayMessageCount(userId: string): Promise<number> {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "message")
    .gte("created_at", today.toISOString());

  return count ?? 0;
}

// ============================================================
// User Profile
// ============================================================

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}

export async function updateLastActive(userId: string) {
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId);
}

// ============================================================
// Leaderboard
// ============================================================

export async function getLeaderboard() {
  const supabase = createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(100);

  return data ?? [];
}
