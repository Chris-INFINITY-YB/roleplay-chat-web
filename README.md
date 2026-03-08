# 情景式角色扮演聊天智能体

基于 Next.js App Router + React + Tailwind CSS 构建，后端通过 OpenAI 兼容接口实现角色对话。

## 1. 配置环境变量

1. 复制模板文件：

```bash
cp .env.local.example .env.local
```

2. 按需填写 `.env.local`：

```env
OPENAI_API_KEY=你的密钥
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

## 2. 配置背景故事与人设

请打开 `src/app/api/chat/route.ts`，找到 `ROLEPLAY_SYSTEM_PROMPT` 常量，并把你的背景故事、人设规则、世界观约束写进去。

## 3. 本地启动

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000` 即可开始聊天。

## 4. 当前实现要点

- 每次请求都会强制注入 System Prompt。
- temperature 固定为 `0.7`，保持创造力并减少过度发散。
- 默认携带最近 `12` 轮（最多 `24` 条）上下文消息，保证剧情连续性。
