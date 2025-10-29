// app/api/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; // чтобы точно был Node на Vercel

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID!;

function esc(s: unknown) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function contactUrl(method: string, contact: string) {
  const v = contact?.trim() || "";
  if (!v) return null;
  if (method === "telegram")  return `https://t.me/${v.replace(/^@/,"")}`;
  if (method === "instagram") return `https://instagram.com/${v.replace(/^@/,"")}`;
  if (method === "whatsapp")  return `https://wa.me/${v.replace(/[^\d]/g,"")}`;
  if (method === "email")     return `mailto:${v}`;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ ok:false, error:"Missing env TELEGRAM_*" }, { status: 500 });
    }

    const body = await req.json();
    // ТЫ теперь шлёшь только эти поля:
    const {
      studentName = "",
      description = "",
      preferredMethod = "telegram",
      contact = "",
      teacher = { name: "", telegram: "", group: "" },
    } = body ?? {};

    // Сборка текста
    const lines = [
      `<b>🧑‍🎓 Новая заявка</b>`,
      `Имя: <b>${esc(studentName) || "—"}</b>`,
      `Описание: ${esc(description) || "—"}`,
      `Связаться: <b>${esc(preferredMethod)}</b> — ${esc(contact) || "—"}`,
      "",
      `<b>👩‍🏫 Предложенный преподаватель</b>`,
      `Имя: <b>${esc(teacher?.name)}</b>`,
      teacher?.telegram ? `Telegram: ${esc(teacher.telegram)}` : "",
      teacher?.group    ? `Группа: ${esc(teacher.group)}`       : "",
    ].filter(Boolean);

    const keyboardRow: any[] = [];
    const cUrl = contactUrl(preferredMethod, contact);
    if (cUrl) keyboardRow.push({ text: "Связаться с учеником", url: cUrl });
    if (teacher?.telegram) keyboardRow.push({ text: "Преподаватель (TG)", url: `https://t.me/${String(teacher.telegram).replace(/^@/,"")}` });
    if (teacher?.group)    keyboardRow.push({ text: "Группа", url: String(teacher.group) });

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: keyboardRow.length ? { inline_keyboard: [keyboardRow] } : undefined,
      }),
    });

    const raw = await tgResp.text();
    let tgJson: any = null;
    try { tgJson = JSON.parse(raw); } catch {}

    if (!tgResp.ok || !tgJson?.ok) {
      console.error("Telegram sendMessage FAILED:", { status: tgResp.status, raw });
      return NextResponse.json({ ok:false, error: tgJson?.description || raw || "Failed to send to Telegram" }, { status: 502 });
    }

    return NextResponse.json({ ok:true });
  } catch (e: any) {
    console.error("API /api/lead error:", e);
    return NextResponse.json({ ok:false, error:"Server error" }, { status: 500 });
  }
}

// Временный пинг для диагностики (можно удалить после проверки)
/*
export async function GET() {
  const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: "ping from vercel" }),
  });
  const raw = await resp.text();
  return new NextResponse(raw, { status: resp.status, headers: { "Content-Type":"application/json" } });
}
*/
