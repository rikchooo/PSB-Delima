'use client';

import '@/styles/globals.css';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Halaman auth
  const isAuthPage =
    pathname === '/PublicWeb/login' ||
    pathname === '/PublicWeb/register' ;

  // Halaman pendaftaran
  const isRegistrationPage =
    pathname === '/pendaftaran' ||
    pathname === '/PublicWeb/pendaftaran';

  // PrivateWeb
  const isPrivateWebPage = pathname?.startsWith('/PrivateWeb/');

  // Bukti pembayaran
  const isBuktiPembayaranPage = pathname === '/PublicWeb/pembayaran/buktipembayaran';

  return (
    <html lang="id">
      <head>
        <title>Pendaftaran Santri Baru - Pondok Pesantren Delima Tanjung Rejo</title>
        <meta name="description" content="PSB Delima Tanjung Rejo" />
        <link rel="icon" href="/icons/LogoPonPes.png" />
        <link rel="apple-touch-icon" href="/icons/LogoPonPes.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className="min-h-screen flex flex-col bg-white">

        {loading && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
            <div className="w-64 h-64 relative">
              <Image
                src="/images/IllustratorLoading.png"
                alt="Loading"
                fill
                className="object-contain animate-pulse"
                priority
              />
            </div>
          </div>
        )}

        {!loading && (
          <>
            {!isAuthPage && !isPrivateWebPage && !isBuktiPembayaranPage && <Header />}

            <main className="flex-grow">
              {children}
            </main>

            {!isAuthPage && !isRegistrationPage && !isPrivateWebPage && !isBuktiPembayaranPage && <Footer />}
          </>
        )}

      </body>
    </html>
  );
}