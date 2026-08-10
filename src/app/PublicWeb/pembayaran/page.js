
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { HiCheck, HiInformationCircle, HiOutlineOfficeBuilding, HiClipboard, HiExclamation, HiClock, HiCloudUpload, HiRefresh, HiPaperAirplane, HiCheckCircle, HiPrinter, HiExclamationCircle } from "react-icons/hi";
export default function PembayaranPage() {
  const router = useRouter();
  const [buktiPembayaran, setBuktiPembayaran] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
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
          const response = await apiFetch(`/api/pendaftaran/status/${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            const backendStatus = data.payment_status || "";
            const confirmedStatuses = ["confirmed", "lunas", "success"];
            const isConfirmed = confirmedStatuses.includes(backendStatus);
            const hasSubmittedProof =
              backendStatus === "submitted" ||
              localStorage.getItem("payment_status") === "submitted";
            if (isConfirmed) {
              setPaymentStatus("success");
              localStorage.setItem("payment_status", backendStatus);
            } else if (hasSubmittedProof) {
              setPaymentStatus("success");
            } else {
              setPaymentStatus("pending");
              localStorage.removeItem("payment_status");
            }
          }
        } catch (error) {
          console.error("Failed to fetch payment status:", error);
        }
      };
      const fetchBiaya = async () => {
        try {
          const settingsRes = await apiFetch('/api/settings');
          let activeYear = new Date().getFullYear();
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            activeYear = parseInt(settingsData.data?.active_year) || activeYear;
          }
          const biayaRes = await apiFetch(`/api/settings/biaya/${activeYear}`);
          if (biayaRes.ok) {
            const biayaData = await biayaRes.json();
            setBiaya(biayaData.biaya || 0);
          }
        } catch (error) {
          console.error("Failed to fetch biaya:", error);
        }
      };
      fetchPaymentStatus();
      fetchBiaya();
    }
  }, [router]);
  const rekeningInfo = {
    bank: "BSI (Bank Syariah Indonesia)",
    nomor: "7258945578",
    nama: "Yayasan Delima Tanjung Rejo",
    kodeBayar: "DTJR-2026",
  };
  const [biaya, setBiaya] = useState(0);
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
        throw new Error('Konfigurasi Cloudinary tidak lengkap: CLOUD_NAME tidak ditemukan');
      }
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Konfigurasi Cloudinary tidak lengkap: UPLOAD_PRESET tidak ditemukan');
      }
      console.log('Starting payment proof upload:', {
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
      console.log('Uploading to:', cloudinaryUrl);
      const cloudinaryResponse = await fetch(
        cloudinaryUrl,
        {
          method: "POST",
          body: formDataUpload,
        },
      );
      let cloudinaryData;
      try {
        cloudinaryData = await cloudinaryResponse.json();
      } catch (parseError) {
        console.error('Failed to parse Cloudinary response:', parseError);
        const textResponse = await cloudinaryResponse.text();
        console.error('Response text:', textResponse);
        throw new Error(
          `Server Cloudinary mengembalikan respons tidak valid (status: ${cloudinaryResponse.status})`
        );
      }
      if (!cloudinaryResponse.ok) {
        const errorMsg = cloudinaryData?.error?.message ||
          cloudinaryData?.error ||
          `HTTP ${cloudinaryResponse.status}`;
        console.error("Cloudinary error response:", cloudinaryData);
        throw new Error(
          `Upload ke Cloudinary gagal: ${errorMsg}`,
        );
      }
      if (cloudinaryData.error) {
        console.error("Cloudinary error:", cloudinaryData);
        throw new Error(
          cloudinaryData.error.message || "Upload ke Cloudinary gagal",
        );
      }
      if (!cloudinaryData.secure_url) {
        console.error('No secure_url in response:', cloudinaryData);
        throw new Error('Upload berhasil tetapi tidak mendapat URL file');
      }
      console.log('Upload successful:', {
        url: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id
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
      setPaymentStatus("success");
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
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Pembayaran Pendaftaran Santri
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selesaikan pembayaran untuk mengaktifkan pendaftaran Santi Anda
          </p>
        </div>
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <HiInformationCircle className="w-6 h-6 mr-3" />
              Informasi Pembayaran
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    BANK TUJUAN
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <HiOutlineOfficeBuilding className="w-8 h-8 text-green-600" />
                    </div>
                    <span className="text-lg font-bold text-gray-800">
                      {rekeningInfo.bank}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    NOMOR REKENING
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-lg text-gray-800">
                      {rekeningInfo.nomor}
                    </span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(rekeningInfo.nomor)
                      }
                      className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Salin nomor rekening"
                    >
                      <HiClipboard className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    ATAS NAMA
                  </label>
                  <p className="font-bold text-lg text-gray-800">
                    {rekeningInfo.nama}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      NOMINAL
                    </label>
                    <p className="font-bold text-xl text-gray-800">
                      {biaya ? `Rp ${biaya.toLocaleString("id-ID")}` : "Rp -"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      KODE BAYAR
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg text-gray-800">
                        {rekeningInfo.kodeBayar}
                      </span>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(rekeningInfo.kodeBayar)
                        }
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Salin kode pembayaran"
                      >
                        <HiClipboard className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start">
                    <HiExclamation className="w-5 h-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Penting:</span> Gunakan kode
                      bayar sebagai berita transfer untuk mempermudah verifikasi
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                  <HiClipboard className="w-5 h-5 mr-2 text-green-600" />
                  Langkah Pembayaran
                </h3>
                <ol className="space-y-3">
                  {[
                    "Transfer ke rekening di atas sesuai nominal",
                    "Simpan bukti transfer (screenshot/nota)",
                    "Upload bukti transfer pada form di bawah",
                    "Tunggu konfirmasi melalui notifikasi",
                  ].map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3 mt-1 flex-shrink-0 text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                      <HiClock className="w-6 h-6 text-gray-500" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-800 mb-2">
                      Batas Waktu Pembayaran
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      24 Jam
                    </p>
                    <p className="text-gray-600 text-sm">
                      Setelah pendaftaran dibuat
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {paymentStatus === "pending" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <HiCloudUpload className="w-6 h-6 text-green-600" />
                Upload Bukti Pembayaran
              </h2>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 md:p-12 text-center transition-all duration-300 hover:border-gray-400 hover:bg-gray-50">
                <input
                  type="file"
                  id="buktiPembayaran"
                  accept="image/*,.png, .jpg, .jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="buktiPembayaran"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  {!buktiPembayaran ? (
                    <>
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                        <HiCloudUpload className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-800 mb-2">
                        <span className="text-green-600 font-bold hover:underline">
                          Klik untuk memilih file
                        </span>{" "}
                        atau drag & drop
                      </p>
                      <p className="text-gray-500">
                        JPG, JPEG, PNG • Maks. 2MB
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                        <HiCheck className="w-10 h-10 text-green-600" />
                      </div>
                      <p className="font-bold text-lg text-gray-800 mb-1">
                        {buktiPembayaran.name}
                      </p>
                      <p className="text-gray-500 mb-4">
                        {(buktiPembayaran.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        type="button"
                        onClick={() => setBuktiPembayaran(null)}
                        className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center"
                      >
                        <HiRefresh className="w-4 h-4 mr-1.5" />
                        Ganti file
                      </button>
                    </div>
                  )}
                </label>
              </div>
              {uploadError && (
                <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start">
                  <HiExclamationCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}
              <div className="mt-8 pt-6 border-t flex justify-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !buktiPembayaran}
                  className={`px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl 
                      transition-all duration-300 shadow-sm hover:shadow-md 
                      flex items-center justify-center space-x-2 min-w-[160px]
                      ${isSubmitting || !buktiPembayaran
                      ? "opacity-70 cursor-not-allowed"
                      : "active:scale-[0.98] hover:scale-[1.02]"
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <HiPaperAirplane className="w-5 h-5" />
                      <span>Kirim Bukti</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
        {paymentStatus === "success" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <HiCheckCircle className="w-6 h-6 text-green-600 mr-3" />
                Konfirmasi & Jadwal
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <HiCheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Pembayaran Berhasil Dikonfirmasi!
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Terima kasih! Pembayaran Anda telah berhasil diverifikasi dan
                  pendaftaran Santi telah aktif.
                </p>
              </div>
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-gray-700 text-lg">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Cetak Bukti Pembayaran
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 ml-14">
                  Simpan bukti pembayaran ini sebagai arsip dan dibawa saat
                  kedatangan ke pesantren.
                </p>
                <div className="ml-14">
                  <button
                    onClick={async () => {
                      const userData = localStorage.getItem("user");
                      if (userData) {
                        const user = JSON.parse(userData);
                        try {
                          const paymentRes = await apiFetch(`/api/pembayaran/email/${encodeURIComponent(user.email)}`);
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
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center transition-colors"
                  >
                    <HiPrinter className="w-5 h-5 mr-2" />
                    Cetak Kwitansi
                  </button>
                </div>
              </div>
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-gray-700 text-lg">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Jadwal Kedatangan ke pesantren
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-14">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      TANGGAL KEDATANGAN
                    </p>
                    <p className="font-bold text-xl text-gray-900">
                      Senin, 15 Juli 2026
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      WAKTU KEDATANGAN
                    </p>
                    <p className="font-bold text-xl text-gray-900">
                      08.00 - 16.00 WIB
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 md:col-span-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      LOKASI PESANTREN
                    </p>
                    <p className="font-medium text-gray-900">
                      Pondok Pesantren Delima Tanjung Rejo
                    </p>
                    <p className="text-gray-600 mt-1">
                      Cangkreng, Mangaran, Kec. Mangaran, Kabupaten Situbondo,
                      Jawa Timur 86363
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-gray-700 text-lg">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Persiapan Kedatangan
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-14">
                  {[
                    "Bukti pembayaran (hasil cetak)",
                    "Perlengkapan pribadi Santi",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <HiCheck className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 pt-6 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start text-gray-600">
                  <HiExclamation className="w-6 h-6 mr-3 mt-1 flex-shrink-0 text-yellow-500" />
                  <p className="text-sm">
                    <br className="hidden md:block" />
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
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
