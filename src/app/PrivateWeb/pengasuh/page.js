"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";
import { HiUserGroup, HiCheckCircle, HiCurrencyDollar, HiInbox, HiChartBar, HiClipboard, HiEye, HiX, HiClock, HiCheck } from "react-icons/hi";
import "@/styles/globals.css";
export default function PengasuhDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [santri, setSantri] = useState([]);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [biaya, setBiaya] = useState(0);
  const [activeYear, setActiveYear] = useState("");
  const router = useRouter();
  const activeYearRef = useRef(activeYear);
  useEffect(() => {
    activeYearRef.current = activeYear;
  }, [activeYear]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!getAuthToken()) {
          router.replace("/PrivateWeb/login");
          return;
        }
        const parsed = getPrivateSession();
        if (!parsed || parsed.role !== "pengasuh") {
          router.replace("/PrivateWeb/login");
          return;
        }
        const [response, settingsResponse] = await Promise.all([
          apiFetch('/api/pengasuh/santri'),
          apiFetch('/api/settings')
        ]);
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        if (settingsResponse.ok) {
          const settingsJson = await settingsResponse.json();
          if (settingsJson.data?.active_year) {
            setActiveYear(settingsJson.data.active_year);
          }
        }
        const mappedData = (result.data || []).map((item) => {
          const levelAlquran = item.level_alquran || "-";
          const levelKitab = item.level_kitab || "-";
          return {
            id: item.id_pendaftaran,
            name: item.nama_lengkap,
            email: item.email,
            phone: item.telp_ayah || item.telp_ibu || "-",
            school: item.pendidikan_terakhir || "-",
            parentName: item.nama_ayah || item.nama_ibu || "-",
            parentPhone: item.telp_ayah || item.telp_ibu || "-",
            parentAyah: item.nama_ayah || "-",
            parentIbu: item.nama_ibu || "-",
            parentAyahPhone: item.telp_ayah || "-",
            parentIbuPhone: item.telp_ibu || "-",
            address: item.alamat_santri || "-",
            status: item.status,
            acceptedDate: item.created_at,
            room: "-",
            dormitory: "-",
            paymentStatus: item.pembayaran_status || "belum",
            paymentAmount: item.nominal ? parseInt(item.nominal) : 0,
            paymentDate: item.pembayaran_created_at || null,
            paymentMethod: item.metode_pembayaran || "-",
            paymentProof: item.bukti_pembayaran || "-",
            quranScore: item.nilai_alquran || 0,
            kitabScore: item.nilai_kitab || 0,
            quranLevel: levelAlquran,
            kitabLevel: levelKitab,
            examNotes: item.catatan_penguji || "-",
            examDate: item.nilai_created_at || "-",
            recommendedClass: "-",
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
            tahun_pendaftaran: item.tahun_pendaftaran,
          };
        });
        mappedData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setSantri(mappedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRes = await apiFetch('/api/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const year = settingsData.data?.active_year || new Date().getFullYear().toString();
          const biayaRes = await apiFetch(`/api/settings/biaya/${year}`);
          if (biayaRes.ok) {
            const biayaData = await biayaRes.json();
            setBiaya(biayaData.biaya || 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings/biaya', err);
      }
    };
    fetchSettings();
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const yearFilteredSantri = activeYear
    ? santri.filter(item => String(item.tahun_pendaftaran) === activeYear)
    : santri;
  const filteredSantri = Array.isArray(yearFilteredSantri)
    ? yearFilteredSantri.filter((s) => {
        const matchesSearch =
          (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.phone || "").includes(searchTerm) ||
          (s.parentName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (s.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.school || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "sudah" &&
            (s.status === "accepted" || s.status === "completed")) ||
          (filterStatus === "belum" &&
            s.status !== "accepted" &&
            s.status !== "completed");
        return matchesSearch && matchesStatus;
      })
    : [];
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage);
  const paginatedSantri = filteredSantri.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalSantri = Array.isArray(yearFilteredSantri) ? yearFilteredSantri.length : 0;
  const sudahSantri = Array.isArray(yearFilteredSantri)
    ? yearFilteredSantri.filter((s) => s.status === "accepted" || s.status === "completed")
        .length
    : 0;
  const sudahUji = Array.isArray(yearFilteredSantri)
    ? yearFilteredSantri.filter((s) => s.quranScore > 0 || s.kitabScore > 0).length
    : 0;
  const paymentStats = useMemo(() => {
    if (!Array.isArray(yearFilteredSantri)) return { sudahBayar: 0, menungguKonfirmasi: 0, totalNominalTerbayar: 0 };
    const verified = ["lunas", "confirmed", "success"];
    let sudahBayar = 0;
    let menungguKonfirmasi = 0;
    let totalNominalTerbayar = 0;
    for (const s of yearFilteredSantri) {
      if (verified.includes(s.paymentStatus)) {
        sudahBayar++;
        totalNominalTerbayar += s.paymentAmount || 0;
      } else if (s.paymentStatus && s.paymentStatus !== "belum") {
        menungguKonfirmasi++;
      }
    }
    return { sudahBayar, menungguKonfirmasi, totalNominalTerbayar };
  }, [yearFilteredSantri]);
  const totalNominalTerbayar = paymentStats.totalNominalTerbayar;
  const sudahBayar = paymentStats.sudahBayar;
  const menungguKonfirmasi = paymentStats.menungguKonfirmasi;
  const getActivityStatus = (s) => {
    const hasExam = s.quranScore > 0 || s.kitabScore > 0;
    const isPaymentVerified = s.paymentStatus === "lunas" || s.paymentStatus === "confirmed" || s.paymentStatus === "success";
    if (s.status === "completed" && hasExam && isPaymentVerified) return "completed";
    if (hasExam) return "examined";
    if (isPaymentVerified) return "paid";
    if (s.status === "accepted" || s.status === "completed") return "accepted";
    return "pending";
  };
  const getActivityLabel = (status) => {
    switch (status) {
      case "examined": return "Nilai telah dimasukkan";
      case "paid": return "Pembayaran diverifikasi";
      case "completed": return "Selesai";
      case "accepted": return "Diterima";
      default: return "Menunggu";
    }
  };
  const getActivityIcon = (status) => {
    switch (status) {
      case "examined": return <HiClipboard className="w-5 h-5 text-blue-600" />;
      case "paid": return <HiCurrencyDollar className="w-5 h-5 text-green-600" />;
      case "completed": return <HiCheckCircle className="w-5 h-5 text-green-600" />;
      case "accepted": return <HiCheck className="w-5 h-5 text-green-600" />;
      default: return <HiClock className="w-5 h-5 text-yellow-600" />;
    }
  };
  const [biayaDetail, setBiayaDetail] = useState(0);
  const openDetail = async (s) => {
    setSelectedSantri(s);
    setIsDetailOpen(true);
    setBiayaDetail(0);
    try {
      const year = activeYear || new Date(s.acceptedDate || s.createdAt).getFullYear().toString();
      const res = await apiFetch(`/api/settings/biaya/${year}`);
      if (res.ok) {
        const data = await res.json();
        setBiayaDetail(data.biaya || 0);
      }
    } catch (err) {
      console.error('Failed to fetch detail biaya', err);
    }
  };
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-bold text-xl mb-2">
              Terjadi Kesalahan
            </p>
            <p className="text-gray-600 text-sm mt-1 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white">
      <PrivateHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeYear && (
          <div className="mb-6 inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-sm font-medium text-green-800">
              Tahun Pendaftaran Aktif: <span className="font-bold">{activeYear}</span>
            </span>
          </div>
        )}
        <section aria-labelledby="stats-heading" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Pendaftaran Santri Baru
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totalSantri}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total pendaftar</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <HiUserGroup className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Pembayaran
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {sudahBayar}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sudah dikonfirmasi {menungguKonfirmasi > 0 ? ` · ${menungguKonfirmasi} menunggu` : ''}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <HiCurrencyDollar className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Nilai Ujian Santri Baru
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {sudahUji}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Santri sudah diuji
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <HiChartBar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Diterima / Selesai
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {sudahSantri}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Status aktif</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <HiCheckCircle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section aria-labelledby="exam-results-heading" className="mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 id="exam-results-heading" className="text-lg font-semibold text-gray-900">
                Hasil Pengujian Santri
              </h3>
            </div>
            {paginatedSantri.length === 0 ? (
              <div className="text-center py-12">
                <HiInbox className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada data
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Belum ada santri yang diuji
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai Al-Quran</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level Al-Quran</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai Kitab</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level Kitab</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan Penguji</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pengujian</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSantri.map((s, i) => {
                      const actStatus = getActivityStatus(s);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(s)}>
                          <td className="px-4 py-3 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{s.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{s.quranScore}</td>
                          <td className="px-4 py-3 whitespace-nowrap capitalize">{s.quranLevel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{s.kitabScore}</td>
                          <td className="px-4 py-3 whitespace-nowrap capitalize">{s.kitabLevel}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 max-w-[200px] truncate">{s.examNotes}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">{s.examDate !== '-' ? new Date(s.examDate).toLocaleDateString("id-ID") : '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              actStatus === "completed" ? "bg-green-100 text-green-800" :
                              actStatus === "examined" ? "bg-blue-100 text-blue-800" :
                              actStatus === "paid" ? "bg-green-100 text-green-800" :
                              actStatus === "accepted" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {getActivityIcon(actStatus)}
                              {getActivityLabel(actStatus)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Pagination */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-[11px] sm:text-sm text-gray-600 text-center sm:text-left">
                Menampilkan{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredSantri.length,
                  )}
                </span>{" "}
                dari{" "}
                <span className="font-medium">{filteredSantri.length}</span>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[11px] sm:text-sm font-medium ${currentPage === i + 1
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-[11px] sm:text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 min-w-[65px] sm:min-w-[80px]"
                >
                  <span className="hidden xs:inline">Berikutnya</span>
                  <span className="xs:hidden">❯</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <section aria-labelledby="activity-heading">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 id="activity-heading" className="text-lg font-semibold text-gray-900">
                Aktivitas Santri Baru
              </h3>
            </div>
            {paginatedSantri.length === 0 ? (
              <div className="text-center py-12">
                <HiInbox className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada aktivitas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Belum ada pendaftaran santri baru
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {paginatedSantri.slice(0, 5).map((s) => {
                  const actStatus = getActivityStatus(s);
                  return (
                    <div
                      key={s.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openDetail(s)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              actStatus === 'completed' ? 'bg-green-100' : 
                              actStatus === 'examined' ? 'bg-blue-100' :
                              actStatus === 'paid' ? 'bg-green-100' :
                              actStatus === 'accepted' ? 'bg-yellow-100' : 
                              'bg-gray-100'
                            }`}>
                              {getActivityIcon(actStatus)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {s.name}
                              </p>
                              <p className="text-sm text-gray-500">{getActivityLabel(actStatus)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {s.createdAt
                              ? new Date(s.createdAt).toLocaleDateString("id-ID")
                              : "-"}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              actStatus === "completed" ? "bg-green-100 text-green-800" :
                              actStatus === "examined" ? "bg-blue-100 text-blue-800" :
                              actStatus === "paid" ? "bg-green-100 text-green-800" :
                              actStatus === "accepted" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getActivityLabel(actStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      {isDetailOpen && selectedSantri && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">Detail Santri</h3>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <HiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Santri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Nama:</span> <span className="font-medium">{selectedSantri.name}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedSantri.email}</span></div>
                  <div><span className="text-gray-500">Alamat:</span> <span className="font-medium">{selectedSantri.address}</span></div>
                  <div><span className="text-gray-500">Sekolah:</span> <span className="font-medium">{selectedSantri.school}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Orang Tua</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Ayah:</span> <span className="font-medium">{selectedSantri.parentAyah}</span></div>
                  <div><span className="text-gray-500">Ibu:</span> <span className="font-medium">{selectedSantri.parentIbu}</span></div>
                  <div><span className="text-gray-500">HP Ayah:</span> <span className="font-medium">{selectedSantri.parentAyahPhone}</span></div>
                  <div><span className="text-gray-500">HP Ibu:</span> <span className="font-medium">{selectedSantri.parentIbuPhone}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Hasil Pendaftaran</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{selectedSantri.status}</span></div>
                  <div><span className="text-gray-500">Tanggal Daftar:</span> <span className="font-medium">{selectedSantri.acceptedDate ? new Date(selectedSantri.acceptedDate).toLocaleDateString("id-ID") : '-'}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Pembayaran</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{selectedSantri.paymentStatus}</span></div>
                   <div><span className="text-gray-500">Nominal:</span> <span className="font-medium">Rp {biayaDetail ? biayaDetail.toLocaleString("id-ID") : '-'}</span></div>
                  <div><span className="text-gray-500">Metode:</span> <span className="font-medium">{selectedSantri.paymentMethod}</span></div>
                  <div><span className="text-gray-500">Tanggal:</span> <span className="font-medium">{selectedSantri.paymentDate ? new Date(selectedSantri.paymentDate).toLocaleDateString("id-ID") : '-'}</span></div>
                  {selectedSantri.paymentProof && selectedSantri.paymentProof !== "-" && (
                    <div className="md:col-span-2">
                      <span className="text-gray-500">Bukti Pembayaran:</span>{" "}
                      <a href={selectedSantri.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Lihat Bukti
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Hasil Pengujian</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Nilai Al-Quran:</span> <span className="font-medium">{selectedSantri.quranScore}</span></div>
                  <div><span className="text-gray-500">Level Al-Quran:</span> <span className="font-medium capitalize">{selectedSantri.quranLevel}</span></div>
                  <div><span className="text-gray-500">Nilai Kitab:</span> <span className="font-medium">{selectedSantri.kitabScore}</span></div>
                  <div><span className="text-gray-500">Level Kitab:</span> <span className="font-medium capitalize">{selectedSantri.kitabLevel}</span></div>
                  <div className="md:col-span-2"><span className="text-gray-500">Catatan Penguji:</span> <span className="font-medium">{selectedSantri.examNotes}</span></div>
                  <div><span className="text-gray-500">Tanggal Pengujian:</span> <span className="font-medium">{selectedSantri.examDate !== '-' ? new Date(selectedSantri.examDate).toLocaleDateString("id-ID") : '-'}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Riwayat Status</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-full ${selectedSantri.status === 'accepted' || selectedSantri.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedSantri.status === 'accepted' || selectedSantri.status === 'completed' ? 'Diterima' : 'Menunggu'}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${['lunas','confirmed','success'].includes(selectedSantri.paymentStatus) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {['lunas','confirmed','success'].includes(selectedSantri.paymentStatus) ? 'Lunas' : selectedSantri.paymentStatus}
                  </span>
                  {(selectedSantri.quranScore > 0 || selectedSantri.kitabScore > 0) && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">Sudah Diuji</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}