const API_BASE = 'https://cdn.jsdelivr.net/gh/izzulabadi/api-wilayah-indonesia-2026@v1.0.4/api';

const cache = {
  provinces: null,
  regencies: {},
  districts: {},
  villages: {},
};

export const fetchProvinces = async () => {
  if (cache.provinces) return cache.provinces;
  const res = await fetch(`${API_BASE}/provinces.json`);
  if (!res.ok) throw new Error('Gagal memuat data provinsi');
  const data = await res.json();
  cache.provinces = data;
  return data;
};

export const fetchKabupaten = async (provinceId) => {
  if (!provinceId) return [];
  if (cache.regencies[provinceId]) return cache.regencies[provinceId];
  const res = await fetch(`${API_BASE}/regencies/${provinceId}.json`);
  if (!res.ok) throw new Error('Gagal memuat data kabupaten');
  const data = await res.json();
  cache.regencies[provinceId] = data;
  return data;
};

export const fetchKecamatan = async (regencyId) => {
  if (!regencyId) return [];
  if (cache.districts[regencyId]) return cache.districts[regencyId];
  const res = await fetch(`${API_BASE}/districts/${regencyId}.json`);
  if (!res.ok) throw new Error('Gagal memuat data kecamatan');
  const data = await res.json();
  cache.districts[regencyId] = data;
  return data;
};

export const fetchDesa = async (districtId) => {
  if (!districtId) return [];
  if (cache.villages[districtId]) return cache.villages[districtId];
  const res = await fetch(`${API_BASE}/villages/${districtId}.json`);
  if (!res.ok) throw new Error('Gagal memuat data desa');
  const data = await res.json();
  cache.villages[districtId] = data;
  return data;
};
