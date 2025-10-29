// app/api/lead/route.ts
import type { NextRequest } from "next/server";
export const runtime = "nodejs";

// Безопасное экранирование под HTML parse_mode
function escHTML(s: any) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function sendToTelegram(token: string, chatIds: string[], textHTML: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const results: any[] = [];
  for (const chat_id of chatIds) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ chat_id, text: textHTML, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    results.push(await resp.json());
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName, goals = [], description, preferredMethod, contact, email,
      budget, currency, teacher = {}, cookieConsent,
    } = body || {};

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    // Можно указать несколько получателей через TELEGRAM_CHAT_IDS="id1,id2,@channel"
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
    const CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || CHAT_ID).split(",").map(s=>s.trim()).filter(Boolean);

    if (!BOT_TOKEN || CHAT_IDS.length === 0) {
      return new Response(JSON.stringify({
        ok:false, error:"Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID(S)"
      }), { status: 500, headers: { "Content-Type":"application/json" }});
    }

    const lines: string[] = [];
    lines.push(`<b>Новая заявка на преподавателя</b>`);
    if (studentName) lines.push(`<b>Имя:</b> ${escHTML(studentName)}`);
    if (goals.length) lines.push(`<b>Цели:</b> ${escHTML(goals.join(", "))}`);
    if (description) lines.push(`<b>Описание:</b> ${escHTML(description)}`);
    if (preferredMethod) lines.push(`<b>Связь:</b> ${escHTML(preferredMethod)} — ${escHTML(contact || email)}`);
    if ((budget ?? "") !== "") lines.push(`<b>Бюджет:</b> ${escHTML(budget)} ${escHTML(currency || "")}`);
    lines.push(`<b>Преподаватель:</b> ${escHTML(teacher?.name || "—")}`);
    if (teacher?.telegram) lines.push(`<b>TG (личный):</b> ${escHTML(teacher.telegram)}`);
    if (teacher?.group)    lines.push(`<b>TG (группа):</b> ${escHTML(teacher.group)}`);
    if (teacher?.instagram)lines.push(`<b>Instagram:</b> ${escHTML(teacher.instagram)}`);
    if (cookieConsent !== null && cookieConsent !== undefined)
      lines.push(`<b>Cookie согласие:</b> ${cookieConsent ? "да" : "нет"}`);

    const results = await sendToTelegram(BOT_TOKEN, CHAT_IDS, lines.join("\n"));
    const anyOk = results.some(r => r?.ok);
    if (!anyOk) {
      // вернём подробности — будет видно в Network → Response
      return new Response(JSON.stringify({ ok:false, error:results }), {
        status: 500, headers: { "Content-Type":"application/json" }
      });
    }
    return new Response(JSON.stringify({ ok:true, results }), { status: 200, headers: { "Content-Type":"application/json" }});
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message || e) }), {
      status: 500, headers: { "Content-Type":"application/json" }
    });
  }
}
