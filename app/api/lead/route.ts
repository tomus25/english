// app/api/lead/route.ts
import type { NextRequest } from "next/server";
export const runtime = "nodejs";

// Экраним под parse_mode: "HTML"
function escHTML(s: any) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Универсальная отправка: поддерживает ОДИН или НЕСКОЛЬКО чат-ид (через TELEGRAM_CHAT_IDS)
async function sendToTelegram(token: string, chatIds: string[], textHTML: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const results: any[] = [];
  for (const chat_id of chatIds) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chat_id,                 // для группы — numeric -100..., для канала можно @username
        text: textHTML,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    results.push(await r.json());
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // берём минимальные поля (как вы просили)
    const {
      studentName = "",
      description = "",
      preferredMethod = "",
      contact = "",
      teacher = {},
    } = body || {};

    // ENV: можно задать ОДИН чат (TELEGRAM_CHAT_ID) или НЕСКОЛЬКО (TELEGRAM_CHAT_IDS="id1,id2,@channel")
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
    const CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (!BOT_TOKEN || CHAT_IDS.length === 0) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID(S) in Vercel env. Add and redeploy."
      }), { status: 500, headers: { "Content-Type": "application/json" }});
    }

    const lines: string[] = [];
    lines.push(`<b>Новая заявка на преподавателя</b>`);
    if (studentName)     lines.push(`<b>Имя:</b> ${escHTML(studentName)}`);
    if (preferredMethod) lines.push(`<b>Связь:</b> ${escHTML(preferredMethod)} — ${escHTML(contact)}`);
    if (description)     lines.push(`<b>Описание:</b> ${escHTML(description)}`);
    if (teacher?.name)   lines.push(`<b>Преподаватель:</b> ${escHTML(teacher.name)}`);
    if (teacher?.telegram) lines.push(`<b>TG (личный):</b> ${escHTML(teacher.telegram)}`);
    if (teacher?.group)    lines.push(`<b>TG (группа):</b> ${escHTML(teacher.group)}`);

    const results = await sendToTelegram(BOT_TOKEN, CHAT_IDS, lines.join("\n"));
    const anyOk = results.some(r => r?.ok);

    // ВСЕГДА возвращаем подробности от Telegram — вы увидите их в Network → Response
    if (!anyOk) {
      return new Response(JSON.stringify({ ok: false, error: results }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok:false, error: String(e?.message || e) }), {
      status: 500, headers: { "Content-Type":"application/json" }
    });
  }
}
