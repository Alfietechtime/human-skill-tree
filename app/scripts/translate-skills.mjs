#!/usr/bin/env node
/**
 * Translate all skills from English to Chinese (zh) and Japanese (ja)
 * Uses the OpenRouter API configured in .env.local
 *
 * Usage: node scripts/translate-skills.mjs [--lang zh|ja] [--start N] [--count N] [--model MODEL]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local
const envPath = path.join(ROOT, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
}

const API_KEY = env.OPENAI_API_KEY;
const BASE_URL = env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1";

// Parse CLI args
const args = process.argv.slice(2);
let targetLang = "zh";
let startIdx = 0;
let count = 999;
let MODEL = "google/gemini-2.0-flash-001"; // Fast & cheap default

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--lang" && args[i + 1]) targetLang = args[++i];
  if (args[i] === "--start" && args[i + 1]) startIdx = parseInt(args[++i]);
  if (args[i] === "--count" && args[i + 1]) count = parseInt(args[++i]);
  if (args[i] === "--model" && args[i + 1]) MODEL = args[++i];
}

// Parse skills-data.ts
function parseSkillsData() {
  const filePath = path.join(ROOT, "src/lib/skills-data.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  const skills = [];
  const lines = content.split(/\r?\n/);
  let currentSkill = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "{" && !currentSkill) {
      currentSkill = {};
    } else if (currentSkill) {
      for (const field of ["slug", "title", "description", "triggers", "methodology", "instructions", "examples", "references"]) {
        if (trimmed.startsWith(`"${field}"`)) {
          const colonIdx = line.indexOf(":");
          let value = line.substring(colonIdx + 1).trim();
          if (value.endsWith(",")) value = value.slice(0, -1);
          try { currentSkill[field] = JSON.parse(value); } catch { currentSkill[field] = value; }
        }
      }
      if (trimmed.startsWith('"phase"')) {
        currentSkill.phase = parseInt(trimmed.match(/(\d+)/)[1]);
      }
      if ((trimmed === "}," || trimmed === "}") && currentSkill.slug) {
        skills.push(currentSkill);
        currentSkill = null;
      }
    }
  }
  return skills;
}

async function callAPI(prompt) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  let result = data.choices[0].message.content.trim();
  // Strip common artifacts from model output
  result = result.replace(/^"""\n?/g, "").replace(/\n?"""$/g, "");
  result = result.replace(/^```\n?/g, "").replace(/\n?```$/g, "");
  // Remove any preamble like "Here is the translation:"
  result = result.replace(/^(Here is|以下是|翻訳|Translation:?).*?\n/i, "");
  return result.trim();
}

async function translateField(text, targetLang, fieldName) {
  const langName = targetLang === "zh" ? "Simplified Chinese (简体中文)" : "Japanese (日本語)";

  const prompt = `You are a professional translator. Your task is to translate the following English text into ${langName}.

IMPORTANT RULES:
1. You MUST translate ALL English text into ${langName}. Do NOT return the original English.
2. Output ONLY the translated text. No explanations, no preamble.
3. Do NOT wrap output in quotes.
4. Preserve all markdown formatting (###, **, -, etc.) exactly as-is.
5. Keep \\n newline markers exactly as they appear.
6. Keep emoji symbols (❌, ✅, etc.) unchanged.
7. For academic references, keep author names and years in English, translate book/paper titles.

English text:
${text}`;

  return callAPI(prompt);
}

async function translateSkill(skill, targetLang) {
  const fields = ["title", "description", "triggers", "methodology", "instructions", "examples", "references"];

  // Translate all 7 fields in parallel for speed!
  const results = await Promise.allSettled(
    fields.map(async (field) => {
      if (!skill[field]) return { field, value: "" };
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const value = await translateField(skill[field], targetLang, field);
          return { field, value };
        } catch (err) {
          if (attempt === maxRetries) {
            console.error(`    FAILED ${field}: ${err.message}`);
            return { field, value: skill[field] }; // English fallback
          }
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    })
  );

  const translated = {};
  for (const result of results) {
    const { field, value } = result.status === "fulfilled" ? result.value : { field: "unknown", value: "" };
    translated[field] = value;
  }
  return translated;
}

function escapeForTS(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function writeTranslationFile(translations, targetLang) {
  const varName = targetLang === "zh" ? "zhTranslations" : "jaTranslations";
  const comment = targetLang === "zh"
    ? "// Chinese (Simplified) translations for all skills"
    : "// Japanese translations for all skills";

  let output = `${comment}\nimport { Skill } from "@/types/skill";\n\ntype SkillTranslation = Omit<Skill, "slug" | "phase">;\n\nexport const ${varName}: Record<string, SkillTranslation> = {\n`;

  for (const [slug, fields] of Object.entries(translations)) {
    output += `  "${slug}": {\n`;
    for (const key of ["title", "description", "triggers", "methodology", "instructions", "examples", "references"]) {
      output += `    ${key}: "${escapeForTS(fields[key] || "")}",\n`;
    }
    output += `  },\n`;
  }

  output += "};\n";

  const outPath = path.join(ROOT, `src/lib/skills-i18n/${targetLang}.ts`);
  fs.writeFileSync(outPath, output, "utf-8");
  console.log(`Wrote ${outPath} (${(output.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log(`\n=== Translating to ${targetLang === "zh" ? "Chinese" : "Japanese"} ===`);
  console.log(`Model: ${MODEL}`);

  const skills = parseSkillsData();
  console.log(`Found ${skills.length} skills\n`);

  const subset = skills.slice(startIdx, startIdx + count);
  const translations = {};
  const startTime = Date.now();

  // Process skills with concurrency limit of 3
  const CONCURRENCY = 3;
  for (let i = 0; i < subset.length; i += CONCURRENCY) {
    const batch = subset.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (skill, j) => {
        const idx = i + j + 1;
        console.log(`[${idx}/${subset.length}] ${skill.title}`);
        const result = await translateSkill(skill, targetLang);
        return { slug: skill.slug, result };
      })
    );
    for (const { slug, result } of batchResults) {
      translations[slug] = result;
    }

    // Save incrementally every batch
    writeTranslationFile(translations, targetLang);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const done = Math.min(i + CONCURRENCY, subset.length);
    const rate = (done / (elapsed / 60)).toFixed(1);
    console.log(`  [${done}/${subset.length} done, ${elapsed}s elapsed, ${rate} skills/min]\n`);
  }

  console.log("\nTranslation complete!");
}

main().catch(console.error);
