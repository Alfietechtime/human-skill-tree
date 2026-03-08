# AI有了技能树，人类呢？

> 一个开源项目的诞生：当认知科学遇上AI Agent

---

**你有没有想过一个问题——**

2025年，AI Agent通过Skill、MCP等标准化协议，获得了操纵现实世界的能力。Claude能跑代码、查数据库、控制浏览器；ChatGPT能联网、写程序、做数据分析；Gemini能看、能听、能和物理世界交互。

AI有了自己的技能树。

**但人类的技能树呢？**

一个35岁的程序员发现自己的技术栈正在被AI替代，怎么追？一个10岁的孩子将毕业在AI完成大部分知识劳动的世界，该学什么？一个博士生花5年死磕一个窄领域，这个投资对吗？一个农村出来的大学新生，没人教他那些不写在课本上的潜规则——谁来教？

这些不是假设性问题。**这就是我们这个时代最核心的问题。**

---

## 学习这件事，我们一直做错了

先说几个可能颠覆你认知的研究结论：

### 1. AI家教比大学课堂更有效

2025年发表在 **Nature Scientific Reports** 上的一项随机对照实验（RCT，临床试验的金标准方法论）发现：使用AI导师的学生，在更短的时间内学到了更多知识，参与度和学习动机也更高——和传统的主动学习课堂相比。

不是和"看PPT讲课"比，是和目前公认最先进的"主动学习教学法"比。AI赢了。

> Kestin et al. (2025). *Scientific Reports*. doi:10.1038/s41598-025-97652-6

### 2. 你最常用的学习方法，大概率是无效的

一项涵盖242项研究、16.9万人的元分析得出结论：**反复阅读、划重点、做摘要——这些最流行的学习方法效果最差。** 真正有效的是检索练习（主动回忆）和间隔重复。

你回想一下：你是怎么"复习"的？翻开笔记重新看一遍？那叫"产生了学会的错觉"。认知科学家有个术语叫 **fluency illusion**（流畅性错觉）——你觉得自己看懂了，但什么都没记住。

> Dunlosky et al. (2013). *Psychological Science in the Public Interest*. doi:10.1177/1529100612453266

### 3. AI辅导对K-12学生有显著正效应

一项发表在 **npj Science of Learning**（Nature子刊）的系统综述，分析了28项研究、4597名学生的数据，发现AI驱动的智能辅导系统在解题能力、批判性思维和逻辑推理方面都有显著提升。

> Systematic review, *npj Science of Learning* (2025). doi:10.1038/s41539-025-00320-7

**科学已经告诉我们答案了：AI + 认知科学 = 人类历史上最强大的学习组合。**

但问题是——**AI本身没有教学结构。它无所不知，但什么也不"教"。**

你问ChatGPT一个问题，它给你一个答案。但它不会：
- 先评估你的水平，再决定讲多深
- 用间隔重复帮你巩固记忆
- 在你快放弃的时候换一种解释方式
- 主动给你出题，而不是等你来问
- 在你需要的时候，模拟一个社交场景让你练习

**除非你给它一个Skill。**

---

## Human Skill Tree：给AI装上教育操作系统

