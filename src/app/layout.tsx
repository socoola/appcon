import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AdConfig - App广告管理后台',
    template: '%s | AdConfig',
  },
  description: 'App广告位配置管理平台，按包名管理移动应用广告配置',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
