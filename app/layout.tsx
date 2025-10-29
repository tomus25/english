export const metadata = {
  title: "FindYourTeacher",
  description: "Найди своего идеального преподавателя английского"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <body>{children}</body>
    </html>
  );
}
