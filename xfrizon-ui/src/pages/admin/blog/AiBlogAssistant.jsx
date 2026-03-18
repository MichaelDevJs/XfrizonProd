import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  FaRobot,
  FaPen,
  FaSearch,
  FaComments,
  FaTrash,
  FaPaperPlane,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaBolt,
  FaRegCopy,
  FaPlus,
} from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_KEY_STORAGE = "xf_ai_openai_key";
const DEFAULT_BACKEND_AI_ENDPOINT = "/admin/ai/blog-assistant/chat";
const BACKEND_AI_ENDPOINT =
  import.meta.env.VITE_ADMIN_AI_CHAT_ENDPOINT?.trim() ||
  DEFAULT_BACKEND_AI_ENDPOINT;

const MODES = [
  {
    id: "write",
    label: "Write",
    icon: FaPen,
    color: "text-violet-400",
    activeBg: "bg-violet-500/20 border-violet-500/40",
    description: "Draft posts, outlines & copy",
  },
  {
    id: "research",
    label: "Research",
    icon: FaSearch,
    color: "text-sky-400",
    activeBg: "bg-sky-500/20 border-sky-500/40",
    description: "Explore topics & gather insights",
  },
  {
    id: "chat",
    label: "Q&A",
    icon: FaComments,
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/20 border-emerald-500/40",
    description: "Ask anything about content",
  },
];

const QUICK_PROMPTS = {
  write: [
    "Write a 500-word blog post about Afrobeats music trends",
    "Generate 5 catchy blog title ideas about electronic music festivals",
    "Create a detailed outline for a blog post about Amapiano",
    "Write an engaging intro for a summer music festival blog",
    "Draft a review for a live music event (fictional example)",
    "Write a listicle: '10 must-attend African music events this year'",
  ],
  research: [
    "What are the latest trends in live music events?",
    "Summarize the history of Afrobeats for a general audience",
    "Key statistics about global music festival attendance",
    "How has streaming changed live music culture?",
    "Top music events that shaped African pop culture",
    "What content performs best on music event blogs?",
  ],
  chat: [
    "How do I improve SEO for my music blog?",
    "What makes a great event recap post?",
    "How often should I publish blog posts?",
    "Tips for writing engaging artist spotlights",
    "How to grow a blog audience in the music niche",
    "What's the ideal blog post length for SEO?",
  ],
};

const SYSTEM_PROMPTS = {
  write: `You are an expert blog writer for Xfrizon — a platform dedicated to music events, Afrobeats, Amapiano, and live entertainment in Africa and the diaspora. 
Write engaging, well-structured blog content with clear headings, vivid language and authentic voice. 
When writing full posts, use markdown-style headings (## for H2, ### for H3) and make the content lively and culturally aware. 
Keep SEO in mind: naturally weave in relevant keywords and write compelling openings.`,

  research: `You are a research assistant for Xfrizon's music and events blog team. 
Help explore topics, synthesize information, surface interesting angles and provide cite-worthy insights that writers can use.
Be thorough, accurate and well-organized. Use bullet points and sections to structure your responses clearly.
Always note when information may need verification from primary sources.`,

  chat: `You are a helpful content strategy advisor for Xfrizon's blog admins.
Answer questions about blogging best practices, content strategy, SEO, audience growth, and music event coverage.
Be concise, actionable and practical. Give specific examples where helpful.`,
};

const WELCOME_MESSAGES = {
  write: "👋 I'm your AI writing assistant. Tell me what you'd like to write — a full blog post, headline ideas, an outline, or any piece of copy. Pick a quick prompt or type your own!",
  research: "🔍 I'm here to help you research topics for your blog. Ask me about trends, history, statistics, or any subject you want to explore before writing.",
  chat: "💬 Ask me anything about blogging, SEO, content strategy, or music event coverage. I'm here to help you build a better blog.",
};

// ─── Markdown renderer (simple) ───────────────────────────────────────────────

const AI_WRITER_MEMORY_STORAGE = "xfrizonAdminAiWriterMemoryV1";

const createDefaultMessagesByMode = () => ({
  write: [{ role: "assistant", content: WELCOME_MESSAGES.write }],
  research: [{ role: "assistant", content: WELCOME_MESSAGES.research }],
  chat: [{ role: "assistant", content: WELCOME_MESSAGES.chat }],
});

const createDefaultDraftsByMode = () => ({
  write: "",
  research: "",
  chat: "",
});

