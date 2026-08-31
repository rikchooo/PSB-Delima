'use client';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const router = useRouter();
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        if (res.status === 403 && message.includes('halaman private')) {
          message = message + ' Gunakan ' + (document.baseURI || window.location.origin) + 'PrivateWeb/login';
        }
        setError(message);
        setLoading(false);
        return;
      }
      const token = data.data?.token;
      const user = data.data?.user;
      if (!token) {
        setError('Login gagal: token tidak diterima dari server');
        setLoading(false);
        return;
      }
      setAuthSession({ token, user, mode: 'public' });
      alert('Login berhasil!');
      router.push('/');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      if (forgotStep === 1) {
        const res = await apiFetch('/api/user/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          setForgotError(data.error || 'Gagal mengirim kode OTP');
          setForgotLoading(false);
          return;
        }
        setForgotSuccess('Kode OTP telah dikirim ke email Anda');
        setForgotStep(2);
      } else if (forgotStep === 2) {
        const res = await apiFetch('/api/user/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
        });
        const data = await res.json();
        if (!res.ok) {
          setForgotError(data.error || 'Kode OTP tidak valid');
          setForgotLoading(false);
          return;
        }
        setForgotSuccess('Kode OTP valid. Silakan buat password baru.');
        setForgotStep(3);
      } else if (forgotStep === 3) {
        const res = await apiFetch('/api/user/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setForgotError(data.error || 'Gagal reset password');
          setForgotLoading(false);
          return;
        }
        setForgotSuccess('Password berhasil direset. Silakan login dengan password baru.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotStep(1);
          setForgotEmail('');
          setForgotOtp('');
          setForgotNewPassword('');
          setForgotSuccess('');
        }, 2000);
      }
    } catch (err) {
      setForgotError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setForgotLoading(false);
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
                width={100}
                height={100}
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
                  placeholder="Min. 6 karakter"
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
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-[#137333] hover:text-[#0f5c29] transition-colors"
              >
                Lupa Password?
              </button>
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
      {showForgotPassword && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-[#1B7A42] to-[#137333]">
              <h3 className="text-lg font-semibold text-white">Lupa Password</h3>
              <p className="text-sm text-green-100 mt-1">
                {forgotStep === 1 && 'Masukkan email Anda untuk menerima kode OTP'}
                {forgotStep === 2 && 'Masukkan kode OTP yang dikirim ke email Anda'}
                {forgotStep === 3 && 'Buat password baru untuk akun Anda'}
              </p>
            </div>
            <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
              {forgotError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{forgotSuccess}</span>
                </div>
              )}
              {forgotStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Aktif</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      placeholder="Masukkan Email Aktif Anda"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F9F9F9] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137333]/20 focus:border-[#137333] focus:bg-white text-sm text-gray-800 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}
              {forgotStep === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode OTP</label>
                  <input
                    type="text"
                    placeholder="Masukkan 6 digit kode OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-[#F9F9F9] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137333]/20 focus:border-[#137333] focus:bg-white text-sm text-gray-800 transition-all duration-200 text-center tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              )}
              {forgotStep === 3 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 karakter"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-[#F9F9F9] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#137333]/20 focus:border-[#137333] focus:bg-white text-sm text-gray-800 transition-all duration-200"
                      required
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
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotStep(1);
                    setForgotEmail('');
                    setForgotOtp('');
                    setForgotNewPassword('');
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 px-4 py-2.5 bg-[#137333] hover:bg-[#0f5c29] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Memproses...' : forgotStep === 3 ? 'Reset Password' : 'Kirim OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}