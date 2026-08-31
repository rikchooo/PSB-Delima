"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import Image from "next/image";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";
import { HiCurrencyDollar, HiUser, HiHome, HiPhone, HiMail, HiCalendar, HiIdentification, HiBriefcase, HiCash, HiLocationMarker, HiTrash } from "react-icons/hi";

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
    const fetchData = async () => {
      try {
        if (!getAuthToken()) {
          router.replace("/PrivateWeb/login");
          return;
        }
        const parsed = getPrivateSession();
        if (!parsed || parsed.role !== "admin") {
          router.replace("/PrivateWeb/login");
          return;
        }
        setAuthChecked(true);
        const response = await apiFetch(`/api/pendaftaran/santri/${params.id}`, {
        });
        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }
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
          tinggalBersama: data.tinggalBersama,
          alamatSantri: data.alamat_santri,
          provinsiSantri: data.provinsi_santri,
          kabupatenSantri: data.kabupaten_santri,
          kecamatanSantri: data.kecamatan_santri,
          desaSantri: data.desa_santri,
          namaAyah: data.nama_ayah,
          ttlAyah: data.ttl_ayah || '-',
          usiaAyah: data.usia_ayah,
          pekerjaanAyah: data.pekerjaan_ayah,
          penghasilanAyah: data.penghasilan_ayah,
          alamatAyah: [data.alamat_ayah, data.desa_ayah, data.kecamatan_ayah, data.kabupaten_ayah, data.provinsi_ayah].filter(Boolean).join(', ') || '-',
          provinsiAyah: data.provinsi_ayah,
          kabupatenAyah: data.kabupaten_ayah,
          kecamatanAyah: data.kecamatan_ayah,
          desaAyah: data.desa_ayah,
          telpAyah: data.telp_ayah,
          namaIbu: data.nama_ibu,
          ttlIbu: data.ttl_ibu || '-',
          usiaIbu: data.usia_ibu,
          pekerjaanIbu: data.pekerjaan_ibu,
          penghasilanIbu: data.penghasilan_ibu,
          alamatIbu: [data.alamat_ibu, data.desa_ibu, data.kecamatan_ibu, data.kabupaten_ibu, data.provinsi_ibu].filter(Boolean).join(', ') || '-',
          provinsiIbu: data.provinsi_ibu,
          kabupatenIbu: data.kabupaten_ibu,
          kecamatanIbu: data.kecamatan_ibu,
          desaIbu: data.desa_ibu,
          telpIbu: data.telp_ibu,
          status: data.status,
          createdAt: data.created_at,
          tahunPendaftaran: data.tahun_pendaftaran,
          berkas: data.berkas,
          paymentNominal: data.payment_nominal,
          user: data.user,
          pembayaran: data.pembayaran,
          penilaian: data.penilaian,
        });
        setStatus(data.status || "pending");
        const year = String(data.tahun_pendaftaran || (data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear()));
        const biayaRes = await apiFetch(`/api/settings/biaya/${year}`);
        if (biayaRes.ok) {
          const biayaData = await biayaRes.json();
          setBiayaDetail(biayaData.data?.biaya || 0);
        }
        const latestPayment = Array.isArray(data.pembayaran)
          ? data.pembayaran[0] || null
          : data.pembayaran || null;
        setPembayaran(latestPayment);
      } catch (err) {
        console.error('Error fetching ', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
      accepted: { label: 'Diterima', className: 'bg-green-100 text-green-800 border border-green-200' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800 border border-red-200' },
      completed: { label: 'Selesai', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1.5 inline-flex items-center text-sm font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getBuktiUrl = () => {
    if (!pembayaran?.bukti_pembayaran) return null;
    if (typeof pembayaran.bukti_pembayaran === 'string') return pembayaran.bukti_pembayaran;
    return pembayaran.bukti_pembayaran.secure_url || pembayaran.bukti_pembayaran.url || null;
  };

  const buktiUrl = getBuktiUrl();

  const DataField = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{value || '-'}</p>
      </div>
    </div>
  );

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
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
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <PrivateHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Detail Pendaftaran Santri</h1>
                </div>
                <p className="text-sm text-gray-600">
                  ID Pendaftaran: <span className="font-semibold text-indigo-600">{santri?.id}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusBadge(status)}
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  <HiTrash className="w-4 h-4" />
                  <span className="text-sm font-medium">Hapus Data</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Data Calon Santri */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 rounded-lg">
                  <HiUser className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Data Calon Santri</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField icon={HiIdentification} label="Nama Lengkap" value={santri?.namaLengkap} />
                <DataField icon={HiUser} label="Nama Panggilan" value={santri?.namaPanggilan} />
                <DataField icon={HiUser} label="Jenis Kelamin" value={santri?.jenisKelamin} />
                <DataField 
                  icon={HiCalendar} 
                  label="Tempat, Tanggal Lahir" 
                  value={`${santri?.tempatLahir || '-'}${santri?.tanggalLahir ? `, ${santri?.tanggalLahir}` : ''}`} 
                />
                <DataField icon={HiIdentification} label="Anak Ke" value={santri?.anakKe} />
                <DataField icon={HiBriefcase} label="Pendidikan Terakhir" value={santri?.pendidikanTerakhir} />
                <DataField icon={HiHome} label="Tinggal Bersama" value={santri?.tinggalBersama} />
                <div className="grid grid-cols-1 md:col-span-2 lg:col-span-3">
                  <DataField 
                    icon={HiLocationMarker} 
                    label="Alamat Lengkap" 
                    value={[santri?.alamatSantri, santri?.desaSantri, santri?.kecamatanSantri, santri?.kabupatenSantri, santri?.provinsiSantri].filter(Boolean).join(', ') || '-'} 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Data Ayah */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                  <HiUser className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Data Ayah</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField icon={HiUser} label="Nama Ayah" value={santri?.namaAyah} />
                <DataField icon={HiCalendar} label="Tempat, Tanggal Lahir" value={santri?.ttlAyah} />
                <DataField icon={HiIdentification} label="Usia" value={santri?.usiaAyah} />
                <DataField icon={HiBriefcase} label="Pekerjaan" value={santri?.pekerjaanAyah} />
                <DataField icon={HiCash} label="Penghasilan" value={santri?.penghasilanAyah} />
                <DataField icon={HiPhone} label="No. Telepon" value={santri?.telpAyah} />
                <div className="md:col-span-2 lg:col-span-3">
                  <DataField icon={HiLocationMarker} label="Alamat" value={santri?.alamatAyah} />
                </div>
              </div>
            </div>
          </section>

          {/* Data Ibu */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-pink-100 rounded-lg">
                  <HiUser className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Data Ibu</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField icon={HiUser} label="Nama Ibu" value={santri?.namaIbu} />
                <DataField icon={HiCalendar} label="Tempat, Tanggal Lahir" value={santri?.ttlIbu} />
                <DataField icon={HiIdentification} label="Usia" value={santri?.usiaIbu} />
                <DataField icon={HiBriefcase} label="Pekerjaan" value={santri?.pekerjaanIbu} />
                <DataField icon={HiCash} label="Penghasilan" value={santri?.penghasilanIbu} />
                <DataField icon={HiPhone} label="No. Telepon" value={santri?.telpIbu} />
                <div className="md:col-span-2 lg:col-span-3">
                  <DataField icon={HiLocationMarker} label="Alamat" value={santri?.alamatIbu} />
                </div>
              </div>
            </div>
          </section>

          {/* Informasi Pendaftaran */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                  <HiMail className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Informasi Pendaftaran</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DataField icon={HiMail} label="Email" value={santri?.email} />
                <DataField icon={HiCalendar} label="Tahun Pendaftaran" value={santri?.tahunPendaftaran || (santri?.createdAt ? new Date(santri.createdAt).getFullYear() : '-')} />
                <DataField 
                  icon={HiCalendar} 
                  label="Tanggal Daftar" 
                  value={santri?.createdAt ? new Date(santri.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'} 
                />
              </div>
            </div>
          </section>

          {/* Bukti Pembayaran */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 rounded-lg">
                  <HiCurrencyDollar className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Bukti Pembayaran</h2>
              </div>
            </div>
            
            <div className="p-6">
              {buktiUrl ? (
                <div className="relative group">
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-emerald-400 transition-colors bg-gray-50">
                    <Image
                      src={buktiUrl}
                      alt="Bukti Pembayaran"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all rounded-xl pointer-events-none"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <HiCurrencyDollar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Belum ada bukti pembayaran</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}