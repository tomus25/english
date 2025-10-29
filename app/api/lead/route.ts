// app/api/lead/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
const RAW_CHAT  = (process.env.TELEGRAM_CHAT_ID   || "").trim();

// маппинг ключей целей → подписи (по желанию)
const GOAL_LABELS: Record<string,string> = {
  speaking: "Разговорный английский",
  travel:   "Для путешествий",
  career:   "Для карьеры / интервью",
  exam:     "IELTS / TOEFL / ОГЭ / ЕГЭ",
  school:   "Школьная программа",
  other:    "Другое",
};

function esc(s: unknown) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function toContactUrl(method: string, value: string) {
  const v = (value || "").trim();
  if (!v) return null;
  if (method === "telegram")  return `https://t.me/${v.replace(/^@/,"")}`;
  if (method === "instagram") return `https://instagram.com/${v.replace(/^@/,"")}`;
  if (method === "whatsapp")  return `https://wa.me/${v.replace(/[^\d]/g,"")}`;
  if (method === "email")     return `mailto:${v}`;
  return null;
}
async function resolveChatId(raw: string) {
  if (/^-?\d+$/.test(raw)) return raw; // уже numeric
  if (raw.startsWith("@")) {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${encodeURIComponent(raw)}`);
    const t = await r.text();
    let j:any=null; try { j = JSON.parse(t); } catch {}
    if (j?.ok && j?.result?.id) return String(j.result.id);
    throw new Error(`getChat failed for ${raw}: ${t}`);
  }
  throw new Error(`Bad TELEGRAM_CHAT_ID format: "${raw}"`);
}

export async function POST(req: Request) {
  try {
    if (!BOT_TOKEN || !RAW_CHAT) {
      return NextResponse.json({ ok:false, error:"Missing env TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID" }, { status: 500 });
    }

    const body = await req.json();
    const {
      studentName = "",
      goals = [],                   // string[]
      description = "",
      preferredMethod = "telegram",
      contact = "",
      email = "",
      budget = null,               // number|null
      currency = "",
      cookieConsent = null,        // true|false|null
    } = body ?? {};

    const CHAT_ID = await resolveChatId(RAW_CHAT);

    // человекочитаемые цели
    const goalsText =
      Array.isArray(goals) && goals.length
        ? goals.map((k: string) => GOAL_LABELS[k] || k).join(", ")
        : "—";

    const lines: string[] = [];
    lines.push(`<b>🧑‍🎓 Новая заявка</b>`);
    lines.push(`Имя: <b>${esc(studentName) || "—"}</b>`);
    lines.push(`Цели: ${esc(goalsText)}`);
    lines.push(`Описание: ${esc(description) || "—"}`);
    lines.push(`Связаться: <b>${esc(preferredMethod)}</b> — ${esc(contact || email) || "—"}`);
    lines.push(`Бюджет: ${budget !== null && budget !== "" ? `<b>${esc(budget)} ${esc(currency)}</b>` : "—"}`);
    lines.push(`Cookie consent: ${cookieConsent === true ? "✅" : cookieConsent === false ? "❌" : "—"}`);

    // кнопка "Связаться с учеником" (если можно построить URL)
    const studentUrl = toContactUrl(preferredMethod, contact || email);
    const replyMarkup = studentUrl ? { inline_keyboard: [[{ text: "Связаться с учеником", url: studentUrl }]] } : undefined;

    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });

    const raw = await resp.text();
    let json:any=null; try { json = JSON.parse(raw); } catch {}

    if (!resp.ok || !json?.ok) {
      console.error("sendMessage FAILED:", { status: resp.status, raw });
      return NextResponse.json({ ok:false, error: json?.description || raw || "Failed to send to Telegram" }, { status: 502 });
    }

    // (опционально) приложить lead.json
    // const form = new FormData();
    // form.append("chat_id", CHAT_ID);
    // form.append("document", new Blob([JSON.stringify(body, null, 2)], { type: "application/json" }), "lead.json");
    // await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: "POST", body: form });

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    console.error("API error:", e?.message || e);
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 500 });
  }
}
