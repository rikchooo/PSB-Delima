'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { fetchProvinces, fetchKabupaten, fetchKecamatan, fetchDesa } from "@/data/regions";

const initialFormData = {
  namaLengkap: '', namaPanggilan: '', jenisKelamin: '', tempatLahir: '', tanggalLahir: '',
  anakKe: '', pendidikanTerakhir: '', tinggalBersama: '', alamatSantri: '', provinsiSantri: '',
  kabupatenSantri: '', kecamatanSantri: '', desaSantri: '', namaAyah: '', tempatLahirAyah: '',
  tanggalLahirAyah: '', usiaAyah: '', pekerjaanAyah: '', penghasilanAyah: '', alamatAyah: '',
  provinsiAyah: '', kabupatenAyah: '', kecamatanAyah: '', desaAyah: '', telpAyah: '',
  namaIbu: '', tempatLahirIbu: '', tanggalLahirIbu: '', usiaIbu: '', pekerjaanIbu: '',
  penghasilanIbu: '', alamatIbu: '', provinsiIbu: '', kabupatenIbu: '', kecamatanIbu: '',
  desaIbu: '', telpIbu: '', tahunPendaftaran: new Date().getFullYear().toString(),
};

const SANTRI_FORM_STORAGE_PREFIX = 'santri_form_data_';

