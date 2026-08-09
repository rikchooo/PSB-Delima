"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";

export default function SantriDetail() {
  const [santri, setSantri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [pembayaran, setPembayaran] = useState(null);
  const [biayaDetail, setBiayaDetail] = useState(0);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Fungsi untuk mengambil data santri berdasarkan ID dari URL
    const fetchData = async () => {
      try {
        if (!getAuthToken()) {
          router.replace("/PrivateWeb/login");
          return;
        }

        // Cek role user, hanya admin yang boleh mengakses halaman ini
        const parsed = getPrivateSession();
        if (!parsed || parsed.role !== "admin") {
          router.replace("/PrivateWeb/login");
          return;
        }

        setAuthChecked(true);

        // Fetch data santri dari backend
        const response = await apiFetch(`/api/pendaftaran/santri/${params.id}`, {
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }

        // Ambil data dari response
        const result = await response.json();
        const data = result.data;
        
        setSantri({
          id: data.id_pendaftaran,
          namaLengkap: data.nama_lengkap,
          namaPanggilan: data.nama_panggilan,
          email: data.email,
          jenisKelamin: data.jenis_kelamin,
          tempatLahir: data.tempat_lahir,
          tanggalLahir: data.tanggal_lahir,
          anakKe: data.anak_ke,
          pendidikanTerakhir: data.pendidikan_terakhir,
          tinggalBersama: data.tinggal_bersama,
          alamatSantri: data.alamat_santri,
          namaAyah: data.nama_ayah,
          ttlAyah: data.ttl_ayah,
          usiaAyah: data.usia_ayah,
          pekerjaanAyah: data.pekerjaan_ayah,
          penghasilanAyah: data.penghasilan_ayah,
          alamatAyah: data.alamat_ayah,
          telpAyah: data.telp_ayah,
          namaIbu: data.nama_ibu,
          ttlIbu: data.ttl_ibu,
          usiaIbu: data.usia_ibu,
          pekerjaanIbu: data.pekerjaan_ibu,
          penghasilanIbu: data.penghasilan_ibu,
          alamatIbu: data.alamat_ibu,
          telpIbu: data.telp_ibu,
          status: data.status,
          createdAt: data.created_at,
          tahunPendaftaran: data.tahun_pendaftaran,
        });
        
        setStatus(data.status || "pending");

        const year = String(data.tahun_pendaftaran || new Date(data.created_at).getFullYear());
        const biayaRes = await apiFetch(`/api/settings/biaya/${year}`);
        if (biayaRes.ok) {
          const biayaData = await biayaRes.json();
          setBiayaDetail(biayaData.biaya || 0);
        }

        const paymentRes = await apiFetch(`/api/pembayaran/pendaftaran/${params.id}`);
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          setPembayaran(paymentData.data || null);
        }
      } catch (err) {
        console.error('Error fetching ', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  // Fungsi tombol kembali
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/PrivateWeb/admin");
    }
  };

  const handleDelete = async () => {
    const confirmation = confirm('Apakah Anda yakin ingin menghapus data pendaftaran ini?\n\nData akan di-soft delete dan tetap disimpan di database untuk arsip.');
    if (!confirmation) return;

    try {
      const res = await apiFetch(`/api/pendaftaran/santri/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menghapus data');
      }

      alert('Data pendaftaran berhasil dihapus');
      router.push('/PrivateWeb/admin');
    } catch (err) {
      alert(`Gagal menghapus data: ${err.message}`);
    }
  };

  const updatePaymentStatus = async (newStatus) => {
    if (!pembayaran?.id) return;
    try {
      const res = await apiFetch(`/api/pembayaran/${pembayaran.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status_pembayaran: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui status pembayaran');
      const updated = await res.json();
      setPembayaran(prev => ({ ...prev, status_pembayaran: newStatus, ...updated.data }));
      alert(`Status pembayaran berhasil diubah menjadi ${newStatus}`);
    } catch (err) {
      alert(`Gagal memperbarui pembayaran: ${err.message}`);
    }
  };

  // Fungsi untuk mendapatkan badge status dengan warna yang sesuai
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Menunggu', className: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' },
      accepted: { label: 'Diterima', className: 'bg-gradient-to-r from-green-400 to-green-600 text-white' },
      rejected: { label: 'Ditolak', className: 'bg-gradient-to-r from-red-400 to-red-600 text-white' },
      completed: { label: 'Selesai', className: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <div className={`px-4 py-2 inline-flex items-center text-sm font-semibold rounded-lg shadow-md ${config.className}`}>
        {config.label}
      </div>
    );
  };

  // Tampilkan loading state
  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
            <p className="text-red-600 font-bold text-xl mb-2">Terjadi Kesalahan</p>
            <p className="text-gray-600 text-sm mt-1 mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">

          <button
            onClick={handleDelete}
            className="flex items-center text-red-600 hover:text-red-700 mb-4 sm:mb-6 transition-colors duration-300 group"
          >
            <svg 
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-semibold text-base sm:text-lg">Hapus Data</span>
          </button>
          
          <article className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Detail Pendaftaran Santri</h1>
                <p className="text-sm sm:text-base text-gray-600">
                  ID Pendaftaran: <span className="font-semibold text-gray-800">{santri?.id}</span>
                </p>
              </div>
              <div className="flex items-center">
                {getStatusBadge(status)}
              </div>
            </div>
          </article>
        </header>

        <div className="space-y-4 sm:space-y-6">
          <section 
            aria-labelledby="santri-data"
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 id="santri-data" className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Data Calon Santri
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              {[
                { label: "Nama Lengkap", value: santri?.namaLengkap },
                { label: "Nama Panggilan", value: santri?.namaPanggilan },
                { label: "Jenis Kelamin", value: santri?.jenisKelamin },
                { label: "Tempat, Tanggal Lahir", value: `${santri?.tempatLahir || '-'}${santri?.tanggalLahir ? `, ${santri?.tanggalLahir}` : ''}` },
                { label: "Anak Ke", value: santri?.anakKe },
                { label: "Pendidikan Terakhir", value: santri?.pendidikanTerakhir },
                { label: "Tinggal Bersama", value: santri?.tinggalBersama },
                { label: "Alamat", value: santri?.alamatSantri },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100"
                >
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900">{item.value || '-'}</p>
                </div>
              ))}
            </div>
          </section>

          <section 
            aria-labelledby="ayah-data"
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 id="ayah-data" className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Data Ayah
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              {[
                { label: "Nama Ayah", value: santri?.namaAyah },
                { label: "Tempat, Tanggal Lahir", value: santri?.ttlAyah },
                { label: "Usia", value: santri?.usiaAyah },
                { label: "Pekerjaan", value: santri?.pekerjaanAyah },
                { label: "Penghasilan", value: santri?.penghasilanAyah },
                { label: "Alamat", value: santri?.alamatAyah },
                { label: "No. Telepon", value: santri?.telpAyah },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100"
                >
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900">{item.value || '-'}</p>
                </div>
              ))}
            </div>
          </section>

          <section 
            aria-labelledby="ibu-data"
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 id="ibu-data" className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Data Ibu
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              {[
                { label: "Nama Ibu", value: santri?.namaIbu },
                { label: "Tempat, Tanggal Lahir", value: santri?.ttlIbu },
                { label: "Usia", value: santri?.usiaIbu },
                { label: "Pekerjaan", value: santri?.pekerjaanIbu },
                { label: "Penghasilan", value: santri?.penghasilanIbu },
                { label: "Alamat", value: santri?.alamatIbu },
                { label: "No. Telepon", value: santri?.telpIbu },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100"
                >
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900">{item.value || '-'}</p>
                </div>
              ))}
            </div>
          </section>

          <section 
            aria-labelledby="pendaftaran-info"
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 id="pendaftaran-info" className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Informasi Pendaftaran
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{santri?.email || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Tahun Pendaftaran</p>
                <p className="font-medium text-sm sm:text-base text-gray-900">{santri?.tahunPendaftaran || (santri?.createdAt ? new Date(santri.createdAt).getFullYear() : '-')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Tanggal Daftar</p>
                <p className="font-medium text-sm sm:text-base text-gray-900">
                  {santri?.createdAt ? new Date(santri.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
            </div>
          </section>

          <section 
            aria-labelledby="pembayaran-info"
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 hover:shadow-xl sm:hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 id="pembayaran-info" className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Data Pembayaran
            </h2>
            {pembayaran ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Status</p>
                    <p className="font-medium text-sm sm:text-base text-gray-900 capitalize">{pembayaran.status_pembayaran || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Nominal</p>
                    <p className="font-medium text-sm sm:text-base text-gray-900">Rp {biayaDetail ? Number(biayaDetail).toLocaleString('id-ID') : '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Metode</p>
                    <p className="font-medium text-sm sm:text-base text-gray-900">{pembayaran.metode_pembayaran || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Tanggal</p>
                    <p className="font-medium text-sm sm:text-base text-gray-900">
                      {pembayaran.created_at ? new Date(pembayaran.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>
                {pembayaran.status_pembayaran === 'submitted' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updatePaymentStatus('lunas')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Konfirmasi
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada data pembayaran</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}