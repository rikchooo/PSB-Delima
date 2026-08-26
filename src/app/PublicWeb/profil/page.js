'use client';
import { clearAuthSession, getAuthToken } from "@/lib/auth";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiLogout } from 'react-icons/hi';

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    if (!user || !getAuthToken()) {
      clearAuthSession({ mode: 'public' });
      router.push('/PublicWeb/login');
    }
  }, [router, user]);

  const handleLogout = () => {
    if (user?.email) {
      localStorage.removeItem(`payment_data_${user.email}`);
    }
    clearAuthSession({ mode: 'public' });
    router.push('/');
  };

  const displayName = user?.full_name || user?.name || 'Pengguna';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-green-700 h-32 relative">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-1 shadow-lg">
                <div className="w-full h-full bg-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-16 pb-6 px-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">{displayName}</h1>
            <p className="text-gray-500 mt-1">{user?.email || '-'}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pengaturan Akun</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Nama Lengkap</p>
                <p className="text-sm text-gray-500">{user?.full_name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Email</p>
                <p className="text-sm text-gray-500">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Role</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role || 'user'}</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 font-semibold text-white bg-red-600 hover:bg-red-500 rounded-full transition-colors"
        >
          <HiLogout className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