export default function PendaftaranSantri() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
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

  const [provincesList, setProvincesList] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingKabupaten, setLoadingKabupaten] = useState({ santri: false, ayah: false, ibu: false });
  const [loadingKecamatan, setLoadingKecamatan] = useState({ santri: false, ayah: false, ibu: false });
  const [loadingDesa, setLoadingDesa] = useState({ santri: false, ayah: false, ibu: false });

  const [showProvinsiSantri, setShowProvinsiSantri] = useState(false);
  const [showKabupatenSantri, setShowKabupatenSantri] = useState(false);
  const [showKecamatanSantri, setShowKecamatanSantri] = useState(false);
  const [showDesaSantri, setShowDesaSantri] = useState(false);
  const [showProvinsiAyah, setShowProvinsiAyah] = useState(false);
  const [showKabupatenAyah, setShowKabupatenAyah] = useState(false);
  const [showKecamatanAyah, setShowKecamatanAyah] = useState(false);
  const [showDesaAyah, setShowDesaAyah] = useState(false);
  const [showProvinsiIbu, setShowProvinsiIbu] = useState(false);
  const [showKabupatenIbu, setShowKabupatenIbu] = useState(false);
  const [showKecamatanIbu, setShowKecamatanIbu] = useState(false);
  const [showDesaIbu, setShowDesaIbu] = useState(false);

  const [santriKabupatenList, setSantriKabupatenList] = useState([]);
  const [santriKecamatanList, setSantriKecamatanList] = useState([]);
  const [santriDesaList, setSantriDesaList] = useState([]);
  const [ayahKabupatenList, setAyahKabupatenList] = useState([]);
  const [ayahKecamatanList, setAyahKecamatanList] = useState([]);
  const [ayahDesaList, setAyahDesaList] = useState([]);
  const [ibuKabupatenList, setIbuKabupatenList] = useState([]);
  const [ibuKecamatanList, setIbuKecamatanList] = useState([]);
  const [ibuDesaList, setIbuDesaList] = useState([]);

  // --- LOGIC TETAP SAMA ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!getAuthToken()) { router.replace('/PublicWeb/login'); return; }
      const userData = localStorage.getItem('user');
      if (!userData) { router.replace('/PublicWeb/login'); return; }
      const user = JSON.parse(userData);
      const email = user.email || '';
      const savedData = email ? localStorage.getItem(`${SANTRI_FORM_STORAGE_PREFIX}${email}`) : null;
      setUserEmail(email);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData({ ...initialFormData, ...(parsedData.formData || {}) });
          setSavedBerkas(parsedData.berkas || {});
        } catch (error) { console.error('Gagal membaca data santri tersimpan:', error); }
      }
      setHasLoadedSavedData(true);
    }
  }, [router]);

  useEffect(() => {
    if (!hasLoadedSavedData || !userEmail || typeof window === 'undefined') return;
    localStorage.setItem(`${SANTRI_FORM_STORAGE_PREFIX}${userEmail}`, JSON.stringify({ formData, berkas: savedBerkas, updatedAt: new Date().toISOString() }));
  }, [formData, savedBerkas, hasLoadedSavedData, userEmail]);

  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);
    fetchProvinces().then(data => { if (!cancelled) { setProvincesList(data); setLoadingProvinces(false); } })
      .catch(() => { if (!cancelled) setLoadingProvinces(false); });
    return () => { cancelled = true; };
  }, []);

  const getProvinceId = useCallback((name) => { const prov = provincesList.find(p => p.name === name); return prov ? prov.id : null; }, [provincesList]);
  const getKabupatenId = useCallback((list, name) => { const item = list.find(i => i.name === name); return item ? item.id : null; }, []);

  const loadKabupaten = useCallback(async (type, provinceName, setList) => {
    const provinceId = getProvinceId(provinceName);
    if (!provinceId) { setList([]); return; }
    setLoadingKabupaten(prev => ({ ...prev, [type]: true }));
    try { const data = await fetchKabupaten(provinceId); setList(data); } catch (e) { setList([]); }
    finally { setLoadingKabupaten(prev => ({ ...prev, [type]: false })); }
  }, [getProvinceId]);

  const loadKecamatan = useCallback(async (type, kabList, kabName, setList) => {
    const kabId = getKabupatenId(kabList, kabName);
    if (!kabId) { setList([]); return; }
    setLoadingKecamatan(prev => ({ ...prev, [type]: true }));
    try { const data = await fetchKecamatan(kabId); setList(data); } catch (e) { setList([]); }
    finally { setLoadingKecamatan(prev => ({ ...prev, [type]: false })); }
  }, [getKabupatenId]);

  const loadDesa = useCallback(async (type, kecList, kecName, setList) => {
    const kecId = getKabupatenId(kecList, kecName);
    if (!kecId) { setList([]); return; }
    setLoadingDesa(prev => ({ ...prev, [type]: true }));
    try { const data = await fetchDesa(kecId); setList(data); } catch (e) { setList([]); }
    finally { setLoadingDesa(prev => ({ ...prev, [type]: false })); }
  }, [getKabupatenId]);

  const berkasList = [
    { name: 'akta', label: 'Akta Kelahiran' }, { name: 'kk', label: 'Kartu Keluarga (KK)' },
    { name: 'ktpOrtu', label: 'KTP Orang Tua' }, { name: 'ijazah', label: 'Ijazah Terakhir' },
    { name: 'foto', label: 'Pas Foto 3x4' }, { name: 'suratSehat', label: 'Surat Keterangan Sehat' },
  ];
  const jenisKelaminOptions = ['Laki-laki', 'Perempuan'];
  const penghasilanOptions = ['< Rp 500.000', 'Rp 500.000 – Rp 1.000.000', 'Rp 1.000.000 – Rp 2.000.000', 'Rp 2.000.000 – Rp 3.000.000', 'Rp 3.000.000 – Rp 5.000.000', '> Rp 5.000.000'];

  useEffect(() => { loadKabupaten('santri', formData.provinsiSantri, setSantriKabupatenList); }, [formData.provinsiSantri, loadKabupaten]);
  useEffect(() => { loadKecamatan('santri', santriKabupatenList, formData.kabupatenSantri, setSantriKecamatanList); }, [formData.provinsiSantri, formData.kabupatenSantri, santriKabupatenList, loadKecamatan]);
  useEffect(() => { loadDesa('santri', santriKecamatanList, formData.kecamatanSantri, setSantriDesaList); }, [formData.provinsiSantri, formData.kabupatenSantri, formData.kecamatanSantri, santriKecamatanList, loadDesa]);
  useEffect(() => { loadKabupaten('ayah', formData.provinsiAyah, setAyahKabupatenList); }, [formData.provinsiAyah, loadKabupaten]);
  useEffect(() => { loadKecamatan('ayah', ayahKabupatenList, formData.kabupatenAyah, setAyahKecamatanList); }, [formData.provinsiAyah, formData.kabupatenAyah, ayahKabupatenList, loadKecamatan]);
  useEffect(() => { loadDesa('ayah', ayahKecamatanList, formData.kecamatanAyah, setAyahDesaList); }, [formData.provinsiAyah, formData.kabupatenAyah, formData.kecamatanAyah, ayahKecamatanList, loadDesa]);
  useEffect(() => { loadKabupaten('ibu', formData.provinsiIbu, setIbuKabupatenList); }, [formData.provinsiIbu, loadKabupaten]);
  useEffect(() => { loadKecamatan('ibu', ibuKabupatenList, formData.kabupatenIbu, setIbuKecamatanList); }, [formData.provinsiIbu, formData.kabupatenIbu, ibuKabupatenList, loadKecamatan]);
  useEffect(() => { loadDesa('ibu', ibuKecamatanList, formData.kecamatanIbu, setIbuDesaList); }, [formData.provinsiIbu, formData.kabupatenIbu, formData.kecamatanIbu, ibuKecamatanList, loadDesa]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date(); const birth = new Date(birthDate + 'T00:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return String(age);
  };

  useEffect(() => { setFormData((prev) => ({ ...prev, usiaAyah: calculateAge(prev.tanggalLahirAyah) })); }, [formData.tanggalLahirAyah]);
  useEffect(() => { setFormData((prev) => ({ ...prev, usiaIbu: calculateAge(prev.tanggalLahirIbu) })); }, [formData.tanggalLahirIbu]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'provinsiSantri') { next.kabupatenSantri = ''; next.kecamatanSantri = ''; next.desaSantri = ''; }
      else if (name === 'kabupatenSantri') { next.kecamatanSantri = ''; next.desaSantri = ''; }
      else if (name === 'kecamatanSantri') { next.desaSantri = ''; }
      else if (name === 'provinsiAyah') { next.kabupatenAyah = ''; next.kecamatanAyah = ''; next.desaAyah = ''; }
      else if (name === 'kabupatenAyah') { next.kecamatanAyah = ''; next.desaAyah = ''; }
      else if (name === 'kecamatanAyah') { next.desaAyah = ''; }
      else if (name === 'provinsiIbu') { next.kabupatenIbu = ''; next.kecamatanIbu = ''; next.desaIbu = ''; }
      else if (name === 'kabupatenIbu') { next.kecamatanIbu = ''; next.desaIbu = ''; }
      else if (name === 'kecamatanIbu') { next.desaIbu = ''; }
      return next;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File terlalu besar! Maksimal 2MB'); e.target.value = null; return; }
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) { alert('Format file tidak valid! Gunakan PDF, Word, JPG, JPEG, atau PNG'); e.target.value = null; return; }
    setBerkas({ ...berkas, [e.target.name]: file });
  };

  const uploadFileToCloudinary = async (file, folderName, fileName) => {
    try {
      if (!folderName || folderName.trim() === '') throw new Error('Nama lengkap santri harus diisi terlebih dahulu');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      const sanitizedFolder = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
      formDataUpload.append('folder', `santri/${sanitizedFolder}`);
      formDataUpload.append('public_id', `${fileName}_${Date.now()}`);
      formDataUpload.append('resource_type', file.type.startsWith('image/') ? 'image' : 'raw');
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) throw new Error('Konfigurasi Cloudinary tidak lengkap: CLOUD_NAME tidak ditemukan');
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) throw new Error('Konfigurasi Cloudinary tidak lengkap: UPLOAD_PRESET tidak ditemukan');
      const response = await fetch(cloudinaryUrl, { method: 'POST', body: formDataUpload });
      let data;
      try { data = await response.json(); } catch (e) { throw new Error(`Server Cloudinary mengembalikan respons tidak valid (status: ${response.status})`); }
      if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
      if (data.error) throw new Error(`Upload gagal: ${data.error.message || data.error}`);
      if (!data.secure_url) throw new Error('Upload berhasil tetapi tidak mendapat URL file');
      return { url: data.secure_url, publicId: data.public_id, format: data.format, size: data.bytes, originalName: file.name };
    } catch (error) { console.error('Cloudinary upload error:', error); throw error; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError(null);
    try {
      const requiredFields = ['namaLengkap', 'namaPanggilan', 'jenisKelamin'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        const fieldLabels = { namaLengkap: 'Nama Lengkap', namaPanggilan: 'Nama Panggilan', jenisKelamin: 'Jenis Kelamin' };
        setError(`Mohon lengkapi field wajib: ${missingFields.map(f => fieldLabels[f]).join(', ')}`);
        setIsSubmitting(false); return;
      }
      const requiredFiles = ['akta', 'kk', 'ktpOrtu', 'ijazah', 'foto', 'suratSehat'];
      const missingFiles = requiredFiles.filter(file => !berkas[file] && !savedBerkas[file]);
      if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(name => berkasList.find(b => b.name === name)?.label).join(', ');
        setError(`Mohon lengkapi berkas: ${missingNames}`);
        setIsSubmitting(false); return;
      }
      const cloudinaryUrls = { ...savedBerkas };
      setUploadingFiles({});
      for (const [key, file] of Object.entries(berkas)) {
        if (!file) continue;
        setUploadingFiles(prev => ({ ...prev, [key]: true }));
        try { const result = await uploadFileToCloudinary(file, formData.namaLengkap, key); cloudinaryUrls[key] = result; }
        catch (error) { const berkaLabel = berkasList.find(b => b.name === key)?.label || key; throw new Error(`Gagal upload ${berkaLabel}: ${error.message}`); }
        finally { setUploadingFiles(prev => ({ ...prev, [key]: false })); }
      }
      const response = await apiFetch(`/api/pendaftaran/santri`, { method: 'POST', body: JSON.stringify({ email: userEmail, ...formData, tahun_pendaftaran: formData.tahunPendaftaran, berkas: cloudinaryUrls }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Gagal menyimpan data');
      localStorage.setItem('registration_status', 'submitted');
      setSavedBerkas(cloudinaryUrls);
      localStorage.setItem(`${SANTRI_FORM_STORAGE_PREFIX}${userEmail}`, JSON.stringify({ formData, berkas: cloudinaryUrls, registrationId: result.data?.id_pendaftaran, status: 'submitted', updatedAt: new Date().toISOString() }));
      alert('Pendaftaran berhasil dikirim!');
      window.location.href = '/PublicWeb/dashboard';
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Gagal menyimpan data. Silakan coba lagi.');
      alert(`${err.message || 'Gagal menyimpan data. Silakan coba lagi.'}`);
    } finally { setIsSubmitting(false); setUploadingFiles({}); }
  };

  // --- STYLING CONSTANTS (Warna tetap green/gray sesuai asli) ---
  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-sm text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionHeaderClass = "px-6 py-4 border-b border-gray-200 bg-gray-50/80";

  // Reusable Custom Select (Logic preserved, styling modernized)
  const CustomSelect = ({ label, value, options, isOpen, setIsOpen, onSelect, loading, disabled, required }) => (
    <div className="relative">
      <label className={labelClass}>{label} {required && <span className="text-red-500">*</span>}</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${inputClass} flex justify-between items-center text-left ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || `Pilih ${label}`}</span>
        <span className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-visible max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 text-sm">Memuat data...</div>
          ) : options.map((item, index) => {
            const itemName = typeof item === 'string' ? item : item.name;
            return (
              <button
                key={index}
                type="button"
                onClick={() => { onSelect(itemName); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === itemName ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {itemName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mx-auto">
            Formulir Pendaftaran Santri Baru
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl mx-auto">
            Lengkapi semua data dan persyaratan di bawah ini dengan benar
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* IDENTITAS CALON SANTRI */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className={sectionHeaderClass}>
              <h2 className="text-lg font-bold text-green-800">Identitas Calon Santri</h2>
              <p className="text-gray-500 text-xs mt-0.5">Lengkapi data diri dengan benar</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
                  <input name="namaLengkap" placeholder="Nama Lengkap Sesuai Akta" value={formData.namaLengkap} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nama Panggilan <span className="text-red-500">*</span></label>
                  <input name="namaPanggilan" placeholder="Nama Panggilan" value={formData.namaPanggilan} onChange={handleChange} required className={inputClass} />
                </div>
                <CustomSelect label="Jenis Kelamin" value={formData.jenisKelamin} options={jenisKelaminOptions} isOpen={showJenisKelamin} setIsOpen={setShowJenisKelamin} onSelect={(v) => setFormData({ ...formData, jenisKelamin: v })} required />
                <div>
                  <label className={labelClass}>Tempat Lahir <span className="text-red-500">*</span></label>
                  <input name="tempatLahir" placeholder="Kabupaten/Kota" value={formData.tempatLahir} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tanggal Lahir <span className="text-red-500">*</span></label>
                  <input name="tanggalLahir" type="date" value={formData.tanggalLahir} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Anak Ke- <span className="text-red-500">*</span></label>
                  <input name="anakKe" type="number" min="1" placeholder="1" value={formData.anakKe} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pendidikan Terakhir <span className="text-red-500">*</span></label>
                  <input name="pendidikanTerakhir" placeholder="SMP/MTS/SMA/SMK/MA/PT" value={formData.pendidikanTerakhir} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tinggal Bersama <span className="text-red-500">*</span></label>
                  <input name="tinggalBersama" placeholder="Orang Tua/Saudara" value={formData.tinggalBersama} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tahun Pendaftaran</label>
                  <input name="tahunPendaftaran" type="number" value={formData.tahunPendaftaran} onChange={handleChange} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`} />
                </div>

                {/* Wilayah Santri */}
                <CustomSelect label="Provinsi" value={formData.provinsiSantri} options={provincesList} isOpen={showProvinsiSantri} setIsOpen={setShowProvinsiSantri} onSelect={(v) => setFormData({ ...formData, provinsiSantri: v })} loading={loadingProvinces} required />
                <CustomSelect label="Kabupaten/Kota" value={formData.kabupatenSantri} options={santriKabupatenList} isOpen={showKabupatenSantri} setIsOpen={setShowKabupatenSantri} onSelect={(v) => setFormData({ ...formData, kabupatenSantri: v })} loading={loadingKabupaten.santri} disabled={!formData.provinsiSantri} required />
                <CustomSelect label="Kecamatan" value={formData.kecamatanSantri} options={santriKecamatanList} isOpen={showKecamatanSantri} setIsOpen={setShowKecamatanSantri} onSelect={(v) => setFormData({ ...formData, kecamatanSantri: v })} loading={loadingKecamatan.santri} disabled={!formData.kabupatenSantri} required />
                <CustomSelect label="Desa" value={formData.desaSantri} options={santriDesaList} isOpen={showDesaSantri} setIsOpen={setShowDesaSantri} onSelect={(v) => setFormData({ ...formData, desaSantri: v })} loading={loadingDesa.santri} disabled={!formData.kecamatanSantri} required />

                <div className="md:col-span-2">
                  <label className={labelClass}>Alamat Lengkap <span className="text-red-500">*</span></label>
                  <textarea name="alamatSantri" placeholder="RT/RW, Dusun, Patokan Lokasi" value={formData.alamatSantri} onChange={handleChange} rows="2" required className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>
          </section>

          {/* DATA AYAH KANDUNG */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className={sectionHeaderClass}>
              <h2 className="text-lg font-bold text-green-700">Data Ayah Kandung</h2>
              <p className="text-gray-500 text-xs mt-0.5">Lengkapi data ayah dengan benar</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
                  <input name="namaAyah" placeholder="Nama Lengkap Ayah" value={formData.namaAyah} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tempat Lahir <span className="text-red-500">*</span></label>
                  <input name="tempatLahirAyah" placeholder="Kabupaten/Kota" value={formData.tempatLahirAyah} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tanggal Lahir <span className="text-red-500">*</span></label>
                  <input name="tanggalLahirAyah" type="date" value={formData.tanggalLahirAyah} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Usia <span className="text-red-500">*</span></label>
                  <input name="usiaAyah" type="number" placeholder="Otomatis" value={formData.usiaAyah} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`} />
                </div>
                <div>
                  <label className={labelClass}>Pekerjaan <span className="text-red-500">*</span></label>
                  <input name="pekerjaanAyah" placeholder="Pekerjaan Ayah" value={formData.pekerjaanAyah} onChange={handleChange} required className={inputClass} />
                </div>
                <CustomSelect label="Penghasilan / Bulan" value={formData.penghasilanAyah} options={penghasilanOptions} isOpen={showPenghasilanAyah} setIsOpen={setShowPenghasilanAyah} onSelect={(v) => setFormData({ ...formData, penghasilanAyah: v })} required />
                <div>
                  <label className={labelClass}>No. Telepon / WA <span className="text-red-500">*</span></label>
                  <input name="telpAyah" placeholder="08xxxxxxxxxx" value={formData.telpAyah} onChange={handleChange} required className={inputClass} />
                </div>

                {/* Wilayah Ayah */}
                <CustomSelect label="Provinsi" value={formData.provinsiAyah} options={provincesList} isOpen={showProvinsiAyah} setIsOpen={setShowProvinsiAyah} onSelect={(v) => setFormData({ ...formData, provinsiAyah: v })} loading={loadingProvinces} required />
                <CustomSelect label="Kabupaten/Kota" value={formData.kabupatenAyah} options={ayahKabupatenList} isOpen={showKabupatenAyah} setIsOpen={setShowKabupatenAyah} onSelect={(v) => setFormData({ ...formData, kabupatenAyah: v })} loading={loadingKabupaten.ayah} disabled={!formData.provinsiAyah} required />
                <CustomSelect label="Kecamatan" value={formData.kecamatanAyah} options={ayahKecamatanList} isOpen={showKecamatanAyah} setIsOpen={setShowKecamatanAyah} onSelect={(v) => setFormData({ ...formData, kecamatanAyah: v })} loading={loadingKecamatan.ayah} disabled={!formData.kabupatenAyah} required />
                <CustomSelect label="Desa/Kelurahan" value={formData.desaAyah} options={ayahDesaList} isOpen={showDesaAyah} setIsOpen={setShowDesaAyah} onSelect={(v) => setFormData({ ...formData, desaAyah: v })} loading={loadingDesa.ayah} disabled={!formData.kecamatanAyah} required />

                <div className="md:col-span-2">
                  <label className={labelClass}>Alamat Lengkap <span className="text-red-500">*</span></label>
                  <textarea name="alamatAyah" placeholder="RT/RW, Dusun, Patokan Lokasi" value={formData.alamatAyah} onChange={handleChange} rows="2" required className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>
          </section>

          {/* DATA IBU KANDUNG */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className={sectionHeaderClass}>
              <h2 className="text-lg font-bold text-green-700">Data Ibu Kandung</h2>
              <p className="text-gray-500 text-xs mt-0.5">Lengkapi data ibu dengan benar</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
                  <input name="namaIbu" placeholder="Nama Lengkap Ibu" value={formData.namaIbu} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tempat Lahir <span className="text-red-500">*</span></label>
                  <input name="tempatLahirIbu" placeholder="Kabupaten/Kota" value={formData.tempatLahirIbu} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tanggal Lahir <span className="text-red-500">*</span></label>
                  <input name="tanggalLahirIbu" type="date" value={formData.tanggalLahirIbu} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Usia <span className="text-red-500">*</span></label>
                  <input name="usiaIbu" type="number" placeholder="Otomatis" value={formData.usiaIbu} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed text-gray-500`} />
                </div>
                <div>
                  <label className={labelClass}>Pekerjaan <span className="text-red-500">*</span></label>
                  <input name="pekerjaanIbu" placeholder="Pekerjaan Ibu" value={formData.pekerjaanIbu} onChange={handleChange} required className={inputClass} />
                </div>
                <CustomSelect label="Penghasilan / Bulan" value={formData.penghasilanIbu} options={penghasilanOptions} isOpen={showPenghasilanIbu} setIsOpen={setShowPenghasilanIbu} onSelect={(v) => setFormData({ ...formData, penghasilanIbu: v })} required />
                <div>
                  <label className={labelClass}>No. Telepon / WA <span className="text-red-500">*</span></label>
                  <input name="telpIbu" placeholder="08xxxxxxxxxx" value={formData.telpIbu} onChange={handleChange} required className={inputClass} />
                </div>

                {/* Wilayah Ibu */}
                <CustomSelect label="Provinsi" value={formData.provinsiIbu} options={provincesList} isOpen={showProvinsiIbu} setIsOpen={setShowProvinsiIbu} onSelect={(v) => setFormData({ ...formData, provinsiIbu: v })} loading={loadingProvinces} required />
                <CustomSelect label="Kabupaten/Kota" value={formData.kabupatenIbu} options={ibuKabupatenList} isOpen={showKabupatenIbu} setIsOpen={setShowKabupatenIbu} onSelect={(v) => setFormData({ ...formData, kabupatenIbu: v })} loading={loadingKabupaten.ibu} disabled={!formData.provinsiIbu} required />
                <CustomSelect label="Kecamatan" value={formData.kecamatanIbu} options={ibuKecamatanList} isOpen={showKecamatanIbu} setIsOpen={setShowKecamatanIbu} onSelect={(v) => setFormData({ ...formData, kecamatanIbu: v })} loading={loadingKecamatan.ibu} disabled={!formData.kabupatenIbu} required />
                <CustomSelect label="Desa/Kelurahan" value={formData.desaIbu} options={ibuDesaList} isOpen={showDesaIbu} setIsOpen={setShowDesaIbu} onSelect={(v) => setFormData({ ...formData, desaIbu: v })} loading={loadingDesa.ibu} disabled={!formData.kecamatanIbu} required />

                <div className="md:col-span-2">
                  <label className={labelClass}>Alamat Lengkap <span className="text-red-500">*</span></label>
                  <textarea name="alamatIbu" placeholder="RT/RW, Dusun, Patokan Lokasi" value={formData.alamatIbu} onChange={handleChange} rows="2" required className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>
          </section>

          {/* UNGGAH BERKAS */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className={sectionHeaderClass}>
              <h2 className="text-lg font-bold text-green-700">Unggah Berkas</h2>
              <p className="text-gray-500 text-xs mt-0.5">Maks. 2MB per file (PDF/JPG/PNG)</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {berkasList.map((item) => (
                  <div key={item.name}>
                    <label className={labelClass}>{item.label} <span className="text-red-500">*</span></label>
                    <input
                      type="file"
                      name={item.name}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {berkas[item.name] && (<p className="text-xs text-green-600 mt-1 font-medium">✓ File baru: {berkas[item.name].name}</p>)}
                    {!berkas[item.name] && savedBerkas[item.name] && (<p className="text-xs text-green-600 mt-1 font-medium">✓ Berkas sudah tersimpan</p>)}
                    {uploadingFiles[item.name] && (<p className="text-xs text-blue-600 mt-1 font-medium">Sedang mengunggah...</p>)}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-center pt-2 pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-10 bg-green-700 text-white rounded-lg font-semibold text-base hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}