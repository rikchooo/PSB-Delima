"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";
import { HiSave, HiCog, HiCalendar, HiDocumentText, HiCheckCircle, HiXCircle,HiCurrencyDollar,HiGlobe,HiTrash,HiHome } from "react-icons/hi";

const DEFAULT_SCHEDULE = {
  wave1: "1 Jan - 31 Mar 2026",
  wave2: "1 Apr - 30 Jun 2026",
  wave3: "1 Jul - 30 Sep 2026",
};

const ROOM_NAMES = {
  male: [
    "Sunan Gresik", "Sunan Ampel", "Sunan Bonang", "Sunan Drajat",
    "Sunan Giri", "Sunan Kalijaga", "Sunan Kudus", "Sunan Muria", "Sunan Gunung Jati"
  ],
  female: [
    "Maryam", "Khadijah", "Aisyah", "Fatimah",
    "Hafshah", "Asiyah", "Aminah", "Shafiyah", "Ruqayyah"
  ]
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
  
  const [activeTab, setActiveTab] = useState("general");
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!getAuthToken()) { router.replace("/PrivateWeb/login"); return; }
        const session = getPrivateSession();
        if (!session || session.role !== "admin") { router.replace("/PrivateWeb/login"); return; }
        
        const [settingsRes, scheduleRes, pendaftaranRes] = await Promise.all([
          apiFetch('/api/settings'),
          apiFetch('/api/settings/schedule'),
          apiFetch('/api/settings/pendaftaran_aktif'),
        ]);
        
        if (settingsRes.ok) {
          const result = await settingsRes.json();
          setSettings(result.data || {});
          setActiveYear(result.data?.active_year || new Date().getFullYear().toString());
        }
        if (scheduleRes.ok) {
          const data = await scheduleRes.json();
          if (data.data) setSchedule(data.data);
        }
        if (pendaftaranRes.ok) {
          const data = await pendaftaranRes.json();
          setPendaftaranAktif(!!data.data.pendaftaran_aktif);
        }
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
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
          setBiaya(data.data?.biaya || 0);
        } else setBiaya(0);
      } catch (e) { setBiaya(0); }
    };
    fetchBiaya();
  }, [activeYear]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (activeTab !== "rooms") return;
      setLoadingRooms(true);
      try {
        const res = await apiFetch('/api/pendaftaran/studentrooms');
        if (res.ok) {
          const data = await res.json();
          const rooms = data.data || [];
          const unique = [];
          const seen = new Set();
          rooms.forEach(r => {
            const key = `${r.name}|${r.gender}`;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(r);
            }
          });
          setRooms(unique);
        }
      } catch (e) { console.error(e); }
      finally { setLoadingRooms(false); }
    };
    fetchRooms();
  }, [activeTab]);

  const handleSaveYearBiaya = useCallback(async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      await Promise.all([
        apiFetch(`/api/settings/active_year`, { method: 'PUT', body: JSON.stringify({ value: activeYear }) }),
        apiFetch(`/api/settings/biaya_${activeYear}`, { method: 'PUT', body: JSON.stringify({ value: biaya }) }),
      ]);
      setSettings(prev => ({ ...prev, active_year: activeYear }));
      setSuccess('Konfigurasi tahun dan biaya berhasil disimpan.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }, [activeYear, biaya]);

  const handleSaveSchedule = useCallback(async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const res = await apiFetch('/api/settings/schedule', { method: 'PUT', body: JSON.stringify(schedule) });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menyimpan jadwal');
      setSuccess('Jadwal gelombang pendaftaran berhasil diperbarui.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }, [schedule]);

  const handleSaveSignature = useCallback(async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      await Promise.all([
        apiFetch(`/api/settings/panitia_nama`, { method: 'PUT', body: JSON.stringify({ value: settings.panitia_nama || '' }) }),
        apiFetch(`/api/settings/panitia_jabatan`, { method: 'PUT', body: JSON.stringify({ value: settings.panitia_jabatan || '' }) }),
        apiFetch(`/api/settings/bendahara/bendahara_nama`, { method: 'PUT', body: JSON.stringify({ value: settings.bendahara_nama || '' }) }),
        apiFetch(`/api/settings/bendahara/bendahara_ttd`, { method: 'PUT', body: JSON.stringify({ value: settings.bendahara_ttd || '' }) }),
        apiFetch(`/api/settings/laporan_barcode`, { method: 'PUT', body: JSON.stringify({ value: settings.laporan_barcode || '' }) }),
      ]);
      setSuccess('Data tanda tangan dan pejabat berhasil disimpan.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }, [settings]);

  const togglePendaftaranAktif = useCallback(async () => {
    setSavingPendaftaran(true); setError(null); setSuccess(null);
    try {
      const newValue = !pendaftaranAktif;
      const res = await apiFetch('/api/settings/pendaftaran_aktif', { method: 'PUT', body: JSON.stringify({ value: newValue }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal update status');
      setPendaftaranAktif(newValue);
      setSuccess(newValue ? 'Pendaftaran santri baru DIAKTIFKAN.' : 'Pendaftaran santri baru DINONAKTIFKAN.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); } finally { setSavingPendaftaran(false); }
  }, [pendaftaranAktif]);

  const handleDeleteRoom = useCallback(async (roomId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kamar ini?')) return;
    try {
      const res = await apiFetch(`/api/pendaftaran/studentrooms/${roomId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus kamar');
      setSuccess('Kamar berhasil dihapus.');
      setTimeout(() => setSuccess(null), 3000);
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (err) { setError(err.message); }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[500px]">
          <p className="text-slate-500 font-medium">Memuat konfigurasi...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "Umum", icon: HiCog },
    { id: "finance", label: "Biaya", icon: HiCurrencyDollar },
    { id: "schedule", label: "Jadwal", icon: HiCalendar },
    { id: "rooms", label: "Kamar", icon: HiHome },
    { id: "docs", label: "Dokumen", icon: HiDocumentText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 lg:pb-12">
      <PrivateHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 border-b border-slate-200 pb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Kelola parameter global, jadwal, dan konfigurasi dokumen resmi.
          </p>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div className="mb-6 sticky top-4 z-20">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm">
                <div className="flex items-start">
                  <HiXCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md shadow-sm">
                <div className="flex items-start">
                  <HiCheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-800">Berhasil</h3>
                    <p className="text-sm text-green-700 mt-1">{success}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
          <div className="hidden lg:block lg:col-span-3">
            <nav className="space-y-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium border-l-2 focus:outline-none ${
                      isActive
                        ? "border-green-600 text-green-700 bg-green-50"
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
              <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Info Sistem</h4>
              <p className="text-xs text-green-700 leading-relaxed">
                Perubahan berdampak langsung pada formulir publik dan laporan keuangan.
              </p>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="lg:col-span-9">
            
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Status Pendaftaran</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Kontrol akses utama untuk pendaftar baru.</p>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-full flex-shrink-0 ${pendaftaranAktif ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        <HiGlobe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Status: <span className={pendaftaranAktif ? "text-green-700 font-bold" : "text-slate-600"}>{pendaftaranAktif ? "TERBUKA" : "TERTUTUP"}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {pendaftaranAktif ? "Formulir dapat diakses publik." : "Formulir disembunyikan."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={togglePendaftaranAktif}
                      disabled={savingPendaftaran}
                      className={`w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded border text-center focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        pendaftaranAktif
                          ? "bg-white border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500"
                          : "bg-green-600 border-transparent text-white hover:bg-green-700 focus:ring-green-500"
                      } disabled:opacity-50`}
                    >
                      {savingPendaftaran ? "Memproses..." : (pendaftaranAktif ? "Tutup Pendaftaran" : "Buka Pendaftaran")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FINANCE */}
            {activeTab === "finance" && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Parameter Keuangan</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Atur tahun aktif dan nominal biaya pendaftaran.</p>
                </div>
                <div className="p-5 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Tahun Akademik Aktif</label>
                      <input
                        type="number"
                        value={activeYear}
                        onChange={(e) => setActiveYear(e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base"
                        placeholder="2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Biaya Pendaftaran (Rp)</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-slate-500 font-medium">Rp</span>
                        </div>
                        <input
                          type="number"
                          value={biaya}
                          onChange={(e) => setBiaya(parseInt(e.target.value) || 0)}
                          className="block w-full rounded-md border-slate-300 pl-10 focus:border-green-500 focus:ring-green-500 py-2.5 pr-3 border text-base"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSaveYearBiaya}
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <HiSave className="w-4 h-4 mr-2" />
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SCHEDULE */}
            {activeTab === "schedule" && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Jadwal Gelombang</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Definisikan rentang tanggal untuk setiap gelombang.</p>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  {[
                    { key: "wave1", label: "Gelombang I", desc: "Pendaftaran awal" },
                    { key: "wave2", label: "Gelombang II", desc: "Pendaftaran reguler" },
                    { key: "wave3", label: "Gelombang III", desc: "Pendaftaran akhir" },
                  ].map((item) => (
                    <div key={item.key} className="p-4 border border-slate-200 rounded-md bg-white">
                      <div className="mb-2">
                        <label className="block text-sm font-semibold text-slate-900">{item.label}</label>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <input
                        type="text"
                        value={schedule[item.key]}
                        onChange={(e) => setSchedule(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base"
                        placeholder="Contoh: 1 Jan - 31 Mar 2026"
                      />
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 flex justify-end mt-2">
                    <button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <HiSave className="w-4 h-4 mr-2" />
                      {saving ? "Menyimpan..." : "Update Jadwal"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === "docs" && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Pejabat & Tanda Tangan</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Data untuk Kwitansi dan Surat Keterangan.</p>
                </div>
                <div className="p-5 sm:p-6 space-y-8">
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Panitia Penerimaan</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={settings.panitia_nama || ''} onChange={(e) => setSettings(prev => ({ ...prev, panitia_nama: e.target.value }))} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan</label>
                        <input type="text" value={settings.panitia_jabatan || ''} onChange={(e) => setSettings(prev => ({ ...prev, panitia_jabatan: e.target.value }))} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">URL TTD / Barcode</label>
                        <input type="text" value={settings.laporan_barcode || ''} onChange={(e) => setSettings(prev => ({ ...prev, laporan_barcode: e.target.value }))} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border font-mono text-xs sm:text-sm" placeholder="https://..." />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Bendahara</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bendahara</label>
                        <input type="text" value={settings.bendahara_nama || ''} onChange={(e) => setSettings(prev => ({ ...prev, bendahara_nama: e.target.value }))} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">URL Tanda Tangan</label>
                        <input type="text" value={settings.bendahara_ttd || ''} onChange={(e) => setSettings(prev => ({ ...prev, bendahara_ttd: e.target.value }))} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border font-mono text-xs sm:text-sm" placeholder="https://..." />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSaveSignature}
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <HiSave className="w-4 h-4 mr-2" />
                      {saving ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ROOMS */}
            {activeTab === "rooms" && (
              <RoomSettingsTab
                rooms={rooms}
                setRooms={setRooms}
                loadingRooms={loadingRooms}
                saving={saving}
                setSaving={setSaving}
                setError={setError}
                setSuccess={setSuccess}
                handleDeleteRoom={handleDeleteRoom}
              />
            )}

          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Icon Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                 className={`flex flex-col items-center justify-center space-y-1 focus:outline-none ${
                  isActive ? "text-green-600" : "text-slate-400"
                }`}
                aria-label={tab.label}
              >
                <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5px]" : ""}`} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, onFieldChange, onDelete }) {
  const { name, gender, quota = 15, current_count = 0, ketua_kamar, id } = room || {};
  const isFull = current_count >= quota;
  const focusColor = gender === 'male' ? 'focus:border-blue-500 focus:ring-blue-500' : 'focus:border-pink-500 focus:ring-pink-500';
  const hoverBorder = gender === 'male' ? 'hover:border-blue-300' : 'hover:border-pink-300';

  return (
    <div className={`border border-slate-200 rounded-lg p-4 ${hoverBorder} transition-colors bg-white`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className={`text-[11px] font-medium ${isFull ? 'text-red-600' : 'text-slate-500'}`}>
              {current_count || 0} / {quota} Santri
            </span>
          </div>
        </div>
        {id && (
          <button
            onClick={onDelete}
            className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
            title="Reset/Hapus data kamar"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ketua Kamar</label>
          <input
            type="text"
            value={ketua_kamar || ''}
            onChange={(e) => onFieldChange('ketua_kamar', e.target.value)}
            className={`block w-full rounded border-slate-300 shadow-sm ${focusColor} py-1.5 px-2 text-xs`}
            placeholder="Nama ketua..."
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kuota Maks</label>
          <input
            type="number"
            min="1"
            max="50"
            value={quota || 15}
            onChange={(e) => onFieldChange('quota', parseInt(e.target.value) || 15)}
            className={`block w-full rounded border-slate-300 shadow-sm ${focusColor} py-1.5 px-2 text-xs`}
          />
        </div>
      </div>
    </div>
  );
}

function RoomSettingsTab({ rooms, setRooms, loadingRooms, saving, setSaving, setError, setSuccess, handleDeleteRoom }) {

  const handleFieldChange = (roomName, gender, field, value) => {
    setRooms(prev => {
      const idx = prev.findIndex(r => r.name === roomName && r.gender === gender);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      }
      return [...prev, { id: null, name: roomName, gender, quota: 15, current_count: 0, ketua_kamar: '', [field]: value }];
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const promises = [];

      Object.entries(ROOM_NAMES).forEach(([gender, names]) => {
        names.forEach(name => {
          const roomData = rooms.find(r => r.name === name && r.gender === gender);
          if (!roomData) return;

          if (roomData.id) {
            promises.push(
              apiFetch(`/api/pendaftaran/studentrooms/${roomData.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  ketua_kamar: roomData.ketua_kamar || '',
                  quota: parseInt(roomData.quota) || 15,
                }),
              }).then(async (res) => {
                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error || `Gagal update ${name}`);
                }
                return res.json();
              })
            );
          } else if (roomData.ketua_kamar || roomData.quota !== 15) {
            promises.push(
              apiFetch('/api/pendaftaran/studentrooms', {
                method: 'POST',
                body: JSON.stringify({
                  name,
                  gender,
                  ketua_kamar: roomData.ketua_kamar || '',
                  quota: parseInt(roomData.quota) || 15,
                }),
              }).then(async (res) => {
                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error || `Gagal tambah ${name}`);
                }
                return res.json();
              })
            );
          }
        });
      });

      const results = await Promise.all(promises);
      setSuccess('Semua data kamar berhasil disimpan.');
      setTimeout(() => setSuccess(null), 3000);

      setRooms(prev => {
        const updated = [...prev];
        results.forEach(result => {
          if (result.success && result.data) {
            const idx = updated.findIndex(r => r.id === result.data.id);
            if (idx >= 0) {
              updated[idx] = result.data;
            } else {
              updated.push(result.data);
            }
          }
        });
        return updated;
      });
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data kamar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Manajemen Asrama</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola ketua kamar dan kuota asrama putra & putri.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || loadingRooms}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          <HiSave className="w-4 h-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Semua"}
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {loadingRooms ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400 text-sm font-medium">Memuat data kamar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <HiHome className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Asrama Putra</h3>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Wali Songo • 9 Kamar</p>
                </div>
              </div>
              <div className="space-y-3">
                {ROOM_NAMES.male.map((name) => {
                  const roomData = rooms.find(r => r.name === name && r.gender === 'male') || { id: null, name, gender: 'male', quota: 15, current_count: 0, ketua_kamar: '' };
                  return (
                    <RoomCard
                      key={name}
                      room={roomData}
                      onFieldChange={(field, value) => handleFieldChange(name, 'male', field, value)}
                      onDelete={() => roomData.id && handleDeleteRoom(roomData.id)}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-pink-100">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                  <HiHome className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Asrama Putri</h3>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Sahabiyah • 9 Kamar</p>
                </div>
              </div>
              <div className="space-y-3">
                {ROOM_NAMES.female.map((name) => {
                  const roomData = rooms.find(r => r.name === name && r.gender === 'female') || { id: null, name, gender: 'female', quota: 15, current_count: 0, ketua_kamar: '' };
                  return (
                    <RoomCard
                      key={name}
                      room={roomData}
                      onFieldChange={(field, value) => handleFieldChange(name, 'female', field, value)}
                      onDelete={() => roomData.id && handleDeleteRoom(roomData.id)}
                    />
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
