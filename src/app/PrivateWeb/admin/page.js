"use client";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";
import { HiUsers, HiClock, HiCheckCircle, HiXCircle, HiPrinter, HiChevronDown, HiTrendingUp, HiExclamation, HiEye, HiCheck, HiX, HiSave, HiCog, HiCurrencyDollar } from "react-icons/hi";
const REGISTRATION_SCHEDULE_KEY = "registration_schedule";
const DEFAULT_REGISTRATION_SCHEDULE = {
  wave1: "1 Jan - 31 Mar 2026",
  wave2: "1 Apr - 30 Jun 2026",
  wave3: "1 Jul - 30 Sep 2026",
};
export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [santri, setSantri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [registrationSchedule, setRegistrationSchedule] = useState(DEFAULT_REGISTRATION_SCHEDULE);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [activeYear, setActiveYear] = useState("");
  const [settings, setSettings] = useState({});
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);
  const activeYearRef = useRef(activeYear);
  const [pendaftaranAktif, setPendaftaranAktif] = useState(true);
  useEffect(() => {
    activeYearRef.current = activeYear;
  }, [activeYear]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let parsed;
        try {
          if (!getAuthToken()) {
            router.replace("/PrivateWeb/login");
            return;
          }
          parsed = getPrivateSession();
          if (!parsed || parsed.role !== "admin") {
            router.replace("/PrivateWeb/login");
            return;
          }
        } catch (parseErr) {
          console.error('Session parse error:', parseErr);
          router.replace("/PrivateWeb/login");
          return;
        }
        setUser(parsed);
        let activeYearValue = "";
        try {
          const settingsRes = await apiFetch('/api/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings(settingsData.data || {});
            activeYearValue = settingsData.data?.active_year || new Date().getFullYear().toString();
            setActiveYear(activeYearValue);
            activeYearRef.current = activeYearValue;
          }
        } catch (settingsErr) {
          console.error('Failed to fetch settings:', settingsErr);
          activeYearValue = new Date().getFullYear().toString();
          activeYearRef.current = activeYearValue;
        }
        try {
          const pendaftaranRes = await apiFetch('/api/settings/pendaftaran_aktif');
          if (pendaftaranRes.ok) {
            const pendaftaranData = await pendaftaranRes.json();
            setPendaftaranAktif(!!pendaftaranData.data.pendaftaran_aktif);
          }
        } catch (pendaftaranErr) {
          console.error('Failed to fetch pendaftaran aktif:', pendaftaranErr);
        }
        console.log('Fetching from API...');
        try {
          const healthCheck = await apiFetch('/api/health', {
            method: 'GET',
          });
          if (!healthCheck.ok) {
            throw new Error('Backend server is not responding properly');
          }
          console.log('Backend health check: OK');
        } catch (healthErr) {
          console.error('Backend health check failed:', healthErr);
          throw new Error('Server backend tidak dapat dihubungi. Pastikan server backend sedang berjalan.');
        }
        const response = await apiFetch('/api/pendaftaran/santri');
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error('Failed to fetch data: ' + response.status);
        }
        const result = await response.json();
        console.log('API Response:', result);
        const registrations = result.data || [];
        console.log('Registrations:', registrations);
        const mappedSantri = registrations.map((item) => ({ 
          id: item.id_pendaftaran, 
          name: item.nama_lengkap,
          email: item.email,
          phone: item.telp_ayah || '-',
          school: item.pendidikan_terakhir || '-',
          parentName: item.nama_ayah || item.nama_ibu || '-',
          status: item.status,
          date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '-',
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          address: item.alamat_santri || '-',
          tahun_pendaftaran: item.tahun_pendaftaran,
          hasExam: !!(item.penilaian && (item.penilaian.nilai_alquran !== null || item.penilaian.nilai_kitab !== null)),
          paymentId: item.pembayaran?.[0]?.id || null,
          paymentStatus: item.pembayaran?.[0]?.status_pembayaran || 'pending',
        }));
        mappedSantri.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setSantri(mappedSantri);
      } catch (err) {
        console.error('Error fetching data:', err);
        console.error('Error message:', err.message);
        let errorMessage = err.message;
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          errorMessage = 'Server backend tidak dapat dihubungi. Pastikan server backend sedang berjalan.';
        } else if (err.message.includes('NetworkError') || err.message.includes('network request failed')) {
          errorMessage = 'Terjadi kesalahan jaringan. Periksa koneksi Anda.';
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const savedSchedule = localStorage.getItem(REGISTRATION_SCHEDULE_KEY);
    if (!savedSchedule) return;
    try {
      setRegistrationSchedule({
        ...DEFAULT_REGISTRATION_SCHEDULE,
        ...JSON.parse(savedSchedule),
      });
    } catch (error) {
      console.error("Gagal membaca jadwal pendaftaran:", error);
    }
  }, []);
  const handleScheduleChange = (field, value) => {
    setRegistrationSchedule((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSaveSchedule = () => {
    localStorage.setItem(REGISTRATION_SCHEDULE_KEY, JSON.stringify(registrationSchedule));
    window.dispatchEvent(new Event("storage"));
    setIsScheduleModalOpen(false);
    alert("Tanggal pendaftaran berhasil diperbarui");
  };
  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    setUpdateError(null);
    try {
      const response = await apiFetch(`/api/pendaftaran/santri/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memperbarui status');
      }
      const result = await response.json();
      setSantri(prevSantri =>
        prevSantri.map(s =>
          s.id === id ? { ...s, status: newStatus } : s
        )
      );
      const statusText = newStatus === 'accepted' ? 'Diterima' : 'Ditolak';
      alert(`Status berhasil diubah menjadi ${statusText}`);
      if (statusFilter !== 'all' && statusFilter !== newStatus) {
        setStatusFilter('all');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setUpdateError(err.message || 'Terjadi kesalahan saat memperbarui status');
      alert(`Gagal memperbarui status: ${err.message || 'Silakan coba lagi'}`);
    } finally {
      setUpdatingId(null);
    }
  };
  const handleDeleteSantri = async (id) => {
    const confirmation = confirm('Apakah Anda yakin ingin menghapus data pendaftaran ini?\n\nData akan di-soft delete dan tidak muncul di daftar utama, tetapi tetap disimpan di database untuk arsip.');
    if (!confirmation) return;
    try {
      const response = await apiFetch(`/api/pendaftaran/santri/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus data');
      }
      setSantri(prevSantri => prevSantri.filter(s => s.id !== id));
      alert('Data pendaftaran berhasil dihapus');
    } catch (err) {
      console.error('Error deleting santri:', err);
      alert(`Gagal menghapus data: ${err.message || 'Silakan coba lagi'}`);
    }
  };
  const handleStatusChange = (id, newStatus) => {
    updateStatus(id, newStatus);
  };
  const handleViewDetail = (id) => {
    router.push(`/PrivateWeb/admin/santri/${id}`);
  };
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };
  const yearFilteredSantri = activeYear
    ? santri.filter((item) => String(item.tahun_pendaftaran) === activeYear)
    : santri;
  const filteredSantri = yearFilteredSantri.filter((item) => {
    const effectiveStatus = item.hasExam ? "completed" : (item.status === "submitted" ? "pending" : item.status);
    const matchesStatus =
      statusFilter === "all" || effectiveStatus === statusFilter;
    return matchesStatus;
  });
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage);
  const paginatedSantri = filteredSantri.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalSantri = yearFilteredSantri.length;
  const pendingSantri = yearFilteredSantri.filter((s) => (s.status === "pending" || s.status === "submitted") && !s.hasExam).length;
  const acceptedSantri = yearFilteredSantri.filter(
    (s) => (s.status === "accepted" || s.status === "completed" || s.hasExam),
  ).length;
  const rejectedSantri = yearFilteredSantri.filter(
    (s) => s.status === "rejected" && !s.hasExam,
  ).length;
  return (
    <div className="min-h-screen bg-gray-50">
      <PrivateHeader />
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <HiExclamation className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-red-600 font-medium">Terjadi kesalahan</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
) : (
       <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="mb-4 flex items-center gap-3">
           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${pendaftaranAktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
             {pendaftaranAktif ? 'Pendaftaran Aktif' : 'Pendaftaran Belum Dibuka'}
           </span>
         </div>
         <section aria-labelledby="stats-heading" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Pendaftaran
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totalSantri}
                  </p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <HiTrendingUp className="w-4 h-4 mr-1" />
                    {totalSantri > 0 ? ((pendingSantri / totalSantri) * 100).toFixed(1) : '0'}% menunggu
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <HiUsers className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Menunggu Verifikasi
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {pendingSantri}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Perlu tindakan segera
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <HiClock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Diterima</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {acceptedSantri}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Siap daftar ulang
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <HiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Ditolak</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {rejectedSantri}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Perlu konfirmasi</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <HiXCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section aria-labelledby="table-heading" className="mb-8">
          <div className="bg-white rounded-xl shadow-md">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h2
                  id="table-heading"
                  className="text-lg font-semibold text-gray-900 flex-shrink-0"
                >
                  Daftar Calon Santri
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto flex-wrap">
                  <div className="flex flex-wrap gap-2">
                    {/* Year dropdown */}
                    <div
                      className="relative w-full sm:w-auto min-w-[160px]"
                      ref={yearDropdownRef}
                    >
                      <button
                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                        className="w-full sm:w-[160px] px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-xs sm:text-sm min-h-[34px] sm:min-h-[42px]"
                      >
                        <span className="truncate">
                          {activeYear ? `Tahun ${activeYear}` : "Semua Tahun"}
                        </span>
                        <HiChevronDown
                          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                            isYearDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isYearDropdownOpen && (
                        <div className="absolute z-20 mt-1 right-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                          {[
                            { value: "", label: "Semua Tahun" },
                            {
                              value: String(new Date().getFullYear()),
                              label: `${new Date().getFullYear()}`,
                            },
                            {
                              value: String(new Date().getFullYear() - 1),
                              label: String(new Date().getFullYear() - 1),
                            },
                            {
                              value: String(new Date().getFullYear() - 2),
                              label: String(new Date().getFullYear() - 2),
                            },
                          ].map((option) => (
                            <button
                              key={option.value || "all"}
                              onClick={() => {
                                setActiveYear(option.value);
                                setIsYearDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm transition ${
                                activeYear === option.value
                                  ? "bg-green-50 text-green-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Status dropdown */}
                    <div
                      className="relative w-full sm:w-auto min-w-[160px]"
                      ref={dropdownRef}
                    >
                      <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full sm:w-[160px] px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-xs sm:text-sm min-h-[34px] sm:min-h-[42px]"
                      >
                        <span className="truncate">
                          {statusFilter === "all" && "Semua Status"}
                          {statusFilter === "pending" && "Menunggu"}
                          {statusFilter === "accepted" && "Diterima"}
                          {statusFilter === "completed" && "Selesai"}
                          {statusFilter === "rejected" && "Ditolak"}
                        </span>
                        <HiChevronDown
                          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                            isStatusDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isStatusDropdownOpen && (
                        <div className="absolute z-20 mt-1 right-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                          {[
                            { value: "all", label: "Semua Status" },
                            { value: "pending", label: "Menunggu" },
                            { value: "accepted", label: "Diterima" },
                            { value: "completed", label: "Selesai" },
                            { value: "rejected", label: "Ditolak" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setStatusFilter(option.value);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm transition ${
                                statusFilter === option.value
                                  ? "bg-green-50 text-green-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                    <button
                      className="hidden sm:flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-w-[120px]"
                      onClick={() => {
                        const params = activeYear ? `?year=${activeYear}` : "";
                        router.push(`/PrivateWeb/admin/laporan${params}`);
                      }}
                      title="Cetak Laporan Santri Diterima"
                    >
                      <HiPrinter className="w-4 h-4 mr-2" />
                      Cetak Laporan
                    </button>
                    <button
                      className="hidden sm:flex items-center justify-center p-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      onClick={() => router.push('/PrivateWeb/admin/setting')}
                      title="Pengaturan"
                    >
                      <HiCog className="w-5 h-5" />
                    </button>
                  </div>
                <div className="sm:hidden grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      const params = activeYear ? `?year=${activeYear}` : "";
                      router.push(`/PrivateWeb/admin/laporan${params}`);
                    }}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                    title="Cetak Laporan Santri Diterima"
                  >
                    <HiPrinter className="w-4 h-4 mr-2" />
                    Cetak Laporan
                  </button>
                  <button
                    onClick={() => router.push('/PrivateWeb/admin/setting')}
                    className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
                    title="Pengaturan"
                  >
                    <HiCog className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="min-w-[580px] md:min-w-full">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap">No</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap">Nama & HP</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap hidden sm:table-cell">Email</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap hidden md:table-cell">Sekolah</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap hidden lg:table-cell">Orang Tua</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-left font-medium text-gray-600 tracking-wider whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSantri.map((santri, index) => (
                      <tr key={santri.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap text-gray-800">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                          <div className="font-medium text-gray-900 truncate max-w-[130px]">{santri.name}</div>
                          <div className="text-gray-600 truncate max-w-[130px] mt-0.5 text-[11px]">{santri.phone}</div>
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-gray-800 truncate max-w-[150px]">{santri.email}</div>
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap hidden md:table-cell text-gray-800">
                          {santri.school}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap hidden lg:table-cell text-gray-800">
                          {santri.parentName}
                        </td>
                          <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 inline-flex text-[10px] sm:text-xs font-medium rounded-full ${
                              santri.hasExam ? "bg-blue-100 text-blue-800" :
                              santri.status === "pending" || santri.status === "submitted" ? "bg-yellow-100 text-yellow-800" :
                              santri.status === "accepted" ? "bg-green-100 text-green-800" :
                              santri.status === "completed" ? "bg-blue-100 text-blue-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {santri.hasExam ? "Selesai" :
                              santri.status === "pending" || santri.status === "submitted" ? "Menunggu" :
                              santri.status === "accepted" ? "Diterima" :
                              santri.status === "completed" ? "Selesai" : "Ditolak"}
                            </span>
                          </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                            {/* View detail */}
                            <button
                              onClick={() => handleViewDetail(santri.id)}
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                              title="Lihat Detail"
                            >
                              <HiEye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </button>
                            {(santri.status === "pending" || santri.status === "submitted") && !santri.hasExam && (
                              <>
                                {/* Accept with loading */}
                                <button
                                  onClick={() => handleStatusChange(santri.id, "accepted")}
                                  disabled={updatingId === santri.id}
                                  className={`p-1.5 rounded transition-colors ${
                                    updatingId === santri.id 
                                      ? 'bg-green-200 cursor-wait' 
                                      : 'hover:bg-green-100'
                                  }`}
                                  title="Terima Pendaftaran"
                                >
                                  {updatingId === santri.id ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <HiCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleStatusChange(santri.id, "rejected")}
                                  disabled={updatingId === santri.id}
                                  className={`p-1.5 rounded transition-colors ${
                                    updatingId === santri.id 
                                      ? 'bg-red-200 cursor-wait' 
                                      : 'hover:bg-red-100'
                                  }`}
                                  title="Tolak Pendaftaran"
                                >
                                  {updatingId === santri.id ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <HiX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                  )}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteSantri(santri.id)}
                              className="p-1.5 rounded hover:bg-red-100 transition-colors"
                              title="Hapus Data"
                            >
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Pagination */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-[11px] sm:text-sm text-gray-600 text-center sm:text-left">
                  Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSantri.length)}</span> dari{" "}
                  <span className="font-medium">{filteredSantri.length}</span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-[11px] sm:text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 min-w-[65px] sm:min-w-[80px]"
                  >
                    <span className="hidden xs:inline">Sebelumnya</span>
                    <span className="xs:hidden">❮</span>
                  </button>
                  <div className="flex flex-wrap gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[11px] sm:text-sm font-medium ${
                          currentPage === i + 1
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-[11px] sm:text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 min-w-[65px] sm:min-w-[80px]"
                  >
                    <span className="hidden xs:inline">Berikutnya</span>
                    <span className="xs:hidden">❯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
</section>
      </main>
      )}
      {updateError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          <p className="font-medium">{updateError}</p>
        </div>
      )}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Ubah Tanggal Pendaftaran
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Tanggal ini akan tampil pada halaman awal di bagian Jadwal Pendaftaran.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "wave1", label: "Gelombang I" },
                { key: "wave2", label: "Gelombang II" },
                { key: "wave3", label: "Gelombang III" },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={registrationSchedule[item.key]}
                    onChange={(event) => handleScheduleChange(item.key, event.target.value)}
                    placeholder="Contoh: 1 Jan - 31 Mar 2026"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRegistrationSchedule(DEFAULT_REGISTRATION_SCHEDULE);
                  localStorage.setItem(REGISTRATION_SCHEDULE_KEY, JSON.stringify(DEFAULT_REGISTRATION_SCHEDULE));
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <HiSave className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
