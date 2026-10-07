import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Database,
  Download,
  Upload,
  RotateCcw,
  Layers,
} from 'lucide-react';
import {
  AuditLogEntry,
  BakDocument,
  BakPayment,
  BakTrip,
  DocumentVersionSnapshot,
  RelationalDatabase,
  UserRole,
} from '../types/bak';
import { calculateBakFinancials, formatRupiah } from '../utils/formatters';
import { exportBakReportToExcel } from '../utils/documentExport';

interface ReportsViewProps {
  documents: BakDocument[];
  trips: BakTrip[];
  payments: BakPayment[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  documents,
  trips,
  payments,
}) => {
  const [filterAgent, setFilterAgent] = useState<string>('ALL');
  const [filterKa, setFilterKa] = useState<string>('ALL');
  const [filterRelasi, setFilterRelasi] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL');

  const uniqueAgents = useMemo(
    () => Array.from(new Set(documents.map((d) => d.pihakKeduaPerusahaan))).filter(Boolean),
    [documents]
  );

  const uniqueKaNames = useMemo(
    () => Array.from(new Set(trips.map((t) => t.namaKa))).filter(Boolean),
    [trips]
  );

  const uniqueRelations = useMemo(
    () =>
      Array.from(
        new Set(trips.map((t) => `${t.relasiAsal} – ${t.relasiTujuan}`))
      ).filter(Boolean),
    [trips]
  );

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (filterAgent !== 'ALL' && doc.pihakKeduaPerusahaan !== filterAgent) {
        return false;
      }
      if (filterPeriod !== 'ALL' && !doc.tanggalBak.startsWith(filterPeriod)) {
        return false;
      }
      const docTrips = trips.filter((t) => t.bakId === doc.id);
      if (filterKa !== 'ALL' && !docTrips.some((t) => t.namaKa === filterKa)) {
        return false;
      }
      if (
        filterRelasi !== 'ALL' &&
        !docTrips.some(
          (t) => `${t.relasiAsal} – ${t.relasiTujuan}` === filterRelasi
        )
      ) {
        return false;
      }
      return true;
    });
  }, [documents, trips, filterAgent, filterKa, filterRelasi, filterPeriod]);

  const periodSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        periodLabel: string;
        countBak: number;
        countTrips: number;
        totalPax: number;
        totalBiaya: number;
        totalTerbayar: number;
        sisaPiutang: number;
      }
    >();

    filteredDocs.forEach((doc) => {
      const ym = doc.tanggalBak.slice(0, 7);
      const [y, m] = ym.split('-');
      const monthNames = [
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
      const label = `${monthNames[Number(m) - 1] || m} ${y}`;

      const docTrips = trips.filter((t) => t.bakId === doc.id);
      const docPays = payments.filter((p) => p.bakId === doc.id);
      const fin = calculateBakFinancials(docTrips, docPays);

      const curr = map.get(ym) || {
        periodLabel: label,
        countBak: 0,
        countTrips: 0,
        totalPax: 0,
        totalBiaya: 0,
        totalTerbayar: 0,
        sisaPiutang: 0,
      };
      curr.countBak += 1;
      curr.countTrips += docTrips.length;
      curr.totalPax += fin.totalPax;
      curr.totalBiaya += fin.totalBiaya;
      curr.totalTerbayar += fin.totalPembayaran;
      curr.sisaPiutang += fin.sisaPembayaran;
      map.set(ym, curr);
    });

    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredDocs, trips, payments]);

  const grandTotals = useMemo(() => {
    return filteredDocs.reduce(
      (acc, doc) => {
        const dt = trips.filter((t) => t.bakId === doc.id);
        const dp = payments.filter((p) => p.bakId === doc.id);
        const fin = calculateBakFinancials(dt, dp);
        acc.pax += fin.totalPax;
        acc.biaya += fin.totalBiaya;
        acc.bayar += fin.totalPembayaran;
        acc.sisa += fin.sisaPembayaran;
        acc.trips += dt.length;
        return acc;
      },
      { pax: 0, biaya: 0, bayar: 0, sisa: 0, trips: 0 }
    );
  }, [filteredDocs, trips, payments]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Laporan &amp; Rekapitulasi Transaksi BAK Rombongan
          </h1>
          <p className="text-xs text-slate-500">
            Rekap total kapasitas pax dan nilai transaksi per periode, agen, kereta api, dan relasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportBakReportToExcel(filteredDocs, trips, payments)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer whitespace-nowrap"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Laporan Excel (.CSV)
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Filter Periode Bulan
          </label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Semua Periode</option>
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Filter Pelanggan / Agen
          </label>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Semua Pelanggan / Agen</option>
            {uniqueAgents.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Filter Nama Kereta Api (KA)
          </label>
          <select
            value={filterKa}
            onChange={(e) => setFilterKa(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Semua Kereta Api</option>
            {uniqueKaNames.map((ka) => (
              <option key={ka} value={ka}>
                {ka}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Filter Relasi Perjalanan
          </label>
          <select
            value={filterRelasi}
            onChange={(e) => setFilterRelasi(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Semua Relasi</option>
            {uniqueRelations.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Dokumen &amp; Perjalanan</div>
          <div className="mt-1 text-lg font-bold font-mono-tabular text-slate-900">
            {filteredDocs.length} BAK · {grandTotals.trips} KA
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Rekap Total Kapasitas Pax</div>
          <div className="mt-1 text-lg font-bold font-mono-tabular text-blue-700">
            {grandTotals.pax} Pax
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Rekap Nilai Transaksi</div>
          <div className="mt-1 text-lg font-bold font-mono-tabular text-slate-900">
            {formatRupiah(grandTotals.biaya)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Pembayaran Diterima</div>
          <div className="mt-1 text-lg font-bold font-mono-tabular text-emerald-700">
            {formatRupiah(grandTotals.bayar)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Rekapitulasi Total Pax &amp; Nilai Transaksi per Periode
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Periode Bulan</th>
                <th className="py-3 px-4 text-right">Jumlah BAK</th>
                <th className="py-3 px-4 text-right">Jumlah Keberangkatan</th>
                <th className="py-3 px-4 text-right">Total Pax</th>
                <th className="py-3 px-4 text-right">Total Nilai Transaksi</th>
                <th className="py-3 px-4 text-right">Realisasi Pembayaran</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {periodSummary.map(([ym, row]) => (
                <tr key={ym} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {row.periodLabel}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">
                    {row.countBak}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">
                    {row.countTrips}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-blue-800">
                    {row.totalPax} Pax
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold">
                    {formatRupiah(row.totalBiaya)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular text-emerald-700 font-medium">
                    {formatRupiah(row.totalTerbayar)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular text-amber-700 font-medium">
                    {formatRupiah(row.sisaPiutang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface AuditTrailViewProps {
  logs: AuditLogEntry[];
  versions: DocumentVersionSnapshot[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  logs,
  versions,
}) => {
  const [tab, setTab] = useState<'logs' | 'versions'>('logs');

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Riwayat Perubahan (Audit Trail) &amp; Versioning Dokumen
          </h1>
          <p className="text-xs text-slate-500">
            Mencatat aktivitas pengguna, waktu perubahan, serta perbandingan data sebelum dan sesudah.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('logs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
              tab === 'logs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Log Aktivitas ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('versions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
              tab === 'versions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Arsip Versi Dokumen ({versions.length})
          </button>
        </div>
      </div>

      {tab === 'logs' ? (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {logs.map((log) => (
            <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50/70">
              <div className="text-xs sm:text-sm font-semibold text-slate-900 font-mono-tabular">
                {log.formattedTime} - {log.user} -{' '}
                <span className="font-sans">{log.activity}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Data Sebelum Perubahan:
                  </span>
                  <span className="text-slate-700 font-mono-tabular">
                    {log.beforeData || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200">
                  <span className="text-[11px] font-semibold text-blue-700 block">
                    Data Sesudah Perubahan:
                  </span>
                  <span className="text-slate-900 font-mono-tabular font-medium">
                    {log.afterData || '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono-tabular font-bold text-slate-900">
                    Snapshot Versi v{ver.version}
                  </span>
                  <span>·</span>
                  <span className="font-mono-tabular">{ver.nomorBak}</span>
                  <span>·</span>
                  <span>Disimpan {ver.savedAt} oleh {ver.savedBy}</span>
                </div>
                <div className="text-sm font-medium text-slate-800">
                  Catatan Revisi: {ver.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface SettingsViewProps {
  db: RelationalDatabase;
  role: UserRole;
  onRestoreDatabase: (newDb: RelationalDatabase) => void;
  onResetDefaultDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  db,
  role,
  onRestoreDatabase,
  onResetDefaultDatabase,
}) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleBackupDownload = () => {
    const jsonString = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_DB_BAK_KAI_Wisata_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMsg('Backup database relasional (.JSON) berhasil diunduh.');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.bak_documents)) {
          onRestoreDatabase(parsed);
          setStatusMsg('Database berhasil dipulihkan dari file backup.');
        }
      } catch {
        setStatusMsg('Gagal membaca file backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const relationalTables = [
    { name: 'users', count: db.users.length, desc: 'Akun & Role Petugas (Admin, Ticketing, Viewer)' },
    { name: 'customers', count: db.customers.length, desc: 'Master Pelanggan / Agen (Pihak Kedua)' },
    { name: 'staff', count: db.staff.length, desc: 'Master Petugas Ticketing (Pihak Pertama)' },
    { name: 'bak_documents', count: db.bak_documents.length, desc: 'Dokumen Utama Berita Acara Kesepakatan' },
    { name: 'bak_trips', count: db.bak_trips.length, desc: 'Relasi 1-ke-Banyak Keberangkatan KA per BAK' },
    { name: 'bak_payments', count: db.bak_payments.length, desc: 'Relasi 1-ke-Banyak Pembayaran per BAK' },
    { name: 'bak_terms', count: db.bak_terms.length, desc: 'Relasi 1-ke-Banyak Ketentuan per BAK' },
    { name: 'bank_accounts', count: db.bank_accounts.length, desc: 'Master Rekening Perusahaan KAI Wisata' },
    { name: 'tariffs', count: db.tariffs.length, desc: 'Master Tarif Subclass & Bea Admin KA' },
    { name: 'audit_logs', count: db.audit_logs.length, desc: 'Riwayat Perubahan Data (Audit Trail)' },
    { name: 'document_versions', count: db.document_versions.length, desc: 'Riwayat Versi Revisi Dokumen BAK' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-lg font-bold text-slate-900">
          Pengaturan Sistem &amp; Manajemen Database Relasional
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola backup database dan inspeksi skema relasional aplikasi BAK Rombongan KAI Wisata.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-950 px-4 py-3 rounded-xl text-xs font-medium">
          {statusMsg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Backup &amp; Pemulihan Database
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBackupDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Backup Database (.JSON)
          </button>

          {role === 'ADMIN' && (
            <>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                <Upload className="w-4 h-4" />
                Restore Database dari File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  onResetDefaultDatabase();
                  setStatusMsg('Database telah direset ke data demo awal KAI Wisata.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset ke Data Demo Default
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Status Skema Tabel Database Relasional (11 Tabel Aktif)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Nama Tabel</th>
                <th className="py-3 px-4">Deskripsi Relasi</th>
                <th className="py-3 px-4 text-right">Jumlah Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {relationalTables.map((tb) => (
                <tr key={tb.name} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-tabular font-semibold text-blue-800">
                    {tb.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{tb.desc}</td>
                  <td className="py-3 px-4 text-right font-mono-tabular font-bold text-slate-900">
                    {tb.count} baris
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
