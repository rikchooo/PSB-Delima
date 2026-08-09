'use client';

// Formulir pendaftaran santri baru

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

/**
 * Struktur data formulir pendaftaran santri.
 * Digunakan sebagai initial state dan referensi field yang harus diisi.
 */
const initialFormData = {
  namaLengkap: '',
  namaPanggilan: '',
  jenisKelamin: '',
  tempatLahir: '',
  tanggalLahir: '',
  anakKe: '',
  pendidikanTerakhir: '',
  tinggalBersama: '',
  alamatSantri: '',
  namaAyah: '',
  ttlAyah: '',
  usiaAyah: '',
  pekerjaanAyah: '',
  penghasilanAyah: '',
  alamatAyah: '',
  telpAyah: '',
  namaIbu: '',
  ttlIbu: '',
  usiaIbu: '',
  pekerjaanIbu: '',
  penghasilanIbu: '',
  alamatIbu: '',
  telpIbu: '',
  tahunPendaftaran: new Date().getFullYear().toString(),
};

const SANTRI_FORM_STORAGE_PREFIX = 'santri_form_data_';

export default function PendaftaranSantri() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);

  // State
  const [userEmail, setUserEmail] = useState('');
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [showJenisKelamin, setShowJenisKelamin] = useState(false);
  const [showPenghasilanAyah, setShowPenghasilanAyah] = useState(false);
  const [showPenghasilanIbu, setShowPenghasilanIbu] = useState(false);
  const [berkas, setBerkas] = useState({});
  const [savedBerkas, setSavedBerkas] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Ambil email
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Cek autentikasi, redirect ke login jika belum login
      if (!getAuthToken()) {
        router.replace('/PublicWeb/login');
        return;
      }

      const userData = localStorage.getItem('user');
      if (!userData) {
        router.replace('/PublicWeb/login');
        return;
      }

      const user = JSON.parse(userData);
      const email = user.email || '';
      // Muat draft formulir tersimpan berdasarkan email user
      const savedData = email ? localStorage.getItem(`${SANTRI_FORM_STORAGE_PREFIX}${email}`) : null;

      setUserEmail(email);

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData({ ...initialFormData, ...(parsedData.formData || {}) });
          setSavedBerkas(parsedData.berkas || {});
        } catch (error) {
          console.error('Gagal membaca data santri tersimpan:', error);
        }
      }
      setHasLoadedSavedData(true);
    }
  }, [router]);

  // Auto-save draft formulir ke localStorage setiap kali formData atau berkas berubah
  useEffect(() => {
    if (!hasLoadedSavedData || !userEmail || typeof window === 'undefined') return;

    localStorage.setItem(
      `${SANTRI_FORM_STORAGE_PREFIX}${userEmail}`,
      JSON.stringify({
        formData,
        berkas: savedBerkas,
        updatedAt: new Date().toISOString(),
      })
    );
  }, [formData, savedBerkas, hasLoadedSavedData, userEmail]);

  // Pilihan dropdown untuk jenis kelamin
  const jenisKelaminOptions = ['Laki-laki', 'Perempuan'];

  // Pilihan dropdown untuk penghasilan
  const penghasilanOptions = [
    '< Rp 500.000',
    'Rp 500.000 – Rp 1.000.000',
    'Rp 1.000.000 – Rp 2.000.000',
    'Rp 2.000.000 – Rp 3.000.000',
    'Rp 3.000.000 – Rp 5.000.000',
    '> Rp 5.000.000',
  ];

  // Daftar berkas
  const berkasList = [
    { name: 'akta', label: 'Akta Kelahiran' },
    { name: 'kk', label: 'Kartu Keluarga (KK)' },
    { name: 'ktpOrtu', label: 'KTP Orang Tua' },
    { name: 'ijazah', label: 'Ijazah Terakhir' },
    { name: 'foto', label: 'Pas Foto 3x4' },
    { name: 'suratSehat', label: 'Surat Keterangan Sehat' },
  ];

  /**
   * @description Handler perubahan input form (controlled component).
   *   Menggunakan pattern functional update untuk menghindari stale closure.
   */
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /**
   * @description Handler perubahan input file.
   *   Validasi: ukuran maksimal 2MB, tipe file PDF/Word/JPG/PNG.
   *   File disimpan di state `berkas` untuk diupload nanti.
   * @throws {alert} - Alert jika file terlalu besar atau format tidak valid
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar! Maksimal 2MB');
      e.target.value = null;
      return;
    }

    // Validasi tipe file
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 
      'image/jpg', 
      'image/png'
    ];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak valid! Gunakan PDF, Word, JPG, JPEG, atau PNG');
      e.target.value = null;
      return;
    }

    setBerkas({ ...berkas, [e.target.name]: file });
  };

  /**
   * @description Upload satu file ke Cloudinary CDN.
   *   Folder disesuaikan dengan nama santri (sanitized).
   * @param {File} file - File yang akan diupload
   * @param {string} folderName - Nama folder (nama santri)
   * @param {string} fileName - Base name untuk public_id
   * @returns {Promise<{url: string, publicId: string, format: string, size: number, originalName: string}>}
   * @throws {Error} Jika upload gagal atau respons Cloudinary tidak valid
   */
  const uploadFileToCloudinary = async (file, folderName, fileName) => {
    try {
      // Validasi nama folder
      if (!folderName || folderName.trim() === '') {
        throw new Error('Nama lengkap santri harus diisi terlebih dahulu');
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      
      // Bersihkan nama folder
      const sanitizedFolder = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
      formDataUpload.append('folder', `santri/${sanitizedFolder}`);
      formDataUpload.append('public_id', `${fileName}_${Date.now()}`);
      formDataUpload.append('resource_type', 
        file.type.startsWith('image/') ? 'image' : 'raw'
      );

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;
      
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        throw new Error('Konfigurasi Cloudinary tidak lengkap: CLOUD_NAME tidak ditemukan');
      }

      if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Konfigurasi Cloudinary tidak lengkap: UPLOAD_PRESET tidak ditemukan');
      }

      console.log('Uploading file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder: `santri/${sanitizedFolder}`,
        cloudinaryUrl: cloudinaryUrl
      });

      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formDataUpload,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse Cloudinary response:', e);
        const responseText = await response.text();
        console.error('Response text:', responseText);
        throw new Error(`Server Cloudinary mengembalikan respons tidak valid (status: ${response.status})`);
      }
      
      if (!response.ok) {
        const errorMsg = data?.error?.message || 
                          data?.error || 
                          `HTTP ${response.status}`;
        console.error('Cloudinary error response:', data);
        throw new Error(`Upload gagal: ${errorMsg}`);
      }

      if (data.error) {
        console.error('Cloudinary error in response:', data.error);
        throw new Error(`Upload gagal: ${data.error.message || data.error}`);
      }

      if (!data.secure_url) {
        console.error('No secure_url in response:', data);
        throw new Error('Upload berhasil tetapi tidak mendapat URL file');
      }

      console.log('Upload successful:', {
        url: data.secure_url,
        publicId: data.public_id
      });

      return {
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        size: data.bytes,
        originalName: file.name,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  /**
   * @description Handler submit formulir pendaftaran.
   *   Alur: validasi input → upload berkas ke Cloudinary → submit ke backend.
   * @throws {Error} Jika validasi gagal, upload gagal, atau backend error
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validasi field wajib diisi sebelum submit
      const requiredFields = ['namaLengkap', 'namaPanggilan', 'jenisKelamin'];
      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        const fieldLabels = {
          namaLengkap: 'Nama Lengkap',
          namaPanggilan: 'Nama Panggilan',
          jenisKelamin: 'Jenis Kelamin'
        };
        const missingLabels = missingFields.map(f => fieldLabels[f]).join(', ');
        setError(`Mohon lengkapi field wajib: ${missingLabels}`);
        setIsSubmitting(false);
        return;
      }

      // Validasi berkas wajib di-upload
      const requiredFiles = ['akta', 'kk', 'ktpOrtu', 'ijazah', 'foto', 'suratSehat'];
      const missingFiles = requiredFiles.filter(file => !berkas[file] && !savedBerkas[file]);

      if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(name =>
          berkasList.find(b => b.name === name)?.label
        ).join(', ');
        setError(`Mohon lengkapi berkas: ${missingNames}`);
        setIsSubmitting(false);
        return;
      }

      console.log('Starting file upload process for:', formData.namaLengkap);

      // Upload berkas ke Cloudinary satu per satu
      const cloudinaryUrls = { ...savedBerkas };
      setUploadingFiles({});

      for (const [key, file] of Object.entries(berkas)) {
        if (!file) continue;

        setUploadingFiles(prev => ({ ...prev, [key]: true }));

        try {
          console.log(`Uploading file: ${key}`);
          const result = await uploadFileToCloudinary(file, formData.namaLengkap, key);
          cloudinaryUrls[key] = result;
          console.log(`Successfully uploaded ${key}`);
        } catch (error) {
          console.error(`Upload ${key} gagal:`, error);
          const berkaLabel = berkasList.find(b => b.name === key)?.label || key;
          throw new Error(`Gagal upload ${berkaLabel}: ${error.message}`);
        } finally {
          setUploadingFiles(prev => ({ ...prev, [key]: false }));
        }
      }

      console.log('All files uploaded. Submitting registration to backend...');

      // Kirim data pendaftaran lengkap ke backend
      const response = await apiFetch(`/api/pendaftaran/santri`, {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          ...formData,
          tahun_pendaftaran: formData.tahunPendaftaran,
          berkas: cloudinaryUrls,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      // Simpan status submitted ke localStorage setelah berhasil
      localStorage.setItem('registration_status', 'submitted');
      setSavedBerkas(cloudinaryUrls);
      localStorage.setItem(
        `${SANTRI_FORM_STORAGE_PREFIX}${userEmail}`,
        JSON.stringify({
          formData,
          berkas: cloudinaryUrls,
          registrationId: result.data?.id_pendaftaran,
          status: 'submitted',
          updatedAt: new Date().toISOString(),
        })
      );
      alert('Pendaftaran berhasil dikirim!');
      window.location.href = '/PublicWeb/profil';

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Gagal menyimpan data. Silakan coba lagi.');
      alert(`${err.message || 'Gagal menyimpan data. Silakan coba lagi.'}`);
    } finally {
      setIsSubmitting(false);
      setUploadingFiles({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Formulir Pendaftaran Santri Baru
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lengkapi semua data dan persyaratan di bawah ini dengan benar
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div>
                  <h2 className="text-xl font-bold text-green-800">Identitas Calon Santri</h2>
                  <p className="text-gray-500 text-sm mt-1">Lengkapi data diri dengan benar</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="namaLengkap" 
                    placeholder="Nama Lengkap Sesuai Akta"
                    value={formData.namaLengkap}
                    onChange={handleChange}
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Panggilan <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="namaPanggilan" 
                    placeholder="Nama Panggilan"
                    value={formData.namaPanggilan}
                    onChange={handleChange}
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowJenisKelamin(!showJenisKelamin)}
                    className="w-full flex justify-between items-center px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  >
                    <span className={formData.jenisKelamin ? 'text-gray-700' : 'text-gray-400'}>
                      {formData.jenisKelamin || 'Pilih Jenis Kelamin'}
                    </span>
                    <span className={`transition-transform duration-200 ${showJenisKelamin ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {showJenisKelamin && (
                    <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
                      {jenisKelaminOptions.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, jenisKelamin: item });
                            setShowJenisKelamin(false);
                          }}
                          className={`w-full text-left px-4 py-3 transition hover:bg-green-50 ${
                            formData.jenisKelamin === item ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="tempatLahir" 
                    placeholder="Kabupaten/Kota"
                    value={formData.tempatLahir}
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="tanggalLahir" 
                    type="date" 
                    value={formData.tanggalLahir}
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anak Ke- <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="anakKe" 
                    placeholder="1" 
                    type="number" 
                    min="1"
                    value={formData.anakKe}
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pendidikan Terakhir <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="pendidikanTerakhir" 
                    placeholder="SMP/MTS/SMA/SMK/MA/PT"
                    value={formData.pendidikanTerakhir}
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Pendaftaran
                  </label>
                  <input
                    name="tahunPendaftaran"
                    type="number"
                    value={formData.tahunPendaftaran}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tinggal Bersama <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="tinggalBersama" 
                    placeholder="Orang Tua/Saudara"
                    value={formData.tinggalBersama}
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    name="alamatSantri" 
                    placeholder="Alamat Lengkap RT/RW, Dusun, Desa, Kecamatan, Kabupaten"
                    value={formData.alamatSantri}
                    onChange={handleChange} 
                    rows="4"
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div>
                  <h2 className="text-xl font-bold text-green-700">Data Ayah Kandung</h2>
                  <p className="text-gray-500 text-sm mt-1">Lengkapi data ayah dengan benar</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="namaAyah"
                    placeholder="Nama Lengkap Ayah"
                    value={formData.namaAyah}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempat, Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="ttlAyah"
                    placeholder="Kabupaten/Kota, Tanggal-Bulan-Tahun"
                    value={formData.ttlAyah}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usia <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="usiaAyah"
                    type="number"
                    placeholder="Usia"
                    value={formData.usiaAyah}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pekerjaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pekerjaanAyah"
                    placeholder="Pekerjaan Ayah"
                    value={formData.pekerjaanAyah}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Penghasilan Ayah / Bulan <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPenghasilanAyah(!showPenghasilanAyah)}
                    className="w-full flex justify-between items-center px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  >
                    <span className={formData.penghasilanAyah ? 'text-gray-700' : 'text-gray-400'}>
                      {formData.penghasilanAyah || 'Pilih Penghasilan'}
                    </span>
                    <span className={`transition-transform duration-200 ${showPenghasilanAyah ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {showPenghasilanAyah && (
                    <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
                      {penghasilanOptions.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, penghasilanAyah: item });
                            setShowPenghasilanAyah(false);
                          }}
                          className={`w-full text-left px-4 py-3 transition hover:bg-green-50 ${
                            formData.penghasilanAyah === item
                              ? 'bg-green-50 text-green-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="telpAyah"
                    placeholder="08xxxxxxxxxx"
                    value={formData.telpAyah}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamatAyah"
                    placeholder="Alamat Lengkap"
                    value={formData.alamatAyah}
                    onChange={handleChange}
                    rows="3"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div>
                  <h2 className="text-xl font-bold text-green-700">Data Ibu Kandung</h2>
                  <p className="text-gray-500 text-sm mt-1">Lengkapi data ibu dengan benar</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="namaIbu"
                    placeholder="Nama Lengkap Ibu"
                    value={formData.namaIbu}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempat, Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="ttlIbu"
                    placeholder="Kabupaten/Kota, Tanggal-Bulan-Tahun"
                    value={formData.ttlIbu}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usia <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="usiaIbu"
                    type="number"
                    placeholder="Usia"
                    value={formData.usiaIbu}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pekerjaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pekerjaanIbu"
                    placeholder="Pekerjaan Ibu"
                    value={formData.pekerjaanIbu}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Penghasilan Ibu / Bulan <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPenghasilanIbu(!showPenghasilanIbu)}
                    className="w-full flex justify-between items-center px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  >
                    <span className={formData.penghasilanIbu ? 'text-gray-700' : 'text-gray-400'}>
                      {formData.penghasilanIbu || 'Pilih Penghasilan'}
                    </span>
                    <span className={`transition-transform duration-200 ${showPenghasilanIbu ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {showPenghasilanIbu && (
                    <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
                      {penghasilanOptions.map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, penghasilanIbu: item });
                            setShowPenghasilanIbu(false);
                          }}
                          className={`w-full text-left px-4 py-3 transition hover:bg-green-50 ${
                            formData.penghasilanIbu === item
                              ? 'bg-green-50 text-green-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="telpIbu"
                    placeholder="08xxxxxxxxxx"
                    value={formData.telpIbu}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamatIbu"
                    placeholder="Alamat Lengkap"
                    value={formData.alamatIbu}
                    onChange={handleChange}
                    rows="3"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 placeholder:text-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div>
                  <h2 className="text-xl font-bold text-green-700">Unggah Berkas</h2>
                  <p className="text-gray-500 text-sm mt-1">Unggah dokumen yang diperlukan (maks. 2MB, format PDF/JPG/PNG)</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {berkasList.map((item) => (
                  <div key={item.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name={item.name}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                    />
                    {berkas[item.name] && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ File dipilih: {berkas[item.name].name}
                      </p>
                    )}
                    {!berkas[item.name] && savedBerkas[item.name] && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Berkas sebelumnya sudah tersimpan
                      </p>
                    )}
                    {uploadingFiles[item.name] && (
                      <p className="text-sm text-blue-600 mt-1">
                        Mengunggah...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-4 px-10 bg-green-700 text-white rounded-full font-semibold hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
