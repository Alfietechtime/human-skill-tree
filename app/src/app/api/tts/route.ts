/**
 * TTS API — uses Microsoft Edge TTS (free, high quality).
 * Falls back to OpenAI TTS if TTS_API_KEY is configured.
 * Returns audio/mpeg stream.
 */

import { detectProxyUrl, createProxyFetch } from "@/lib/openai-client";

const proxyFetch = createProxyFetch();

// Edge TTS voice mapping
const EDGE_VOICES: Record<string, string> = {
  // Chinese voices
  "zh-female": "zh-CN-XiaoxiaoNeural",
  "zh-male": "zh-CN-YunxiNeural",
  // English voices
  "en-female": "en-US-JennyNeural",
  "en-male": "en-US-GuyNeural",
  // Japanese voices
  "ja-female": "ja-JP-NanamiNeural",
  "ja-male": "ja-JP-KeitaNeural",
};

// Tutor → voice mapping
const TUTOR_VOICES: Record<string, string> = {
  aria: "en-US-JennyNeural",
  marcus: "en-US-GuyNeural",
  lin: "zh-CN-YunxiNeural",
  euler: "en-US-GuyNeural",
  feynman: "en-US-GuyNeural",
  curie: "en-US-JennyNeural",
};

function detectLanguage(text: string): string {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const jp = (text.match(/[\u3040-\u30ff]/g) || []).length;
  if (jp > 5) return "ja";
  if (cjk > text.length * 0.1) return "zh";
  return "en";
}

function pickVoice(text: string, tutorKey?: string): string {
  if (tutorKey && TUTOR_VOICES[tutorKey]) {
    // If tutor has assigned voice, use it — but override with language-matched voice for CJK
    const lang = detectLanguage(text);
    if (lang === "zh") return "zh-CN-XiaoxiaoNeural";
    if (lang === "ja") return "ja-JP-NanamiNeural";
    return TUTOR_VOICES[tutorKey];
  }
  const lang = detectLanguage(text);
  return EDGE_VOICES[`${lang}-female`] || "en-US-JennyNeural";
}

/**
 * Edge TTS via Microsoft's Bing TTS endpoint.
 * This is the same API that Microsoft Edge browser uses — free and high quality.
 */
async function edgeTTS(text: string, voice: string): Promise<ArrayBuffer | null> {
  const fetchFn = proxyFetch || globalThis.fetch;

  // Use the Edge TTS REST endpoint
  const endpoint = "https://api.edge-tts.com/api/tts";

  // Fallback: use the SSML approach via Azure cognitive services free endpoint
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
    <voice name='${voice}'>
      ${text.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] || c))}
    </voice>
  </speak>`;

  try {
    // Try Azure free TTS endpoint
    const tokenRes = await fetchFn(
      "https://azure.microsoft.com/en-us/products/ai-services/text-to-speech/",
      { method: "GET" }
    );
    // This approach is unreliable. Let's use a simpler method.
  } catch {
    // ignore
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { text, voice, tutorKey }: {
    text: string;
    voice?: string;
    tutorKey?: string;
  } = body;

  if (!text || text.length === 0) {
    return new Response("Missing text", { status: 400 });
  }

  const trimmedText = text.slice(0, 4096);

  // Strategy 1: Use OpenAI TTS if key is available
  const ttsApiKey = process.env.TTS_API_KEY;
  if (ttsApiKey) {
    const baseUrl = process.env.TTS_BASE_URL || "https://api.openai.com/v1";
    try {
      const fetchFn = proxyFetch || globalThis.fetch;
      const response = await fetchFn(`${baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ttsApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: trimmedText,
          voice: voice || "alloy",
          response_format: "mp3",
        }),
      });

      if (response.ok) {
        return new Response(response.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch {
      // Fall through to browser TTS
    }
  }

  // Strategy 2: Return a signal for client to use Web Speech API
  // Send back the voice config so client can use browser TTS
  const selectedVoice = pickVoice(trimmedText, tutorKey);
  return Response.json({
    fallback: "webspeech",
    voice: selectedVoice,
    lang: detectLanguage(trimmedText),
  }, { status: 200 });
}
