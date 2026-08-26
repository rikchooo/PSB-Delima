"use client";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import PrivateHeader from "@/components/PrivateHeader";
import { HiBookOpen, HiBookmark, HiClipboard, HiSave, HiArrowLeft } from "react-icons/hi";

function getLevel(nilai) {
  const n = parseFloat(nilai);
  if (isNaN(n)) return "";
  if (n <= 20) return "pemula";
  if (n <= 40) return "dasar";
  if (n <= 60) return "menengah";
  if (n <= 80) return "lanjut";
  return "mahir";
}

const LEVEL_LABELS = {
  pemula: "Pemula", dasar: "Dasar", menengah: "Menengah", lanjut: "Lanjut", mahir: "Mahir",
};

const LEVEL_COLORS = {
  pemula: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
  dasar: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
  menengah: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-100" },
  lanjut: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  mahir: { bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
};

const RANGE_INFO = [
  { min: 0, max: 20, level: "Pemula" },
  { min: 21, max: 40, level: "Dasar" },
  { min: 41, max: 60, level: "Menengah" },
  { min: 61, max: 80, level: "Lanjut" },
  { min: 81, max: 100, level: "Mahir" },
];

export default function InputNilaiPage() {
  const [santri, setSantri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nilaiAlquran: "", nilaiKitab: "", catatan: "",
    makharijulHuruf: "", tajwid: "", fashahah: "", adabMembaca: "",
    kefashihanMembacaKitab: "", pemahamanTatabahasa: "", ketepatanMakna: "",
  });

  const router = useRouter();
  const params = useParams();

  const autoNilaiAlquran = useMemo(() => {
    const vals = [formData.makharijulHuruf, formData.tajwid, formData.fashahah, formData.adabMembaca]
      .filter(v => v !== "" && v !== null && v !== undefined).map(Number).filter(v => !isNaN(v));
    if (vals.length === 0) return "";
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [formData.makharijulHuruf, formData.tajwid, formData.fashahah, formData.adabMembaca]);

  const autoNilaiKitab = useMemo(() => {
    const vals = [formData.kefashihanMembacaKitab, formData.pemahamanTatabahasa, formData.ketepatanMakna]
      .filter(v => v !== "" && v !== null && v !== undefined).map(Number).filter(v => !isNaN(v));
    if (vals.length === 0) return "";
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [formData.kefashihanMembacaKitab, formData.pemahamanTatabahasa, formData.ketepatanMakna]);

  const autoLevelAlquran = useMemo(() => getLevel(autoNilaiAlquran), [autoNilaiAlquran]);
  const autoLevelKitab = useMemo(() => getLevel(autoNilaiKitab), [autoNilaiKitab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!getAuthToken()) { router.replace("/PrivateWeb/login"); return; }
        const parsed = getPrivateSession();
        if (!parsed || parsed.role !== "penguji") { router.replace("/PrivateWeb/login"); return; }
        const response = await apiFetch(`/api/pendaftaran/santri/${params.id}`);
        if (!response.ok) throw new Error('Gagal memuat data santri');
        const result = await response.json();
        const data = result.data;
        setSantri({
          id: data.id_pendaftaran, namaLengkap: data.nama_lengkap, namaPanggilan: data.nama_panggilan,
          email: data.email, jenisKelamin: data.jenis_kelamin, tempatLahir: data.tempat_lahir,
          tanggalLahir: data.tanggal_lahir, pendidikanTerakhir: data.pendidikan_terakhir,
          alamatSantri: data.alamat_santri, provinsiSantri: data.provinsi_santri, kabupatenSantri: data.kabupaten_santri,
          kecamatanSantri: data.kecamatan_santri, desaSantri: data.desa_santri, namaAyah: data.nama_ayah,
          namaIbu: data.nama_ibu, telpAyah: data.telp_ayah, telpIbu: data.telp_ibu,
        });
      } catch (err) { console.error('Error fetching data:', err); setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [params.id, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const alquran = parseFloat(autoNilaiAlquran);
    const kitab = parseFloat(autoNilaiKitab);
    if (isNaN(alquran) || isNaN(kitab)) { alert("Isi minimal satu nilai pada setiap kategori untuk menghitung nilai akhir"); return; }
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/pengujian/santri/${params.id}/nilai`, {
        method: 'POST',
        body: JSON.stringify({
          nilai_alquran: alquran, nilai_kitab: kitab,
          level_alquran: autoLevelAlquran, level_kitab: autoLevelKitab, catatan: formData.catatan,
          makharijul_huruf: formData.makharijulHuruf !== "" && formData.makharijulHuruf !== null && formData.makharijulHuruf !== undefined ? parseFloat(formData.makharijulHuruf) : null,
          tajwid: formData.tajwid !== "" && formData.tajwid !== null && formData.tajwid !== undefined ? parseFloat(formData.tajwid) : null,
          fashahah: formData.fashahah !== "" && formData.fashahah !== null && formData.fashahah !== undefined ? parseFloat(formData.fashahah) : null,
          adab_membaca: formData.adabMembaca !== "" && formData.adabMembaca !== null && formData.adabMembaca !== undefined ? parseFloat(formData.adabMembaca) : null,
          kefashihan_membaca_kitab: formData.kefashihanMembacaKitab !== "" && formData.kefashihanMembacaKitab !== null && formData.kefashihanMembacaKitab !== undefined ? parseFloat(formData.kefashihanMembacaKitab) : null,
          pemahaman_tatabahasa: formData.pemahamanTatabahasa !== "" && formData.pemahamanTatabahasa !== null && formData.pemahamanTatabahasa !== undefined ? parseFloat(formData.pemahamanTatabahasa) : null,
          ketepatan_makna: formData.ketepatanMakna !== "" && formData.ketepatanMakna !== null && formData.ketepatanMakna !== undefined ? parseFloat(formData.ketepatanMakna) : null,
        }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || errorData.message || 'Gagal menyimpan nilai'); }
      await response.json();
      alert("Nilai berhasil disimpan!");
      router.back();
    } catch (err) { console.error('Error submitting nilai:', err); alert(`Gagal menyimpan nilai: ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleBack = () => window.history.length > 1 ? router.back() : router.push("/PrivateWeb/penguji");

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-red-600 font-bold text-xl mb-2">Terjadi Kesalahan</p>
            <p className="text-gray-600 text-sm mt-1 mb-6">{error}</p>
            <button onClick={handleBack} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md">Kembali</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PrivateHeader />
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data santri...</p>
          </div>
        </div>
      </div>
    );
  }

  const levelColorAlquran = LEVEL_COLORS[autoLevelAlquran] || LEVEL_COLORS.pemula;
  const levelColorKitab = LEVEL_COLORS[autoLevelKitab] || LEVEL_COLORS.pemula;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PrivateHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* === HEADER === */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Formulir Penilaian Tes</h1>
              <p className="text-sm text-gray-500 mt-0.5">Input nilai ujian masuk santri baru</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-bold uppercase">Santri</span>
              <span className="font-semibold text-gray-900">{santri?.namaLengkap || '-'}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-bold uppercase">Email</span>
              <span className="text-gray-700">{santri?.email || '-'}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-bold uppercase">Telepon</span>
              <span className="text-gray-700">{santri?.telpAyah || santri?.telpIbu || '-'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* === LEVEL REFERENCE === */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Skala Level</p>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 h-8">
              {RANGE_INFO.map((r, idx) => {
                const colors = {
                  Pemula: "bg-red-500",
                  Dasar: "bg-orange-500",
                  Menengah: "bg-yellow-500",
                  Lanjut: "bg-blue-500",
                  Mahir: "bg-green-600",
                };
                const textColors = {
                  Pemula: "text-white",
                  Dasar: "text-white",
                  Menengah: "text-white",
                  Lanjut: "text-white",
                  Mahir: "text-white",
                };
                return (
                  <div
                    key={r.level}
                    className={`flex-1 flex items-center justify-center text-xs font-bold ${colors[r.level]} ${textColors[r.level]} relative`}
                    title={`${r.min}-${r.max}: ${r.level}`}
                  >
                    <span className="hidden sm:inline">{r.min}-{r.max}</span>
                    <span className="mx-1 opacity-60">→</span>
                    <span className="truncate">{r.level}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1.5 px-0.5">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>

          {/* === AL-QURAN SECTION === */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-l-4 border-green-500 px-6 py-4 bg-green-50/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg shadow-sm">
                  <HiBookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Al-Quran</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Nilai Akhir</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{autoNilaiAlquran || '—'}</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className={`px-3 py-1.5 rounded-lg border ${levelColorAlquran.bg} ${levelColorAlquran.text} ${levelColorAlquran.border}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider">Level</p>
                  <p className="text-sm font-bold leading-none mt-0.5">{LEVEL_LABELS[autoLevelAlquran] || '—'}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Makharijul Huruf</label>
                  <input type="number" name="makharijulHuruf" value={formData.makharijulHuruf} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tajwid</label>
                  <input type="number" name="tajwid" value={formData.tajwid} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fashahah</label>
                  <input type="number" name="fashahah" value={formData.fashahah} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adab Membaca</label>
                  <input type="number" name="adabMembaca" value={formData.adabMembaca} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
              </div>
            </div>
          </div>

          {/* === KITAB KUNING SECTION === */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-l-4 border-yellow-500 px-6 py-4 bg-yellow-50/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-lg shadow-sm">
                  <HiBookmark className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Kitab Kuning</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Nilai Akhir</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{autoNilaiKitab || '—'}</p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className={`px-3 py-1.5 rounded-lg border ${levelColorKitab.bg} ${levelColorKitab.text} ${levelColorKitab.border}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider">Level</p>
                  <p className="text-sm font-bold leading-none mt-0.5">{LEVEL_LABELS[autoLevelKitab] || '—'}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kefashihan Membaca</label>
                  <input type="number" name="kefashihanMembacaKitab" value={formData.kefashihanMembacaKitab} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pemahaman Tatabahasa</label>
                  <input type="number" name="pemahamanTatabahasa" value={formData.pemahamanTatabahasa} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ketepatan Makna</label>
                  <input type="number" name="ketepatanMakna" value={formData.ketepatanMakna} onChange={handleInputChange} min="0" max="100" step="0.1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 py-2.5 px-3 border text-base" placeholder="0 – 100" />
                </div>
              </div>
            </div>
          </div>

          {/* === CATATAN === */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Penguji (Opsional)</label>
            <textarea name="catatan" value={formData.catatan} onChange={handleInputChange} rows={3} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 border text-base resize-none" placeholder="Tulis catatan evaluasi, rekomendasi, atau observasi khusus..." />
          </div>

          {/* === ACTION BAR === */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button type="button" onClick={handleBack} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-white hover:text-gray-900 hover:border-gray-400 transition-colors text-sm font-medium">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md">
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <HiSave className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
