"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import '@/styles/globals.css';
import PrivateHeader from "@/components/PrivateHeader";
import { HiUserGroup, HiCheckCircle, HiClock, HiSearch, HiUser } from "react-icons/hi";

export default function PengujiDashboard() {
  const [activeTab, setActiveTab] = useState("jadwal");
  const [searchTerm, setSearchTerm] = useState("");
  const [santri, setSantri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        if (!parsed || parsed.role !== "penguji") {
          router.replace("/PrivateWeb/login");
          return;
        }

        const [santriResponse, nilaiResponse, settingsResponse] = await Promise.all([
          apiFetch('/api/pendaftaran/santri'),
          apiFetch('/api/pengujian/santri'),
          apiFetch('/api/settings')
        ]);

        if (!santriResponse.ok) {
          throw new Error('Failed to fetch santri data');
        }

        const santriResult = await santriResponse.json();
        const nilaiResult = nilaiResponse.ok ? await nilaiResponse.json() : { data: [] };

        if (settingsResponse.ok) {
          const settingsJson = await settingsResponse.json();
          if (settingsJson.data?.active_year) {
            setActiveYear(settingsJson.data.active_year);
          }
        }

        const allData = santriResult.data || [];
        const nilaiData = nilaiResult.data || [];

        const nilaiIds = new Set(nilaiData.map(item => item.id_pendaftaran));

        const acceptedSantri = allData.filter(item => item.status === 'accepted' || item.status === 'completed');

        const mappedData = acceptedSantri.map((item) => ({
          id: item.id_pendaftaran,
          name: item.nama_lengkap,
          email: item.email,
          phone: item.telp_ayah || '-',
          school: item.pendidikan_terakhir || '-',
          testDate: item.created_at,
          testTime: "08:00 - 12:00",
          status: item.status,
          hasNilai: nilaiIds.has(item.id_pendaftaran),
          tahun_pendaftaran: item.tahun_pendaftaran,
          createdAt: item.created_at,
        }));

        mappedData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        const yearFilteredData = activeYearRef.current
          ? mappedData.filter(item => String(item.tahun_pendaftaran) === activeYearRef.current)
          : mappedData;

        setSantri(yearFilteredData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleInputNilai = (santriId) => {
    router.push(`/PrivateWeb/penguji/nilai/${santriId}`);
  };

  const filteredSantri = santri.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);

    if (activeTab === "jadwal") {
      return matchesSearch;
    } else if (activeTab === "semua") {
      return matchesSearch;
    }
    return false;
  });

  const totalSantri = santri.length;
  const completedTests = santri.filter(s => s.hasNilai).length;
  const pendingTests = totalSantri - completedTests;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-bold text-xl mb-2">Terjadi Kesalahan</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
          <h2 id="stats-heading" className="sr-only">
            Statistik Tes Santri
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Santri
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totalSantri}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Menunggu tes</p>
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
                    Tes Selesai
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {completedTests}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total selesai</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <HiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Tes Pending
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {pendingTests}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Belum diuji</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <HiClock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="schedule-heading" className="mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Data Santri
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Santri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asal Sekolah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Daftar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSantri.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <HiUser className="mx-auto h-12 w-12 text-gray-400 opacity-50" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          Tidak ada data
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {activeTab === "semua"
                            ? "Belum ada santri yang terdaftar"
                            : "Tidak ada jadwal tes"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSantri.map((s, index) => (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleInputNilai(s.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {s.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {s.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {s.school}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {s.testDate ? new Date(s.testDate).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {s.hasNilai ? (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Selesai
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInputNilai(s.id);
                            }}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-4 py-2 rounded-md hover:bg-green-100 transition font-medium flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Input Nilai
                          </button>
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
