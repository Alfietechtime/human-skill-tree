/**
 * Generate 9 beautifully designed cards for 小红书 篇0
 * Resolution: 1242 × 1660 (3:4 ratio)
 * Font sizes: minimum 36px (appears ~11px on phone), titles 90px+
 * Visual: gradient accents, glow effects, strong hierarchy
 */

for (const k of ["HTTP_PROXY","HTTPS_PROXY","ALL_PROXY","http_proxy","https_proxy","all_proxy"]) {
  delete process.env[k];
}
process.env.NO_PROXY = "*";

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = "D:/pythonPycharms/工具开发/054ai教育/human-skill-tree/docs/xhs-cards";
const W = 1242;
const H = 1660;
mkdirSync(OUT, { recursive: true });

const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
@font-face { font-family:'E'; src:local('Segoe UI Emoji'),local('Apple Color Emoji'),local('Noto Color Emoji'); }
body {
  width:${W}px; height:${H}px;
  font-family:"Microsoft YaHei","PingFang SC","Helvetica Neue",sans-serif;
  color:#E8E8F0; overflow:hidden;
  display:flex; flex-direction:column;
  background:#0F0B1E;
}
.bg { position:absolute; inset:0; z-index:-1; }
.c {
  flex:1; display:flex; flex-direction:column;
  padding:72px 76px 40px; position:relative;
}
.pn {
  position:absolute; top:36px; right:72px;
  font-size:32px; color:rgba(255,255,255,0.25); font-weight:300;
}
.lb {
  display:flex; align-items:center; gap:16px; margin-bottom:36px;
}
.ld {
  width:52px; height:52px; border-radius:50%;
  background:linear-gradient(135deg,#8B5CF6,#3B82F6);
  display:flex; align-items:center; justify-content:center;
  font-size:26px; color:white; font-weight:bold;
}
.lt { font-size:28px; font-weight:600; color:rgba(255,255,255,0.4); letter-spacing:3px; }

h1 {
  font-size:96px; font-weight:900; line-height:1.2; margin-bottom:32px;
  background:linear-gradient(135deg,#C4B5FD,#93C5FD,#67E8F9);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
}
h2 {
  font-size:72px; font-weight:800; line-height:1.2; margin-bottom:28px;
  color:#F0EEFF;
}
.sub {
  font-size:42px; line-height:1.55; color:rgba(255,255,255,0.6); margin-bottom:32px;
}
.bt {
  font-size:42px; line-height:1.65; color:rgba(255,255,255,0.85); margin-bottom:20px;
}
.hl {
  background:linear-gradient(135deg,rgba(139,92,246,0.18),rgba(59,130,246,0.12));
  border-left:6px solid #8B5CF6;
  border-radius:0 20px 20px 0;
  padding:32px 36px; margin-bottom:24px;
}
.hl .bt { margin-bottom:0; }
.g { display:grid; gap:16px; }
.cd {
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:20px; padding:28px 32px;
}
.ci { font-size:52px; margin-bottom:8px; font-family:'E',sans-serif; }
.ct { font-size:40px; font-weight:700; color:#E0D4FF; margin-bottom:6px; }
.cx { font-size:36px; line-height:1.5; color:rgba(255,255,255,0.6); }
.tr { display:flex; flex-wrap:wrap; gap:14px; margin-top:auto; padding-top:24px; }
.tg {
  background:rgba(139,92,246,0.2); border:1px solid rgba(139,92,246,0.3);
  border-radius:28px; padding:12px 28px; font-size:32px; color:#C4B5FD;
}
.dv {
  height:1px; margin:24px 0;
  background:linear-gradient(90deg,transparent,rgba(139,92,246,0.4),transparent);
}
.sr { display:flex; gap:18px; margin-bottom:24px; }
.st {
  flex:1; background:rgba(255,255,255,0.05); border-radius:16px;
  padding:28px 16px; text-align:center;
}
.sn {
  font-size:64px; font-weight:900;
  background:linear-gradient(135deg,#C4B5FD,#67E8F9);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
}
.sl { font-size:30px; color:rgba(255,255,255,0.45); margin-top:8px; }
.ft {
  padding:24px 72px; display:flex; align-items:center; justify-content:center;
  border-top:1px solid rgba(255,255,255,0.06);
}
.fx { font-size:28px; color:rgba(255,255,255,0.25); letter-spacing:1px; }
.sp { flex:1; }

/* tutor grid */
.tug { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.tuc {
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:24px 26px;
  display:flex; align-items:flex-start; gap:14px;
}
.tue { font-size:44px; font-family:'E',sans-serif; flex-shrink:0; }
.tun { font-size:38px; font-weight:700; color:#E0D4FF; }
.tud { font-size:30px; color:rgba(255,255,255,0.5); margin-top:4px; line-height:1.45; }

/* demo cards */
.dc {
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
  border-radius:20px; padding:30px 34px; margin-bottom:16px;
  display:flex; gap:22px; align-items:flex-start;
}
.dn {
  font-size:72px; font-weight:900; line-height:1;
  background:linear-gradient(135deg,#8B5CF6,#3B82F6);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  flex-shrink:0;
}
.dd { flex:1; }
.dtl { font-size:40px; font-weight:700; color:#F0EEFF; margin-bottom:6px; }
.dds { font-size:36px; color:rgba(255,255,255,0.55); line-height:1.5; }

/* cta boxes */
.cb {
  background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.15));
  border:1px solid rgba(139,92,246,0.25);
  border-radius:20px; padding:32px 36px; margin-bottom:20px;
}
.cbt { font-size:42px; font-weight:700; color:#C4B5FD; margin-bottom:10px; }
.cbx { font-size:36px; color:rgba(255,255,255,0.65); line-height:1.55; }

/* glow accent for cover */
.glow {
  position:absolute; border-radius:50%; filter:blur(80px); opacity:0.15;
}
`;

const bgSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#0F0B1E"/>
      <stop offset="40%" stop-color="#1A1333"/>
      <stop offset="100%" stop-color="#0D1117"/>
    </linearGradient>
    <radialGradient id="g1" cx="0.85" cy="0.1" r="0.5">
      <stop offset="0%" stop-color="rgba(139,92,246,0.15)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="g2" cx="0.15" cy="0.9" r="0.5">
      <stop offset="0%" stop-color="rgba(59,130,246,0.1)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect fill="url(#bg)" width="${W}" height="${H}"/>
  <rect fill="url(#g1)" width="${W}" height="${H}"/>
  <rect fill="url(#g2)" width="${W}" height="${H}"/>
</svg>`;
const bgURL = `data:image/svg+xml;base64,${Buffer.from(bgSVG).toString("base64")}`;

const FT = `<div class="ft"><span class="fx">Human Skill Tree · 人类技能树</span></div>`;

function page(n, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body><img class="bg" src="${bgURL}"/>
<div class="c"><span class="pn">${n}/9</span>
<div class="lb"><div class="ld">H</div><span class="lt">HUMAN SKILL TREE</span></div>
${body}</div>${FT}</body></html>`;
}

const cards = [
  // 1 — Cover
  { name:"01-cover", html: page(1, `
    <div class="sp"></div>
    <h1 style="font-size:100px;">AI 有了技能树<br/>人类呢？</h1>
    <div class="dv"></div>
    <p class="bt" style="font-size:46px; color:rgba(255,255,255,0.65); margin-bottom:40px;">
      33 个 AI 技能 + 交互式学习平台<br/>
      把 ChatGPT / Claude / DeepSeek<br/>
      变成基于认知科学的学习伙伴
    </p>
    <div class="sr">
      <div class="st"><div class="sn">33</div><div class="sl">AI 技能</div></div>
      <div class="st"><div class="sn">6</div><div class="sl">AI 导师</div></div>
      <div class="st"><div class="sn">18+</div><div class="sl">模型</div></div>
      <div class="st"><div class="sn">3</div><div class="sl">语言</div></div>
    </div>
    <div class="tr">
      <span class="tg">完全开源</span>
      <span class="tg">国内可直连</span>
      <span class="tg">免费使用</span>
    </div>
  `)},

  // 2 — Why
  { name:"02-why", html: page(2, `
    <h2>为什么做这个项目？</h2>
    <p class="bt" style="font-size:40px;">2025 年，AI 通过 Skill、MCP 等协议获得了操纵现实世界的能力。</p>
    <p class="bt" style="font-weight:700; color:#C4B5FD; font-size:48px; margin-bottom:28px;">但人类呢？</p>
    <div class="g" style="grid-template-columns:1fr; gap:16px;">
      <div class="cd" style="padding:30px 36px;">
        <div class="ci">👨‍💻</div>
        <div class="cx" style="font-size:40px;">35 岁程序员发现技术栈正在被 AI 替代，怎么追？</div>
      </div>
      <div class="cd" style="padding:30px 36px;">
        <div class="ci">👶</div>
        <div class="cx" style="font-size:40px;">一个孩子将出生在 AI 完成大部分知识劳动的世界，该学什么？</div>
      </div>
      <div class="cd" style="padding:30px 36px;">
        <div class="ci">🎓</div>
        <div class="cx" style="font-size:40px;">农村出来的大学新生，没人教那些课本上没有的潜规则，谁来教？</div>
      </div>
    </div>
    <div class="sp"></div>
    <div class="hl">
      <p class="bt" style="margin:0; font-size:44px; font-weight:700;">
        核心问题不是「AI 能不能教」<br/>而是「怎么让 AI 正确地教」
      </p>
    </div>
  `)},

  // 3 — Science
  { name:"03-science", html: page(3, `
    <h2>认知科学基础</h2>
    <p class="sub" style="font-size:38px;">每个技能都内置经过验证的学习理论</p>
    <div class="cd" style="margin-bottom:18px; padding:30px 34px;">
      <p class="ct" style="font-size:38px;">📄 PNAS 2025 · AI 辅导实验</p>
      <p class="bt" style="font-size:40px; margin-bottom:8px;">GPT-4 辅导让数学成绩涨 <span style="color:#67E8F9; font-weight:800;">48%—127%</span></p>
      <p class="cx" style="font-size:34px;">前提：必须加教学设计约束</p>
    </div>
    <div class="cd" style="margin-bottom:18px; padding:30px 34px;">
      <p class="ct" style="font-size:38px;">📊 Dunlosky 元分析 · 16.9 万人</p>
      <p class="bt" style="font-size:40px; margin-bottom:8px;">划重点、反复阅读效果<span style="color:#F87171; font-weight:800;">最差</span></p>
      <p class="cx" style="font-size:34px;">真正有效的是检索练习 + 间隔重复</p>
    </div>
    <div class="dv"></div>
    <p class="bt" style="font-size:36px; color:#C4B5FD; margin-bottom:18px;">项目内置的学习理论：</p>
    <div class="g" style="grid-template-columns:1fr 1fr; gap:12px;">
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">苏格拉底式提问</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">间隔重复 Leitner</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">费曼技巧</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">Bloom 认知分类</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">必要难度 Bjork</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">最近发展区</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">认知负荷理论</div></div>
      <div class="cd" style="padding:20px 24px;"><div class="cx" style="font-size:34px; color:#E0D4FF;">2 Sigma Bloom</div></div>
    </div>
  `)},

  // 4 — Skills
  { name:"04-skills", html: page(4, `
    <h2>33 个技能覆盖</h2>
    <p class="sub" style="font-size:42px;">从小学到职场，从学科到做人</p>
    <div class="g" style="grid-template-columns:1fr 1fr; gap:14px;">
      <div class="cd" style="padding:26px 28px;">
        <div class="ci">📚</div>
        <div class="ct" style="font-size:36px;">K-12 全科</div>
        <div class="cx" style="font-size:32px;">数学 · 科学 · 语言<br/>人文社科 · 考试教练</div>
      </div>
      <div class="cd" style="padding:26px 28px;">
        <div class="ci">🎓</div>
        <div class="ct" style="font-size:36px;">大学阶段</div>
        <div class="cx" style="font-size:32px;">STEM · 商科经济<br/>医学健康 · 艺术设计</div>
      </div>
      <div class="cd" style="padding:26px 28px;">
        <div class="ci">🔬</div>
        <div class="ct" style="font-size:36px;">研究生 / 科研</div>
        <div class="cx" style="font-size:32px;">方法论 · 学术写作<br/>文献综述 · 数据分析</div>
      </div>
      <div class="cd" style="padding:26px 28px;">
        <div class="ci">💼</div>
        <div class="ct" style="font-size:36px;">职业发展</div>
        <div class="cx" style="font-size:32px;">技术面试 · 金融<br/>咨询 · 公务员考试</div>
      </div>
      <div class="cd" style="padding:26px 28px;">
        <div class="ci">🤝</div>
        <div class="ct" style="font-size:36px;">社交智慧</div>
        <div class="cx" style="font-size:32px;">人情世故 · 跨文化<br/>情商训练 · 谈判说服</div>
      </div>
      <div class="cd" style="padding:26px 28px;">
        <div class="ci">🧠</div>
        <div class="ct" style="font-size:36px;">自我发展</div>
        <div class="cx" style="font-size:32px;">批判思维 · 财务素养<br/>创造力 · 健康管理</div>
      </div>
    </div>
    <div class="sp"></div>
    <div class="hl">
      <p class="bt" style="margin:0; font-size:38px; text-align:center;">
        最底层技能：<span style="color:#67E8F9; font-weight:800;">学会学习</span>
      </p>
    </div>
  `)},

  // 5 — Tutors
  { name:"05-tutors", html: page(5, `
    <h2>苏格拉底导师系统</h2>
    <p class="sub" style="font-size:40px;">6 位 AI 导师 · 不给答案 · 用问题引导思考</p>
    <div class="tug">
      <div class="tuc"><span class="tue">✨</span><div><div class="tun">Aria</div><div class="tud">热情的叙事者<br/>类比和故事化讲解</div></div></div>
      <div class="tuc"><span class="tue">🎯</span><div><div class="tun">Marcus</div><div class="tud">严谨的逻辑家<br/>要求严格推导</div></div></div>
      <div class="tuc"><span class="tue">🌊</span><div><div class="tun">Lin</div><div class="tud">安静的深度思考者<br/>注重底层原理</div></div></div>
      <div class="tuc"><span class="tue">📐</span><div><div class="tun">Euler</div><div class="tud">追求数学之美<br/>公式 + 直觉解释</div></div></div>
      <div class="tuc"><span class="tue">🥁</span><div><div class="tun">Feynman</div><div class="tud">幽默简化大师<br/>费曼技巧</div></div></div>
      <div class="tuc"><span class="tue">⚗️</span><div><div class="tun">Curie</div><div class="tud">坚韧实验科学家<br/>观察先行</div></div></div>
    </div>
    <div class="dv"></div>
    <div class="cd" style="border-color:rgba(139,92,246,0.3);">
      <p class="bt" style="margin-bottom:8px; font-size:38px;">
        <span style="color:#C4B5FD; font-weight:700;">跨导师记忆</span>
      </p>
      <p class="cx" style="font-size:34px;">切换导师时，新导师知道你之前学了什么、在哪卡壳。课后导师们还在群聊里讨论你的表现</p>
    </div>
  `)},

  // 6 — Gamification
  { name:"06-gamification", html: page(6, `
    <h2>游戏化学习</h2>
    <p class="sub" style="font-size:42px;">让学习像打游戏一样上瘾</p>
    <div class="g" style="grid-template-columns:1fr; gap:16px;">
      <div class="cd" style="display:flex; align-items:center; gap:22px; padding:28px 32px;">
        <span style="font-size:56px; font-family:'E'; flex-shrink:0;">⚡</span>
        <div><div class="ct">经验值系统</div><div class="cx" style="font-size:34px;">发消息 +5 XP · 学知识点 +20 XP · 复习 +15 XP</div></div>
      </div>
      <div class="cd" style="display:flex; align-items:center; gap:22px; padding:28px 32px;">
        <span style="font-size:56px; font-family:'E'; flex-shrink:0;">🔥</span>
        <div><div class="ct">连续学习奖励</div><div class="cx" style="font-size:34px;">连续学习天数追踪 + 等级系统</div></div>
      </div>
      <div class="cd" style="display:flex; align-items:center; gap:22px; padding:28px 32px;">
        <span style="font-size:56px; font-family:'E'; flex-shrink:0;">🧠</span>
        <div><div class="ct">间隔重复</div><div class="cx" style="font-size:34px;">1天 → 3天 → 7天 → 14天 → 掌握</div></div>
      </div>
      <div class="cd" style="display:flex; align-items:center; gap:22px; padding:28px 32px;">
        <span style="font-size:56px; font-family:'E'; flex-shrink:0;">📊</span>
        <div><div class="ct">知识点自动提取</div><div class="cx" style="font-size:34px;">AI 从对话中提取概念，量化掌握度</div></div>
      </div>
      <div class="cd" style="display:flex; align-items:center; gap:22px; padding:28px 32px;">
        <span style="font-size:56px; font-family:'E'; flex-shrink:0;">📱</span>
        <div><div class="ct">成绩单分享</div><div class="cx" style="font-size:34px;">一键生成学习报告卡片</div></div>
      </div>
    </div>
  `)},

  // 7 — Social Intelligence
  { name:"07-social", html: page(7, `
    <h2>人情世故</h2>
    <p class="sub" style="font-size:40px;">用 AI 教社交潜规则</p>
    <div class="g" style="grid-template-columns:1fr; gap:14px;">
      <div class="cd" style="padding:28px 32px;">
        <p class="ct" style="font-size:42px; margin-bottom:12px;">🍽️ 饭局</p>
        <p class="cx" style="font-size:36px; line-height:1.6;">
          座位怎么排（面门为尊）<br/>
          敬酒顺序 · 杯子高度<br/>
          什么时候该抢买单
        </p>
      </div>
      <div class="cd" style="padding:28px 32px;">
        <p class="ct" style="font-size:42px; margin-bottom:12px;">🎁 送礼</p>
        <p class="cx" style="font-size:36px; line-height:1.6;">
          禁忌：钟（终）· 梨（离）· 伞（散）· 鞋（邪）<br/>
          红包带 8 避 4，金额看关系远近
        </p>
      </div>
      <div class="cd" style="padding:28px 32px;">
        <p class="ct" style="font-size:42px; margin-bottom:12px;">💼 职场</p>
        <p class="cx" style="font-size:36px; line-height:1.6;">
          「考虑考虑」= 不行<br/>
          「有空聊聊」= 要谈正事了<br/>
          多请示多汇报，不越级汇报
        </p>
      </div>
    </div>
    <div class="sp"></div>
    <div class="hl">
      <p class="bt" style="margin:0; font-size:40px;">
        AI 可以模拟饭局 / 面试场景<br/>让你安全练习
      </p>
    </div>
  `)},

  // 8 — Demos
  { name:"08-demos", html: page(8, `
    <h2>三个真实 Demo</h2>
    <p class="sub" style="margin-bottom:28px; font-size:40px;">三个热门场景的真实对话</p>
    <div class="dc">
      <div class="dn">01</div>
      <div class="dd">
        <div class="dtl">小孩学奥数 · 鸡兔同笼</div>
        <div class="dds" style="font-size:38px;">
          Aria 导师不给答案<br/>
          引导孩子发现「假设法」<br/>
          <span style="color:#C4B5FD;">「如果全是鸡，多少只脚？」</span>
        </div>
      </div>
    </div>
    <div class="dc">
      <div class="dn">02</div>
      <div class="dd">
        <div class="dtl">职场新人 · 陪领导吃饭</div>
        <div class="dds" style="font-size:38px;">
          Marcus 导师教饭局新人定位<br/>
          然后扮演客户让你练<br/>
          <span style="color:#C4B5FD;">「新人的任务不是表现，是？」</span>
        </div>
      </div>
    </div>
    <div class="dc">
      <div class="dn">03</div>
      <div class="dd">
        <div class="dtl">学 Transformer · 注意力机制</div>
        <div class="dds" style="font-size:38px;">
          Feynman 用「鸡尾酒会效应」类比<br/>
          3 轮对话说出了 Q-K-V<br/>
          <span style="color:#C4B5FD;">「想象你在嘈杂的派对里...」</span>
        </div>
      </div>
    </div>
  `)},

  // 9 — CTA
  { name:"09-cta", html: page(9, `
    <h2>怎么用？</h2>
    <p class="sub" style="font-size:40px;">完全免费，三种方式</p>
    <div class="cb">
      <div class="cbt">方式一：直接访问 Web 平台</div>
      <div class="cbx">
        国内可直连，无需特殊网络<br/>
        <span style="color:#4ADE80; font-size:38px; font-weight:600;">地址见评论区置顶</span>
      </div>
    </div>
    <div class="cb">
      <div class="cbt">方式二：安装到你的 AI 工具</div>
      <div class="cbx">
        支持 Claude Code / Cursor / Windsurf<br/>
        也可粘贴到 ChatGPT / DeepSeek 使用
      </div>
    </div>
    <div class="cb">
      <div class="cbt">方式三：开源代码自部署</div>
      <div class="cbx">
        完全开源，可以 Fork 改造<br/>成你自己的教学工具
      </div>
    </div>
    <div class="dv"></div>
    <p class="bt" style="font-size:46px; font-weight:700; text-align:center; margin-bottom:14px;">
      完全开源，免费使用
    </p>
    <p class="bt" style="font-size:38px; text-align:center; color:rgba(255,255,255,0.5); line-height:1.6;">
      AI 获得了操纵现实的专项能力<br/>
      那人类何去何从？如何学习？
    </p>
    <div class="sp"></div>
    <div class="tr" style="justify-content:center;">
      <span class="tg">评论区见链接</span>
      <span class="tg">欢迎提建议</span>
      <span class="tg">欢迎贡献</span>
    </div>
  `)},
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const card of cards) {
    const p = await ctx.newPage();
    await p.setContent(card.html, { waitUntil: "load" });
    await p.waitForTimeout(400);
    await p.screenshot({ path: join(OUT, `${card.name}.png`), type: "png" });
    console.log(`  ✓ ${card.name}.png`);
    await p.close();
  }
  await browser.close();
  console.log(`\n✅ ${cards.length} cards → ${OUT}`);
}
main().catch(console.error);
