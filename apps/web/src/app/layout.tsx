import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientLayout from '../components/ClientShell'; 
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'VirtualVet',
  description: 'Sistema de Avaliação',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}