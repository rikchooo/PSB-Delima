"use client";
import "@/styles/globals.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  HiOutlineClipboard,
  HiOutlineCheckCircle,
  HiOutlineBell,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCloudUpload,
  HiOutlineCheck,
  HiOutlineArrowNarrowRight,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineCamera,
  HiOutlineHeart,
} from "react-icons/hi";
import { FaInstagram, FaFacebook, FaYoutube, FaTiktok } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
const DEFAULT_SCHEDULE = {
  wave1: "1 Jan - 31 Mar 2026",
  wave2: "1 Apr - 30 Jun 2026",
  wave3: "1 Jul - 30 Sep 2026",
};
export default function LandingPage() {
  const router = useRouter();
  const [registrationSchedule, setRegistrationSchedule] =
    useState(DEFAULT_SCHEDULE);
  const [activeYear, setActiveYear] = useState(null);
  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/PublicWeb/dashboard");
    }
  }, [router]);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiFetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.data?.active_year) {
            setActiveYear(data.data.active_year);
          }
        }
      } catch (error) {
        console.error("Gagal memuat tahun aktif dari API:", error);
      }
    };
    loadSettings();
  }, []);
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await apiFetch("/api/settings/schedule");
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setRegistrationSchedule(data.data);
            return;
          }
        }
      } catch (error) {
        console.error("Gagal memuat jadwal pendaftaran dari API:", error);
      }
      const savedSchedule = localStorage.getItem("registration_schedule");
      if (!savedSchedule) return;
      try {
        setRegistrationSchedule({
          ...DEFAULT_SCHEDULE,
          ...JSON.parse(savedSchedule),
        });
      } catch (error) {
        console.error("Gagal membaca jadwal pendaftaran:", error);
      }
    };
    loadSchedule();
    window.addEventListener("storage", loadSchedule);
    return () => {
      window.removeEventListener("storage", loadSchedule);
    };
  }, []);
  const handleLogin = () => {
    window.location.href = "/PublicWeb/login";
  };
  const handleRegister = () => {
    window.location.href = "/PublicWeb/register";
  };
  return (
    <div className="bg-white py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="text-center py-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Pondok Pesantren
          </h1>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-green-700 mt-4 mb-6 leading-tight">
            Delima Tanjung Rejo
          </h2>
          <p className="text-3xl md:text-4xl font-semibold text-gray-800 mb-10">
            Pendaftaran Santri Baru <br className="hidden sm:block" />
            Tahun Ajaran{" "}
            {activeYear
              ? `${activeYear} / ${parseInt(activeYear) + 1}`
              : "2026 / 2027"}
          </p>
          <div className="max-w-3xl mx-auto mb-12">
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6 rounded-full" />
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Mengantarkan manusia unggul dengan mengedapkan
              <span className="font-semibold text-green-700">
                {" "}
                keluhuran akhlak
              </span>
              ,
              <span className="font-semibold text-green-700">
                {" "}
                cerdas berilmu
              </span>
              , dan
              <span className="font-semibold text-green-700">
                {" "}
                bijak beramal
              </span>
              .
            </p>
          </div>
          <div className="flex flex-row gap-5 justify-center">
            <button
              onClick={handleLogin}
              className="py-3 px-8 text-lg font-semibold text-green-700 bg-green-100 rounded-full transition-all duration-200 border border-green-300 hover:border-green-500"
            >
              Masuk
            </button>
            <button
              onClick={handleRegister}
              className="py-3 px-8 text-lg font-semibold text-white bg-green-700 hover:bg-green-600 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Daftar
            </button>
          </div>
        </section>
        <section className="py-10">
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
              Jadwal Pendaftaran
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pilih Gelombang Pendaftaran Santri Baru
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4">
              Pastikan Anda mendaftar pada gelombang yang sesuai untuk
              mendapatkan proses seleksi yang optimal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-white border border-green-200 hover:border-green-300 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm">
                  Prioritas
                </span>
              </div>
              <div className="mb-6">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md">
                  <HiOutlineStar className="w-7 h-7" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Gelombang I
                </h4>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                  <HiOutlineCalendar className="w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">
                    {registrationSchedule.wave1}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Kuota prioritas dengan benefit early bird.
                </p>
              </div>
            </div>
            <div className="group relative bg-white border border-green-200 hover:border-green-300 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 shadow-sm">
                  Reguler
                </span>
              </div>
              <div className="mb-6">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <HiOutlineCheckCircle className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Gelombang II
                </h4>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                  <HiOutlineCalendar className="w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">
                    {registrationSchedule.wave2}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Kuota reguler dengan proses standar.
                </p>
              </div>
            </div>
            <div className="group relative bg-white border border-green-200 hover:border-green-300 rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 shadow-sm">
                  Terbatas
                </span>
              </div>
              <div className="mb-6">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                  <HiOutlineClock className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Gelombang III
                </h4>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                  <HiOutlineCalendar className="w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">
                    {registrationSchedule.wave3}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Kuota terbatas, seleksi lebih ketat.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-10">
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
              Langkah Mudah
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Alur Pendaftaran Santri Baru
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4">
              Ikuti langkah-langkah berikut untuk menyelesaikan proses
              pendaftaran santri baru.
            </p>
          </div>
          {/* Desktop layout */}
          <div className="hidden md:block relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-green-200" />
            <div className="grid grid-cols-6 gap-4 relative">
              <div className="flex flex-col items-center text-center group">
                <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg shadow-sm group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                  <HiOutlineUser className="w-5 h-5" />
                </div>
                <div className="mt-4 px-2">
                  <h5 className="font-bold text-gray-900 text-sm">Buat Akun</h5>
                  <p className="text-xs text-gray-500 mt-1">Daftar email</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg shadow-sm group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                  <HiOutlineClipboard className="w-5 h-5" />
                </div>
                <div className="mt-4 px-2">
                  <h5 className="font-bold text-gray-900 text-sm">
                    Isi Formulir
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">Data pribadi</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg shadow-sm group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                  <HiOutlineCloudUpload className="w-5 h-5" />
                </div>
                <div className="mt-4 px-2">
                  <h5 className="font-bold text-gray-900 text-sm">
                    Upload Berkas
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">Dokumen</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg shadow-sm group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                  <HiOutlineCheck className="w-5 h-5" />
                </div>
                <div className="mt-4 px-2">
                  <h5 className="font-bold text-gray-900 text-sm">
                    Verifikasi
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">Validasi admin</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg shadow-sm group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                  <HiOutlineBell className="w-5 h-5" />
                </div>
                <div className="mt-4 px-2">
                  <h5 className="font-bold text-gray-900 text-sm">
                    Pemberitahuan
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">Hasil seleksi</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg shadow-sm group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                  <HiOutlineCurrencyDollar className="w-5 h-5" />
                </div>
                <div className="mt-4 px-2">
                  <h5 className="font-bold text-gray-900 text-sm">
                    Pembayaran
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">Administrasi</p>
                </div>
              </div>
            </div>
          </div>
          {/* Mobile layout */}
          <div className="md:hidden space-y-6">
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm flex-shrink-0">
                <HiOutlineUser className="w-5 h-5" />
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-base">Buat Akun</h5>
                <p className="text-sm text-gray-500">
                  Daftar dengan email aktif
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm flex-shrink-0">
                <HiOutlineClipboard className="w-5 h-5" />
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-base">
                  Isi Formulir
                </h5>
                <p className="text-sm text-gray-500">
                  Lengkapi data pribadi & pendidikan
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm flex-shrink-0">
                <HiOutlineCloudUpload className="w-5 h-5" />
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-base">
                  Upload Berkas
                </h5>
                <p className="text-sm text-gray-500">
                  Unggah dokumen persyaratan
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm flex-shrink-0">
                <HiOutlineCheck className="w-5 h-5" />
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-base">
                  Verifikasi Data
                </h5>
                <p className="text-sm text-gray-500">
                  Tim admin memvalidasi berkas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm flex-shrink-0">
                <HiOutlineBell className="w-5 h-5" />
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-base">
                  Pemberitahuan
                </h5>
                <p className="text-sm text-gray-500">
                  Notifikasi hasil seleksi via email
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm flex-shrink-0">
                <HiOutlineCurrencyDollar className="w-5 h-5" />
              </div>
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-base">
                  Pembayaran
                </h5>
                <p className="text-sm text-gray-500">
                  Selesaikan administrasi keuangan
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Registration requirements */}
        <section className="py-10">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-10">
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
                  Lengkapi persyaratan
                </span>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Syarat Pendaftaran Santri Baru
                </h3>
                <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
                  Pastikan Anda memenuhi persyaratan untuk memastikan proses
                  pendaftaran berjalan lancar.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: HiOutlineDocumentText,
                    text: "Fotokopi Akta Kelahiran",
                    color: "text-blue-500",
                    bg: "bg-blue-100",
                  },
                  {
                    icon: HiOutlineHome,
                    text: "Fotokopi Kartu Keluarga",
                    color: "text-emerald-500",
                    bg: "bg-emerald-100",
                  },
                  {
                    icon: HiOutlineIdentification,
                    text: "KTP Orang Tua / Wali",
                    color: "text-purple-500",
                    bg: "bg-purple-100",
                  },
                  {
                    icon: HiOutlineAcademicCap,
                    text: "Ijazah / SKL (jika ada)",
                    color: "text-amber-500",
                    bg: "bg-amber-100",
                  },
                  {
                    icon: HiOutlineCamera,
                    text: "Pas Foto 3x4 (2 lembar)",
                    color: "text-pink-500",
                    bg: "bg-pink-100",
                  },
                  {
                    icon: HiOutlineHeart,
                    text: "Surat Keterangan Sehat",
                    color: "text-red-500",
                    bg: "bg-red-100",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl border border-green-100 hover:border-green-300 transition-all duration-300 group cursor-default"
                  >
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-xl ${item.bg}`}
                    >
                      <item.icon
                        className={`w-6 h-6 ${item.color} group-hover:scale-110 transition-all duration-300`}
                      />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* Contact & location */}
        <section className="py-10">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
              Hubungi Kami
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Silakan Hubungi Melalui Saluran Resmi
            </h3>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
              Butuh bantuan dalam proses pendaftaran? Siap melayani
              pertanyaan Anda melalui kontak resmi di bawah ini.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact cards */}
            <div className="space-y-4">
              <a
                href="https://wa.me/6289524064264"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white border border-green-100 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white transition-transform">
                  <Image
                    src="/icons/WhatsAppIcon.png"
                    alt="WhatsApp"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    WhatsApp Admin
                  </h4>
                  <p className="text-sm text-gray-500">Respon cepat 24/7</p>
                </div>
                <HiOutlineArrowNarrowRight
                  alt="Link"
                  className="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform"
                />
              </a>
              <a
                href="mailto:delimatanjungrejo@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white border border-green-100 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white transition-transform">
                  <Image
                    src="/icons/GmailIcon.png"
                    alt="Email"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    Email Resmi
                  </h4>
                  <p className="text-sm text-gray-500">
                    delimatanjungrejo@gmail.com
                  </p>
                </div>
                <HiOutlineArrowNarrowRight
                  alt="Link"
                  className="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform"
                />
              </a>
              {/* Social media */}
              <div className="mt-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl">
                <h5 className="font-semibold text-gray-900 mb-4 text-center">
                  Ikuti Kami di Media Sosial
                </h5>
                <div className="grid grid-cols-4 gap-3">
                  <a
                    href="https://www.instagram.com/delima.cangkreng_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-green-100 hover:border-pink-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-110 transition-transform">
                      <FaInstagram className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                      Instagram
                    </span>
                  </a>
                  <a
                    href="https://www.tiktok.com/@delima.cangkreng_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-green-100 hover:border-gray-400 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-black group-hover:scale-110 transition-transform">
                      <FaTiktok className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-800 transition-colors">
                      TikTok
                    </span>
                  </a>
                  <a
                    href="https://www.facebook.com/delima.cangkreng"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-green-100 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 group-hover:scale-110 transition-transform">
                      <FaFacebook className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      Facebook
                    </span>
                  </a>
                  <a
                    href="https://youtube.com/@delima.cangkreng_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-green-100 hover:border-red-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-600 group-hover:scale-110 transition-transform">
                      <FaYoutube className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-red-600 transition-colors">
                      YouTube
                    </span>
                  </a>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Dapatkan update terbaru seputar kegiatan & informasi pondok
                </p>
              </div>
            </div>
            {/* Map */}
            <div className="relative rounded-3xl overflow-hidden border border-green-100 shadow-sm group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3954.260161193086!2d114.04231767443108!3d-7.655151275741897!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd72f114bf75f5f%3A0xb596d2eb47ce4d2!2sPP.%20Delima%20Tanjung%20Rejo!5e0!3m2!1sid!2sid!4v1770546845990!5m2!1sid!2sid"
                className="w-full h-72 md:h-full min-h-[400px] border-0 group-hover:scale-[1.02] transition-transform duration-500"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Pondok Pesantren Delima Tanjung Rejo"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
