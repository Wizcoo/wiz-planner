import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wiz Timeline — 团队研发任务排期与里程碑看板",
  description: "面向研发团队的高性能 macOS 风格资源排期与里程碑追踪系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased select-none">{children}</body>
    </html>
  );
}
