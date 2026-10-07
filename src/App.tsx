import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Building2,
  Tags,
  Landmark,
  ScrollText,
  Users,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import {
  AuditLogEntry,
  BakDocument,
  BakPayment,
  BakTermItem,
  BakTrip,
  BankAccount,
  Customer,
  MasterTariff,
  MasterTerm,
  RelationalDatabase,
  StaffMember,
  UserRole,
} from './types/bak';
import { INITIAL_DATABASE } from './data/initialData';
import {
  formatTimestampLog,
  generateNomorBak,
  getIndonesianDayName,
} from './utils/formatters';
import { DashboardAndListView } from './components/DashboardAndListView';
import { BakWizard } from './components/BakWizard';
import {
  MasterBanksView,
  MasterCustomersView,
  MasterStaffView,
  MasterTariffsView,
  MasterTermsView,
} from './components/MasterDataViews';
import {
  AuditTrailView,
  ReportsView,
  SettingsView,
} from './components/ReportsAndSystemViews';
import { PublicVerifyView } from './components/PublicVerifyModal';

type NavMenuKey =
  | 'dashboard'
  | 'bak_list'
  | 'create_bak'
  | 'customers'
  | 'tariffs'
  | 'banks'
  | 'terms'
  | 'staff'
  | 'reports'
  | 'audit'
  | 'settings';

const STORAGE_KEY = 'KAI_WISATA_BAK_RELATIONAL_DB_V2';

