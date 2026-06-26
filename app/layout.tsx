import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WWMeet",
  description: "When Where Meet — 친구들과 가능한 일정을 맞추고 장소를 골라보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
