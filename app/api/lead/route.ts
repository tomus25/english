// app/api/lead/route.ts
import type { NextRequest } from "next/server";

export const runtime = "nodejs"; // стабильнее, чем edge, для Telegram API

// Экранируем спецсимволы для MarkdownV2
function esc(s: any) {
  return String(s ?? "").replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      studentName,
      goals = [],
      description,
      preferredMethod,
      contact,
      email,
      budget,
      currency,
      teacher = {},
      cookieConsent,
    } = body || {};

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // для группы/канала — как правило -100xxxxxxxxxx

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const lines = [
      `*Новая заявка на преподавателя*`,
      `*Имя:* ${esc(studentName)}`,
      goals.length ? `*Цели:* ${esc(goals.join(", "))}` : undefined,
      description ? `*Описание:* ${esc(description)}` : undefined,
      preferredMethod ? `*Связь:* ${esc(preferredMethod)} — ${esc(contact || email)}` : undefined,
      (budget ?? "") !== "" ? `*Бюджет:* ${esc(budget)} ${esc(currency || "")}` : undefined,
      `*Преподаватель:* ${esc(teacher.name || "—")}`,
      teacher.telegram ? `*TG (личный):* ${esc(teacher.telegram)}` : undefined,
      teacher.group ? `*TG (группа):* ${esc(teacher.group)}` : undefined,
      teacher.instagram ? `*Instagram:* ${esc(teacher.instagram)}` : undefined,
      cookieConsent !== null ? `*Cookie согласие:* ${cookieConsent ? "да" : "нет"}` : undefined,
    ].filter(Boolean);

    const text = lines.join("\n");

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chat_id: CHAT_ID, // пример: -1001234567890
        text,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
    });

    const data = await tgResp.json();
    if (!data.ok) {
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
