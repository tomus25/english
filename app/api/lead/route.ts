import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  if (!token || !chatId) {
    return NextResponse.json({ ok: false, error: "Missing Telegram env" }, { status: 500 });
  }

  const goals = (body.goals || []).map((g: string) => `• ${g}`).join('\n');
  const budgetLine = body.budget ? `💵 Бюджет: ${body.budget} ${body.currency || ""}\n` : "";

  const text =
    `✨ *Новая заявка на английский*\n\n` +
    `👤 Имя: ${body.studentName || "-"}\n` +
    `📝 Описание: ${body.description || "-"}\n` +
    `📲 Связаться через: ${body.preferredMethod} → ${body.contact || body.email || "-"}\n` +
    budgetLine +
    `\n⭐ Преподаватель: ${body.teacher?.name || "-"}\n` +
    `TG: ${body.teacher?.telegram || "-"}\n` +
    `WA: ${body.teacher?.whatsapp || "-"}\n` +
    `IG: ${body.teacher?.instagram || "-"}\n` +
    (goals ? `\n🎯 Цели:\n${goals}` : "");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });

  return NextResponse.json({ ok: true });
}