const sanitizeMessagesByMode = (raw) => {
  const defaults = createDefaultMessagesByMode();
  if (!raw || typeof raw !== "object") return defaults;

  const next = { ...defaults };
  MODES.forEach(({ id }) => {
    const list = Array.isArray(raw[id]) ? raw[id] : [];
    const cleaned = list
      .filter((item) => item && (item.role === "assistant" || item.role === "user"))
      .map((item) => ({
        role: item.role,
        content: String(item.content || "").slice(0, 8000),
      }))
      .filter((item) => item.content.trim().length > 0)
      .slice(-80);

    next[id] = cleaned.length > 0 ? cleaned : defaults[id];
  });

  return next;
};

const sanitizeDraftsByMode = (raw) => {
  const defaults = createDefaultDraftsByMode();
  if (!raw || typeof raw !== "object") return defaults;

  const next = { ...defaults };
  MODES.forEach(({ id }) => {
    next[id] = String(raw[id] || "").slice(0, 10000);
  });

  return next;
};

function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-zinc-100 mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-zinc-100 mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-base font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-300">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-zinc-300"><span class="text-zinc-400 text-xs mr-1">$1.</span>$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-zinc-800 text-violet-300 px-1 rounded text-xs">$1</code>')
    .replace(/\n{2,}/g, '</p><p class="mb-2 text-zinc-300 leading-relaxed">')
    .replace(/^(?!<[h|l|p])/gm, '')
    .trim();
}

