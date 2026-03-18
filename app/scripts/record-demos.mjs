/**
 * Record 3 promotional demo GIFs for 小红书
 *
 * Demo 1: 奥数鸡兔同笼 (Aria tutor)
 * Demo 2: 人情世故饭局 (Marcus tutor)
 * Demo 3: Transformer注意力机制 (Feynman tutor)
 *
 * Usage:
 *   node scripts/record-demos.mjs           # record all 3
 *   node scripts/record-demos.mjs demo1     # record only demo1
 *
 * Requires: dev server on localhost:3000, ffmpeg in PATH
 * Outputs: docs/demos/demo{1,2,3}-*.gif + .png screenshots
 */

// Force-clear proxy env vars
for (const k of ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]) {
  delete process.env[k];
}
process.env.NO_PROXY = "*";
process.env.no_proxy = "*";

import { chromium } from "playwright";
import { execSync } from "child_process";
import { mkdirSync, rmSync, readdirSync, statSync } from "fs";
import { join } from "path";

const DEMO_DIR = "docs/demos";
const FRAMES_DIR = "docs/demos/_frames";
const WIDTH = 1280;
const HEIGHT = 720;
const BASE = "http://127.0.0.1:3000/zh";
const FPS = 8;
const FRAME_INTERVAL = 1000 / FPS;

mkdirSync(DEMO_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanFrames() {
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });
}

let frameIdx = 0;

async function shot(page) {
  const num = String(frameIdx++).padStart(4, "0");
  await page.screenshot({ path: join(FRAMES_DIR, `frame_${num}.png`) });
}

async function hold(page, count = 5) {
  for (let i = 0; i < count; i++) {
    await shot(page);
    await sleep(FRAME_INTERVAL);
  }
}

function framesToGif(name) {
  const gifPath = join(DEMO_DIR, `${name}.gif`);
  try {
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%04d.png" ` +
        `-vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg" ` +
        `-loop 0 "${gifPath}"`,
      { stdio: "pipe" }
    );
    const count = readdirSync(FRAMES_DIR).filter((f) => f.endsWith(".png")).length;
    const size = (statSync(gifPath).size / 1024 / 1024).toFixed(1);
    console.log(`  \u2713 ${gifPath} (${count} frames, ${size} MB)`);
  } catch (e) {
    console.error(`  GIF creation failed: ${e.message}`);
  }
}

function framesToMp4(name) {
  const mp4Path = join(DEMO_DIR, `${name}.mp4`);
  try {
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%04d.png" ` +
        `-c:v libx264 -pix_fmt yuv420p -crf 23 -preset fast "${mp4Path}"`,
      { stdio: "pipe" }
    );
    const size = (statSync(mp4Path).size / 1024 / 1024).toFixed(1);
    console.log(`  \u2713 ${mp4Path} (${size} MB)`);
  } catch (e) {
    console.error(`  MP4 creation failed: ${e.message}`);
  }
}

async function selectTutor(page, tutorName) {
  try {
    // Click tutor dropdown button
    const tutorBtn = page.locator("button").filter({ hasText: /导师/ }).first();
    if (await tutorBtn.isVisible({ timeout: 3000 })) {
      await tutorBtn.click();
      await sleep(800);

      // Find and click the tutor option
      const option = page.locator("button").filter({ hasText: tutorName });
      if (await option.first().isVisible({ timeout: 3000 })) {
        await option.first().click();
        console.log(`  Selected tutor: ${tutorName}`);
        await sleep(500);
      }

      // Close dropdown - press Escape then click center
      await page.keyboard.press("Escape");
      await sleep(300);
      await page.mouse.click(640, 400);
      await sleep(500);
    }
  } catch (e) {
    console.log(`  Tutor selection skipped: ${e.message}`);
  }
}

async function typeAndSend(page, message) {
  // Wait for the input to be present and visible
  await page.waitForSelector('input[placeholder*="导师"]', { state: "visible", timeout: 10000 });
  const input = page.locator('input[placeholder*="导师"]');
  await input.click();
  await sleep(300);

  // Type with animation
  for (const ch of message) {
    await input.type(ch, { delay: 30 });
  }
  await sleep(400);

  // Send
  await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
  const sendBtn = page.locator('button[type="submit"]').first();
  await sendBtn.click();
  console.log("  Message sent");
}

async function waitForAIResponse(page, maxWaitMs = 60000) {
  const start = Date.now();
  let stableCount = 0;

  // Wait a bit for streaming to start
  await sleep(3000);

  while (Date.now() - start < maxWaitMs) {
    await sleep(1500);

    // Check if send button is enabled (response complete)
    try {
      const isDisabled = await page.locator('button[type="submit"]').isDisabled();
      if (!isDisabled) {
        stableCount++;
        if (stableCount >= 2) {
          console.log("  AI response complete");
          return true;
        }
      } else {
        stableCount = 0;
      }
    } catch {
      // continue
    }
  }

  console.log("  Response wait timed out");
  return false;
}

async function captureStreamingResponse(page, maxFrames = 200) {
  // Capture frames while AI is responding
  for (let i = 0; i < maxFrames; i++) {
    await shot(page);
    await sleep(FRAME_INTERVAL);

    // Check if response is done every 2 seconds
    if (i > 0 && i % 16 === 0) {
      try {
        const isDisabled = await page.locator('button[type="submit"]').isDisabled();
        if (!isDisabled) {
          // Response done, capture a few more frames
          await hold(page, 16);

          // Scroll to show full response
          await page.evaluate(() => {
            const areas = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]');
            for (const a of areas) {
              if (a.scrollHeight > a.clientHeight) {
                a.scrollTo({ top: a.scrollHeight, behavior: "smooth" });
              }
            }
          });
          await sleep(800);
          await hold(page, 16);
          return;
        }
      } catch {}
    }
  }
}

