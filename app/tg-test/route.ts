// app/api/tg-test/route.ts
export const runtime = "nodejs";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat  = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_IDS;

  if (!token || !chat) {
    return new Response(JSON.stringify({ ok:false, error:"Missing envs" }), { status: 500 });
  }

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: chat,                     // для группы — numeric -100..., для канала можно @username
      text: "Проверка связи ✔️",
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
  const data = await r.json();
  return new Response(JSON.stringify(data), { status: data.ok ? 200 : 500 });
}
