"use client";

// Halaman pengaturan sistem

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";
import { HiSave, HiSwitchHorizontal, HiUserGroup, HiDocumentText, HiCheckCircle, HiXCircle, HiArrowLeft } from "react-icons/hi";

const DEFAULT_SCHEDULE = {
  wave1: "1 Jan - 31 Mar 2026",
  wave2: "1 Apr - 30 Jun 2026",
  wave3: "1 Jul - 30 Sep 2026",
};

export default function SettingPage() {
  const [settings, setSettings] = useState({});
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [biaya, setBiaya] = useState(0);
  const [pendaftaranAktif, setPendaftaranAktif] = useState(false);
  const [savingPendaftaran, setSavingPendaftaran] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!getAuthToken()) {
          router.replace("/PrivateWeb/login");
          return;
        }
        const session = getPrivateSession();
        if (!session || session.role !== "admin") {
          router.replace("/PrivateWeb/login");
          return;
        }

        const [settingsRes, scheduleRes, pendaftaranRes] = await Promise.all([
          apiFetch('/api/settings'),
          apiFetch('/api/settings/schedule'),
          apiFetch('/api/settings/pendaftaran_aktif'),
        ]);

        if (settingsRes.ok) {
          const result = await settingsRes.json();
          setSettings(result.data || {});
          const year = result.data?.active_year || new Date().getFullYear().toString();
          setActiveYear(year);
        }

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          if (scheduleData.data) {
            setSchedule(scheduleData.data);
          }
        }

        if (pendaftaranRes.ok) {
          const pendaftaranData = await pendaftaranRes.json();
          setPendaftaranAktif(!!pendaftaranData.pendaftaran_aktif);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  useEffect(() => {
    const fetchBiaya = async () => {
      if (!activeYear) return;
      try {
        const res = await apiFetch(`/api/settings/biaya/${activeYear}`);
        if (res.ok) {
          const data = await res.json();
          setBiaya(data.biaya || 0);
        } else {
          setBiaya(0);
        }
      } catch (e) {
        console.error("Failed to fetch biaya", e);
        setBiaya(0);
      }
    };

    fetchBiaya();
  }, [activeYear]);

  const handleSaveYearBiaya = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Simpan tahun aktif dan biaya pendaftaran secara paralel
      await Promise.all([
        apiFetch(`/api/settings/active_year`, {
          method: 'PUT',
          body: JSON.stringify({ value: activeYear }),
        }),
        apiFetch(`/api/settings/biaya_${activeYear}`, {
          method: 'PUT',
          body: JSON.stringify({ value: biaya }),
        }),
      ]);
      setSettings(prev => ({ ...prev, active_year: activeYear }));
      setSuccess('Tahun dan biaya pendaftaran berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [activeYear, biaya]);

  const handleSaveSchedule = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Simpan jadwal gelombang pendaftaran ke backend
      const res = await apiFetch('/api/settings/schedule', {
        method: 'PUT',
        body: JSON.stringify(schedule),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan jadwal');
      }
      setSuccess('Jadwal pendaftaran berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [schedule]);

  const handleSaveSignature = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Simpan nama/jabatan panitia, nama/ttd bendahara, dan barcode secara paralel
      await Promise.all([
        apiFetch(`/api/settings/panitia_nama`, {
          method: 'PUT',
          body: JSON.stringify({ value: settings.panitia_nama || '' }),
        }),
        apiFetch(`/api/settings/panitia_jabatan`, {
          method: 'PUT',
          body: JSON.stringify({ value: settings.panitia_jabatan || '' }),
        }),
        apiFetch(`/api/settings/bendahara/bendahara_nama`, {
          method: 'PUT',
          body: JSON.stringify({ value: settings.bendahara_nama || '' }),
        }),
        apiFetch(`/api/settings/bendahara/bendahara_ttd`, {
          method: 'PUT',
          body: JSON.stringify({ value: settings.bendahara_ttd || '' }),
        }),
        apiFetch(`/api/settings/laporan_barcode`, {
          method: 'PUT',
          body: JSON.stringify({ value: settings.laporan_barcode || '' }),
        }),
      ]);
      setSuccess('Pengaturan berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [settings.panitia_nama, settings.panitia_jabatan, settings.bendahara_nama, settings.bendahara_ttd, settings.laporan_barcode]);

  const togglePendaftaranAktif = useCallback(async () => {
    setSavingPendaftaran(true);
    setError(null);
    setSuccess(null);
    try {
      // Toggle status pendaftaran (buka/tutup) ke backend
      const newValue = !pendaftaranAktif;
      const res = await apiFetch('/api/settings/pendaftaran_aktif', {
        method: 'PUT',
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memperbarui status pendaftaran');
      }
      setPendaftaranAktif(newValue);
      setSuccess(newValue ? 'Pendaftaran santri baru telah diaktifkan' : 'Pendaftaran santri baru telah dinonaktifkan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPendaftaran(false);
    }
  }, [pendaftaranAktif]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat pengaturan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && Object.keys(settings).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-bold text-xl mb-2">Terjadi Kesalahan</p>
            <p className="text-gray-600 text-sm mt-1 mb-6">{error}</p>
            <button onClick={() => router.back()} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PrivateHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
              <p className="text-gray-600 mt-1">
                Kelola konfigurasi dan preferensi sistem pendaftaran santri baru
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start">
            <HiXCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-start">
            <HiCheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Berhasil</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Configuration Cards */}
        <div className="space-y-6">
          {/* Registration Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-transparent">
              <div className="flex items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Status Pendaftaran</h2>
                  <p className="text-sm text-gray-500">Aktifkan atau nonaktifkan pendaftaran santri baru</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${pendaftaranAktif
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {pendaftaranAktif ? (
                      <HiCheckCircle className="w-4 h-4 mr-1.5" />
                    ) : (
                      <HiXCircle className="w-4 h-4 mr-1.5" />
                    )}
                    {pendaftaranAktif ? 'Aktifkan' : 'Nonaktif'}
                  </div>
                  <span className="text-sm text-gray-600">
                    {pendaftaranAktif
                      ? 'Pendaftaran dibuka'
                      : 'Pendaftaran ditutup'}
                  </span>
                </div>
                <button
                  onClick={togglePendaftaranAktif}
                  disabled={savingPendaftaran}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${pendaftaranAktif
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                    }`}
                >
                  {savingPendaftaran ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    pendaftaranAktif ? 'Nonaktif' : 'Aktifkan'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Academic Year & Fee Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
              <div className="flex items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tahun Akademik & Biaya</h2>
                  <p className="text-sm text-gray-500">Atur tahun aktif dan biaya pendaftaran</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Aktif
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={activeYear}
                      onChange={(e) => setActiveYear(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Tahun Aktif"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biaya Pendaftaran
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-medium">Rp</span>
                    <input
                      type="number"
                      value={biaya}
                      onChange={(e) => setBiaya(parseInt(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Nominal biaya"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveYearBiaya}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  <HiSave className="w-5 h-5 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-transparent">
              <div className="flex items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Jadwal Pendaftaran</h2>
                  <p className="text-sm text-gray-500">Atur periode pendaftaran per gelombang</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: "wave1", label: "Gelombang I", color: "green" },
                  { key: "wave2", label: "Gelombang II", color: "blue" },
                  { key: "wave3", label: "Gelombang III", color: "purple" },
                ].map((item) => (
                  <div key={item.key} className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.label}
                    </label>
                    <input
                      type="text"
                      value={schedule[item.key]}
                      onChange={(e) => setSchedule(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder="Masukkan periode pendaftaran"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  <HiSave className="w-5 h-5 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>

          {/* Signatures Card - Combined */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-transparent">
              <div className="flex items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tanda Tangan & Dokumen</h2>
                  <p className="text-sm text-gray-500">Konfigurasi tanda tangan untuk kwitansi dan laporan</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Panitia
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings.panitia_nama || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, panitia_nama: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Nama Panitia"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jabatan Panitia
                  </label>
                  <input
                    type="text"
                    value={settings.panitia_jabatan || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, panitia_jabatan: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Jabatan Panitia"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Tanda Tangan Panitia
                  </label>
                  <input
                    type="text"
                    value={settings.laporan_barcode || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, laporan_barcode: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="https://res.cloudinary.com/.../ttd_panitia.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Bendahara
                  </label>
                  <input
                    type="text"
                    value={settings.bendahara_nama || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, bendahara_nama: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Nama Bendahara"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Tanda Tangan Bendahara
                  </label>
                  <input
                    type="text"
                    value={settings.bendahara_ttd || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, bendahara_ttd: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="https://res.cloudinary.com/.../ttd.png"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSignature}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  <HiSave className="w-5 h-5 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

