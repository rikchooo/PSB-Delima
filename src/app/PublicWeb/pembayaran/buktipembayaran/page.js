"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getPrivateSession } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "@/styles/globals.css";

export default function LaporanPage() {
  const [pembayaran, setPembayaran] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biaya, setBiaya] = useState(0);
  const [settings, setSettings] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchPembayaran = async () => {
      if (!getAuthToken()) {
        router.replace("/PublicWeb/login");
        return;
      }

      const id = searchParams.get("id");
      if (!id) {
        setLoading(false);
        setError("ID pendaftaran tidak ditemukan");
        return;
      }

      try {
        const paymentRes = await apiFetch(`/api/pembayaran/pendaftaran/${id}`);
        if (!paymentRes.ok) {
          const errText = await paymentRes.text().catch(() => 'Gagal mengambil data pembayaran');
          throw new Error(errText || "Gagal mengambil data pembayaran");
        }
        const paymentResult = await paymentRes.json();
        const paymentData = paymentResult.data || paymentResult;
        setPembayaran(paymentData);

        let biayaValue = 0;
        try {
          const settingsRes = await apiFetch('/api/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings(settingsData.data || {});
            const activeYear = settingsData.data?.active_year || new Date().getFullYear();
            const biayaRes = await apiFetch(`/api/settings/biaya/${activeYear}`);
            if (biayaRes.ok) {
              const biayaData = await biayaRes.json();
              biayaValue = biayaData.biaya || 0;
            }
          }
        } catch (settingsErr) {
          console.warn('Settings not available, using payment nominal fallback', settingsErr);
        }

        if (!biayaValue && paymentData.nominal) {
          const parsed = parseInt(paymentData.nominal, 10);
          if (!isNaN(parsed)) biayaValue = parsed;
        }

        setBiaya(biayaValue);
        setError(null);
      } catch (err) {
        console.error('Fetch payment error:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat data pembayaran');
      } finally {
        setLoading(false);
      }
    };

    fetchPembayaran();
  }, [searchParams, router]);

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (loading) return <div className="p-6">Memuat data pembayaran...</div>;
  if (!pembayaran) return <div className="p-6">Data pembayaran tidak ditemukan</div>;

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/PublicWeb/pembayaran");
    }
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    try {
      return new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return tanggal;
    }
  };

  const formatRupiah = (angka) => {
    const nominal = Number(angka) || 0;
    const utuh = Math.floor(nominal).toLocaleString("id-ID");
    const desimal = (nominal % 1).toFixed(2).slice(2);
    return `Rp ${utuh},${desimal}`;
  };

  const getStatusLabel = (status) => {
    if (!status) return "Belum Bayar";
    switch (status) {
      case "submitted":
        return "Menunggu Konfirmasi";
      case "confirmed":
      case "lunas":
      case "success":
        return "Lunas / Dikonfirmasi";
      case "rejected":
      case "cancelled":
        return "Ditolak";
      default:
        return status;
    }
  };

  const nominal = biaya || pembayaran.nominal || 0;
  const terbilang = (() => {
    const bilangan = [
      "",
      "Satu",
      "Dua",
      "Tiga",
      "Empat",
      "Lima",
      "Enam",
      "Tujuh",
      "Delapan",
      "Sembilan",
      "Sepuluh",
      "Sebelas",
    ];
    const penggalan = (n) => {
      if (n < 12) return bilangan[n];
      if (n < 20) return penggalan(n - 10) + " Belas";
      if (n < 100)
        return (
          penggalan(Math.floor(n / 10)) + " Puluh " + bilangan[n % 10]
        ).trim();
      if (n < 200) return ("Seratus " + penggalan(n - 100)).trim();
      if (n < 1000)
        return (
          penggalan(Math.floor(n / 100)) + " Ratus " + penggalan(n % 100)
        ).trim();
      if (n < 2000) return ("Seribu " + penggalan(n - 1000)).trim();
      if (n < 1000000)
        return (
          penggalan(Math.floor(n / 1000)) + " Ribu " + penggalan(n % 1000)
        ).trim();
      if (n < 1000000000)
        return (
          penggalan(Math.floor(n / 1000000)) +
          " Juta " +
          penggalan(n % 1000000)
        ).trim();
      return "";
    };
    return (penggalan(nominal) + " Rupiah").replace(/\s+/g, " ").trim();
  })();

  const noKwitansi = `PSB-${String(pembayaran.id ?? searchParams.get("id") ?? "-").padStart(4, '0')}`;
  const noRegistrasi = `PSB-${String(pembayaran.id_pendaftaran ?? searchParams.get("id") ?? "-").padStart(4, '0')}`;

  return (
    <div className="kwitansi-wrapper">
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

      <div className="kwitansi-page">
        <div className="kwitansi-inner">
          <div className="kwitansi-header">
            <div className="kwitansi-title">
              <h1>KWITANSI PEMBAYARAN</h1>
              <p>PONDOK PESANTREN DELIMA TJR CANGKRENG</p>
              <span>YAYASAN DELIMA TANJUNG REJO</span>
            </div>
            <div className="kwitansi-no">
              <table>
                <tbody>
                  <tr>
                    <td>No. Kwitansi</td>
                    <td>: {noKwitansi}</td>
                  </tr>
                  <tr>
                    <td>No. Registrasi</td>
                    <td>: {noRegistrasi}</td>
                  </tr>
                  <tr>
                    <td>Tanggal</td>
                    <td>: {formatTanggal(pembayaran.created_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="kwitansi-body">
            <table className="kwitansi-table">
              <tbody>
                <tr>
                  <td className="label">Telah Terima Dari</td>
                  <td className="colon">:</td>
                  <td className="value">{pembayaran.nama_lengkap || pembayaran.nama_santri || "-"}</td>
                </tr>
                <tr>
                  <td className="label">Email</td>
                  <td className="colon">:</td>
                  <td className="value">{pembayaran.email || "-"}</td>
                </tr>
                <tr>
                  <td className="label">Uang Sejumlah</td>
                  <td className="colon">:</td>
                  <td className="value terbilang">{terbilang}</td>
                </tr>
                <tr>
                  <td className="label">Untuk Pembayaran</td>
                  <td className="colon">:</td>
                  <td className="value">
                    Pendaftaran Santri Baru Tahun Ajaran {pembayaran.tahun_pendaftaran || new Date().getFullYear()}/{String((pembayaran.tahun_pendaftaran || new Date().getFullYear()) + 1).slice(-2)}
                  </td>
                </tr>
                <tr>
                  <td className="label">Metode Pembayaran</td>
                  <td className="colon">:</td>
                  <td className="value">{pembayaran.metode_pembayaran || "Transfer Bank"}</td>
                </tr>
                <tr>
                  <td className="label">Status</td>
                  <td className="colon">:</td>
                  <td className="value">{getStatusLabel(pembayaran.status_pembayaran)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="kwitansi-amount">
            <span className="amount-label">JUMLAH</span>
            <span className="amount-value">{formatRupiah(nominal)}</span>
          </div>

          <div className="kwitansi-footer">
            <div className="kwitansi-note">
              <p>Catatan:</p>
              <p>Kwitansi ini merupakan bukti pembayaran yang sah.</p>
            </div>
            <div className="kwitansi-sign">
              <p className="mb-3 font-semibold">Mengetahui,</p>
              <div className="flex flex-col items-center">
                {settings?.bendahara_ttd && (
                  <Image src={settings.bendahara_ttd} alt="TTD Bendahara" className="h-10 w-auto object-contain" />
                )}
              <p className="font-semibold underline mt-1">{settings?.bendahara_nama || 'Nama Bendahara'}</p>
              <p className="text-[10px] text-gray-500 mt-1">Bendahara</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
