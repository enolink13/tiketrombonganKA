import { BakPayment, BakTrip, PaymentStatus } from '../types/bak';

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const BULAN_ROMAWI = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
];

export function getIndonesianDayName(dateStr: string): string {
  if (!dateStr) return 'Selasa';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return 'Selasa';
  const date = new Date(y, m - 1, d);
  return HARI_INDONESIA[date.getDay()] || 'Selasa';
}

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const monthName = BULAN_INDONESIA[m - 1] || '';
  return `${d} ${monthName} ${y}`;
}

export function formatDayAndDateIndonesia(dateStr: string, explicitDay?: string): string {
  if (!dateStr) return '-';
  const dayName = explicitDay || getIndonesianDayName(dateStr);
  return `${dayName}, ${formatIndonesianDate(dateStr)}`;
}

export function getRomanMonthFromDate(dateStr: string): string {
  if (!dateStr) return 'IX';
  const parts = dateStr.split('-').map(Number);
  const month = parts[1];
  if (!month || month < 1 || month > 12) return 'IX';
  return BULAN_ROMAWI[month - 1];
}

export function getYearFromDate(dateStr: string): number {
  if (!dateStr) return 2026;
  const parts = dateStr.split('-').map(Number);
  return parts[0] || 2026;
}

export function generateNomorBak(sequenceNumber: number, dateStr: string): string {
  const romanMonth = getRomanMonthFromDate(dateStr);
  const year = getYearFromDate(dateStr);
  const paddedSeq = String(sequenceNumber);
  return `${paddedSeq}/KAWISATA/GDD/WOMT.1/${romanMonth}/${year}`;
}

export function formatRupiah(amount: number, withPrefix = true): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = safe < 0 ? '-' : '';
  return withPrefix ? `${sign}Rp${formatted}` : `${sign}${formatted}`;
}

export function calculateTripTotals(
  tarifSubclass: number,
  beaAdmin: number,
  jumlahPax: number
): {
  tarifTiketPlusAdmin: number;
  jumlahBiaya: number;
} {
  const safeTarif = Math.max(0, Number(tarifSubclass) || 0);
  const safeAdmin = Math.max(0, Number(beaAdmin) || 0);
  const safePax = Math.max(0, Number(jumlahPax) || 0);
  const tarifTiketPlusAdmin = safeTarif + safeAdmin;
  const jumlahBiaya = tarifTiketPlusAdmin * safePax;
  return {
    tarifTiketPlusAdmin,
    jumlahBiaya,
  };
}

export function calculateBakFinancials(
  trips: BakTrip[],
  payments: BakPayment[]
): {
  totalPax: number;
  totalBiaya: number;
  totalPembayaran: number;
  sisaPembayaran: number;
  statusPembayaran: PaymentStatus;
} {
  const totalPax = trips.reduce((acc, t) => acc + (Number(t.jumlahPax) || 0), 0);
  const totalBiaya = trips.reduce((acc, t) => {
    const { jumlahBiaya } = calculateTripTotals(t.tarifSubclass, t.beaAdmin, t.jumlahPax);
    return acc + jumlahBiaya;
  }, 0);

  const totalPembayaran = payments.reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);
  const sisaPembayaran = Math.max(0, totalBiaya - totalPembayaran);

  let statusPembayaran: PaymentStatus = 'Belum Dibayar';
  if (totalBiaya > 0 && totalPembayaran >= totalBiaya) {
    statusPembayaran = 'Lunas';
  } else if (totalPembayaran > 0 && payments.length === 1 && totalPembayaran <= totalBiaya * 0.5) {
    statusPembayaran = 'DP';
  } else if (totalPembayaran > 0) {
    statusPembayaran = 'Sebagian Dibayar';
  }

  return {
    totalPax,
    totalBiaya,
    totalPembayaran,
    sisaPembayaran,
    statusPembayaran,
  };
}

export function buildDocumentFilename(
  nomorBak: string,
  pihakKeduaPerusahaan: string,
  extension: 'pdf' | 'docx'
): string {
  const seqMatch = nomorBak.split('/')[0] || nomorBak.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanCompany = (pihakKeduaPerusahaan || 'Pelanggan')
    .replace(/^PT\.?\s+/i, '')
    .replace(/\s+Tbk\.?$/i, '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `BAK_${seqMatch}_${cleanCompany}.${extension}`;
}

export function formatAuditTimestamp(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export const formatTimestampLog = formatAuditTimestamp;
