'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiMenuAlt3, HiX, HiLogout } from 'react-icons/hi';
import { clearAuthSession, getPrivateSession } from '@/lib/auth';

export default function PrivateHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(() => getPrivateSession());

  const router = useRouter();

  const roleLabel = {
    admin: "Panitia",
    penguji: "Penguji",
    pengasuh: "Pengasuh",
  };

  const handleLogout = () => {
    clearAuthSession({ mode: 'private' });
    setUser(null);
    setIsMenuOpen(false);
    router.push("/PrivateWeb/login");
  };

  return (
    <header className="bg-green-50 border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-0">
        <div className="flex justify-between items-center h-24 md:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href={`/PrivateWeb/${user?.role || 'admin'}`} className="w-10 h-10 block flex-shrink-0">
              <Image
                src="/icons/LogoPonPes.png"
                alt="Logo PonPes"
                width={40}
                height={40}
                priority
              />
            </Link>

            <div>
              <h1 className="text-lg font-bold text-gray-800">
                PP. Delima Tanjung Rejo
              </h1>
              <p className="text-xs text-gray-500 hidden md:block">
                SI-Pendaftaran Santri Baru
              </p>
            </div>
          </div>

          {/* Desktop menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">
                {user ? roleLabel[user.role] || "User" : "Loading..."}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="py-2 px-6 font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition flex items-center gap-2"
            >
              <HiLogout className="w-5 h-5" />
              Keluar
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <HiX className="w-8 h-8 text-gray-600" />
              ) : (
                <HiMenuAlt3 className="w-8 h-8 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-24 bg-white border-t z-40 shadow-lg">
            <div className="py-6 px-6 space-y-6">
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800">
                  {user ? roleLabel[user.role] || "User" : "Loading..."}
                </p>
              </div>

              <div className="border-t" />

              <div className="flex justify-center">
                <button
                  onClick={handleLogout}
                  className="py-3 px-10 font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition flex items-center gap-2"
                >
                  <HiLogout className="w-5 h-5" />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
