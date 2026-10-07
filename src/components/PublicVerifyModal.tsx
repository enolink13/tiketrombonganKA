import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  ArrowLeft,
  Train,
  Calendar,
  Building2,
  Users,
  FileCheck2,
} from 'lucide-react';
import { BakDocument, BakTrip } from '../types/bak';
import {
  formatDayAndDateIndonesia,
  formatIndonesianDate,
} from '../utils/formatters';
import { QrCodeSvg } from './QrCodeSvg';

interface PublicVerifyViewProps {
  initialCode: string;
  documents: BakDocument[];
  trips: BakTrip[];
  onClose: () => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  initialCode,
  documents,
  trips,
  onClose,
}) => {
  const [queryCode, setQueryCode] = useState(initialCode);

  const normalizedQuery = queryCode.trim().toLowerCase();
  const matchedDoc = documents.find(
    (d) =>
      d.verificationCode.toLowerCase() === normalizedQuery ||
      d.nomorBak.toLowerCase() === normalizedQuery ||
      d.id.toLowerCase() === normalizedQuery
  );

  const matchedTrips = matchedDoc
    ? trips.filter((t) => t.bakId === matchedDoc.id)
    : [];
  const totalPax = matchedTrips.reduce((acc, t) => acc + (Number(t.jumlahPax) || 0), 0);
  const isValid = Boolean(matchedDoc && matchedDoc.statusDokumen !== 'Archived');

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Sistem Ticketing
          </button>

          <div className="font-mono-tabular text-xs text-slate-500">
            Endpoint Publik: <span className="text-slate-900 font-medium">/verify/{queryCode || 'kode'}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  Portal Verifikasi Dokumen BAK — KAI Wisata
                </h1>
                <p className="text-xs text-slate-300">
                  PT Kereta Api Pariwisata · Sistem Verifikasi Keaslian Berita Acara Kesepakatan
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-slate-200 bg-slate-50/60">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Masukkan Kode Verifikasi QR atau Nomor BAK:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={queryCode}
                  onChange={(e) => setQueryCode(e.target.value)}
                  placeholder="Contoh: KAW-290-IX2026 atau 290/KAWISATA/GDD/WOMT.1/IX/2026"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono-tabular"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {documents.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setQueryCode(d.verificationCode)}
                    className={`px-3 py-2 text-xs font-mono-tabular rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      queryCode === d.verificationCode
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.verificationCode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {matchedDoc ? (
              <div className="space-y-6">
                <div
                  className={`p-4 rounded-lg border flex items-start gap-3.5 ${
                    isValid
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  {isValid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="text-base font-bold tracking-tight">
                      {isValid ? 'Dokumen BAK Valid' : 'Dokumen BAK Diarsipkan'}
                    </div>
                    <p className="text-xs mt-0.5 text-slate-700">
                      {isValid
                        ? 'Nomor Berita Acara Kesepakatan (BAK) ini terdaftar secara resmi pada database Ticketing PT Kereta Api Pariwisata dan dinyatakan sah.'
                        : 'Dokumen ini tercatat dalam arsip histori dan tidak lagi aktif untuk perjalanan baru.'}
                    </p>
                  </div>
                  <QrCodeSvg value={matchedDoc.verificationCode} size={56} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                      Nomor BAK
                    </div>
                    <div className="mt-1 font-mono-tabular font-semibold text-sm text-slate-900">
                      {matchedDoc.nomorBak}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Tanggal BAK
                    </div>
                    <div className="mt-1 font-semibold text-sm text-slate-900">
                      {formatDayAndDateIndonesia(matchedDoc.tanggalBak, matchedDoc.hariBak)}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Pihak Kedua (Pelanggan / Agen)
                    </div>
                    <div className="mt-1 font-semibold text-sm text-slate-900">
                      {matchedDoc.pihakKeduaPerusahaan}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Total Peserta &amp; Status Dokumen
                    </div>
                    <div className="mt-1 font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <span className="font-mono-tabular">{totalPax} Pax</span>
                      <span>·</span>
                      <span className="text-emerald-700">
                        Status: {matchedDoc.statusDokumen}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Rincian Jadwal Keberangkatan Terdaftar ({matchedTrips.length} Perjalanan)
                  </h2>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                    {matchedTrips.map((trip, idx) => (
                      <div
                        key={trip.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-medium">
                            Keberangkatan {idx + 1} ·{' '}
                            {formatDayAndDateIndonesia(trip.tanggal, trip.hari)}
                          </div>
                          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Train className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                              {trip.namaKa} ({trip.nomorKa}) — Kelas {trip.kelas}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Relasi: <strong>{trip.relasiAsal}</strong> →{' '}
                            <strong>{trip.relasiTujuan}</strong> · Pukul{' '}
                            <span className="font-mono-tabular">
                              {trip.jamBerangkat} – {trip.jamTiba} WIB
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-xs text-slate-500">Jumlah Kapasitas</div>
                          <div className="font-mono-tabular text-sm font-bold text-slate-900">
                            {trip.jumlahPax} Pax
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    Demi perlindungan privasi data, halaman publik ini tidak menampilkan NIK
                    penumpang, nomor rekening, atau nominal rincian pembayaran.
                  </span>
                  <span className="font-mono-tabular">
                    Tanggal Cetak: {formatIndonesianDate(matchedDoc.tanggalBak)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <XCircle className="w-10 h-10 text-red-600 mx-auto" />
                <div className="text-base font-bold text-slate-900">
                  Dokumen BAK Tidak Ditemukan
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Kode verifikasi atau Nomor BAK <span className="font-mono-tabular font-semibold">{queryCode}</span> tidak terdaftar dalam database PT Kereta Api Pariwisata. Pastikan kode telah diketik dengan benar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
