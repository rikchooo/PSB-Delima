'use client';

import Link from 'next/link';
import { apiFetch } from "@/lib/api";
import { clearAuthSession, getAuthToken } from "@/lib/auth";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiCheckCircle, HiClock, HiExclamation, HiLogout, HiDocumentText, HiCurrencyDollar, HiChevronDown, HiPencil } from 'react-icons/hi';

const hasFilledSantriForm = (savedData) => {
  if (!savedData) return false;

  try {
    const parsedData = JSON.parse(savedData);
    const formData = parsedData.formData || {};

    return Object.values(formData).some((value) =>
      typeof value === 'string' ? value.trim() !== '' : Boolean(value)
    );
  } catch (error) {
    console.error('Gagal membaca data formulir santri tersimpan:', error);
    return false;
  }
};

export default function ProfilPage() {
  const router = useRouter();
  
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  
  const [registrationStatus, setRegistrationStatus] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('registration_status') || '';
  });
  
  const [paymentStatus, setPaymentStatus] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('payment_status') || '';
  });

  const [hasSantriData, setHasSantriData] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [pendaftaranAktif, setPendaftaranAktif] = useState(true);
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    if (!user || !getAuthToken()) {
      clearAuthSession({ mode: 'public' });
      router.push('/PublicWeb/login');
      return;
    }

    const savedSantriData = localStorage.getItem(`santri_form_data_${user.email}`);
    const savedPaymentData = localStorage.getItem(`payment_data_${user.email}`);
    setHasSantriData(hasFilledSantriForm(savedSantriData));
    if (savedPaymentData) {
      try {
        setPaymentData(JSON.parse(savedPaymentData));
      } catch (error) {
        console.error('Gagal membaca data pembayaran tersimpan:', error);
        setPaymentData(null);
      }
    } else {
      setPaymentData(null);
    }

    const fetchLatestStatus = async () => {
      setFetchError(null);
      try {
        const statusResponse = await apiFetch(`/api/pendaftaran/status/${encodeURIComponent(user.email)}`);
        if (!statusResponse.ok) {
          throw new Error(`HTTP error! status: ${statusResponse.status}`);
        }
        const data = await statusResponse.json();
        if (data.status) {
          setRegistrationStatus(data.status);
          localStorage.setItem('registration_status', data.status);
        }
        if (data.payment_status) {
          setPaymentStatus(data.payment_status);
          localStorage.setItem('payment_status', data.payment_status);
        }

        const paymentResponse = await apiFetch(`/api/pembayaran/email/${encodeURIComponent(user.email)}`);
        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json();
          if (paymentResult.data) {
            setPaymentData(paymentResult.data);
            localStorage.setItem(`payment_data_${user.email}`, JSON.stringify(paymentResult.data));
          }
        } else if (paymentResponse.status !== 404) {
          const errText = await paymentResponse.text().catch(() => 'Unknown error');
          console.error('Payment fetch failed:', paymentResponse.status, errText);
          setFetchError(prev => prev ? `${prev}\nPembayaran: ${paymentResponse.status}` : `Pembayaran: ${paymentResponse.status}`);
        }
      } catch (error) {
        console.error('Error fetching status:', error);
        const msg = error?.message || 'Gagal mengambil data dari server. Pastikan server backend sedang berjalan.';
        setFetchError(msg);
      }
    };

    fetchLatestStatus();

    const fetchPendaftaranAktif = async () => {
      try {
        const res = await apiFetch('/api/settings/pendaftaran_aktif');
        if (res.ok) {
          const data = await res.json();
          setPendaftaranAktif(!!data.pendaftaran_aktif);
        }
      } catch (err) {
        console.error('Failed to fetch pendaftaran aktif:', err);
      }
    };

    fetchPendaftaranAktif();
  }, [router, user]);

  const handleLogout = () => {
    if (user?.email) {
      localStorage.removeItem(`payment_data_${user.email}`);
    }
    clearAuthSession({ mode: 'public' });
    router.push('/');
  };

  const isRegistrationAccepted = registrationStatus === 'accepted';
  const isRegistrationSubmitted = registrationStatus === 'submitted' || registrationStatus === 'pending';
  const isRegistrationFilled = hasSantriData || isRegistrationSubmitted || isRegistrationAccepted;
  const isPaymentSubmitted = paymentStatus === 'submitted' || Boolean(paymentData);
  const isPaymentConfirmed = ['confirmed', 'lunas', 'success'].includes(paymentStatus);
  const paymentHref = isPaymentConfirmed && paymentData?.id_pendaftaran
    ? `/PublicWeb/pembayaran/buktipembayaran?id=${paymentData.id_pendaftaran}`
    : '/PublicWeb/pembayaran';

  const displayName = user?.full_name || user?.name || 'Pengguna';

  const getInitials = (name, email) => {
    if (name && name !== 'Pengguna') {
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

  const userInitials = getInitials(displayName, user?.email);

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
        {notif && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-700">{notif}</p>
            <button onClick={() => setNotif(null)} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-green-700 h-32 relative">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-1 shadow-lg">
                <div className="w-full h-full bg-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {userInitials}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-16 pb-6 px-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">{displayName}</h1>
            <p className="text-gray-500 mt-1">{user?.email || '-'}</p>
          </div>

          {fetchError && (
            <div className="px-6 pb-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{fetchError}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Status Pendaftaran</h2>
          
          <div className="flex items-center justify-center py-4">
            {isRegistrationAccepted ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <span className="text-xl font-semibold text-green-600">Diterima</span>
              </div>
            ) : isRegistrationSubmitted ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HiClock className="w-8 h-8 text-yellow-600" />
                </div>
                <span className="text-xl font-semibold text-yellow-600">Menunggu Konfirmasi</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HiExclamation className="w-8 h-8 text-gray-500" />
                </div>
                <span className="text-xl font-semibold text-gray-500">Belum Mengisi</span>
              </div>
            )}
          </div>

          {isRegistrationAccepted && isPaymentConfirmed && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <HiCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Pendaftaran dan Pembayaran Selesai!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Pembayaran Anda sudah dikonfirmasi. Silakan simpan bukti pembayaran sebagai arsip.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isRegistrationAccepted && !isPaymentConfirmed && isPaymentSubmitted && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <HiClock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">Bukti Pembayaran Terkirim</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Pembayaran sedang menunggu konfirmasi dari panitia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isRegistrationAccepted && !isPaymentConfirmed && !isPaymentSubmitted && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <HiExclamation className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Pendaftaran Diterima!</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Segera lakukan pembayaran untuk menyelesaikan proses pendaftaran.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="border-b border-gray-100">
            <button
              onClick={() => {
                if (!pendaftaranAktif) {
                  setNotif('Pendaftaran belum dibuka. Silakan kembali lagi nanti.');
                  return;
                }
                router.push('/PublicWeb/pendaftaran');
              }}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <HiDocumentText className="w-6 h-6 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Formulir Pendaftaran</p>
                <p className="text-sm text-gray-500">
                  {isRegistrationFilled ? 'Data santri sudah tersimpan' : 'Lihat dan isi data pendaftaran'}
                </p>
              </div>
              <HiChevronDown className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
            </button>

            {isRegistrationFilled && (
              <div className="px-4 pb-4">
                <Link
                  href="/PublicWeb/pendaftaran?mode=edit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full transition-colors"
                >
                  <HiPencil className="w-5 h-5" />
                  Edit Data Santri
                </Link>
              </div>
            )}
          </div>

          {isRegistrationAccepted && (
            <Link
              href={paymentHref}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isPaymentConfirmed ? 'bg-green-100' : isPaymentSubmitted ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {isPaymentConfirmed ? (
                  <HiCheckCircle className="w-6 h-6 text-green-700" />
                ) : isPaymentSubmitted ? (
                  <HiClock className="w-6 h-6 text-blue-700" />
                ) : (
                  <HiCurrencyDollar className="w-6 h-6 text-green-700" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Pembayaran</p>
                <p className="text-sm text-gray-500">
                  {isPaymentConfirmed
                    ? 'Pembayaran selesai, bukti pembayaran tersimpan'
                    : isPaymentSubmitted
                      ? 'Bukti pembayaran terkirim, menunggu konfirmasi'
                      : 'Lakukan pembayaran biaya pendaftaran'}
                </p>
              </div>
              {(isPaymentSubmitted || isPaymentConfirmed) && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  isPaymentConfirmed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isPaymentConfirmed ? 'Selesai' : 'Terkirim'}
                </span>
              )}
              <HiChevronDown className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
            </Link>
          )}
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
