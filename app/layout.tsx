import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Providers } from './providers';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'RDO - Objects That Say No',
  description: 'Digital objects that enforce their own rules. A new Web3 primitive.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-rdo-900 text-white antialiased min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-rdo-900/80 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="font-serif text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">RDO</Link>
                <div className="flex items-center gap-6 text-sm font-medium text-white/70">
                  <a href="/create" className="hover:text-white transition-colors">Create</a>
                  <a href="/about" className="hover:text-white transition-colors">Manifesto</a>
                  <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
                </div>
              </div>
            </nav>
            <main className="flex-grow pt-20">
              {children}
            </main>
            <footer className="border-t border-white/10 py-12">
              <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
                <p>&copy; 2026 RDO Protocol. Refuse Everything.</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
