import type { Metadata } from 'next';
import { SupabaseConfigProvider } from '@/lib/supabase-config-inject';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Clube · 影协放映助手',
    template: '%s · Clube',
  },
  description:
    'Clube 是为高校影协 / 艺术策展团队打造的排片、签到、评分与复盘工具。',
  keywords: ['影协', '放映', '策展', 'Clube', '排片', '签到', '评分', '高校影协'],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased bg-[#0B0B0C] text-[#F4F1EA] font-sans min-h-screen">
        <SupabaseConfigProvider>{children}</SupabaseConfigProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0B0B0C',
              color: '#F4F1EA',
              border: '1px solid rgba(244,241,234,0.2)',
              borderRadius: '2px',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: '12px',
              letterSpacing: '0.05em',
            },
          }}
        />
      </body>
    </html>
  );
}
