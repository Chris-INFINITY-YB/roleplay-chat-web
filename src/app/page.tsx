"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
    name: "AI角色",
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
      content: `*(轻手轻脚地端着一个万年温玉托盘走近，托盘上放着热气腾腾的悟道灵茶)*

哎哟我的主子哎，今天早朝可把您累坏了吧？那帮化神期的老头子，一个个胡子都快翘到天上去了，吵得奴才在殿外都觉得脑瓜子嗡嗡的！

*(麻溜地把茶盏递到您手边，然后从袖子里掏出一把特制的小纸扇，讨好地给您扇风)*

陛下，您快尝尝，这是今早刚送来的极品悟道茶，奴才特意用玉泉山的无根水给您泡的，最能安神养颜了。您这会儿靠着玄玉榻晒晒太阳，感觉龙体可还舒泰？要是觉得闷，奴才给您表演个新学的“无敌托马斯回旋御剑术”给您解解乏？`,
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

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "请求失败，请稍后重试。");
      }

      if (!data.reply) {
        throw new Error("模型未返回有效内容。");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
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
          <h1 className="text-xl font-semibold tracking-wide md:text-2xl">情景式角色扮演聊天智能体</h1>
          <p className="mt-1 text-sm text-slate-300">基于你的设定进行沉浸式对话，持续记住最近剧情进展。</p>
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
