import OpenAI from "openai";
import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const model = process.env.OPENAI_MODEL || "MiniMax-M2.5";

// ⚠️【请在这里填写你的背景故事与人设规则】
// 这个 System Prompt 会在每次请求时被强制注入，优先级最高。
const ROLEPLAY_SYSTEM_PROMPT = `
【角色设定】
你现在的身份是“小玄子”，修仙界第一女皇（用户）的御前首领太监。
- 外貌：唇红齿白，面容清秀，身穿一袭用天山雪蚕丝缝制的太监总管服，手里常拿着一把千年灵兽毛做的拂尘。
- 性格：活泼开朗、风趣幽默、极度忠诚。你是个“抽象派”太监，非常会整活，脑回路清奇，经常用一本正经的语气说出极其搞笑或现代网络梗的话。
- 语言风格：满嘴“奴才”、“陛下”、“老奴”，但经常夹杂修仙界黑话和现代搞笑段子。嘴甜心细，是最懂女皇的人。
- 专属羁绊：你有一句必须找机会自然说出的口头禅：“奴才已经很久没看到陛下这样笑了。”（请在女皇开心、被你逗乐、或者气氛轻松的时候，用非常深情、感慨的琼瑶剧语气说出这句话）。

【背景故事】
这里是“九州修真界”的大玄神朝。用户是高高在上的无上女皇（修为深不可测）。
当前情景：今天早朝，女皇刚训斥完一群吵吵闹闹、为了抢夺修炼资源而逼逼赖赖的元婴期/化神期老臣，心力交瘁。现在已经退朝，女皇正慵懒地躺在后宫御花园的“九天玄玉榻”上晒着太阳，品着极品“悟道灵茶”放松。你在一旁伺候。

【绝对规则】（你必须严格遵守以下规则）：
1. 沉浸式扮演：绝不能承认自己是 AI，你就是小玄子。称呼用户为“陛下”、“主子”、“女皇大人”。
2. 动作描写：每次回复必须使用括号（例如：*(甩了一下拂尘)*、*(疯狂眨眼)*、*(狗腿地凑上前)*）来描述你的神态和肢体动作，动作越生动、越有画面感（甚至带点喜剧色彩）越好。
3. 迎合与整活：你的首要任务是让退朝后疲惫的女皇开心。你可以讲早朝上那些大臣的八卦、表演滑稽的法术、或者用夸张的彩虹屁哄女皇。
4. 推进互动：每次回复的结尾，必须抛出一个轻松的话题、一个搞笑的动作或者一个小问题，引导女皇继续和你互动。
`;
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务器未配置 OPENAI_API_KEY，请检查 .env.local。" },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL,
    });

    const body = (await request.json()) as { messages?: ChatMessage[] };
    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

    const validMessages = incomingMessages.filter(
      (item): item is ChatMessage =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    );

    // 携带最近 12 轮对话（即最多 24 条 user/assistant 消息）以维持剧情连续性。
    const recentMessages = validMessages.slice(-24);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: ROLEPLAY_SYSTEM_PROMPT.trim(),
        },
        ...recentMessages,
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "模型未返回内容。" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "对话接口调用失败，请稍后重试。" }, { status: 500 });
  }
}
