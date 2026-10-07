import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Copy,
  Edit3,
  Eye,
  FileDown,
  FileText,
  Printer,
  Archive,
  Bell,
  Calendar as CalendarIcon,
  Train,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  BakDocument,
  BakPayment,
  BakTermItem,
  BakTrip,
  BankAccount,
  UserRole,
} from '../types/bak';
import {
  calculateBakFinancials,
  formatDayAndDateIndonesia,
  formatIndonesianDate,
  formatRupiah,
} from '../utils/formatters';
import { exportBakToDocx, exportBakToPdf } from '../utils/documentExport';
import { BakDocumentPreview } from './BakDocumentPreview';

interface DashboardAndListViewProps {
  mode: 'dashboard' | 'list';
  documents: BakDocument[];
  trips: BakTrip[];
  payments: BakPayment[];
  terms: BakTermItem[];
  bankAccounts: BankAccount[];
  role: UserRole;
  onCreateNew: () => void;
  onEditBak: (bakId: string) => void;
  onDuplicateBak: (bakId: string) => void;
  onArchiveBak: (bakId: string) => void;
  onOpenVerify: (code: string) => void;
}

type QuickFilterTab =
  | 'Semua'
  | 'Draft'
  | 'Menunggu Pembayaran'
  | 'Sebagian Dibayar'
  | 'Lunas'
  | 'Selesai'
  | 'Arsip';

