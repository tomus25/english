import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: chat, text: "Проверка связи ✔️" })
  });
  const data = await r.json();
  return new Response(JSON.stringify(data), { status: data.ok ? 200 : 500 });
}
