import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// Простая экранизация для parse_mode: "HTML"
function escapeHTML(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Мягкая валидация
    const {
      studentName,
      goals,
      description,
      preferredMethod,
      contact,
      email,
      budget,
      currency,
      teacher,
      cookieConsent,
      // можно добавить ip/ua из заголовков, если нужно
    } = body ?? {};

    if (!Array.isArray(goals)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    // Собираем текст для Telegram
    const lines: string[] = [];
    lines.push(`<b>🧑‍🎓 Новая заявка</b>`);
    lines.push(`Имя: <b>${escapeHTML(studentName)}</b>`);
    lines.push(`Цели: ${escapeHTML(goals.join(", ")) || "—"}`);
    lines.push(`Описание: ${escapeHTML(description) || "—"}`);
    lines.push(`Связаться: <b>${escapeHTML(preferredMethod)}</b> — ${escapeHTML(contact || email || "—")}`);
    lines.push(`Бюджет: ${budget != null && budget !== "" ? `<b>${escapeHTML(budget)} ${escapeHTML(currency)}</b>` : "—"}`);
    lines.push(`Cookie consent: ${cookieConsent === true ? "✅" : cookieConsent === false ? "❌" : "—"}`);
    if (teacher) {
      lines.push("");
      lines.push(`<b>👩‍🏫 Предложенный преподаватель</b>`);
      lines.push(`Имя: <b>${escapeHTML(teacher.name)}</b>`);
      if (teacher.telegram) lines.push(`Telegram: ${escapeHTML(teacher.telegram)}`);
      if (teacher.whatsapp) lines.push(`WhatsApp: ${escapeHTML(teacher.whatsapp)}`);
      if (teacher.instagram) lines.push(`Instagram: ${escapeHTML(teacher.instagram)}`);
      if (teacher.group) lines.push(`Группа: ${escapeHTML(teacher.group)}`);
    }

    const text = lines.join("\n");

    // Отправляем в Telegram
    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        // Можно добавить inline-кнопки для быстрого контакта
        reply_markup: {
          inline_keyboard: [
            preferredMethod === "telegram" && contact
              ? [{ text: "Написать в Telegram", url: `https://t.me/${String(contact).replace(/^@/, "")}` }]
              : null,
            preferredMethod === "instagram" && contact
              ? [{ text: "Открыть Instagram", url: `https://instagram.com/${String(contact).replace(/^@/, "")}` }]
              : null,
            preferredMethod === "whatsapp" && contact
              ? [{ text: "Написать в WhatsApp", url: `https://wa.me/${String(contact).replace(/[^\d]/g, "")}` }]
              : null,
            preferredMethod === "email" && email
              ? [{ text: "Написать письмо", url: `mailto:${email}` }]
              : null,
          ].filter(Boolean),
        },
        disable_web_page_preview: true,
      }),
    });

    const tgJson = await tgResp.json();

    if (!tgResp.ok || !tgJson.ok) {
      console.error("Telegram error:", tgJson);
      return NextResponse.json({ ok: false, error: "Failed to send to Telegram" }, { status: 502 });
    }

    // (Опционально) здесь же можешь сохранить в БД/CRM
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
