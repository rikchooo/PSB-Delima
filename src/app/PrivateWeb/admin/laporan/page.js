"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "@/styles/globals.css";
export default function LaporanPage() {
  const [santri, setSantri] = useState([]);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const kopSurat = {
    nama: "PONDOK PESANTREN DELIMA TJR CANGKRENG",
    arab: "المعْهد الدّيْنى دليْما تنْجُنا رَجاء",
    yayasan: "YAYASAN DELIMA TANJUNG REJO",
    sk: "Nomor SK. KEMENKUMHAM : AHU-0008815.AH.01.04.Tahun 2023",
    alamat: "Sekretariat : Jl. Cangkreng, Dusun Utara Pasar – Desa Mangaran – Kec. Mangaran – Situbondo (68363)",
  };
  useEffect(() => {
    const fetchData = async () => {
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
        const [settingsRes, santriRes] = await Promise.all([
          apiFetch('/api/settings'),
          apiFetch('/api/pendaftaran/santri'),
        ]);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData.data || {});
        }
        if (!santriRes.ok) {
          throw new Error('Failed to fetch santri data');
        }
        const santriResult = await santriRes.json();
        const data = (santriResult.data || [])
          .filter((x) => {
            if (x.status !== "accepted" && x.status !== "completed") return false;
            if (yearParam) {
              const tahunPendaftaran = x.tahun_pendaftaran
                ? Number(x.tahun_pendaftaran)
                : NaN;
              return tahunPendaftaran === Number(yearParam);
            }
            return true;
          })
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((item, i) => ({
            no: i + 1,
            nama: item.nama_lengkap,
            jk: item.jenis_kelamin,
            ttl: `${item.tempat_lahir}, ${item.tanggal_lahir}`,
            anakKe: item.anak_ke,
            pendidikan: item.pendidikan_terakhir,
            alamat: `${item.alamat_santri || ''} ${item.desa_santri || ''} ${item.kecamatan_santri || ''} ${item.kabupaten_santri || ''} ${item.provinsi_santri || ''}`.trim() || '-',
            ayah: item.nama_ayah,
            ibu: item.nama_ibu,
            telp: item.telp_ayah,
          }));
        setSantri(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchData();
  }, [router, yearParam]);
  const handlePrint = () => {
    window.print();
  };
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/PrivateWeb/admin");
    }
  };
  if (error) return <div>Error: {error}</div>;
  const currentYear = settings.active_year || new Date().getFullYear();
  const namaPanitia = settings.panitia_nama || "Nama Panitia";
  const jabatanPanitia = settings.panitia_jabatan || "Panitia PSB";
  return (
    <div className="report-page-wrapper">
      <div className="no-print fixed top-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={handleBack}
          className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Kembali</span>
        </button>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="font-medium">Cetak</span>
        </button>
      </div>
      <div className="a4-page">
        <div className="kop-surat-wrapper relative">
          <div className="logo-container absolute -left-12 -top-4 w-36 h-36 z-0">
            <Image
              src="/images/IllustratorLoading.png"
              alt="logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="relative z-10 kop-surat">
            <div className="flex items-center justify-between">
              <div className="w-24 flex-shrink-0"></div>
              <div className="text-center flex-1 leading-tight">
                <h1 className="nama-pondok">
                  {kopSurat.nama}
                </h1>
                <p className="arabic-name">
                  {kopSurat.arab}
                </p>
                <p className="yayasan">
                  {`"${kopSurat.yayasan}"`}
                </p>
                <p className="sk-kemenkumham mt-1">
                  {kopSurat.sk}
                </p>
                <p className="sekretariat1">
                  {kopSurat.alamat}
                </p>
              </div>
              <div className="w-24 flex-shrink-0"></div>
            </div>
          </div>
        </div>
        <div className="text-center mb-4">
          <h2 className="font-bold text-[14px]">
            LAPORAN PENDAFTARAN SANTRI BARU
          </h2>
          <p className="text-xs text-gray-600">
            {yearParam
              ? `Tahun Ajaran ${yearParam}/${parseInt(yearParam) + 1}`
              : `Tahun Ajaran ${currentYear}/${currentYear + 1}`
            }
          </p>
        </div>
        <table className="w-full border border-black text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border border-black p-1">No</th>
              <th className="border border-black p-1">Nama</th>
              <th className="border border-black p-1">JK</th>
              <th className="border border-black p-1">TTL</th>
              <th className="border border-black p-1">Anak</th>
              <th className="border border-black p-1">Pendidikan</th>
              <th className="border border-black p-1">Alamat</th>
              <th className="border border-black p-1">Ayah</th>
              <th className="border border-black p-1">Ibu</th>
              <th className="border border-black p-1">No. HP</th>
            </tr>
          </thead>
          <tbody>
            {santri.length === 0 ? (
              <tr>
                <td colSpan="10" className="border border-black p-4 text-center">
                  Tidak ada data calon santri yang diterima
                </td>
              </tr>
            ) : (
              santri.map((s, i) => (
                <tr key={i}>
                  <td className="border border-black p-1 text-center">{s.no}</td>
                  <td className="border border-black p-1">{s.nama}</td>
                  <td className="border border-black p-1 text-center">
                    {s.jk === "Laki-laki" ? "L" : "P"}
                  </td>
                  <td className="border border-black p-1">{s.ttl}</td>
                  <td className="border border-black p-1 text-center">{s.anakKe}</td>
                  <td className="border border-black p-1">{s.pendidikan}</td>
                  <td className="border border-black p-1">{s.alamat}</td>
                  <td className="border border-black p-1">{s.ayah}</td>
                  <td className="border border-black p-1">{s.ibu}</td>
                  <td className="border border-black p-1 text-center">{s.telp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-8 flex justify-end">
          <div className="text-center w-64">
            <p>Situbondo, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <div className="mt-8 mb-16">
              <div className="flex flex-col items-center gap-1">
                 {settings.laporan_barcode && (
                  <Image src={settings.laporan_barcode} alt="Barcode" className="mb-1 h-12 w-auto object-contain" />
                )}
                <p className="font-medium underline">{namaPanitia}</p>
                <p className="text-xs text-gray-600">{jabatanPanitia}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}