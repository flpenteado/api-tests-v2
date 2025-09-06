import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { StoreProvider } from './state/StoreProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'API Tests v2',
  description: 'API testing application with Postman-like interface',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