export const DashboardAndListView: React.FC<DashboardAndListViewProps> = ({
  mode,
  documents,
  trips,
  payments,
  terms,
  bankAccounts,
  role,
  onCreateNew,
  onEditBak,
  onDuplicateBak,
  onArchiveBak,
  onOpenVerify,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<QuickFilterTab>('Semua');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterDepartureDate, setFilterDepartureDate] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('ALL');
  const [calendarMonth, setCalendarMonth] = useState<string>('2026-10');
  const [showCalendarSection, setShowCalendarSection] = useState<boolean>(
    mode === 'dashboard'
  );
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [detailDocId, setDetailDocId] = useState<string | null>(null);

  const canCreateOrEdit = role === 'ADMIN' || role === 'PETUGAS_TICKETING';
  const canArchive = role === 'ADMIN';

  const enrichedDocs = useMemo(() => {
    return documents.map((doc) => {
      const docTrips = trips.filter((t) => t.bakId === doc.id);
      const docPays = payments.filter((p) => p.bakId === doc.id);
      const fin = calculateBakFinancials(docTrips, docPays);
      return {
        doc: {
          ...doc,
          statusPembayaran: fin.statusPembayaran,
        },
        trips: docTrips,
        payments: docPays,
        fin,
      };
    });
  }, [documents, trips, payments]);

  const stats = useMemo(() => {
    const activeItems = enrichedDocs.filter(
      (item) => item.doc.statusDokumen !== 'Archived'
    );
    const currentMonthPrefix = '2026-10';
    const bakThisMonth = activeItems.filter((item) =>
      item.doc.tanggalBak.startsWith(currentMonthPrefix)
    ).length;

    const unpaidCount = activeItems.filter(
      (item) => item.fin.statusPembayaran !== 'Lunas'
    ).length;

    const paidCount = activeItems.filter(
      (item) => item.fin.statusPembayaran === 'Lunas'
    ).length;

    const totalTransactionValue = activeItems.reduce(
      (acc, item) => acc + item.fin.totalBiaya,
      0
    );

    const totalGroupTrips = activeItems.reduce(
      (acc, item) => acc + item.trips.length,
      0
    );

    const totalPaxAll = activeItems.reduce(
      (acc, item) => acc + item.fin.totalPax,
      0
    );

    return {
      totalBak: documents.length,
      bakThisMonth,
      unpaidCount,
      paidCount,
      totalTransactionValue,
      totalGroupTrips,
      totalPaxAll,
    };
  }, [enrichedDocs, documents.length]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return enrichedDocs.filter(({ doc, trips: docTrips, fin }) => {
      if (activeTab === 'Draft' && doc.statusDokumen !== 'Draft') return false;
      if (
        activeTab === 'Menunggu Pembayaran' &&
        fin.statusPembayaran !== 'Belum Dibayar'
      )
        return false;
      if (
        activeTab === 'Sebagian Dibayar' &&
        !['DP', 'Sebagian Dibayar'].includes(fin.statusPembayaran)
      )
        return false;
      if (activeTab === 'Lunas' && fin.statusPembayaran !== 'Lunas') return false;
      if (
        activeTab === 'Selesai' &&
        !['Signed', 'Completed'].includes(doc.statusDokumen)
      )
        return false;
      if (activeTab === 'Arsip' && doc.statusDokumen !== 'Archived') return false;

      const [docY, docM] = doc.tanggalBak.split('-');
      if (filterYear !== 'ALL' && docY !== filterYear) return false;
      if (filterMonth !== 'ALL' && docM !== filterMonth) return false;

      if (
        filterPaymentStatus !== 'ALL' &&
        fin.statusPembayaran !== filterPaymentStatus
      ) {
        return false;
      }

      if (
        filterDepartureDate &&
        !docTrips.some((t) => t.tanggal === filterDepartureDate)
      ) {
        return false;
      }

      if (q) {
        const matchDoc =
          doc.nomorBak.toLowerCase().includes(q) ||
          doc.pihakKeduaPerusahaan.toLowerCase().includes(q) ||
          doc.pihakKeduaNama.toLowerCase().includes(q) ||
          doc.verificationCode.toLowerCase().includes(q);

        const matchTrip = docTrips.some(
          (t) =>
            t.namaKa.toLowerCase().includes(q) ||
            t.nomorKa.toLowerCase().includes(q) ||
            t.relasiAsal.toLowerCase().includes(q) ||
            t.relasiTujuan.toLowerCase().includes(q) ||
            t.tanggal.includes(q)
        );

        if (!matchDoc && !matchTrip) return false;
      }

      return true;
    });
  }, [
    enrichedDocs,
    searchQuery,
    activeTab,
    filterMonth,
    filterYear,
    filterDepartureDate,
    filterPaymentStatus,
  ]);

  const unpaidReminders = useMemo(
    () =>
      enrichedDocs.filter(
        (i) =>
          i.doc.statusDokumen !== 'Archived' &&
          i.fin.statusPembayaran !== 'Lunas'
      ),
    [enrichedDocs]
  );

  const upcomingDepartures = useMemo(() => {
    const all: { trip: BakTrip; doc: BakDocument }[] = [];
    enrichedDocs.forEach(({ doc, trips: dt }) => {
      if (doc.statusDokumen === 'Archived') return;
      dt.forEach((tr) => {
        if (tr.tanggal >= '2026-10-06') {
          all.push({ trip: tr, doc });
        }
      });
    });
    return all.sort((a, b) => a.trip.tanggal.localeCompare(b.trip.tanggal));
  }, [enrichedDocs]);

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: {
      day: number | null;
      dateStr: string;
      events: { trip: BakTrip; doc: BakDocument }[];
    }[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, dateStr: '', events: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      const dayEvents: { trip: BakTrip; doc: BakDocument }[] = [];
      enrichedDocs.forEach(({ doc, trips: dt }) => {
        if (doc.statusDokumen === 'Archived') return;
        dt.forEach((tr) => {
          if (tr.tanggal === dateStr) {
            dayEvents.push({ trip: tr, doc });
          }
        });
      });
      cells.push({ day: d, dateStr, events: dayEvents });
    }
    return cells;
  }, [calendarMonth, enrichedDocs]);

  const previewItem = useMemo(
    () => enrichedDocs.find((i) => i.doc.id === previewDocId),
    [enrichedDocs, previewDocId]
  );

  const detailItem = useMemo(
    () => enrichedDocs.find((i) => i.doc.id === detailDocId),
    [enrichedDocs, detailDocId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'dashboard'
              ? 'Dashboard Operasional BAK Rombongan'
              : 'Manajemen & Histori Dokumen BAK Rombongan'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PT Kereta Api Pariwisata (KAI Wisata) · Stasiun Gondangdia, Jakarta Pusat
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {mode === 'dashboard' && (
            <button
              type="button"
              onClick={() => setShowCalendarSection((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              {showCalendarSection ? 'Sembunyikan Kalender' : 'Kalender Keberangkatan'}
            </button>
          )}
          {canCreateOrEdit && (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Buat BAK Baru
            </button>
          )}
        </div>
      </div>

      {mode === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Total BAK</div>
            <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-slate-900">
              {stats.totalBak}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Seluruh dokumen terdaftar
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">BAK Bulan Ini</div>
            <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-blue-700">
              {stats.bakThisMonth}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Periode Oktober 2026
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">BAK Belum Lunas</div>
            <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-amber-700">
              {stats.unpaidCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Menunggu pelunasan
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">BAK Lunas</div>
            <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-emerald-700">
              {stats.paidCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Pembayaran terverifikasi
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Total Nilai Transaksi</div>
            <div className="mt-1.5 text-lg font-bold font-mono-tabular text-slate-900 truncate">
              {formatRupiah(stats.totalTransactionValue)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Akumulasi seluruh BAK
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Perjalanan Rombongan</div>
            <div className="mt-1.5 text-2xl font-bold font-mono-tabular text-slate-900">
              {stats.totalGroupTrips}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-mono-tabular">
              Total {stats.totalPaxAll} Pax
            </div>
          </div>
        </div>
      )}

      {mode === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Notifikasi Pembayaran Belum Lunas ({unpaidReminders.length})</span>
              </div>
              <span className="text-[11px] text-slate-500">Monitoring Piutang</span>
            </div>

            {unpaidReminders.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                Seluruh dokumen BAK telah lunas.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {unpaidReminders.map(({ doc, fin }) => (
                  <div
                    key={doc.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {doc.pihakKeduaPerusahaan}
                      </div>
                      <div className="text-slate-500 font-mono-tabular">
                        {doc.nomorBak} · Status: {fin.statusPembayaran}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono-tabular font-bold text-amber-700">
                        Sisa {formatRupiah(fin.sisaPembayaran)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditBak(doc.id)}
                        className="text-[11px] text-blue-700 hover:underline cursor-pointer"
                      >
                        Input Pelunasan →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                <Train className="w-4 h-4 text-blue-600" />
                <span>Reminder Jadwal Keberangkatan Rombongan ({upcomingDepartures.length})</span>
              </div>
              <span className="text-[11px] text-slate-500">Mulai Oktober 2026</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
              {upcomingDepartures.slice(0, 4).map(({ trip, doc }) => (
                <div
                  key={trip.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {trip.namaKa} ({trip.nomorKa}) · {trip.relasiAsal} → {trip.relasiTujuan}
                    </div>
                    <div className="text-slate-500">
                      {doc.pihakKeduaPerusahaan} · Pukul{' '}
                      <span className="font-mono-tabular">{trip.jamBerangkat} WIB</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-slate-900">
                      {formatIndonesianDate(trip.tanggal)}
                    </div>
                    <div className="font-mono-tabular text-blue-700 font-medium">
                      {trip.jumlahPax} Pax
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'dashboard' && showCalendarSection && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kalender Jadwal Perjalanan Rombongan KA
              </h2>
              <p className="text-xs text-slate-500">
                Klik jadwal keberangkatan pada tanggal kalender untuk melihat preview dokumen BAK.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarMonth('2026-09')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  calendarMonth === '2026-09'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                September 2026
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth('2026-10')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  calendarMonth === '2026-10'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Oktober 2026
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 pb-1 border-b border-slate-200">
            <div>Minggu</div>
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div>Sabtu</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[78px] p-1.5 rounded-lg border text-left ${
                  cell.day
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50/50 border-transparent'
                }`}
              >
                {cell.day && (
                  <>
                    <div className="text-[11px] font-mono-tabular font-semibold text-slate-500">
                      {cell.day}
                    </div>
                    <div className="mt-1 space-y-1">
                      {cell.events.map(({ trip, doc }) => (
                        <button
                          key={trip.id}
                          type="button"
                          onClick={() => setPreviewDocId(doc.id)}
                          className="w-full text-left px-1.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[10px] leading-tight text-blue-950 cursor-pointer"
                        >
                          <div className="font-bold truncate">{trip.namaKa}</div>
                          <div className="font-mono-tabular text-blue-700">
                            {trip.jumlahPax} pax · {trip.jamBerangkat}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(
            [
              'Semua',
              'Draft',
              'Menunggu Pembayaran',
              'Sebagian Dibayar',
              'Lunas',
              'Selesai',
              'Arsip',
            ] as QuickFilterTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nomor BAK, Perusahaan, Perwakilan, Nama/No KA, Relasi..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="lg:col-span-2">
            <input
              type="date"
              value={filterDepartureDate}
              onChange={(e) => setFilterDepartureDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              <option value="ALL">Semua Bulan BAK</option>
              <option value="09">September (IX)</option>
              <option value="10">Oktober (X)</option>
              <option value="11">November (XI)</option>
              <option value="12">Desember (XII)</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-mono-tabular bg-white border border-slate-300 rounded-lg"
            >
              <option value="ALL">Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              <option value="ALL">Status Pembayaran</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="DP">DP</option>
              <option value="Sebagian Dibayar">Sebagian Dibayar</option>
              <option value="Lunas">Lunas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Dokumen Berita Acara Kesepakatan (BAK)
          </h2>
          <span className="text-xs text-slate-500 font-mono-tabular">
            Menampilkan {filteredItems.length} dari {documents.length} BAK
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Nomor BAK</th>
                <th className="py-3 px-4">Tanggal BAK</th>
                <th className="py-3 px-4">Pihak Kedua (Pelanggan / Agen)</th>
                <th className="py-3 px-4 text-right">Keberangkatan</th>
                <th className="py-3 px-4 text-right">Total Pax</th>
                <th className="py-3 px-4 text-right">Total Biaya</th>
                <th className="py-3 px-4">Status Pembayaran</th>
                <th className="py-3 px-4">Status Dokumen</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredItems.map(({ doc, trips: docTrips, payments: docPays, fin }) => {
                const bank = bankAccounts.find((b) => b.id === doc.bankAccountId);
                const docTerms = terms.filter((t) => t.bakId === doc.id);

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/90">
                    <td className="py-3.5 px-4">
                      <div className="font-mono-tabular font-bold text-slate-900">
                        {doc.nomorBak}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-tabular">
                        Kode: {doc.verificationCode} · v{doc.version}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {formatIndonesianDate(doc.tanggalBak)}
                      </div>
                      <div className="text-[11px] text-slate-500">{doc.hariBak}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {doc.pihakKeduaPerusahaan}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.pihakKeduaNama} · {doc.pihakKeduaJabatan}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono-tabular">
                      <div className="font-semibold text-slate-900">
                        {docTrips.length} KA
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px] ml-auto">
                        {docTrips.map((t) => t.namaKa).join(', ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                      {fin.totalPax} Pax
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(fin.totalBiaya)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        {fin.statusPembayaran === 'Lunas' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : fin.statusPembayaran === 'Belum Dibayar' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span
                          className={
                            fin.statusPembayaran === 'Lunas'
                              ? 'text-emerald-800'
                              : fin.statusPembayaran === 'Belum Dibayar'
                              ? 'text-red-700'
                              : 'text-amber-800'
                          }
                        >
                          {fin.statusPembayaran}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {doc.statusDokumen}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailDocId(doc.id)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewDocId(doc.id)}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canCreateOrEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditBak(doc.id)}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDuplicateBak(doc.id)}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                              title="Duplikat BAK"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            exportBakToPdf(doc, docTrips, docPays, docTerms, bank)
                          }
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          title="Download PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            exportBakToDocx(doc, docTrips, docPays, docTerms, bank)
                          }
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                          title="Download DOCX"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocId(doc.id);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          title="Cetak"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {canArchive && doc.statusDokumen !== 'Archived' && (
                          <button
                            type="button"
                            onClick={() => onArchiveBak(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title="Arsipkan"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-mono-tabular text-blue-700 font-semibold">
                  {detailItem.doc.nomorBak}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Detail Transaksi BAK — {detailItem.doc.pihakKeduaPerusahaan}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailDocId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {detailItem.trips.map((tr, i) => (
                <div
                  key={tr.id}
                  className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      Keberangkatan {i + 1}: {tr.namaKa} ({tr.nomorKa}) — {tr.kelas}
                    </div>
                    <div className="text-slate-600">
                      {formatDayAndDateIndonesia(tr.tanggal, tr.hari)} · {tr.relasiAsal} → {tr.relasiTujuan}
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <div className="font-bold text-slate-900">
                      {formatRupiah(tr.jumlahBiaya)}
                    </div>
                    <div className="text-slate-500">{tr.jumlahPax} Pax</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const code = detailItem.doc.verificationCode;
                  setDetailDocId(null);
                  onOpenVerify(code);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Halaman Verifikasi (/verify/{detailItem.doc.verificationCode})
              </button>

              <button
                type="button"
                onClick={() => setDetailDocId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-[820px] bg-slate-900 text-white px-5 py-3.5 rounded-t-xl flex flex-wrap items-center justify-between gap-3 no-print">
            <div>
              <div className="text-xs font-mono-tabular text-blue-300">
                Preview Resmi A4 — {previewItem.doc.nomorBak}
              </div>
              <div className="text-sm font-bold">
                {previewItem.doc.pihakKeduaPerusahaan}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  exportBakToPdf(
                    previewItem.doc,
                    previewItem.trips,
                    previewItem.payments,
                    terms.filter((t) => t.bakId === previewItem.doc.id),
                    bankAccounts.find((b) => b.id === previewItem.doc.bankAccountId)
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Generate PDF
              </button>

              <button
                type="button"
                onClick={() =>
                  exportBakToDocx(
                    previewItem.doc,
                    previewItem.trips,
                    previewItem.payments,
                    terms.filter((t) => t.bakId === previewItem.doc.id),
                    bankAccounts.find((b) => b.id === previewItem.doc.bankAccountId)
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Generate DOCX
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak
              </button>

              <button
                type="button"
                onClick={() => setPreviewDocId(null)}
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="w-full max-w-[820px] bg-white rounded-b-xl overflow-hidden shadow-2xl">
            <BakDocumentPreview
              document={previewItem.doc}
              trips={previewItem.trips}
              payments={previewItem.payments}
              terms={terms.filter((t) => t.bakId === previewItem.doc.id)}
              bankAccount={bankAccounts.find(
                (b) => b.id === previewItem.doc.bankAccountId
              )}
              onOpenVerify={(code) => {
                setPreviewDocId(null);
                onOpenVerify(code);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
