'use client';

"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Rocket, Check, Star, Instagram, Send, Phone, X } from "lucide-react";

// ---- Встроенные минимальные UI-компоненты (чтобы не было Module not found) ----
// Button
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};
function Button({ className = "", variant = "default", size = "md", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition active:scale-[0.98]";
  const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants: Record<string, string> = {
    default: "bg-black text-white hover:bg-black/90",
    outline: "border border-slate-300 bg-white hover:bg-slate-50",
    ghost: "hover:bg-slate-100"
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
}
// Card
function Card(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`rounded-2xl border bg-white ${props.className||""}`} />; }
function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`p-6 ${props.className||""}`} />; }
function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 {...props} className={`text-xl font-semibold ${props.className||""}`} />; }
function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>) { return <p {...props} className={`text-sm text-muted-foreground ${props.className||""}`} />; }
function CardContent(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`p-6 ${props.className||""}`} />; }
function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`p-6 pt-0 ${props.className||""}`} />; }
// Input
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 ${props.className||""}`} />;
}
// Textarea
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 ${props.className||""}`} />;
}
// Checkbox
type CheckboxProps = { checked?: boolean; onCheckedChange?: (checked: boolean)=>void } & Omit<React.InputHTMLAttributes<HTMLInputElement>,"type"|"onChange">;
function Checkbox({checked, onCheckedChange, ...rest}: CheckboxProps) {
  return <input type="checkbox" checked={!!checked} onChange={(e)=>onCheckedChange?.(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-black" {...rest}/>;
}
// Badge (поддержка variant="outline")
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" };
function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  const variants: Record<string, string> = {
    default: "border border-slate-200 bg-slate-50",
    outline: "border border-slate-300 bg-transparent",
  };
  return <span {...props} className={`${base} ${variants[variant]} ${className}`} />;
}
// Separator
function Separator(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`h-px w-full bg-slate-200 ${props.className||""}`} />; }

// ------------------------------------------------------------
// Лендинг: «Найди своего идеального преподавателя английского»
// Технологии: React + Tailwind + shadcn/ui + Framer Motion
// ------------------------------------------------------------
// Политика конфиденциальности и соответствие требованиям Facebook Ads:
//  - На странице реализована публичная политика (модалка + якорь #privacy),
//    доступная по ссылке вида https://ваш-домен/#privacy — это подходит для модерации Meta.
//  - Добавлен чекбокс явного согласия на обработку персональных данных (обязателен для отправки формы).
//  - Добавлен баннер cookie-согласия (для пикселя/UTM — включите по необходимости).
//  - В тексте политики указаны: какие данные собираем, цели, основания, срок хранения, права пользователя,
//    внешние получатели (Telegram Bot API, WhatsApp, Instagram), контакты ответственного лица.
//  - Замените значения в блоке ПАРАМЕТРЫ ПОЛИТИКИ ниже под себя.
// ------------------------------------------------------------

// >>> ПАРАМЕТРЫ ПОЛИТИКИ (заполните!) <<<
const CONTROLLER_NAME = "FindYourTeacher / Индивидуальный предприниматель (пример)";
const BUSINESS_ADDRESS = "Город, страна (адрес)";
const CONTACT_EMAIL = "info@example.com"; // укажите рабочую почту для обращения по данным
const CONTACT_TELEGRAM = "@your_support"; // поддержка/контакт
const DATA_RETENTION_DAYS = 365; // срок хранения заявок, дней

