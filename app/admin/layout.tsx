// app/layout.tsx
import "./globals.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "PaththareAds Admin Panel",
  description: "PaththareAds Admin Panel",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const isAuthed = (await cookieStore).get("admin_auth")?.value === "true";

  if (!isAuthed) {
    redirect("/admin-login");
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
