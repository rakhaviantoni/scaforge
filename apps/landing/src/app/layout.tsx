import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Scaforge - Modular Full-Stack Boilerplate Ecosystem',
  description: 'Build production-ready apps in minutes. Choose your framework, add plugins as you need them. Next.js, Nuxt, TanStack Start, and Hydrogen supported.',
  keywords: ['boilerplate', 'scaffold', 'nextjs', 'nuxt', 'tanstack', 'fullstack', 'typescript', 'react', 'vue'],
  authors: [{ name: 'Rakha Viantoni' }],
  openGraph: {
    title: 'Scaforge - Modular Full-Stack Boilerplate Ecosystem',
    description: 'Build production-ready apps in minutes. Choose your framework, add plugins as you need them.',
    url: 'https://scaforge.rakhaviantoni.com',
    siteName: 'Scaforge',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scaforge - Modular Full-Stack Boilerplate Ecosystem',
    description: 'Build production-ready apps in minutes. Choose your framework, add plugins as you need them.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