// ВСПОМОГАТЕЛЬНО: форматируем ссылку WhatsApp и Telegram
function formatWhatsAppHref(num: string | undefined) {
  const digits = (num || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}
function formatTelegramHref(handle: string | undefined) {
  const h = (handle || "").replace("@", "");
  return h ? `https://t.me/${h}` : "#";
}


// ЛЁГКИЕ DEV-ТЕСТЫ
const DEV_TESTS = (() => {
  try {
    console.assert(formatWhatsAppHref("+7 980 729-11-07").endsWith("79807291107"), "WA format failed");
    console.assert(formatTelegramHref("@alena_346st").endsWith("alena_346st"), "TG format failed");
    // Дополнительные проверки
    console.assert(Array.isArray(CURRENCIES) && CURRENCIES.some(c=>c.code==='RUB'), 'Currencies must include RUB');
    console.assert(!CURRENCIES.some(c=>c.code==='UAH'), 'UAH must be removed from currencies');
    console.assert(Number("1200") === 1200, 'Budget numeric conversion failed');
  } catch {}
  return true;
})();

const GOALS = [
  { key: "speaking", label: "Разговорный английский" },
  { key: "travel", label: "Для путешествий" },
  { key: "career", label: "Для карьеры / интервью" },
  { key: "exam", label: "IELTS / TOEFL / ОГЭ / ЕГЭ" },
  { key: "school", label: "Школьная программа" },
  { key: "other", label: "Другое" },
];

const CONTACT_METHODS = [
  { key: "telegram", label: "Telegram", icon: Send },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "whatsapp", label: "WhatsApp", icon: Phone },
  { key: "email", label: "Email", icon: Star },
];

// Популярные валюты для РФ и соседних рынков (дефолт — RUB)
const CURRENCIES = [
  { code: "RUB", symbol: "₽", label: "Рубли (₽)" },
  { code: "USD", symbol: "$", label: "Доллары ($)" },
  { code: "EUR", symbol: "€", label: "Евро (€)" },
  { code: "KZT", symbol: "₸", label: "Тенге (₸)" },
  { code: "BYN", symbol: "Br", label: "Белорусский рубль (Br)" },
  { code: "TRY", symbol: "₺", label: "Турецкая лира (₺)" },
];

const SAMPLE_TEACHERS = [
  {
    name: "Алена Игоревна",
    tagline: "Эксперт по разговорному английскому, помогает снять языковой барьер",
    about:
      "Разговорный английский с упором на уверенность и практику. Подтверждённый уровень C1, современные методики, фокус на живой речи и реальных задачах (путешествия, работа, переезд). Первое знакомство — бесплатно.",
    socials: {
      instagram: "@alena.proenglish",
      website: "",
      whatsapp: "79807291107",
      telegram: "@alena_346st",
    },
    photo:
      "https://cdn.profi.ru/xfiles/pfiles/2d6385c4d6cb4399b50cd6d33f785d18.jpg-profi_a34-240.jpg",
    rating: 5.0,
    levels: ["A2", "B1", "B2", "C1"],
  },
];

function useRandomTeacher(preferenceSeed: string) {
  const hash = [...preferenceSeed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = hash % SAMPLE_TEACHERS.length;
  return SAMPLE_TEACHERS[idx];
}

function PolicyContent() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1>Политика конфиденциальности</h1>
      <p><strong>Оператор (контролер данных):</strong> {CONTROLLER_NAME}, адрес: {BUSINESS_ADDRESS}. Контакты: {CONTACT_EMAIL}, {CONTACT_TELEGRAM}.</p>
      <h2>1. Какие данные мы собираем</h2>
      <ul>
        <li>Имя, выбранные цели обучения, описание требований к преподавателю.</li>
        <li>Контактные данные, которые вы указываете добровольно: Telegram @username, Instagram, WhatsApp номер, Email.</li>
        <li>Технические данные (cookie/UTM для аналитики и рекламы, если вы дали согласие на cookie).</li>
      </ul>
      <h2>2. Зачем мы обрабатываем данные</h2>
      <ul>
        <li>Чтобы связаться с вами и предложить подходящего преподавателя английского языка.</li>
        <li>Для коммуникации через выбранный вами канал (Telegram/WhatsApp/Email/Instagram).</li>
        <li>Для аналитики рекламных кампаний (напр., Meta Pixel) — только при согласии на cookie.</li>
      </ul>
      <h2>3. Правовые основания</h2>
      <ul>
        <li>Ваше <strong>согласие</strong> (чекбокс перед отправкой формы).</li>
        <li>Наш <strong>законный интерес</strong> — обработка заявки и коммуникация по вашему запросу.</li>
      </ul>
      <h2>4. Передача и получатели</h2>
      <p>Мы отправляем информацию вашему преподавателю и используем внешние сервисы по вашему выбору: Telegram (Telegram Bot API), WhatsApp, Instagram. Эти сервисы могут находиться за пределами вашей юрисдикции.</p>
      <h2>5. Срок хранения</h2>
      <p>Данные заявки храним не более {DATA_RETENTION_DAYS} дней, после чего удаляем или анонимизируем, если иное не требуется по закону.</p>
      <h2>6. Права пользователя</h2>
      <ul>
        <li>Доступ, исправление, удаление, ограничение обработки, отзыв согласия, возражение на обработку, переносимость данных.</li>
        <li>Чтобы реализовать права, напишите на {CONTACT_EMAIL} или {CONTACT_TELEGRAM}.</li>
      </ul>
      <h2>7. Cookie и трекинг</h2>
      <p>Мы используем cookie только при вашем согласии (баннер внизу страницы). Вы можете в любой момент отозвать согласие и отключить cookie.</p>
      <h2>8. Возрастные ограничения</h2>
      <p>Сервис не предназначен для лиц младше 16 лет. Если вам меньше 16, не отправляйте форму и не предоставляйте данные.</p>
      <h2>9. Обновления политики</h2>
      <p>Мы можем обновлять Политику. Актуальная версия доступна по ссылке «Политика конфиденциальности» на этой странице.</p>
    </div>
  );
}

