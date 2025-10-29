import { NextResponse } from "next/server";
export const runtime = "nodejs";

const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
const RAW_CHAT  = (process.env.TELEGRAM_CHAT_ID   || "").trim();

function esc(s: unknown) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function resolveChatId(raw: string) {
  // Если уже числовой (-100...), вернём как есть
  if (/^-?\d+$/.test(raw)) return raw;
  // Если @username канала/супергруппы — спросим у Telegram
  if (raw.startsWith("@")) {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${encodeURIComponent(raw)}`);
    const t = await r.text();
    let j:any=null; try { j = JSON.parse(t); } catch {}
    if (j?.ok && j?.result?.id) return String(j.result.id);
    throw new Error(`getChat failed for ${raw}: ${t}`);
  }
  throw new Error(`Unsupported TELEGRAM_CHAT_ID format: "${raw}"`);
}

export async function POST(req: Request) {
  try {
    if (!BOT_TOKEN || !RAW_CHAT) {
      return NextResponse.json({ ok:false, error:"Missing env TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID" }, { status: 500 });
    }

    const { studentName = "", description = "", preferredMethod = "telegram", contact = "", teacher = { name:"", telegram:"", group:"" } } = await req.json();

    // 1) Разрешим @username → числовой id
    const CHAT_ID = await resolveChatId(RAW_CHAT);

    // 2) Сконструируем сообщение
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
    ].filter(Boolean).join("\n");

    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const raw = await resp.text();
    let json:any=null; try { json = JSON.parse(raw); } catch {}

    if (!resp.ok || !json?.ok) {
      console.error("sendMessage FAILED:", { status: resp.status, raw });
      return NextResponse.json({ ok:false, error: json?.description || raw || "Failed to send to Telegram" }, { status: 502 });
    }

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    console.error("API error:", e?.message || e);
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 500 });
  }
}
