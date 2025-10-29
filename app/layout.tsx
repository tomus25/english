// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "FindYourTeacher",
  description: "Найди своего идеального преподавателя английского",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  );
}
