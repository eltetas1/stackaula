import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ClientCookieBanner } from '../components/ClientCookieBanner';



const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aula CEIP - Portal Educativo',
  description: 'Portal de comunicación para la comunidad educativa del centro',
  keywords: ['educación', 'avisos', 'centro educativo', 'CEIP'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ClientCookieBanner />
        </div>
      </body>
    </html>
  );
}