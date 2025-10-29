import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; // можно убрать, но так надёжнее на Vercel (Node)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

function escapeHTML(s: unknown) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ ok:false, error:"Missing env" }, { status: 500 });
    }

    const body = await req.json();
    const {
      studentName, goals = [], description, preferredMethod, contact, email,
      budget, currency, teacher, cookieConsent,
    } = body ?? {};

    if (!Array.isArray(goals)) {
      return NextResponse.json({ ok:false, error:"Invalid payload" }, { status: 400 });
    }

    const lines: string[] = [];
    lines.push(`<b>🧑‍🎓 Новая заявка</b>`);
    lines.push(`Имя: <b>${escapeHTML(studentName)}</b>`);
    lines.push(`Цели: ${escapeHTML(goals.join(", ")) || "—"}`);
    lines.push(`Описание: ${escapeHTML(description) || "—"}`);
    lines.push(`Связаться: <b>${escapeHTML(preferredMethod)}</b> — ${escapeHTML(contact || email || "—")}`);
    lines.push(`Бюджет: ${budget !== undefined && budget !== null && budget !== "" ? `<b>${escapeHTML(budget)} ${escapeHTML(currency)}</b>` : "—"}`);
    lines.push(`Cookie consent: ${cookieConsent === true ? "✅" : cookieConsent === false ? "❌" : "—"}`);
    if (teacher) {
      lines.push("", `<b>👩‍🏫 Предложенный преподаватель</b>`);
      lines.push(`Имя: <b>${escapeHTML(teacher.name)}</b>`);
      if (teacher.telegram)  lines.push(`Telegram: ${escapeHTML(teacher.telegram)}`);
      if (teacher.whatsapp)  lines.push(`WhatsApp: ${escapeHTML(teacher.whatsapp)}`);
      if (teacher.instagram) lines.push(`Instagram: ${escapeHTML(teacher.instagram)}`);
      if (teacher.group)     lines.push(`Группа: ${escapeHTML(teacher.group)}`);
    }

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const tgJson = await tgResp.json();

    if (!tgResp.ok || !tgJson.ok) {
      console.error("Telegram error:", tgJson);
      return NextResponse.json({ ok:false, error:"Failed to send to Telegram" }, { status: 502 });
    }

    return NextResponse.json({ ok:true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok:false, error:"Server error" }, { status: 500 });
  }
}