function MessageContent({ content }) {
  const paragraphs = content.split(/\n{2,}/);
  return (
    <div className="text-xs leading-relaxed space-y-1">
      {paragraphs.map((para, i) => {
        const html = renderMarkdown(para);
        if (html.startsWith("<h") || html.startsWith("<li")) {
          return (
            <div
              key={i}
              dangerouslySetInnerHTML={{ __html: html }}
              className="text-zinc-300"
            />
          );
        }
        // Process inline code segments
        const segments = para.split(/(`[^`]+`)/);
        return (
          <p key={i} className="text-zinc-300 leading-relaxed">
            {segments.map((seg, j) => {
              if (seg.startsWith("`") && seg.endsWith("`")) {
                return (
                  <code key={j} className="bg-zinc-800 text-violet-300 px-1 rounded text-[11px]">
                    {seg.slice(1, -1)}
                  </code>
                );
              }
              // Strip simple markdown bold/italic markers for plain display
              return seg.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
            })}
          </p>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AiBlogAssistant({ onInsertContent }) {
  const [mode, setMode] = useState("write");
  const [messagesByMode, setMessagesByMode] = useState(() => createDefaultMessagesByMode());
  const [draftsByMode, setDraftsByMode] = useState(() => createDefaultDraftsByMode());
  const [isLoading, setIsLoading] = useState(false);

  // Quick prompts panel
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Manual API key for local dev testing
  const [manualApiKey, setManualApiKey] = useState("");
  const [showManualKeyInput, setShowManualKeyInput] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const messages = messagesByMode[mode] || createDefaultMessagesByMode()[mode];
  const input = draftsByMode[mode] || "";

  const setModeMessages = useCallback((nextValue, targetMode = mode) => {
    setMessagesByMode((prev) => {
      const base = prev[targetMode] || createDefaultMessagesByMode()[targetMode];
      const nextMessages = typeof nextValue === "function" ? nextValue(base) : nextValue;
      return {
        ...prev,
        [targetMode]: Array.isArray(nextMessages) ? nextMessages : base,
      };
    });
  }, [mode]);

  const setModeInput = useCallback((nextValue, targetMode = mode) => {
    setDraftsByMode((prev) => ({
      ...prev,
      [targetMode]: String(nextValue ?? ""),
    }));
  }, [mode]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Security hardening: remove any legacy key that may have been stored in browser.
  useEffect(() => {
    try {
      if (localStorage.getItem(API_KEY_STORAGE)) {
        localStorage.removeItem(API_KEY_STORAGE);
        toast.info("Local API key removed. AI now routes securely through backend.");
      }
    } catch {
      // Ignore localStorage access issues.
    }
  }, []);

  // Restore persisted AI writer memory for this page.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_WRITER_MEMORY_STORAGE);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed?.mode && MODES.some((m) => m.id === parsed.mode)) {
        setMode(parsed.mode);
      }
      setMessagesByMode(sanitizeMessagesByMode(parsed?.messagesByMode));
      setDraftsByMode(sanitizeDraftsByMode(parsed?.draftsByMode));
      if (typeof parsed?.showQuickPrompts === "boolean") {
        setShowQuickPrompts(parsed.showQuickPrompts);
      }
    } catch {
      // Ignore invalid persisted memory payload.
    }
  }, []);

  // Persist drafts and conversation memory for this page.
  useEffect(() => {
    try {
      const payload = {
        mode,
        messagesByMode,
        draftsByMode,
        showQuickPrompts,
      };
      localStorage.setItem(AI_WRITER_MEMORY_STORAGE, JSON.stringify(payload));
    } catch {
      // Ignore storage failures.
    }
  }, [mode, messagesByMode, draftsByMode, showQuickPrompts]);

  const switchMode = (newMode) => {
    setMode(newMode);
    inputRef.current?.focus();
  };

  const postAiWithRetry = async (payload) => {
    const maxAttempts = 2;
    const timeoutMs = 70000;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await api.post(BACKEND_AI_ENDPOINT, payload, { timeout: timeoutMs });
      } catch (error) {
        lastError = error;
        const code = String(error?.code || "").toUpperCase();
        const message = String(error?.message || "").toLowerCase();
        const isTimeout = code === "ECONNABORTED" || message.includes("timeout");

        if (!isTimeout || attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw lastError;
  };

  // Send message via backend AI route or direct OpenAI (if manual key provided)
  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || isLoading) return;

      const userMsg = { role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setModeMessages(updatedMessages, mode);
      setModeInput("", mode);
      setIsLoading(true);

      try {
        // If manual API key provided, call OpenAI directly
        if (manualApiKey.trim()) {
          const openaiPayload = {
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPTS[mode] },
              ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            ],
            max_tokens: 2000,
            temperature: 0.72,
          };

          const directRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${manualApiKey.trim()}`,
            },
            body: JSON.stringify(openaiPayload),
          });

          if (!directRes.ok) {
            const errData = await directRes.json();
            const errorMsg = errData?.error?.message || `HTTP ${directRes.status}`;
            throw new Error(errorMsg);
          }

          const directData = await directRes.json();
          const reply = directData?.choices?.[0]?.message?.content?.trim() || "No response received.";
          setModeMessages((prev) => [...prev, { role: "assistant", content: reply }], mode);
        } else {
          // Use backend route
          const payload = {
            mode,
            userMessage: text,
            messages: [
              { role: "system", content: SYSTEM_PROMPTS[mode] },
              ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            ],
            maxTokens: 2000,
            temperature: 0.72,
          };

          const res = await postAiWithRetry(payload);
          const data = res?.data || {};
          const payloadData = data?.data || {};
          const reply =
            payloadData.reply?.trim() ||
            data.reply?.trim() ||
            data.message?.trim() ||
            data.choices?.[0]?.message?.content?.trim() ||
            "No response received.";
          setModeMessages((prev) => [...prev, { role: "assistant", content: reply }], mode);
        }
      } catch (err) {
        console.error("AI request failed:", err);
        const statusCode = err?.response?.status;
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Request failed";

        let hint = "Please check backend AI configuration and try again.";
        if (statusCode === 429 || errorMsg.toLowerCase().includes("rate limit")) {
          hint = "OpenAI rate limit hit. Wait a minute and try again, or use a key/project with higher quota.";
        } else if (statusCode === 503 || errorMsg.includes("OPENAI_API_KEY")) {
          hint = "Backend is missing OPENAI_API_KEY in the running environment.";
        } else if (
          String(err?.code || "").toUpperCase() === "ECONNABORTED" ||
          errorMsg.toLowerCase().includes("timeout")
        ) {
          hint = "AI generation timed out. The app now retries once automatically; if it still fails, reduce prompt length or check backend/API latency.";
        } else if (errorMsg.toLowerCase().includes("authentication")) {
          hint = manualApiKey.trim()
            ? "The manual API key may be invalid or revoked. Check your key at platform.openai.com."
            : "The backend key may be invalid or revoked. Regenerate the key and restart backend.";
        }

        toast.error(errorMsg);
        setModeMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${errorMsg}\n\n${hint}`,
          },
        ], mode);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, manualApiKey, messages, mode, setModeInput, setModeMessages]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const insertIntoEditor = (content) => {
    if (onInsertContent) {
      onInsertContent(content);
      toast.success("Content sent to editor");
    } else {
      copyMessage(content);
    }
  };

  const clearChat = () => {
    setModeMessages([{ role: "assistant", content: WELCOME_MESSAGES[mode] }], mode);
    setModeInput("", mode);
  };

  const activeMode = MODES.find((m) => m.id === mode);

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full min-h-150">
      {/* ── Left Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-full lg:w-56 xl:w-60 shrink-0 flex flex-col gap-3">
        {/* Mode Selector */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 pl-1">
            Mode
          </p>
          <div className="flex flex-col gap-1.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    isActive
                      ? `${m.activeBg} text-white`
                      : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`mt-0.5 shrink-0 text-xs ${isActive ? m.color : ""}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{m.label}</p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 hidden sm:block lg:block">
                      {m.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 pl-1">
            Security
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-400 mb-3">
            AI requests are routed through backend so API keys stay server-side.
          </p>
          
          {/* Manual Key Input for Dev */}
          <button
            onClick={() => setShowManualKeyInput((v) => !v)}
            className="w-full text-left px-2 py-1.5 text-[10px] rounded bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-700 text-zinc-300 transition-colors"
          >
            {showManualKeyInput ? "Hide" : "Show"} DEV: Manual Key
          </button>
          
          {showManualKeyInput && (
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <input
                type="password"
                value={manualApiKey}
                onChange={(e) => setManualApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-2 py-1.5 text-[10px] bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <p className="text-[9px] text-zinc-500 mt-1.5">
                Enter your OpenAI API key to bypass backend routing. Used only in this session.
              </p>
              {manualApiKey && (
                <div className="mt-1.5 text-[9px] text-emerald-400">
                  ✓ Using manual key (direct OpenAI)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
          <button
            onClick={() => setShowQuickPrompts((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
          >
            <span className="flex items-center gap-2 text-xs">
              <FaBolt className={`text-[10px] ${activeMode?.color}`} />
              Quick Prompts
            </span>
            {showQuickPrompts ? (
              <FaChevronUp className="text-[10px]" />
            ) : (
              <FaChevronDown className="text-[10px]" />
            )}
          </button>

          {showQuickPrompts && (
            <div className="flex flex-col gap-1 px-2 pb-2 border-t border-zinc-800 pt-2 overflow-y-auto">
              {QUICK_PROMPTS[mode].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="text-left text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 px-2 py-1.5 rounded-lg transition-colors leading-snug disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              mode === "write" ? "bg-violet-500/20" :
              mode === "research" ? "bg-sky-500/20" : "bg-emerald-500/20"
            }`}>
              <FaRobot className={`text-xs ${activeMode?.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-100">
                AI {activeMode?.label === "Q&A" ? "Q&A" : activeMode?.label + " Assistant"}
              </p>
              <p className="text-[10px] text-zinc-500">
                {messages.length > 1 ? `${messages.length - 1} exchange${messages.length > 2 ? "s" : ""}` : "New conversation"} · {manualApiKey.trim() ? "🔑 Direct" : "Backend routed"}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-[10px] transition-colors px-2 py-1 hover:bg-zinc-900 rounded-lg"
          >
            <FaTrash className="text-[10px]" />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                  msg.role === "user"
                    ? "bg-zinc-700 text-zinc-300"
                    : mode === "write" ? "bg-violet-500/30 text-violet-300"
                    : mode === "research" ? "bg-sky-500/30 text-sky-300"
                    : "bg-emerald-500/30 text-emerald-300"
                }`}
              >
                {msg.role === "user" ? "A" : <FaRobot className="text-[9px]" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2.5 group relative ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-zinc-900 border border-zinc-800"
                }`}
              >
                <MessageContent content={msg.content} />

                {/* Action buttons on AI messages */}
                {msg.role === "assistant" && idx > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <FaRegCopy className="text-[9px]" />
                      Copy
                    </button>
                    {onInsertContent && (
                      <button
                        onClick={() => insertIntoEditor(msg.content)}
                        className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 px-1.5 py-0.5 rounded hover:bg-violet-500/10 transition-colors"
                      >
                        <FaPlus className="text-[9px]" />
                        Use in editor
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2.5 flex-row">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5 ${
                mode === "write" ? "bg-violet-500/30 text-violet-300"
                : mode === "research" ? "bg-sky-500/30 text-sky-300"
                : "bg-emerald-500/30 text-emerald-300"
              }`}>
                <FaRobot className="text-[9px]" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-zinc-800 p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setModeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "write"
                  ? "Describe the blog post you'd like to write..."
                  : mode === "research"
                  ? "What topic would you like to research?"
                  : "Ask a question about blogging or content..."
              }
              rows={2}
              disabled={isLoading}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className={`shrink-0 w-10 h-10 self-end rounded-xl flex items-center justify-center transition-all ${
                isLoading || !input.trim()
                  ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  : mode === "write"
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : mode === "research"
                  ? "bg-sky-600 hover:bg-sky-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isLoading ? (
                <FaSpinner className="text-xs animate-spin" />
              ) : (
                <FaPaperPlane className="text-xs" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5 pl-1">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}