async function setupPage(browser) {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    colorScheme: "dark",
  });

  // Skip onboarding, enable tutor mode
  await page.goto(`${BASE}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("tutor-mode", '"on"');
  });

  return page;
}

// ══════════════════════════════════════════════════════════
// DEMO 1: 奥数鸡兔同笼 (Aria)
// ══════════════════════════════════════════════════════════
async function recordDemo1(browser) {
  console.log("\n\ud83c\udfac Demo 1: \u5965\u6570\u9e21\u5154\u540c\u7b3c (Aria)");
  cleanFrames();
  frameIdx = 0;

  const page = await setupPage(browser);

  // Navigate to math tutor chat
  await page.goto(`${BASE}/chat/01-k12-mathematics`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await sleep(2000);

  // Select Aria tutor
  await selectTutor(page, "Aria");

  // Show initial empty chat
  await hold(page, 10);

  // Type the math problem
  console.log("  Typing question...");
  await typeAndSend(
    page,
    "\u6211\u5973\u513f\u5c0f\u5b66\u56db\u5e74\u7ea7\uff0c\u8fd9\u9053\u5965\u6570\u9898\u4e0d\u4f1a\u505a\uff1a\u4e00\u4e2a\u519c\u573a\u6709\u9e21\u548c\u5154\uff0c\u517135\u4e2a\u5934\uff0c94\u53ea\u811a\uff0c\u95ee\u9e21\u548c\u5154\u5404\u6709\u591a\u5c11\u53ea\uff1f"
  );

  // Capture the streaming response
  await captureStreamingResponse(page, 300);

  // Save screenshot of final state
  await page.screenshot({ path: join(DEMO_DIR, "demo1-math-result.png") });
  console.log("  Screenshot saved");

  // Generate GIF and MP4
  framesToGif("demo1-math-olympiad");
  framesToMp4("demo1-math-olympiad");

  await page.close();
}

// ══════════════════════════════════════════════════════════
// DEMO 2: 人情世故饭局 (Marcus)
// ══════════════════════════════════════════════════════════
async function recordDemo2(browser) {
  console.log("\n\ud83c\udfac Demo 2: \u4eba\u60c5\u4e16\u6545\u996d\u5c40 (Marcus)");
  cleanFrames();
  frameIdx = 0;

  const page = await setupPage(browser);

  // Navigate to social intelligence chat
  await page.goto(`${BASE}/chat/05-social-intelligence`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await sleep(2000);

  // Select Marcus tutor
  await selectTutor(page, "Marcus");

  // Show initial state
  await hold(page, 10);

  // Type the scenario
  console.log("  Typing question...");
  await typeAndSend(
    page,
    "\u4e0b\u5468\u8981\u548c\u90e8\u95e8\u9886\u5bfc\u4e00\u8d77\u53bb\u63a5\u5f85\u5ba2\u6237\u5403\u996d\uff0c\u6211\u662f\u7ec4\u91cc\u6700\u5e74\u8f7b\u7684\u65b0\u4eba\uff0c\u5b8c\u5168\u4e0d\u77e5\u9053\u8be5\u600e\u4e48\u8868\u73b0\uff0c\u5f88\u7d27\u5f20"
  );

  // Capture streaming response
  await captureStreamingResponse(page, 300);

  // Save screenshot
  await page.screenshot({ path: join(DEMO_DIR, "demo2-social-result.png") });
  console.log("  Screenshot saved");

  // Generate GIF and MP4
  framesToGif("demo2-social-intelligence");
  framesToMp4("demo2-social-intelligence");

  await page.close();
}

// ══════════════════════════════════════════════════════════
// DEMO 3: Transformer 注意力机制 (Feynman)
// ══════════════════════════════════════════════════════════
async function recordDemo3(browser) {
  console.log("\n\ud83c\udfac Demo 3: Transformer\u6ce8\u610f\u529b\u673a\u5236 (Feynman)");
  cleanFrames();
  frameIdx = 0;

  const page = await setupPage(browser);

  // Navigate to STEM tutor chat
  await page.goto(`${BASE}/chat/02-stem-tutor`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await sleep(2000);

  // Select Feynman tutor
  await selectTutor(page, "Feynman");

  // Show initial state
  await hold(page, 10);

  // Type the question
  console.log("  Typing question...");
  await typeAndSend(
    page,
    "\u6211\u60f3\u7406\u89e3 Transformer \u7684\u6ce8\u610f\u529b\u673a\u5236\uff0c\u770b\u4e86\u5f88\u591a\u6587\u7ae0\u4f46\u603b\u662f\u770b\u5b8c\u5c31\u5fd8\u3002\u80fd\u7528\u7b80\u5355\u7684\u65b9\u5f0f\u89e3\u91ca\u5417\uff1f"
  );

  // Capture streaming response
  await captureStreamingResponse(page, 300);

  // Save screenshot
  await page.screenshot({ path: join(DEMO_DIR, "demo3-transformer-result.png") });
  console.log("  Screenshot saved");

  // Generate GIF and MP4
  framesToGif("demo3-transformer");
  framesToMp4("demo3-transformer");

  await page.close();
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
async function main() {
  const arg = process.argv[2] || "all";

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-proxy-server"],
  });

  try {
    if (arg === "all" || arg === "demo1") await recordDemo1(browser);
    if (arg === "all" || arg === "demo2") await recordDemo2(browser);
    if (arg === "all" || arg === "demo3") await recordDemo3(browser);
  } finally {
    await browser.close();
    rmSync(FRAMES_DIR, { recursive: true, force: true });
  }

  console.log("\n\u2705 Done! Output in docs/demos/");
}

main().catch(console.error);