export default function LandingFindTeacher() {
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [desc, setDesc] = useState("");
  const [method, setMethod] = useState("telegram");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false); // явное согласие
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState<null | ReturnType<typeof useRandomTeacher>>(null);
  const [submitted, setSubmitted] = useState(false);
  // Бюджет и валюта
  const [budget, setBudget] = useState<string>(""); // сумма за урок (строка для удобства ввода)
  const [currency, setCurrency] = useState<string>("RUB");

  // Открываем политику при хэше #privacy (для модерации Meta есть публичная ссылка)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#privacy') {
      setShowPolicy(true);
    }
    // cookie consent из localStorage
    try {
      const saved = localStorage.getItem('cookieConsent');
      if (saved !== null) setCookieConsent(saved === 'true');
      else setCookieConsent(false);
    } catch { setCookieConsent(false); }
  }, []);

  const seed = useMemo(() => `${name}|${goals.join(",")}|${desc}|${method}|${contact}|${budget}|${currency}`, [name, goals, desc, method, contact, budget, currency]);
  const teacher = useRandomTeacher(seed);

  const goalToggle = (key: string) => {
    setGoals((prev) => (prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]));
  };

  function onMatch() {
    const payload = {
      studentName: name,
      goals,
      description: desc,
      preferredMethod: method,
      contact,
      email,
      budget: budget ? Number(budget) : null,
      currency,
      teacher: {
        name: teacher.name,
        telegram: teacher.socials.telegram,
        whatsapp: teacher.socials.whatsapp,
        instagram: teacher.socials.instagram,
      },
      cookieConsent,
    };

    setLoading(true);
    setSubmitted(true);

    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setMatched(teacher);
      })
      .catch(() => {
        setMatched(teacher);
      })
      .finally(() => setLoading(false));
  }

  const hero = (
    <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 lg:pt-24 lg:pb-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 to-white" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Badge className="rounded-full px-3 py-1 text-sm">НАЙДИ СВОЕГО ПРЕПОДАВАТЕЛЯ</Badge>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Хочешь выучить английский <span className="inline-flex items-center gap-2">легко <Sparkles className="h-7 w-7" /></span> и с удовольствием?
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Подберём идеального преподавателя под твои цели и характер. Заполни мини-игру — и мы свяжемся с тобой в течение 24 часов.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="#quiz">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Найти моего преподавателя
            </Button>
          </a>
          <a href="#privacy" onClick={(e)=>{e.preventDefault(); setShowPolicy(true);}} className="inline-flex items-center text-sm underline text-muted-foreground hover:text-foreground">
            Политика конфиденциальности
          </a>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Check className="h-4 w-4"/>Первое знакомство — бесплатно</div>
          <div className="flex items-center gap-2"><Check className="h-4 w-4"/>Подбор за 24 часа</div>
          <div className="flex items-center gap-2"><Check className="h-4 w-4"/>Сертифицированные преподаватели</div>
        </div>
      </motion.div>
    </div>
  );

  const quiz = (
    <section id="quiz" className="mx-auto max-w-5xl px-4 pb-20">
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
            <Rocket className="h-6 w-6"/> Мини-игра: опиши своего идеального преподавателя
          </CardTitle>
          <CardDescription className="text-base">
            Ответь на несколько вопросов — и мы покажем идеального наставника для тебя.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 p-6 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Как тебя зовут?</label>
              <Input placeholder="Иван" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium">Твои цели</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <label key={g.key} className="flex items-center gap-2 rounded-xl border p-3 hover:bg-accent">
                    <Checkbox checked={goals.includes(g.key)} onCheckedChange={() => goalToggle(g.key)} />
                    <span>{g.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Опиши своего идеального преподавателя</label>
              <Textarea
                placeholder="Дружелюбный, с чувством юмора, много практики, 2 раза в неделю, утро..."
                className="min-h-[120px]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted-foreground">Чем подробнее опишешь, тем точнее подбор.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Как удобнее связаться?</label>
              <div className="flex flex-wrap gap-2">
                {CONTACT_METHODS.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    type="button"
                    variant={method === key ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setMethod(key)}
                  >
                    <Icon className="mr-2 h-4 w-4"/>{label}
                  </Button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={method}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {method === "telegram" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Твой Telegram @username</label>
                    <Input placeholder="@username" value={contact} onChange={(e) => setContact(e.target.value)} />
                  </div>
                )}
                {method === "instagram" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Твой Instagram</label>
                    <Input placeholder="@instagram" value={contact} onChange={(e) => setContact(e.target.value)} />
                  </div>
                )}
                {method === "whatsapp" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Твой WhatsApp</label>
                    <Input placeholder="+7 900 000-00-00" value={contact} onChange={(e) => setContact(e.target.value)} />
                  </div>
                )}
                {method === "email" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Твой Email</label>
                    <Input type="email" placeholder="you@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                )}

                {/* Бюджет за урок + валюта */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Бюджет за урок</label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="50"
                      placeholder="например, 1200"
                      value={budget}
                      onChange={(e)=>setBudget(e.target.value)}
                      className="w-40"
                    />
                    <select
                      className="w-48 rounded-md border bg-white px-3 py-2 text-sm"
                      value={currency}
                      onChange={(e)=>setCurrency(e.target.value)}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Можно оставить пустым — подберём варианты в разных ценовых диапазонах.</p>
                </div>

              </motion.div>
            </AnimatePresence>

            {/* Чекбокс согласия — обязателен для Facebook Ads */}
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v)=>setConsent(!!v)} />
              <span>
                Я соглашаюсь с <a href="#privacy" onClick={(e)=>{e.preventDefault(); setShowPolicy(true);}} className="underline">Политикой конфиденциальности</a> и на обработку моих данных для связи со мной.
              </span>
            </label>

            <Button
              size="lg"
              className="h-12 w-full text-base font-semibold"
              onClick={onMatch}
              disabled={loading || !consent}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/> Подбираем преподавателя...</span>
              ) : (
                "Сгенерировать моего преподавателя"
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Нажимая кнопку, ты соглашаешься с обработкой персональных данных и политикой конфиденциальности.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );

  const match = (
    <AnimatePresence>
      {submitted && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-5xl px-4 pb-24"
        >
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold">Мы нашли преподавателя, который тебе подойдёт!</h2>
            <p className="mt-2 text-muted-foreground">Он свяжется с тобой в течение 24 часов. Также можешь связаться напрямую ниже.</p>
          </div>

          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="grid gap-0 md:grid-cols-3">
              {/* Левая колонка — аватар и рейтинг */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-8">
                <div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-indigo-200">
                  {matched?.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={matched.photo}
                      alt={matched?.name || "Преподаватель"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-3xl font-extrabold text-white">
                      {matched?.name?.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Star className="h-5 w-5"/>
                  <span className="text-lg font-semibold">{matched?.rating}</span>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {matched?.levels.map((l) => (
                    <Badge key={l} variant="outline" className="rounded-full">{l}</Badge>
                  ))}
                </div>
              </div>

              {/* Правая часть — информация */}
              <div className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-2xl">{matched?.name}</CardTitle>
                  <CardDescription>{matched?.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base leading-relaxed">{matched?.about}</p>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Instagram</div>
                      <a href={`https://instagram.com/${matched?.socials.instagram.replace("@", "")}`} className="text-base font-medium hover:underline" target="_blank" rel="noreferrer">
                        {matched?.socials.instagram}
                      </a>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">WhatsApp</div>
                      <a href={formatWhatsAppHref(matched?.socials.whatsapp)} className="text-base font-medium hover:underline" target="_blank" rel="noreferrer">
                        +{(matched?.socials.whatsapp || "").replace(/[^\d]/g, "")}
                      </a>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Telegram</div>
                      <a href={formatTelegramHref(matched?.socials.telegram)} className="text-base font-medium hover:underline" target="_blank" rel="noreferrer">
                        {matched?.socials.telegram}
                      </a>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button asChild className="rounded-full">
                    <a href={formatTelegramHref(matched?.socials.telegram)} target="_blank" rel="noreferrer">Написать в Telegram</a>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <a href={formatWhatsAppHref(matched?.socials.whatsapp)} target="_blank" rel="noreferrer">Написать в WhatsApp</a>
                  </Button>
                  <Button asChild variant="ghost" className="rounded-full">
                    <a href={`https://instagram.com/${(matched?.socials.instagram || "").replace("@", "")}`} target="_blank" rel="noreferrer">Открыть Instagram</a>
                  </Button>
                </CardFooter>
              </div>
            </div>
          </Card>
        </motion.section>
      )}
    </AnimatePresence>
  );

  const trust = (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Первое занятие — бесплатно</CardTitle>
            <CardDescription>Познакомься с подходом, поставь цели, узнай свой уровень.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Подбор за 24 часа</CardTitle>
            <CardDescription>Мы оперативно подбираем наставника и выходим на связь.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Сертифицированные преподаватели</CardTitle>
            <CardDescription>CELTA, DELTA, TKT, международный опыт и реальные кейсы.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );

  const footer = (
    <footer className="border-t bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} FindYourTeacher</div>
        <div className="flex items-center gap-4 text-sm">
          <a className="hover:underline" href="#privacy" onClick={(e)=>{e.preventDefault(); setShowPolicy(true);}}>Политика конфиденциальности</a>
          <a className="hover:underline" href="#">Пользовательское соглашение</a>
        </div>
      </div>
    </footer>
  );

  // Модалка политики (без зависимости от Dialog)
  const policyModal = showPolicy ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={()=>setShowPolicy(false)} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button aria-label="Закрыть" className="absolute right-3 top-3 rounded-full p-2 hover:bg-slate-100" onClick={()=>setShowPolicy(false)}>
          <X className="h-5 w-5"/>
        </button>
        <PolicyContent />
      </div>
    </div>
  ) : null;

  // Баннер cookie (хранит выбор в localStorage)
  const cookieBanner = cookieConsent === false ? (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl rounded-t-2xl border bg-white p-4 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Мы используем cookie для аналитики и рекламы (Meta Pixel) — только при вашем согласии.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>{ setCookieConsent(false); try{localStorage.setItem('cookieConsent','false');}catch{} }}>Отклонить</Button>
          <Button onClick={()=>{ setCookieConsent(true); try{localStorage.setItem('cookieConsent','true');}catch{} }}>Принять</Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {hero}
      {quiz}
      {match}
      {trust}
      {footer}
      {policyModal}
      {cookieBanner}
    </div>
  );
}
