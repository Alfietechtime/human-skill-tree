/**
 * TTS voice configuration — maps tutors to OpenAI TTS voices.
 */

export type TTSVoice = "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer";

export interface TTSVoiceConfig {
  voice: TTSVoice;
  label: string;
  tutorKey?: string;
}

/** Default voice assignments for each tutor */
export const TUTOR_VOICE_MAP: Record<string, TTSVoice> = {
  aria: "alloy",
  marcus: "echo",
  lin: "fable",
  euler: "onyx",
  feynman: "nova",
  curie: "shimmer",
};

/** All available voices */
export const TTS_VOICES: TTSVoiceConfig[] = [
  { voice: "alloy", label: "Alloy (Neutral)", tutorKey: "aria" },
  { voice: "echo", label: "Echo (Male)", tutorKey: "marcus" },
  { voice: "fable", label: "Fable (Warm)", tutorKey: "lin" },
  { voice: "nova", label: "Nova (Lively)", tutorKey: "feynman" },
  { voice: "onyx", label: "Onyx (Deep)", tutorKey: "euler" },
  { voice: "shimmer", label: "Shimmer (Soft)", tutorKey: "curie" },
];

/** Get the voice for a given tutor key */
export function getVoiceForTutor(tutorKey?: string): TTSVoice {
  if (!tutorKey) return "alloy";
  return TUTOR_VOICE_MAP[tutorKey] || "alloy";
}

// localStorage key for user voice override
const VOICE_OVERRIDE_KEY = "tts-voice-override";

export function getSavedVoiceOverride(): TTSVoice | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VOICE_OVERRIDE_KEY) as TTSVoice | null;
}

export function saveVoiceOverride(voice: TTSVoice | null) {
  if (typeof window === "undefined") return;
  if (voice) {
    localStorage.setItem(VOICE_OVERRIDE_KEY, voice);
  } else {
    localStorage.removeItem(VOICE_OVERRIDE_KEY);
  }
}
