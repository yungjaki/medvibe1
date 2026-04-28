import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CurriculumProvider } from '@/context/CurriculumContext';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'MedVibe — Учи медицина с кеф',
  description: 'Интерактивна платформа за медицински студенти в България. Анатомия, Хистология, Биология, Химия.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <AuthProvider>
          <ThemeProvider>
            <CurriculumProvider>
              {children}
            </CurriculumProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
