'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import Header from '@/components/header/Header';
import { HiAcademicCap, HiBookOpen, HiDocumentText, HiExclamation, HiArrowLeft, HiHome, HiCheck } from 'react-icons/hi';

export default function HasilPengujianPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nilaiData, setNilaiData] = useState(null);
  const [santriData, setSantriData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [assigningRoom, setAssigningRoom] = useState(false);
  const [assignedRoom, setAssignedRoom] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const pendaftaranId = searchParams.get('id');
  const santriGender = santriData?.jenis_kelamin;
  const genderFilter = santriGender === 'Perempuan' ? 'female' : 'male';
  const filteredRooms = rooms.filter(room => room.gender === genderFilter);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/PublicWeb/login');
      return;
    }

    const fetchData = async () => {
      if (!pendaftaranId) {
        setError('ID pendaftaran tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        const [nilaiRes, roomsRes] = await Promise.allSettled([
          apiFetch(`/api/pengujian/santri/${pendaftaranId}`),
          apiFetch(`/api/pendaftaran/studentrooms`),
        ]);

        if (nilaiRes.status === 'fulfilled' && nilaiRes.value.ok) {
          const data = await nilaiRes.value.json();
          setNilaiData(data.data || null);
          setSantriData(data.data?.pendaftaran || null);
        } else if (nilaiRes.status === 'fulfilled' && nilaiRes.value.status !== 404) {
          const err = await nilaiRes.value.json();
          throw new Error(err.error || err.message || 'Gagal memuat nilai');
        }

        if (roomsRes.status === 'fulfilled' && roomsRes.value.ok) {
          const data = await roomsRes.value.json();
          setRooms(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching hasil pengujian:', err);
        setError(err.message || 'Gagal memuat data hasil pengujian');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pendaftaranId, router]);

  const handleAssignRoom = async () => {
    if (!selectedRoomId || assigningRoom) return;

    setAssigningRoom(true);
    setAssignSuccess(false);

    try {
      const res = await apiFetch(`/api/pendaftaran/studentrooms/${selectedRoomId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ registrationId: parseInt(pendaftaranId) }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssignedRoom(data.data || rooms.find(r => r.id === selectedRoomId));
        setAssignSuccess(true);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memilih kamar');
      }
    } catch (err) {
      console.error('Error assigning room:', err);
      setError(err.message || 'Gagal memilih kamar');
    } finally {
      setAssigningRoom(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/PublicWeb/dashboard');
    }
  };

  const formatNilai = (value) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(2);
  };

  const getLevelLabel = (level) => {
    const labels = {
      pemula: 'Pemula',
      dasar: 'Dasar',
      menengah: 'Menengah',
      lanjut: 'Lanjut',
      mahir: 'Mahir',
    };
    return labels[level] || level || '-';
  };

  const ScoreRow = ({ label, value, last }) => (
    <div className={`flex justify-between items-center py-2.5 ${!last ? 'border-b border-slate-100' : ''}`}>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 font-mono">{formatNilai(value)}</span>
    </div>
  );

  const getRoomStatus = (room) => {
    if (assignedRoom && assignedRoom.id === room.id) return 'assigned';
    if (room.current_count >= room.quota) return 'full';
    return 'available';
  };

  const getGenderLabel = (gender) => {
    return gender === 'male' ? 'Putra' : 'Putri';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-400 font-medium text-sm">Memuat hasil pengujian...</p>
        </div>
      </div>
    );
  }

  if (error || !nilaiData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="text-center bg-white rounded-lg border border-slate-200 shadow-sm p-8 max-w-md w-full">
            <HiExclamation className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-slate-900 font-bold text-lg mb-2">
              {error || 'Data Tidak Ditemukan'}
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {!nilaiData
                ? 'Hasil pengujian Anda belum tersedia. Silakan hubungi panitia untuk informasi lebih lanjut.'
                : error}
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800"
            >
              <HiArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hasil Pengujian</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Santri: <span className="font-semibold text-slate-700">{santriData?.nama_lengkap || '-'}</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono border border-slate-100 px-3 py-1.5 rounded bg-slate-50 self-start sm:self-auto">
            ID: {pendaftaranId}
          </div>
        </div>

        {/* Room Assignment Section */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-indigo-50/50 flex items-center gap-2">
            <HiHome className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-indigo-900 uppercase tracking-wide">Pilihan Asrama</h3>
          </div>
          <div className="p-5">
            {assignedRoom ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <HiCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Kamar {assignedRoom.name} berhasil dipilih
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {getGenderLabel(assignedRoom.gender)} | Kuota: {assignedRoom.current_count}/{assignedRoom.quota}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Pilih kamar asrama yang tersedia untuk {getGenderLabel(genderFilter)}:
                </p>
                
                {filteredRooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRooms.map((room) => {
                      const status = getRoomStatus(room);
                      const isSelected = selectedRoomId === room.id;
                      return (
                        <label
                          key={room.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50'
                              : status === 'full'
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={status === 'full'}
                            onChange={() => status !== 'full' && setSelectedRoomId(room.id)}
                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">Kamar {room.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Kuota: {room.current_count}/{room.quota}
                              {status === 'full' && <span className="text-red-600 ml-1">(Penuh)</span>}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Belum ada kamar tersedia untuk {getGenderLabel(genderFilter)}.</p>
                )}

                <div className="pt-3">
                  <button
                    onClick={handleAssignRoom}
                    disabled={!selectedRoomId || assigningRoom}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {assigningRoom ? 'Memproses...' : 'Pilih Kamar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Al-Quran Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-emerald-50/50 flex items-center gap-2">
              <HiBookOpen className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-emerald-900 uppercase tracking-wide">Al-Quran</h3>
            </div>
            <div className="p-5">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nilai Akhir</p>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatNilai(nilaiData.nilai_alquran)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Level</p>
                  <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                    {getLevelLabel(nilaiData.level_alquran)}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-0">
                <ScoreRow label="Makharijul Huruf" value={nilaiData.makharijul_huruf} />
                <ScoreRow label="Tajwid" value={nilaiData.tajwid} />
                <ScoreRow label="Fashahah" value={nilaiData.fashahah} />
                <ScoreRow label="Adab Membaca" value={nilaiData.adab_membaca} last />
              </div>
            </div>
          </div>

          {/* Kitab Kuning Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-amber-50/50 flex items-center gap-2">
              <HiDocumentText className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-sm text-amber-900 uppercase tracking-wide">Kitab Kuning</h3>
            </div>
            <div className="p-5">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nilai Akhir</p>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatNilai(nilaiData.nilai_kitab)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Level</p>
                  <span className="inline-block px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                    {getLevelLabel(nilaiData.level_kitab)}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-0">
                <ScoreRow label="Kefashihan Membaca" value={nilaiData.kefashihan_membaca_kitab} />
                <ScoreRow label="Pemahaman Tatabahasa" value={nilaiData.pemahaman_tatabahasa} />
                <ScoreRow label="Ketepatan Makna" value={nilaiData.ketepatan_makna} last />
              </div>
            </div>
          </div>

        </div>

        {/* Catatan Penguji */}
        {nilaiData.catatan && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Catatan Penguji</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {nilaiData.catatan}
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
