// app/api/tg-test/route.ts
export const runtime = "nodejs";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = (process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "").trim();

  if (!token || !chats) {
    return new Response(JSON.stringify({ ok:false, error:"Missing envs" }), { status: 500 });
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const r = await fetch(url, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: chats,                        // можно -100..., можно @public_channel
      text: "Проверка связи ✔️",
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
  const data = await r.json();
  return new Response(JSON.stringify(data), { status: data.ok ? 200 : 500 });
}
