'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import {
  HiDocumentText,
  HiCurrencyDollar,
  HiAcademicCap,
  HiUserGroup
} from 'react-icons/hi';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentData, setPaymentData] = useState(null);
  const [nilaiData, setNilaiData] = useState(null);
  const [pendaftaranData, setPendaftaranData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({});

  const fetchDashboardData = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const [pendaftaranRes, paymentRes, nilaiRes, settingsRes] = await Promise.allSettled([
        apiFetch(`/api/pendaftaran/user/${encodeURIComponent(userId)}`),
        apiFetch(`/api/pembayaran/user/${encodeURIComponent(userId)}`),
        apiFetch(`/api/pengujian/santri`),
        apiFetch(`/api/admin/settings/public`),
      ]);

      let currentPendaftaranId = null;

      if (pendaftaranRes.status === 'fulfilled' && pendaftaranRes.value.ok) {
        const data = await pendaftaranRes.value.json();
        const list = data.data || [];
        if (list.length > 0) {
          const pd = list[0];
          setPendaftaranData(pd);
          setRegistrationStatus(pd.status || '');
          currentPendaftaranId = pd.id;
        }
      }

      if (paymentRes.status === 'fulfilled' && paymentRes.value.ok) {
        const data = await paymentRes.value.json();
        const list = data.data || [];
        if (list.length > 0) {
          setPaymentData(list[0]);
          const rawStatus = list[0].status_pembayaran || list[0].payment_status || list[0].pembayaran_status || 'pending';
          setPaymentStatus(rawStatus);
        }
      }

      if (nilaiRes.status === 'fulfilled' && nilaiRes.value.ok && currentPendaftaranId) {
        const data = await nilaiRes.value.json();
        const list = data.data || [];
        const matched = list.find(item => item.id_pendaftaran === currentPendaftaranId);
        if (matched) {
          setNilaiData(matched);
        }
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        setSettings(data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/PublicWeb/login');
      return;
    }
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.replace('/PublicWeb/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDashboardData(parsedUser.id);
    } catch (e) {
      router.replace('/PublicWeb/login');
    }
  }, [fetchDashboardData, router]);

  const handleLogout = () => {
    if (user?.email) localStorage.removeItem(`payment_data_${user.email}`);
    ['auth_token', 'isLoggedIn', 'user', 'registration_status', 'payment_status', 'private_session', 'private_user']
      .forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new Event('logout'));
    router.push('/PublicWeb/login');
  };

  const isRegistrationActive = settings.registration_active === 'true';
  const isAccepted = registrationStatus === 'accepted';
  const isSubmitted = registrationStatus === 'submitted';
  const isRegistrationFilled = isSubmitted || isAccepted;
  const isConfirmed = ['confirmed', 'lunas', 'success'].includes(paymentStatus);
  const isPaymentSubmitted = paymentStatus === 'submitted' || Boolean(paymentData);
  const hasNilai = nilaiData && nilaiData.nilai_alquran != null;

  const displayName = user?.full_name || user?.name || 'Pengguna';

  const getStatusLabel = (status) => {
    switch (status) {
      case 'accepted': return 'Diterima';
      case 'submitted': return 'Menunggu';
      case 'pending': return 'Belum Diisi';
      case 'rejected': return 'Ditolak';
      case 'completed': return 'Selesai';
      default: return status || '-';
    }
  };

  const getPaymentLabel = (status) => {
    switch (status) {
      case 'confirmed':
      case 'lunas':
      case 'success': return 'Lunas';
      case 'submitted': return 'Menunggu';
      case 'pending': return 'Belum Bayar';
      case 'rejected':
      case 'cancelled': return 'Ditolak';
      default: return status || '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  const registrations = pendaftaranData ? [pendaftaranData] : [];

  const filteredRegistrations = registrations.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.nama_lengkap || '').toLowerCase().includes(term) ||
      (item.nama_panggilan || '').toLowerCase().includes(term) ||
      (item.telp_ayah || '').includes(term) ||
      (item.telp_ibu || '').includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <section aria-labelledby="stats-heading" className="mb-8">
          <h2 id="stats-heading" className="sr-only">Ringkasan Pendaftaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              type="button"
              onClick={() => isRegistrationActive && router.push('/PublicWeb/pendaftaran')}
              disabled={!isRegistrationActive}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transition-all text-left w-full ${
                isRegistrationActive ? 'hover:shadow-xl' : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pendaftaran</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {isRegistrationFilled ? 'Sudah' : 'Belum'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {isRegistrationActive
                      ? (isRegistrationFilled ? 'Formulir sudah diisi' : 'Formulir belum diisi')
                      : 'Pendaftaran ditutup'}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <HiDocumentText className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => isAccepted && router.push('/PublicWeb/pembayaran')}
              disabled={!isAccepted}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transition-all text-left w-full ${
                isAccepted ? 'hover:shadow-xl cursor-pointer' : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pembayaran</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {isConfirmed ? 'Lunas' : isPaymentSubmitted ? 'Proses' : 'Belum'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{getPaymentLabel(paymentStatus)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <HiCurrencyDollar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => hasNilai && router.push(`/PublicWeb/hasiltest?id=${pendaftaranData?.id}`)}
              disabled={!hasNilai}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transition-all text-left w-full ${
                hasNilai ? 'hover:shadow-xl cursor-pointer' : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Hasil Test</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {hasNilai ? 'Selesai' : 'Belum'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasNilai ? 'Nilai sudah tersedia' : 'Menunggu jadwal test'}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <HiAcademicCap className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </button>
          </div>
        </section>

        <section aria-labelledby="data-heading" className="mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 id="data-heading" className="text-lg font-semibold text-gray-900">
                Data Pendaftaran Saya
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Telepon</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Pembayaran</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <HiUserGroup className="mx-auto h-12 w-12 text-gray-400 opacity-50" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm ? 'Tidak ada hasil pencarian' : 'Anda belum mengisi formulir pendaftaran'}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() => isRegistrationActive && router.push('/PublicWeb/pendaftaran')}
                            disabled={!isRegistrationActive}
                            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isRegistrationActive
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isRegistrationActive ? 'Isi Formulir' : 'Pendaftaran Ditutup'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.nama_lengkap}
                          </div>
                          <div className="text-sm text-gray-500 sm:hidden">
                            {item.telp_ayah || item.telp_ibu || '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {item.telp_ayah || item.telp_ibu || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' || item.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isConfirmed ? 'bg-green-100 text-green-800' :
                            isPaymentSubmitted ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getPaymentLabel(paymentStatus)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <button
                              onClick={() => isRegistrationActive && router.push('/PublicWeb/pendaftaran?mode=edit')}
                              disabled={!isRegistrationActive}
                              className={`text-green-600 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-md transition font-medium ${
                                isRegistrationActive ? 'hover:bg-green-100' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
