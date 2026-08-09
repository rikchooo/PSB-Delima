'use client';

// Halaman login publik

import Image from 'next/image';
import { apiFetch } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import "@/styles/globals.css";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Mohon lengkapi email dan password');
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/user/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        let message = data.error || 'Login gagal';
        // Jika user mencoba akses halaman private dari login publik, beri petunjuk
        if (res.status === 403 && message.includes('halaman private')) {
          message = message + ' Gunakan ' + (document.baseURI || window.location.origin) + 'PrivateWeb/login';
        }
        setError(message);
        setLoading(false);
        return;
      }

      if (!data.token) {
        setError('Login gagal: token tidak diterima dari server');
        setLoading(false);
        return;
      }

      // Simpan sesi publik (mode: public untuk akses halaman publik)
      setAuthSession({ token: data.token, user: data.user, mode: 'public' });

      alert('Login berhasil!');
      router.push('/');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans antialiased">
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-gradient-to-b from-[#1B7A42] to-[#137333] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

        <div className="flex flex-col items-center text-center z-10 max-w-sm">
          <div className="relative w-48 h-48 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl mb-8 transition-transform duration-500 hover:scale-105">
            <div className="w-36 h-36 rounded-full bg-white flex items-center justify-center p-3 shadow-lg">
              <Image
                src="/images/IllustratorLoading.png"
                alt="Logo Pondok Pesantren Delima Tanjung Rejo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-white mb-4">
            Pendaftaran Santri Baru<br />
            Pondok Pesantren Delima Tanjung Rejo
          </h2>

          <p className="text-green-100/80 text-xs lg:text-sm leading-relaxed font-light">
            Mengantarkan manusia unggul dengan mengedapkan keluhuran akhlak, cerdas berilmu, dan bijak beramal.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between px-6 py-8 md:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="flex flex-col items-center text-center md:hidden bg-gradient-to-b from-[#1B7A42] to-[#137333] -mt-8 mx-[-24px] pt-10 pb-8 rounded-b-full mb-4">
          <div className="relative w-40 h-40 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl mb-4 transition-transform duration-500 hover:scale-105">
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center p-3 shadow-lg">
              <Image
                src="/images/IllustratorLoading.png"
                alt="Logo Ponpes Delima Tanjung Rejo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="hidden md:block" />

        <div className="w-full max-w-[440px] mx-auto my-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
              Masuk ke Akun Anda
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Silakan masukkan email dan kata sandi Anda untuk masuk ke sistem.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-150 rounded-xl text-red-650 text-sm flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Aktif
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Masukkan Email Aktif Anda"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#F9F9F9] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137333]/20 focus:border-[#137333] focus:bg-white text-sm text-gray-800 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 8 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 bg-[#F9F9F9] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137333]/20 focus:border-[#137333] focus:bg-white text-sm text-gray-800 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#137333] hover:bg-[#0f5c29] text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-md shadow-[#137333]/10"
            >
              <span>{loading ? 'Memproses...' : 'Masuk'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="text-center text-sm mt-8">
            <span className="text-gray-500">Belum punya akun? </span>
            <a href="/PublicWeb/register" className="font-bold text-[#137333] hover:text-[#0f5c29] hover:underline transition-colors ml-1">
              Daftar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
