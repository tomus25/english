// pages/api/lead.ts
import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  try {
    if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok:false, error:"Missing env TELEGRAM_*" });

    const {
      studentName = "",
      description = "",
      preferredMethod = "telegram",
      contact = "",
      teacher = { name: "", telegram: "", group: "" },
    } = req.body ?? {};

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

    const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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

    const raw = await tg.text();
    let json: any = null;
    try { json = JSON.parse(raw); } catch {}

    if (!tg.ok || !json?.ok) {
      console.error("Telegram sendMessage FAILED:", { status: tg.status, raw });
      return res.status(502).json({ ok:false, error: json?.description || raw || "Failed to send to Telegram" });
    }

    return res.status(200).json({ ok:true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok:false, error:"Server error" });
  }
}