export default function App() {
  const [db, setDb] = useState<RelationalDatabase>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.bak_documents)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial database
    }
    return INITIAL_DATABASE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage quota errors
    }
  }, [db]);

  const [activeNav, setActiveNav] = useState<NavMenuKey>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMIN');
  const [editingBakId, setEditingBakId] = useState<string | null>(null);
  const [verifyCodeModal, setVerifyCodeModal] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      return decodeURIComponent(path.replace('/verify/', ''));
    }
    return null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const currentUserAccount = useMemo(() => {
    return (
      db.users.find((u) => u.role === currentUserRole) || {
        id: 'usr-1',
        name: 'Sumarjiyono',
        email: 'sumarjiyono13@kawisata.id',
        role: currentUserRole,
        nipp: '68920144',
        jabatan: 'Pelaksana Ticketing',
      }
    );
  }, [db.users, currentUserRole]);

  const nextSequenceNumber = useMemo(() => {
    const maxSeq = db.bak_documents.reduce(
      (max, d) => (d.sequenceNumber > max ? d.sequenceNumber : max),
      289
    );
    return maxSeq + 1;
  }, [db.bak_documents]);

  const appendAuditLog = (
    activity: string,
    beforeData: string,
    afterData: string,
    bakId?: string,
    nomorBak?: string
  ): AuditLogEntry => {
    const now = new Date();
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now.toISOString(),
      formattedTime: formatTimestampLog(now),
      user: currentUserAccount.name,
      role: currentUserRole,
      bakId,
      nomorBak,
      activity,
      beforeData,
      afterData,
    };
  };

  const handleStartCreateNew = () => {
    setEditingBakId(null);
    setActiveNav('create_bak');
  };

  const handleStartEditBak = (bakId: string) => {
    setEditingBakId(bakId);
    setActiveNav('create_bak');
  };

  const handleDuplicateBak = (bakId: string) => {
    const sourceDoc = db.bak_documents.find((d) => d.id === bakId);
    if (!sourceDoc) return;

    const newSeq = nextSequenceNumber;
    const todayStr = '2026-10-06';
    const newId = `bak-${Date.now()}`;
    const newNomorBak = generateNomorBak(newSeq, todayStr);

    const duplicatedDoc: BakDocument = {
      ...sourceDoc,
      id: newId,
      sequenceNumber: newSeq,
      nomorBak: newNomorBak,
      tanggalBak: todayStr,
      hariBak: getIndonesianDayName(todayStr),
      statusDokumen: 'Draft',
      statusPembayaran: 'Belum Dibayar',
      verificationCode: `VER-KAW-${new Date().getFullYear()}-${String(newSeq).padStart(3, '0')}`,
      version: 1,
      catatanRevisi: `Duplikasi dari BAK Nomor ${sourceDoc.nomorBak}`,
      createdBy: currentUserAccount.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sourceTrips = db.bak_trips
      .filter((t) => t.bakId === bakId)
      .map((t, idx) => ({
        ...t,
        id: `trip-${Date.now()}-${idx + 1}`,
        bakId: newId,
      }));

    const sourceTerms = db.bak_terms
      .filter((tm) => tm.bakId === bakId)
      .map((tm, idx) => ({
        ...tm,
        id: `bterm-${Date.now()}-${idx + 1}`,
        bakId: newId,
      }));

    const auditEntry = appendAuditLog(
      `Menduplikasi BAK ${sourceDoc.nomorBak} menjadi ${newNomorBak}`,
      `Sumber: ${sourceDoc.nomorBak} (${sourceDoc.pihakKeduaPerusahaan})`,
      `BAK Baru: ${newNomorBak} (Status: Draft)`,
      newId,
      newNomorBak
    );

    setDb((prev) => ({
      ...prev,
      bak_documents: [duplicatedDoc, ...prev.bak_documents],
      bak_trips: [...prev.bak_trips, ...sourceTrips],
      bak_terms: [...prev.bak_terms, ...sourceTerms],
      audit_logs: [auditEntry, ...prev.audit_logs],
    }));

    setEditingBakId(newId);
    setActiveNav('create_bak');
    showToast(`BAK berhasil diduplikasi menjadi ${newNomorBak}`);
  };

  const handleArchiveBak = (bakId: string) => {
    const target = db.bak_documents.find((d) => d.id === bakId);
    if (!target) return;

    const auditEntry = appendAuditLog(
      `Mengarsipkan BAK ${target.nomorBak}`,
      `Status Dokumen: ${target.statusDokumen}`,
      `Status Dokumen: Archived`,
      target.id,
      target.nomorBak
    );

    setDb((prev) => ({
      ...prev,
      bak_documents: prev.bak_documents.map((d) =>
        d.id === bakId
          ? { ...d, statusDokumen: 'Archived', updatedAt: new Date().toISOString() }
          : d
      ),
      audit_logs: [auditEntry, ...prev.audit_logs],
    }));

    showToast(`Dokumen BAK ${target.nomorBak} dipindahkan ke Arsip.`);
  };

  const handleSaveBak = (
    doc: BakDocument,
    trips: BakTrip[],
    payments: BakPayment[],
    terms: BakTermItem[],
    isDraftSave: boolean,
    revisionNote?: string
  ) => {
    const existing = db.bak_documents.find((d) => d.id === doc.id);

    if (existing) {
      const oldTrips = db.bak_trips.filter((t) => t.bakId === doc.id);
      const oldPax = oldTrips.reduce((s, t) => s + t.jumlahPax, 0);
      const newPax = trips.reduce((s, t) => s + t.jumlahPax, 0);

      const activityDesc =
        oldPax !== newPax
          ? `Mengubah jumlah pax BAK ${doc.nomorBak} dari ${oldPax} menjadi ${newPax}`
          : `Memperbarui dokumen BAK ${doc.nomorBak} (Versi v${doc.version})`;

      const auditEntry = appendAuditLog(
        activityDesc,
        `Versi v${existing.version} · Pax: ${oldPax} · Status: ${existing.statusDokumen} (${existing.statusPembayaran})`,
        `Versi v${doc.version} · Pax: ${newPax} · Status: ${doc.statusDokumen} (${doc.statusPembayaran})`,
        doc.id,
        doc.nomorBak
      );

      const snapshotEntry = {
        id: `ver-${Date.now()}`,
        bakId: doc.id,
        nomorBak: doc.nomorBak,
        version: doc.version,
        savedAt: formatTimestampLog(new Date()),
        savedBy: currentUserAccount.name,
        reason: revisionNote || 'Pembaruan data dokumen BAK',
        snapshot: {
          document: doc,
          trips,
          payments,
          terms,
        },
      };

      setDb((prev) => ({
        ...prev,
        bak_documents: prev.bak_documents.map((d) => (d.id === doc.id ? doc : d)),
        bak_trips: [
          ...prev.bak_trips.filter((t) => t.bakId !== doc.id),
          ...trips,
        ],
        bak_payments: [
          ...prev.bak_payments.filter((p) => p.bakId !== doc.id),
          ...payments,
        ],
        bak_terms: [
          ...prev.bak_terms.filter((tm) => tm.bakId !== doc.id),
          ...terms,
        ],
        audit_logs: [auditEntry, ...prev.audit_logs],
        document_versions: [snapshotEntry, ...prev.document_versions],
      }));
    } else {
      const totalPax = trips.reduce((s, t) => s + t.jumlahPax, 0);
      const auditEntry = appendAuditLog(
        `Membuat BAK baru ${doc.nomorBak} (${doc.pihakKeduaPerusahaan})`,
        `Belum ada dokumen`,
        `Nomor: ${doc.nomorBak} · ${trips.length} Keberangkatan (${totalPax} Pax) · Status: ${doc.statusDokumen}`,
        doc.id,
        doc.nomorBak
      );

      const snapshotEntry = {
        id: `ver-${Date.now()}`,
        bakId: doc.id,
        nomorBak: doc.nomorBak,
        version: 1,
        savedAt: formatTimestampLog(new Date()),
        savedBy: currentUserAccount.name,
        reason: 'Pembuatan awal dokumen BAK',
        snapshot: {
          document: doc,
          trips,
          payments,
          terms,
        },
      };

      setDb((prev) => ({
        ...prev,
        bak_documents: [doc, ...prev.bak_documents],
        bak_trips: [...prev.bak_trips, ...trips],
        bak_payments: [...prev.bak_payments, ...payments],
        bak_terms: [...prev.bak_terms, ...terms],
        audit_logs: [auditEntry, ...prev.audit_logs],
        document_versions: [snapshotEntry, ...prev.document_versions],
      }));
    }

    showToast(
      isDraftSave
        ? `Draft BAK ${doc.nomorBak} berhasil disimpan.`
        : `Dokumen BAK ${doc.nomorBak} berhasil disimpan (Status: ${doc.statusDokumen}).`
    );

    if (!isDraftSave) {
      setEditingBakId(null);
      setActiveNav('bak_list');
    } else {
      setEditingBakId(doc.id);
    }
  };

  // Master Data Handlers
  const handleSaveCustomer = (customer: Customer, isNew: boolean) => {
    const auditEntry = appendAuditLog(
      `${isNew ? 'Menambah' : 'Memperbarui'} Master Pelanggan: ${customer.namaPerusahaan}`,
      isNew ? '-' : `ID: ${customer.id}`,
      `${customer.namaPerusahaan} (PIC: ${customer.pic})`
    );
    setDb((prev) => ({
      ...prev,
      customers: isNew
        ? [customer, ...prev.customers]
        : prev.customers.map((c) => (c.id === customer.id ? customer : c)),
      audit_logs: [auditEntry, ...prev.audit_logs],
    }));
    showToast(`Data pelanggan ${customer.namaPerusahaan} berhasil disimpan.`);
  };

  const handleDeleteCustomer = (id: string) => {
    setDb((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
    showToast('Data pelanggan dihapus.');
  };

  const handleSaveTariff = (tariff: MasterTariff, isNew: boolean) => {
    const auditEntry = appendAuditLog(
      `${isNew ? 'Menambah' : 'Memperbarui'} Master Tarif Subclass ${tariff.subclass}`,
      isNew ? '-' : `ID: ${tariff.id}`,
      `${tariff.namaKaDefault || 'KA'} (${tariff.jenisKelas} - ${tariff.subclass}): Rp${tariff.tarif}`
    );
    setDb((prev) => ({
      ...prev,
      tariffs: isNew
        ? [tariff, ...prev.tariffs]
        : prev.tariffs.map((t) => (t.id === tariff.id ? tariff : t)),
      audit_logs: [auditEntry, ...prev.audit_logs],
    }));
    showToast(`Master tarif subclass ${tariff.subclass} berhasil disimpan.`);
  };

  const handleDeleteTariff = (id: string) => {
    setDb((prev) => ({
      ...prev,
      tariffs: prev.tariffs.filter((t) => t.id !== id),
    }));
    showToast('Data master tarif dihapus.');
  };

  const handleSaveBank = (bank: BankAccount, isNew: boolean) => {
    setDb((prev) => ({
      ...prev,
      bank_accounts: isNew
        ? [...prev.bank_accounts, bank]
        : prev.bank_accounts.map((b) => (b.id === bank.id ? bank : b)),
    }));
    showToast(`Rekening ${bank.bank} berhasil disimpan.`);
  };

  const handleDeleteBank = (id: string) => {
    setDb((prev) => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((b) => b.id !== id),
    }));
    showToast('Rekening dihapus.');
  };

  const handleSaveTerm = (term: MasterTerm, isNew: boolean) => {
    setDb((prev) => ({
      ...prev,
      master_terms: isNew
        ? [...prev.master_terms, term]
        : prev.master_terms.map((t) => (t.id === term.id ? term : t)),
    }));
    showToast('Ketentuan master berhasil disimpan.');
  };

  const handleDeleteTerm = (id: string) => {
    setDb((prev) => ({
      ...prev,
      master_terms: prev.master_terms.filter((t) => t.id !== id),
    }));
    showToast('Ketentuan master dihapus.');
  };

  const handleSaveStaff = (member: StaffMember, isNew: boolean) => {
    setDb((prev) => ({
      ...prev,
      staff: isNew
        ? [...prev.staff, member]
        : prev.staff.map((s) => (s.id === member.id ? member : s)),
    }));
    showToast(`Data petugas ${member.nama} berhasil disimpan.`);
  };

  const handleDeleteStaff = (id: string) => {
    setDb((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== id),
    }));
    showToast('Data petugas dihapus.');
  };

  // If Public Verification View is active (/verify/[kode])
  if (verifyCodeModal !== null) {
    return (
      <PublicVerifyView
        initialCode={verifyCodeModal}
        documents={db.bak_documents}
        trips={db.bak_trips}
        onClose={() => {
          setVerifyCodeModal(null);
          if (window.location.pathname.startsWith('/verify/')) {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  const navItems: {
    key: NavMenuKey;
    label: string;
    icon: React.FC<{ className?: string }>;
    group: 'OPERASIONAL' | 'MASTER DATA' | 'LAPORAN & SISTEM';
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      group: 'OPERASIONAL',
    },
    {
      key: 'bak_list',
      label: 'BAK Rombongan',
      icon: FileText,
      group: 'OPERASIONAL',
    },
    {
      key: 'create_bak',
      label: 'Buat BAK',
      icon: FilePlus2,
      group: 'OPERASIONAL',
    },
    {
      key: 'customers',
      label: 'Pelanggan / Agen',
      icon: Building2,
      group: 'MASTER DATA',
    },
    {
      key: 'tariffs',
      label: 'Master Tarif',
      icon: Tags,
      group: 'MASTER DATA',
    },
    {
      key: 'banks',
      label: 'Master Rekening',
      icon: Landmark,
      group: 'MASTER DATA',
    },
    {
      key: 'terms',
      label: 'Master Ketentuan',
      icon: ScrollText,
      group: 'MASTER DATA',
    },
    {
      key: 'staff',
      label: 'Master Petugas',
      icon: Users,
      group: 'MASTER DATA',
    },
    {
      key: 'reports',
      label: 'Laporan',
      icon: BarChart3,
      group: 'LAPORAN & SISTEM',
    },
    {
      key: 'audit',
      label: 'Audit Trail & Versi',
      icon: History,
      group: 'LAPORAN & SISTEM',
    },
    {
      key: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      group: 'LAPORAN & SISTEM',
    },
  ];

  const editingDoc = editingBakId
    ? db.bak_documents.find((d) => d.id === editingBakId)
    : undefined;
  const editingTrips = editingBakId
    ? db.bak_trips.filter((t) => t.bakId === editingBakId)
    : undefined;
  const editingPayments = editingBakId
    ? db.bak_payments.filter((p) => p.bakId === editingBakId)
    : undefined;
  const editingTerms = editingBakId
    ? db.bak_terms.filter((tm) => tm.bakId === editingBakId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Sidebar Navigasi Kiri (Desktop) */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-slate-200 border-r border-slate-800 select-none z-30">
        {/* Brand Header KAI Wisata */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex flex-col items-center justify-center font-bold tracking-tight shrink-0 shadow-xs">
            <span className="text-[11px] leading-none">KAI</span>
            <span className="text-[8px] text-amber-300 font-semibold tracking-wider mt-0.5">
              WISATA
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white tracking-tight truncate">
              BAK Rombongan Tiket KA
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              PT Kereta Api Pariwisata
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {(['OPERASIONAL', 'MASTER DATA', 'LAPORAN & SISTEM'] as const).map(
            (groupName) => (
              <div key={groupName}>
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {groupName}
                </div>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.group === groupName)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            if (item.key === 'create_bak') {
                              setEditingBakId(null);
                            }
                            setActiveNav(item.key);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )
          )}
        </nav>

        {/* Portal Verifikasi QR Cepat */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setVerifyCodeModal('VER-KAW-2026-290')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Cek Verifikasi QR (/verify)</span>
          </button>
          <div className="px-2 py-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Stasiun Gondangdia</span>
            <span className="font-mono-tabular text-slate-300">WOMT.1</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Utility Header */}
        <header className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Sistem Berita Acara Kesepakatan (BAK) Angkutan Rombongan
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Unit Ticketing PT Kereta Api Pariwisata · Stasiun Gondangdia Jakarta Pusat
              </div>
            </div>
          </div>

          {/* Role Switcher & Active Staff Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-slate-800">
                {currentUserAccount.name}
              </span>
              <span className="text-[11px] text-slate-500">
                {currentUserAccount.jabatan} · NIPP {currentUserAccount.nipp}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Role:
              </span>
              <select
                value={currentUserRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setCurrentUserRole(newRole);
                  showToast(`Hak akses diubah ke mode: ${newRole}`);
                }}
                aria-label="Pilih Role Pengguna"
                className="text-xs font-bold text-blue-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="ADMIN">Admin (Full Access)</option>
                <option value="PETUGAS_TICKETING">Petugas Ticketing</option>
                <option value="VIEWER">Viewer (Read-only)</option>
              </select>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="no-print lg:hidden bg-slate-900 text-white px-4 py-3 space-y-1 border-b border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.key === 'create_bak') setEditingBakId(null);
                    setActiveNav(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                    activeNav === item.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Toast Notification Banner */}
        {toastMsg && (
          <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Workspace Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardAndListView
              mode="dashboard"
              documents={db.bak_documents}
              trips={db.bak_trips}
              payments={db.bak_payments}
              terms={db.bak_terms}
              bankAccounts={db.bank_accounts}
              role={currentUserRole}
              onCreateNew={handleStartCreateNew}
              onEditBak={handleStartEditBak}
              onDuplicateBak={handleDuplicateBak}
              onArchiveBak={handleArchiveBak}
              onOpenVerify={(code) => setVerifyCodeModal(code)}
            />
          )}

          {activeNav === 'bak_list' && (
            <DashboardAndListView
              mode="list"
              documents={db.bak_documents}
              trips={db.bak_trips}
              payments={db.bak_payments}
              terms={db.bak_terms}
              bankAccounts={db.bank_accounts}
              role={currentUserRole}
              onCreateNew={handleStartCreateNew}
              onEditBak={handleStartEditBak}
              onDuplicateBak={handleDuplicateBak}
              onArchiveBak={handleArchiveBak}
              onOpenVerify={(code) => setVerifyCodeModal(code)}
            />
          )}

          {activeNav === 'create_bak' && (
            <BakWizard
              key={editingBakId || 'new-bak'}
              mode={editingDoc ? 'edit' : 'create'}
              initialDoc={editingDoc}
              initialTrips={editingTrips}
              initialPayments={editingPayments}
              initialTerms={editingTerms}
              nextSequenceNumber={nextSequenceNumber}
              existingDocs={db.bak_documents}
              staffList={db.staff}
              customers={db.customers}
              bankAccounts={db.bank_accounts}
              masterTerms={db.master_terms}
              tariffs={db.tariffs}
              currentUserRole={currentUserRole}
              currentUserName={currentUserAccount.name}
              onSaveBak={handleSaveBak}
              onCancel={() => {
                setEditingBakId(null);
                setActiveNav('bak_list');
              }}
              onOpenVerify={(code) => setVerifyCodeModal(code)}
            />
          )}

          {activeNav === 'customers' && (
            <MasterCustomersView
              customers={db.customers}
              role={currentUserRole}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeNav === 'tariffs' && (
            <MasterTariffsView
              tariffs={db.tariffs}
              role={currentUserRole}
              onSaveTariff={handleSaveTariff}
              onDeleteTariff={handleDeleteTariff}
            />
          )}

          {activeNav === 'banks' && (
            <MasterBanksView
              banks={db.bank_accounts}
              role={currentUserRole}
              onSaveBank={handleSaveBank}
              onDeleteBank={handleDeleteBank}
            />
          )}

          {activeNav === 'terms' && (
            <MasterTermsView
              terms={db.master_terms}
              role={currentUserRole}
              onSaveTerm={handleSaveTerm}
              onDeleteTerm={handleDeleteTerm}
            />
          )}

          {activeNav === 'staff' && (
            <MasterStaffView
              staff={db.staff}
              role={currentUserRole}
              onSaveStaff={handleSaveStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsView
              documents={db.bak_documents}
              trips={db.bak_trips}
              payments={db.bak_payments}
            />
          )}

          {activeNav === 'audit' && (
            <AuditTrailView
              logs={db.audit_logs}
              versions={db.document_versions}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              db={db}
              role={currentUserRole}
              onRestoreDatabase={(newDb) => {
                setDb(newDb);
                showToast('Database berhasil dipulihkan.');
              }}
              onResetDefaultDatabase={() => {
                setDb(INITIAL_DATABASE);
                showToast('Database direset ke data demo awal KAI Wisata.');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
