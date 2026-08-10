"use client";
import { useRouter } from "next/navigation";
import { HiExclamation } from "react-icons/hi";
export default function Unauthorized() {
  const router = useRouter();
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/PrivateWeb/login");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
        <div className="text-red-500 mb-4">
          <HiExclamation className="w-16 h-16 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-gray-600 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}