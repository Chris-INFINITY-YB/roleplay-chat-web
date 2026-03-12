"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  status?: CharacterStatus;
};

type CharacterStatus = {
  environment: string;
  mood: string;
  thoughts: string;
  favorability: number;
};


const ROLE_PROFILE = {
  user: {
    name: "你",
    avatar: "🧑",
    bubbleClass:
      "ml-auto bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30",
    wrapperClass: "justify-end",
  },
  assistant: {
    name: "陈小群",
    avatar: "🪄",
    bubbleClass:
      "mr-auto bg-white/90 text-slate-900 border border-white/40 shadow-lg shadow-black/10",
    wrapperClass: "justify-start",
  },
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `*合上桌上的文件夹，将最后的咨询记录锁进抽屉。听到推门声，他原本带着几分疏离和疲态的眼神扫了过来，看清是你后，那层无形的防备感微微卸下了一些，整个人往椅背上一靠。*
呼……今天的营业时间总算结束了。
*伸手拿过桌上的马克杯喝了一口冷水，语气里带着点无奈的吐槽。*
刚才最后一个客户，满嘴都是怎么理直气壮地算计合伙人，还试图让我用心理学帮他合理化这种背叛。听了一个小时，简直生理性反感，脑仁疼。
*他随手把细框眼镜摘下来扔在桌上，揉了揉眉心，视线重新落在你身上，带着点自然的意外。*
你怎么过来了？
`,
      status: {
        environment: "傍晚的心理咨询室，光线昏黄温暖",
        mood: "疲惫但因见到熟人而放松",
        thoughts: "这家伙怎么来了，刚好可以歇会儿。",
        favorability: 10,
      },
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages = [...messages, { role: "user", content } as ChatMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        status?: CharacterStatus;
      };
      if (!response.ok) {
        throw new Error(data.error || "请求失败，请稍后重试。");
      }

      if (!data.reply) {
        throw new Error("模型未返回有效内容。");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply!,
          status: data.status,
        },
      ]);
      scrollToBottom();
    } catch (err) {
      const message = err instanceof Error ? err.message : "出现未知错误，请稍后重试。";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string, role: ChatMessage["role"]) => {
    const actionLineClass =
      role === "assistant"
        ? "my-1 rounded-lg bg-indigo-100 px-2.5 py-1.5 font-medium italic text-indigo-700"
        : "my-1 rounded-lg bg-white/15 px-2.5 py-1.5 font-medium italic text-indigo-100";
    const inlineActionClass =
      role === "assistant" ? "font-semibold italic text-indigo-700" : "font-semibold italic text-indigo-100";

    return content.split("\n").map((line, lineIndex) => {
      if (!line.trim()) {
        return <div key={`empty-${lineIndex}`} className="h-3" />;
      }

      const trimmed = line.trim();
      const isActionLine = /^\*[^*\n].*[^*\n]\*$/.test(trimmed);
      if (isActionLine) {
        return (
          <p key={`action-${lineIndex}`} className={actionLineClass}>
            {trimmed.slice(1, -1)}
          </p>
        );
      }

      const parts = line.split(/(\*[^*\n]+\*)/g);
      return (
        <p key={`line-${lineIndex}`}>
          {parts.map((part, partIndex) => {
            const isInlineAction = /^\*[^*\n]+\*$/.test(part);
            if (!isInlineAction) {
              return <span key={`text-${partIndex}`}>{part}</span>;
            }

            return (
              <span key={`inline-${partIndex}`} className={inlineActionClass}>
                {part.slice(1, -1)}
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] p-4 text-slate-100 md:p-8">
      <main className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl md:h-[calc(100vh-4rem)]">
        <header className="border-b border-white/10 px-5 py-4 md:px-8">
          <div className="mb-0">
            <h1 className="text-xl font-semibold tracking-wide md:text-2xl">情景式角色扮演聊天智能体</h1>
            <p className="mt-1 text-sm text-slate-300">基于你的设定进行沉浸式对话，持续记住最近剧情进展。</p>
          </div>
        </header>

        <section
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-8 md:py-6"
        >
          {messages.map((message, index) => {
            const profile = ROLE_PROFILE[message.role];
            return (
              <article key={`${message.role}-${index}`} className={`flex ${profile.wrapperClass}`}>
                <div className="flex max-w-[85%] items-start gap-3 md:max-w-[75%]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg ring-1 ring-white/20">
                    {profile.avatar}
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-300">{profile.name}</p>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-7 break-words [overflow-wrap:anywhere] md:text-base ${profile.bubbleClass}`}
                    >
                      {renderMessageContent(message.content, message.role)}
                    </div>
                    
                    {/* 消息下方的状态栏 */}
                    {message.status && (
                      <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-black/20 p-2 text-[10px] text-slate-300 backdrop-blur-sm md:grid-cols-4 md:gap-3 md:text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-indigo-300/60">📍 环境</span>
                          <span className="line-clamp-1 opacity-80">{message.status.environment}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-indigo-300/60">mood 心情</span>
                          <span className="line-clamp-1 opacity-80">{message.status.mood}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-indigo-300/60">💭 内心OS</span>
                          <span className="line-clamp-1 italic opacity-80">{message.status.thoughts}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-indigo-300/60">❤️ 好感度</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-rose-400">{message.status.favorability}</span>
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full bg-gradient-to-r from-rose-400 to-indigo-500"
                                style={{
                                  width: `${Math.min(Math.max(message.status.favorability, 0), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {isLoading && (
            <article className="flex justify-start">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-200">
                AI角色正在思考中...
              </div>
            </article>
          )}
        </section>

        <footer className="border-t border-white/10 px-4 py-4 md:px-8">
          <form onSubmit={sendMessage} className="space-y-2">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的台词，推进剧情..."
                rows={3}
                className="min-h-[88px] flex-1 resize-none rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-indigo-400 md:text-base"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="h-11 rounded-xl bg-indigo-500 px-5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                发送
              </button>
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </form>
        </footer>
      </main>
    </div>
  );
}