这就是我做 [Human Skill Tree](https://github.com/24kchengYe/human-skill-tree) 这个开源项目的出发点。

**一句话：30+个AI Agent技能，把ChatGPT/Claude/Gemini/Copilot/DeepSeek变成有结构、有方法论、基于认知科学的学习伙伴。**

不是聊天机器人。不是课程平台。是一个**升级AI与想学习的人类交互方式**的技能集合。

### 它覆盖什么？

| 阶段 | 示例技能 |
|---|---|
| 🏫 K-12基础教育 | 数学导师、科学导师、语言学习、人文社科、考试系统教练 |
| 🎓 大学阶段 | STEM导师、商科经济、人文社科、医学健康、艺术设计 |
| 🔬 研究生/科研 | 研究方法论、学术写作、文献综述、数据分析与统计 |
| 💼 职业发展 | 技术职业导航、面试准备、金融职业、咨询职业、公务员考试 |
| 🤝 社交智慧 | 人情世故教练、跨文化沟通、情商训练、谈判与说服 |
| 🧠 自我发展 | 批判性思维、财务素养、创造力与创新、健康管理 |

**最底层的技能叫"学会学习"（Learning How to Learn）**——基于Barbara Oakley的课程和Dunlosky的元分析，教你怎么用Feynman技巧、间隔重复、交叉练习等方法来学任何东西。

### 它不同在哪里？

| 直接问AI | 用了Human Skill Tree |
|---|---|
| "解释一下量子力学" → 给你一堆文字 | 先评估你的物理基础，再从你能理解的类比入手 |
| "帮我准备面试" → 泛泛建议 | 模拟面试官，用STAR方法逐个拆解你的经历 |
| "怎么学英语" → 列出5个方法 | 制定30天计划，含间隔重复+shadowing+每日检索练习 |
| "饭局怎么表现" → 通用礼仪 | 分析具体场景：你是最年轻的？体制内还是民企？模拟演练 |

---

## 关于"人情世故"这个技能

这可能是全网第一个用AI教"人情世故"的技能。

不是教你"要有礼貌"之类的废话。是具体到：
- 饭局座位怎么排，主位在哪，你该坐哪
- 敬酒的顺序、杯子高度、"以茶代酒"怎么说
- 抢买单的时机和节奏（什么时候坚持，什么时候让步）
- 送礼的禁忌（钟=终，梨=离，伞=散，四=死）
- 红包金额规则（带8，避4，金额反映关系远近）
- 职场潜规则（多请示多汇报、不要越级汇报、公开表扬私下批评）
- "考虑考虑"在中文里通常意味着"不行"

这些东西在哪本教材里？没有。但每个中国人都在真实场景里吃过这些亏。

**现在你可以让AI模拟这些场景，安全地练习。**

---

## 最火的学科：如何学AI？

现在所有人都想学AI，但绝大多数人的路径是错的。

我在项目里专门设计了一个AI素养框架，三层结构：

**第一层：AI使用者（所有人都需要）**
- 如何写有效的prompt
- 如何判断AI输出的正确性（AI会自信地胡说八道）
- 什么时候该用AI，什么时候不该

**第二层：AI增强工作者（大多数知识工作者需要）**
- 把AI整合到你的工作流程中
- 数据分析自动化
- 让AI辅助写作、编程、研究

**第三层：AI构建者（技术从业者）**
- 理解机器学习原理（不是背公式，是理解直觉）
- 微调模型
- 构建AI应用

**每一层都用Human Skill Tree的方法论来教——不是灌输知识，而是主动学习、间隔重复、在做中学。**

---

## 为什么要开源？

因为这个问题太大了，不是一个人能解决的。

全世界有70亿人需要在AI时代重新学习。每个国家的教育系统不同，每种文化的社交规则不同，每个行业需要的技能不同。

我一个人写了3个完整技能和28个框架。**但我需要你——无论你是教师、学生、家长、程序员、还是任何关心"人类如何学习"的人。**

项目地址：**[github.com/24kchengYe/human-skill-tree](https://github.com/24kchengYe/human-skill-tree)**

你可以：
- ⭐ Star 让更多人看到
- 提 Issue 建议新技能
- 直接贡献一个你擅长领域的 SKILL.md
- Fork 后改造成你自己的教学工具

MIT 开源协议，免费使用，永远开源。

---

## 安装（30秒）

```bash
# Claude Code
npx skills install 24kchengYe/human-skill-tree

# Cursor / Windsurf
# 复制 skills/ 目录到你的 .cursor/skills/

# ChatGPT / Gemini / DeepSeek
# 打开任意 SKILL.md，内容粘贴为 Custom Instructions
```

---

## 一个问题结尾

> AI通过Skill和MCP获得了操纵现实的专项能力。
> 那人类何去何从？如何学习？
> 成年的人类如何赶上，新生的人类如何开始？

这是我创建这个项目时的问题。也是留给你的问题。

欢迎来评论区讨论。

---

**参考文献：**
1. Kestin, G. et al. (2025). AI tutoring outperforms active learning. *Nature Scientific Reports*. doi:10.1038/s41598-025-97652-6
2. Dunlosky, J. et al. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest*, 14(1), 4-58.
3. Donoghue, G. M. & Hattie, J. A. C. (2021). A meta-analysis of ten learning techniques. *Frontiers in Education*. doi:10.3389/feduc.2021.657895
4. npj Science of Learning (2025). Systematic review of AI-powered ITS in K-12. doi:10.1038/s41539-025-00320-7
5. Oakley, B. (2014). *A Mind for Numbers*. TarcherPerigee.
6. Brown, P. C., Roediger, H. L., & McDaniel, M. A. (2014). *Make It Stick: The Science of Successful Learning*. Harvard University Press.

---

*作者：24kchengYe · [GitHub](https://github.com/24kchengYe) · 如果觉得有用，请给项目一个 ⭐*

*#AI教育 #认知科学 #人类技能树 #ChatGPT #Claude #AI学习 #终身学习 #开源教育*
