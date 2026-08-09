'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { HiMenuAlt3, HiX } from 'react-icons/hi';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [registrationStatus, setRegistrationStatus] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('registration_status') || '';
  });

  const [paymentStatus, setPaymentStatus] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('payment_status') || '';
  });

  useEffect(() => {
    const initAuth = () => {
      const loggedIn = localStorage.getItem('isLoggedIn');
      const userData = localStorage.getItem('user');
      setIsLoggedIn(!!loggedIn);
      setUser(userData ? JSON.parse(userData) : null);
    };

    initAuth();

    const handleStorage = () => {
      const status = localStorage.getItem('registration_status') || '';
      const payment = localStorage.getItem('payment_status') || '';
      const loggedIn = localStorage.getItem('isLoggedIn');
      const userData = localStorage.getItem('user');

      setRegistrationStatus(status);
      setPaymentStatus(payment);
      setIsLoggedIn(!!loggedIn);
      setUser(userData ? JSON.parse(userData) : null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('login', handleStorage);
    window.addEventListener('logout', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('login', handleStorage);
      window.removeEventListener('logout', handleStorage);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = '/PublicWeb/login';
  };

  const handleRegister = () => {
    window.location.href = '/PublicWeb/register';
  };

  const isRegistrationAccepted = registrationStatus === 'accepted';
  const isRegistrationSubmitted = registrationStatus === 'submitted';
  const isPaymentConfirmed = paymentStatus === 'confirmed';

  const getInitials = (name, email) => {
    if (name) {
      return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    }

    if (!email) return 'U';
    const [username] = email.split('@');
    return username.charAt(0).toUpperCase();
  };

  const userInitials = getInitials(user?.full_name || user?.name, user?.email);

  return (
    <header className="bg-green-50 border-b sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-0">
        <div className="flex justify-between items-center h-24 md:h-20">
          <Link href="/" className="w-11 h-11 block">
            <Image
              src="/icons/LogoPonPes.png"
              alt="Logo PonPes"
              width={44}
              height={44}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {!isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLogin}
                  className="py-2 px-6 font-semibold text-green-700 bg-green-100 rounded-full border border-green-300 hover:border-green-500"
                >
                  Masuk
                </button>

                <button
                  onClick={handleRegister}
                  className="py-2 px-6 font-semibold text-white bg-green-700 hover:bg-green-600 rounded-full"
                >
                  Daftar
                </button>
              </div>
            ) : (
              <Link
                href="/PublicWeb/profil"
                className="flex items-center space-x-2 py-2 px-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{userInitials}</span>
                </div>
              </Link>
            )}
          </nav>

          <div className="md:hidden">
            {!isLoggedIn ? (
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? (
                  <HiX className="w-8 h-8 text-gray-600" />
                ) : (
                  <HiMenuAlt3 className="w-8 h-8 text-gray-600" />
                )}
              </button>
            ) : (
              <Link
                href="/PublicWeb/profil"
                className="flex items-center space-x-2"
              >
                <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{userInitials}</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {!isLoggedIn && isMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-24 bg-white border-t z-40 shadow-lg">
            <div className="py-6 px-6 space-y-4">
              <div className="flex justify-center">
                <div className="flex gap-4">
                  <button
                    onClick={handleLogin}
                    className="py-2 px-6 font-semibold text-green-700 bg-green-100 rounded-full border border-green-300"
                  >
                    Masuk
                  </button>

                  <button
                    onClick={handleRegister}
                    className="py-2 px-6 font-semibold text-white bg-green-700 rounded-full"
                  >
                    Daftar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
