import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CurriculumProvider } from '@/context/CurriculumContext';
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f472b6' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: 'MedVibe — Учи медицина с кеф',
  description: 'Интерактивна платформа за медицински студенти в България. Анатомия, Хистология, Биология, Химия.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'MedVibe',
    statusBarStyle: 'black-translucent',
    startupImage: '/icon.svg',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'MedVibe',
    description: 'Учи медицина с кеф 🩺',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className="h-full">
      <head>
        {/* iOS PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MedVibe" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.svg" />
        <link rel="mask-icon" href="/icon.svg" color="#f472b6" />
        {/* Prevent zoom on input focus (iOS) */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.className} min-h-full`}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <CurriculumProvider>
                {children}
              </CurriculumProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
