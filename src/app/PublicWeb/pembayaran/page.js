"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  HiCheck,
  HiInformationCircle,
  HiOutlineOfficeBuilding,
  HiClipboard,
  HiExclamation,
  HiCloudUpload,
  HiRefresh,
  HiPaperAirplane,
  HiCheckCircle,
  HiPrinter,
  HiExclamationCircle,
  HiClock,
} from "react-icons/hi";

export default function PembayaranPage() {
  const router = useRouter();
  const [buktiPembayaran, setBuktiPembayaran] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("payment_status");
      if (["confirmed", "lunas", "success"].includes(saved)) return "success";
      if (saved === "submitted") return "waiting";
    }
    return "pending";
  });
  const [uploadError, setUploadError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!getAuthToken()) {
        router.replace("/PublicWeb/login");
        return;
      }
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.replace("/PublicWeb/login");
        return;
      }
      const user = JSON.parse(userData);
      const email = user.email || "";
      setUserEmail(email);
      const fetchPaymentStatus = async () => {
        try {
          const response = await apiFetch(
            `/api/pendaftaran/status/${encodeURIComponent(email)}`,
          );
           if (response.ok) {
              const data = await response.json();
              const backendStatus = data.data?.payment_status || "";
              const confirmedStatuses = ["confirmed", "lunas", "success"];
              if (confirmedStatuses.includes(backendStatus)) {
                setPaymentStatus("success");
                localStorage.setItem("payment_status", backendStatus);
              } else if (backendStatus === "submitted") {
                setPaymentStatus("waiting");
                localStorage.setItem("payment_status", backendStatus);
              } else {
                setPaymentStatus("pending");
                localStorage.removeItem("payment_status");
              }
            } else if (localStorage.getItem("payment_status") === "submitted") {
              setPaymentStatus("waiting");
            }
        } catch (error) {
          console.error("Failed to fetch payment status:", error);
          setPaymentStatus("pending");
          localStorage.removeItem("payment_status");
        }
      };
      const fetchBiaya = async () => {
        try {
          const settingsRes = await apiFetch("/api/settings");
          let activeYear = new Date().getFullYear();
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            activeYear = parseInt(settingsData.data?.active_year) || activeYear;
            setKodeBayar(`DTJR-${activeYear}`);
          }
          const biayaRes = await apiFetch(`/api/settings/biaya/${activeYear}`);
          if (biayaRes.ok) {
            const biayaData = await biayaRes.json();
            setBiaya(biayaData.data?.biaya || 0);
          }
        } catch (error) {
          console.error("Failed to fetch biaya:", error);
        }
      };
      fetchPaymentStatus();
      fetchBiaya();
    }
  }, [router]);

  const [biaya, setBiaya] = useState(0);
  const [kodeBayar, setKodeBayar] = useState(
    () => `DTJR-${new Date().getFullYear()}`,
  );
  const rekeningInfo = {
    bank: "BSI (Bank Syariah Indonesia)",
    nomor: "7258945578",
    nama: "Yayasan Delima Tanjung Rejo",
    kodeBayar,
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      const maxSize = 2 * 1024 * 1024;
      if (!validTypes.includes(file.type)) {
        setUploadError("Format file tidak valid. Harus JPG, JPEG, atau PNG");
        setBuktiPembayaran(null);
        return;
      }
      if (file.size > maxSize) {
        setUploadError("Ukuran file terlalu besar. Maksimal 2MB");
        setBuktiPembayaran(null);
        return;
      }
      setUploadError("");
      setBuktiPembayaran(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buktiPembayaran) {
      setUploadError("Silakan upload bukti pembayaran terlebih dahulu");
      return;
    }
    if (!userEmail) {
      setUploadError("Silakan login terlebih dahulu");
      return;
    }
    setIsSubmitting(true);
    setUploadError("");
    try {
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        throw new Error(
          "Konfigurasi Cloudinary tidak lengkap: CLOUD_NAME tidak ditemukan",
        );
      }
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(
          "Konfigurasi Cloudinary tidak lengkap: UPLOAD_PRESET tidak ditemukan",
        );
      }
      console.log("Starting payment proof upload:", {
        fileName: buktiPembayaran.name,
        fileSize: buktiPembayaran.size,
        fileType: buktiPembayaran.type,
      });
      const formDataUpload = new FormData();
      formDataUpload.append("file", buktiPembayaran);
      formDataUpload.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      );
      formDataUpload.append("folder", "pembayaran");
      formDataUpload.append("public_id", `bukti_${Date.now()}`);
      formDataUpload.append(
        "resource_type",
        buktiPembayaran.type.startsWith("image/") ? "image" : "raw",
      );
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;
      console.log("Uploading to:", cloudinaryUrl);
      const cloudinaryResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formDataUpload,
      });
      let cloudinaryData;
      try {
        cloudinaryData = await cloudinaryResponse.json();
      } catch (parseError) {
        console.error("Failed to parse Cloudinary response:", parseError);
        const textResponse = await cloudinaryResponse.text();
        console.error("Response text:", textResponse);
        throw new Error(
          `Server Cloudinary mengembalikan respons tidak valid (status: ${cloudinaryResponse.status})`,
        );
      }
      if (!cloudinaryResponse.ok) {
        const errorMsg =
          cloudinaryData?.error?.message ||
          cloudinaryData?.error ||
          `HTTP ${cloudinaryResponse.status}`;
        console.error("Cloudinary error response:", cloudinaryData);
        throw new Error(`Upload ke Cloudinary gagal: ${errorMsg}`);
      }
      if (cloudinaryData.error) {
        console.error("Cloudinary error:", cloudinaryData);
        throw new Error(
          cloudinaryData.error.message || "Upload ke Cloudinary gagal",
        );
      }
      if (!cloudinaryData.secure_url) {
        console.error("No secure_url in response:", cloudinaryData);
        throw new Error("Upload berhasil tetapi tidak mendapat URL file");
      }
      console.log("Upload successful:", {
        url: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
      });
      const response = await apiFetch(`/api/pembayaran`, {
        method: "POST",
        body: JSON.stringify({
          email: userEmail,
          buktiPembayaran: {
            url: cloudinaryData.secure_url,
            publicId: cloudinaryData.public_id,
            format: cloudinaryData.format,
            size: cloudinaryData.bytes,
            originalName: buktiPembayaran.name,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Gagal menyimpan bukti pembayaran",
        );
      }
      localStorage.setItem(
        "payment_status",
        result.data?.status_pembayaran || "submitted",
      );
      localStorage.setItem(
        `payment_data_${userEmail}`,
        JSON.stringify({
          ...(result.data || {}),
          buktiPembayaran: {
            url: cloudinaryData.secure_url,
            publicId: cloudinaryData.public_id,
            format: cloudinaryData.format,
            size: cloudinaryData.bytes,
            originalName: buktiPembayaran.name,
          },
        }),
      );
      setPaymentStatus("waiting");
      setTimeout(() => {
        alert(
          "Bukti pembayaran berhasil dikirim!\n\nSilakan tunggu konfirmasi dari panitia.",
        );
      }, 500);
    } catch (error) {
      console.error("Payment submit error:", error);
      setPaymentStatus("failed");
      setUploadError(
        error.message ||
          "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header Section */}
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mx-auto">
            Pembayaran Pendaftaran Santri
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl mx-auto">
            Selesaikan administrasi keuangan untuk mengaktifkan pendaftaran
            santri Anda.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* SECTION 1: INFORMASI PEMBAYARAN */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <HiInformationCircle className="w-5 h-5 text-slate-500" />
              Informasi Transfer
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Bank Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Bank Card */}
                  <div className="flex-1 p-4 border border-slate-200 rounded-md bg-slate-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <HiOutlineOfficeBuilding className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Bank Tujuan
                      </p>
                      <p className="font-bold text-slate-900">
                        {rekeningInfo.bank}
                      </p>
                    </div>
                  </div>

                  {/* Nominal Card */}
                  <div className="flex-1 p-4 border border-slate-200 rounded-md bg-slate-50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Nominal Transfer
                    </p>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">
                      {biaya ? `Rp ${biaya.toLocaleString("id-ID")}` : "Rp -"}
                    </p>
                  </div>
                </div>

                {/* Account Number Row */}
                <div className="p-4 border border-slate-200 rounded-md flex items-center justify-between group hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      No. Rekening
                    </p>
                    <p className="font-mono text-lg font-bold text-slate-900">
                      {rekeningInfo.nomor}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(rekeningInfo.nomor)
                    }
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Salin nomor rekening"
                  >
                    <HiClipboard className="w-5 h-5" />
                  </button>
                </div>

                {/* Name & Code Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-md">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Atas Nama
                    </p>
                    <p className="font-semibold text-slate-900 text-sm leading-snug">
                      {rekeningInfo.nama}
                    </p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-md flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Kode Bayar
                      </p>
                      <p className="font-mono font-bold text-slate-900">
                        {rekeningInfo.kodeBayar}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(rekeningInfo.kodeBayar)
                      }
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Salin kode pembayaran"
                    >
                      <HiClipboard className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded text-sm text-amber-800">
                  <HiExclamation className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <p>
                    <span className="font-bold">PENTING:</span> Wajib
                    mencantumkan <strong>KODE BAYAR</strong> pada berita
                    transfer untuk verifikasi otomatis.
                  </p>
                </div>
              </div>

              {/* Right Column: Steps */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-md p-5 h-fit">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                  <HiClipboard className="w-4 h-4 text-slate-500" /> Alur
                  Pembayaran
                </h3>
                <ol className="space-y-4 relative border-l border-slate-200 ml-2 pl-4">
                  {[
                    "Transfer ke rekening di atas sesuai nominal",
                    "Simpan bukti transfer (screenshot/nota)",
                    "Upload bukti transfer pada form di bawah",
                    "Tunggu konfirmasi melalui notifikasi",
                  ].map((step, index) => (
                    <li key={index} className="relative">
                      <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-300"></div>
                      <span className="text-sm text-slate-600 leading-relaxed block pt-0.5">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500 mb-1">
                    Batas Waktu Pembayaran
                  </p>
                  <p className="text-2xl font-bold text-slate-900">24 Jam</p>
                  <p className="text-xs text-slate-500">
                    Setelah pendaftaran dibuat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: UPLOAD FORM (Pending State) */}
        {paymentStatus === "pending" && (
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <HiCloudUpload className="w-5 h-5 text-slate-500" />
                Upload Bukti Pembayaran
              </h2>
            </div>

            <div className="p-6 max-w-2xl mx-auto">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 hover:border-slate-400 transition-colors relative min-h-[240px] flex flex-col justify-center">
                <input
                  type="file"
                  id="buktiPembayaran"
                  accept="image/*,.png, .jpg, .jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {!buktiPembayaran ? (
                  <div className="pointer-events-none">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiCloudUpload className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Klik atau seret file bukti transfer ke sini
                    </p>
                    <p className="text-xs text-slate-500">
                      Format: JPG, JPEG, PNG • Maks. 2MB
                    </p>
                  </div>
                ) : (
                  <div className="relative z-20 pointer-events-auto">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                      <HiCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-xs mx-auto">
                      {buktiPembayaran.name}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {(buktiPembayaran.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setBuktiPembayaran(null);
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <HiRefresh className="w-3 h-3" /> Ganti File
                    </button>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700 flex items-start gap-2">
                  <HiExclamationCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !buktiPembayaran}
                  className={`
                    px-6 py-2.5 rounded text-sm font-medium flex items-center gap-2 min-w-[160px] justify-center
                    ${
                      isSubmitting || !buktiPembayaran
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-transparent"
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <HiRefresh className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <HiPaperAirplane className="w-4 h-4" />
                      Kirim Bukti
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2B: WAITING CONFIRMATION */}
        {paymentStatus === "waiting" && (
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <HiClock className="w-5 h-5 text-amber-500" />
                Menunggu Konfirmasi
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <HiClock className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Bukti Pembayaran Sedang Diproses
                </h3>
                <p className="text-slate-500 max-w-lg mx-auto">
                  Bukti transfer Anda telah diterima dan sedang diverifikasi oleh panitia. Anda akan mendapatkan notifikasi setelah pembayaran dikonfirmasi.
                </p>
              </div>
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => (window.location.href = "/PublicWeb/dashboard")}
                  className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded transition-colors"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: SUCCESS STATE */}
        {paymentStatus === "success" && (
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
                Status Konfirmasi
              </h2>
            </div>

            <div className="p-6 md:p-8">
              {/* Success Header */}
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <HiCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Pembayaran Berhasil Dikonfirmasi!
                </h3>
                <p className="text-slate-500 max-w-lg mx-auto">
                  Terima kasih. Pembayaran Anda telah diverifikasi dan
                  pendaftaran santri kini aktif.
                </p>
              </div>

              {/* Step 1: Print */}
              <div className="mb-8 pb-8 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-1">
                    Cetak Bukti Pembayaran
                  </h4>
                  <p className="text-sm text-slate-500 mb-3">
                    Simpan kwitansi ini sebagai arsip dan tunjukkan saat
                    kedatangan.
                  </p>
                  <button
                    onClick={async () => {
                      const userData = localStorage.getItem("user");
                      if (userData) {
                        const user = JSON.parse(userData);
                        try {
                          const paymentRes = await apiFetch(
                            `/api/pembayaran/email/${encodeURIComponent(user.email)}`,
                          );
                          const paymentData = await paymentRes.json();
                          if (paymentData.data?.id_pendaftaran) {
                            window.location.href = `/PublicWeb/pembayaran/buktipembayaran?id=${paymentData.data.id_pendaftaran}`;
                          } else {
                            alert("Data pembayaran tidak ditemukan");
                          }
                        } catch (err) {
                          alert("Gagal mengambil data pembayaran");
                        }
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <HiPrinter className="w-4 h-4" />
                    Unduh Kwitansi PDF
                  </button>
                </div>
              </div>

              {/* Step 2: Schedule */}
              <div className="mb-8 pb-8 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
                  2
                </div>
                <div className="flex-1 w-full">
                  <h4 className="font-bold text-slate-900 mb-3">
                    Jadwal Kedatangan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Tanggal
                      </p>
                      <p className="font-semibold text-slate-900 text-sm">
                        Senin, 15 Juli 2026
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Waktu
                      </p>
                      <p className="font-semibold text-slate-900 text-sm">
                        08.00 - 16.00 WIB
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 sm:col-span-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Lokasi
                      </p>
                      <p className="font-semibold text-slate-900 text-sm leading-tight">
                        Pondok Pesantren Delima Tanjung Rejo, Cangkreng - Mangaran - Situbondo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Prep */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-3">
                    Persiapan Kedatangan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Bukti pembayaran (hasil cetak)",
                      "Perlengkapan pribadi santri",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded border border-slate-100"
                      >
                        <HiCheck className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => (window.location.href = "/")}
                  className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded transition-colors"
                >
                  Kembali
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
