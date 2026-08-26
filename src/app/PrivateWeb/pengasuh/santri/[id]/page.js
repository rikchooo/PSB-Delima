"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import PrivateHeader from "@/components/PrivateHeader";
import { HiArrowLeft, HiUser, HiUsers, HiClipboard, HiCurrencyDollar, HiExternalLink, HiAcademicCap, HiCheckCircle, HiClock, HiXCircle, HiHome } from "react-icons/hi";
import "@/styles/globals.css";

export default function PengasuhSantriDetailPage() {
  const [santri, setSantri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biayaDetail, setBiayaDetail] = useState(0);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!getAuthToken()) { router.replace("/PrivateWeb/login"); return; }
        const parsed = getPrivateSession();
        if (!parsed || parsed.role !== "pengasuh") { router.replace("/PrivateWeb/login"); return; }

        const response = await apiFetch(`/api/pendaftaran/santri/${params.id}`);
        if (!response.ok) throw new Error("Gagal memuat data santri");
        const result = await response.json();
        const data = result.data;

        const levelAlquran = data.penilaian?.level_alquran || "-";
        const levelKitab = data.penilaian?.level_kitab || "-";

        setSantri({
          id: data.id_pendaftaran, namaLengkap: data.nama_lengkap, namaPanggilan: data.nama_panggilan,
          email: data.email, jenisKelamin: data.jenis_kelamin, tempatLahir: data.tempat_lahir,
          tanggalLahir: data.tanggal_lahir, pendidikanTerakhir: data.pendidikan_terakhir,
          alamatSantri: data.alamat_santri, desaSantri: data.desa_santri, kecamatanSantri: data.kecamatan_santri,
          kabupatenSantri: data.kabupaten_santri, provinsiSantri: data.provinsi_santri,
          namaAyah: data.nama_ayah, namaIbu: data.nama_ibu, telpAyah: data.telp_ayah, telpIbu: data.telp_ibu,
          status: data.status, acceptedDate: data.created_at, tahunPendaftaran: data.tahun_pendaftaran,
          paymentStatus: (Array.isArray(data.pembayaran) ? data.pembayaran?.[0]?.status_pembayaran : data.pembayaran?.status_pembayaran) || "belum",
          paymentAmount: (Array.isArray(data.pembayaran) ? data.pembayaran?.[0]?.nominal : data.pembayaran?.nominal) || 0,
          paymentDate: (Array.isArray(data.pembayaran) ? data.pembayaran?.[0]?.created_at : data.pembayaran?.created_at) || null,
          paymentMethod: (Array.isArray(data.pembayaran) ? data.pembayaran?.[0]?.metode_pembayaran : data.pembayaran?.metode_pembayaran) || "-",
          paymentProof: (Array.isArray(data.pembayaran) ? data.pembayaran?.[0]?.bukti_pembayaran : data.pembayaran?.bukti_pembayaran) || null,
          quranScore: data.penilaian?.nilai_alquran || 0, kitabScore: data.penilaian?.nilai_kitab || 0,
          quranLevel: levelAlquran, kitabLevel: levelKitab,
          examNotes: data.penilaian?.catatan || "-", examDate: data.penilaian?.created_at || "-",
          room: data.room || null,
        });

        const year = String(data.tahun_pendaftaran || new Date(data.created_at).getFullYear());
        const biayaRes = await apiFetch(`/api/settings/biaya/${year}`);
        if (biayaRes.ok) {
          const biayaData = await biayaRes.json();
          setBiayaDetail(biayaData.data?.biaya || 0);
        }
      } catch (err) { console.error("Error fetching detail:", err); setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [params.id, router]);

  const handleBack = () => router.push("/PrivateWeb/pengasuh");

  const getBuktiUrl = () => {
    if (!santri?.paymentProof) return null;
    if (typeof santri.paymentProof === "string") return santri.paymentProof;
    return santri.paymentProof.secure_url || santri.paymentProof.url || null;
  };

  const buktiUrl = getBuktiUrl();

  // Helper components
  const DataRow = ({ label, value, mono, last }) => (
    <div className={`flex justify-between items-baseline py-2.5 ${!last ? 'border-b border-gray-100' : ''}`}>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-right max-w-[60%] ${mono ? 'font-mono' : 'font-medium'} text-gray-900`}>{value || '-'}</span>
    </div>
  );

  const SectionCard = ({ icon: Icon, title, color, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className={`px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-${color}-50/30`}>
        <Icon className={`w-4 h-4 text-${color}-600`} />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  const getStatusBadge = (status) => {
    const map = {
      accepted: { l: 'Diterima', c: 'bg-green-100 text-green-800', i: HiCheckCircle },
      completed: { l: 'Selesai', c: 'bg-blue-100 text-blue-800', i: HiCheckCircle },
      rejected: { l: 'Ditolak', c: 'bg-red-100 text-red-800', i: HiXCircle },
      pending: { l: 'Menunggu', c: 'bg-yellow-100 text-yellow-800', i: HiClock },
    };
    const cfg = map[status] || map.pending;
    const Ic = cfg.i;
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.c}`}><Ic className="w-3 h-3" />{cfg.l}</span>;
  };

  const isPaid = ["lunas", "confirmed", "success"].includes(santri?.paymentStatus);
  const isTested = (santri?.quranScore > 0 || santri?.kitabScore > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500 font-medium text-sm">Memuat data santri...</p>
        </div>
      </div>
    );
  }

  if (error || !santri) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
            <HiXCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-900 font-bold text-lg mb-1">Terjadi Kesalahan</p>
            <p className="text-gray-500 text-sm mb-6">{error || "Data tidak ditemukan"}</p>
            <button onClick={handleBack} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">Kembali</button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [santri.alamatSantri, santri.desaSantri, santri.kecamatanSantri, santri.kabupatenSantri, santri.provinsiSantri].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gray-50">
      <PrivateHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* === LEFT COLUMN: Profile Summary (Sticky) === */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-green-600 px-5 py-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                  <HiUser className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white leading-tight">{santri.namaLengkap}</h1>
                <p className="text-green-100 text-sm mt-0.5">{santri.namaPanggilan || '-'}</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  {getStatusBadge(santri.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tahun</span>
                  <span className="text-sm font-medium text-gray-900">{santri.tahunPendaftaran || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID</span>
                  <span className="text-xs font-mono text-gray-600">{santri.id}</span>
                </div>
              </div>
            </div>

            {/* Status Timeline Badges */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Riwayat Status</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  santri.status === "accepted" || santri.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {santri.status === "accepted" || santri.status === "completed" ? "✓ Diterima" : "◷ Menunggu"}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  isPaid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {isPaid ? "✓ Lunas" : santri.paymentStatus}
                </span>
                {isTested && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                    ✓ Sudah Diuji
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN: Detail Sections === */}
          <div className="lg:col-span-2 space-y-0">

            {/* Data Santri */}
            <SectionCard icon={HiUser} title="Data Calon Santri" color="green">
              <div className="space-y-0">
                <DataRow label="Email" value={santri.email} mono />
                <DataRow label="Jenis Kelamin" value={santri.jenisKelamin} />
                <DataRow label="Tempat, Tanggal Lahir" value={`${santri.tempatLahir}, ${santri.tanggalLahir ? new Date(santri.tanggalLahir).toLocaleDateString("id-ID") : "-"}`} />
                <DataRow label="Pendidikan Terakhir" value={santri.pendidikanTerakhir} />
                <DataRow label="Tanggal Daftar" value={santri.acceptedDate ? new Date(santri.acceptedDate).toLocaleDateString("id-ID") : "-"} />
                <DataRow label="Alamat Lengkap" value={fullAddress} last />
              </div>
            </SectionCard>

            {/* Data Orang Tua */}
            <SectionCard icon={HiUsers} title="Data Orang Tua" color="blue">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div className="space-y-0">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 pt-1">Ayah</p>
                  <DataRow label="Nama" value={santri.namaAyah} />
                  <DataRow label="No. Telepon" value={santri.telpAyah} mono last />
                </div>
                <div className="space-y-0 mt-4 sm:mt-0">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 pt-1">Ibu</p>
                  <DataRow label="Nama" value={santri.namaIbu} />
                  <DataRow label="No. Telepon" value={santri.telpIbu} mono last />
                </div>
              </div>
            </SectionCard>

            {/* Data Pembayaran */}
            <SectionCard icon={HiCurrencyDollar} title="Data Pembayaran" color="yellow">
              <div className="space-y-0">
                <DataRow label="Status" value={<span className="capitalize">{santri.paymentStatus}</span>} />
                <DataRow label="Nominal Tagihan" value={biayaDetail ? `Rp ${Number(biayaDetail).toLocaleString("id-ID")}` : "-"} />
                <DataRow label="Metode Pembayaran" value={santri.paymentMethod} />
                <DataRow label="Tanggal Upload" value={santri.paymentDate ? new Date(santri.paymentDate).toLocaleDateString("id-ID") : "-"} last />
              </div>
              {buktiUrl && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a href={buktiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors">
                    <HiExternalLink className="w-3.5 h-3.5" /> Lihat Bukti Pembayaran
                  </a>
                </div>
              )}
            </SectionCard>

            {/* Hasil Pengujian */}
            <SectionCard icon={HiAcademicCap} title="Hasil Pengujian" color="indigo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                <div className="space-y-0">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2 pt-1">Al-Quran</p>
                  <DataRow label="Nilai" value={<span className="text-blue-600 font-bold text-base">{santri.quranScore}</span>} />
                  <DataRow label="Level" value={<span className="capitalize">{santri.quranLevel}</span>} last />
                </div>
                <div className="space-y-0 mt-4 sm:mt-0">
                  <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-2 pt-1">Kitab Kuning</p>
                  <DataRow label="Nilai" value={<span className="text-yellow-600 font-bold text-base">{santri.kitabScore}</span>} />
                  <DataRow label="Level" value={<span className="capitalize">{santri.kitabLevel}</span>} last />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <DataRow label="Tanggal Pengujian" value={santri.examDate !== "-" ? new Date(santri.examDate).toLocaleDateString("id-ID") : "-"} last />
              </div>
              {santri.examNotes && santri.examNotes !== "-" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan Penguji</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                    {santri.examNotes}
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Data Asrama */}
            {santri.room && (
            <SectionCard icon={HiHome} title="Data Asrama" color="teal">
              <div className="space-y-0">
                <DataRow label="Nama Kamar" value={santri.room.name} />
                <DataRow label="Jenis Kelamin" value={santri.room.gender === "male" ? "Laki-laki" : santri.room.gender === "female" ? "Perempuan" : santri.room.gender} />
                <DataRow label="Kapasitas" value={`${santri.room.current_count || 0} / ${santri.room.quota || 0}`} />
                <DataRow label="Ketua Kamar" value={santri.room.ketua_kamar || "-"} last />
              </div>
            </SectionCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}