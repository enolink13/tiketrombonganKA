import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileDown,
  FileText,
  Printer,
  Save,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Upload,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import {
  BakDocument,
  BakPayment,
  BakTermItem,
  BakTrip,
  BankAccount,
  Customer,
  DocumentStatus,
  MasterTariff,
  MasterTerm,
  SignatureMode,
  StaffMember,
  UserRole,
} from '../types/bak';
import {
  calculateBakFinancials,
  calculateTripTotals,
  formatDayAndDateIndonesia,
  formatRupiah,
  generateNomorBak,
  getIndonesianDayName,
} from '../utils/formatters';
import { BakDocumentPreview } from './BakDocumentPreview';
import { exportBakToDocx, exportBakToPdf } from '../utils/documentExport';

interface BakWizardProps {
  mode: 'create' | 'edit';
  initialDoc?: BakDocument;
  initialTrips?: BakTrip[];
  initialPayments?: BakPayment[];
  initialTerms?: BakTermItem[];
  nextSequenceNumber: number;
  existingDocs: BakDocument[];
  staffList: StaffMember[];
  customers: Customer[];
  bankAccounts: BankAccount[];
  masterTerms: MasterTerm[];
  tariffs: MasterTariff[];
  currentUserRole: UserRole;
  currentUserName: string;
  onSaveBak: (
    doc: BakDocument,
    trips: BakTrip[],
    payments: BakPayment[],
    terms: BakTermItem[],
    isDraftSave: boolean,
    revisionNote?: string
  ) => void;
  onCancel: () => void;
  onOpenVerify: (code: string) => void;
}

const WIZARD_STEPS = [
  { step: 1, title: 'Data BAK' },
  { step: 2, title: 'Pihak I & II' },
  { step: 3, title: 'Surat Permohonan' },
  { step: 4, title: 'Data Keberangkatan' },
  { step: 5, title: 'Pembayaran' },
  { step: 6, title: 'Ketentuan' },
  { step: 7, title: 'Preview BAK' },
  { step: 8, title: 'Finalisasi & Dokumen' },
];

export const BakWizard: React.FC<BakWizardProps> = ({
  mode,
  initialDoc,
  initialTrips,
  initialPayments,
  initialTerms,
  nextSequenceNumber,
  existingDocs,
  staffList,
  customers,
  bankAccounts,
  masterTerms,
  tariffs,
  currentUserName,
  onSaveBak,
  onCancel,
  onOpenVerify,
}) => {
  const defaultDate = '2026-10-06';
  const defaultStaff =
    staffList.find((s) => s.nama.toLowerCase().includes('sumarjiyono')) ||
    staffList[0] || {
      id: 'stf-1',
      nama: 'Sumarjiyono',
      nipp: '68914',
      jabatan: 'Pelaksana Ticketing',
      alamat:
        'Stasiun Gondangdia, Pintu Selatan – Lantai Dasar, Jakarta Pusat 10340',
      aktif: true,
    };

  const defaultBank = bankAccounts.find((b) => b.aktif) || bankAccounts[0];

  const [activeStep, setActiveStep] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState<string>('');

  const [docState, setDocState] = useState<BakDocument>(() => {
    if (initialDoc) return { ...initialDoc };
    const seq = nextSequenceNumber;
    const nomorOtomatis = generateNomorBak(seq, defaultDate);
    return {
      id: `bak-${seq}-${Date.now().toString().slice(-4)}`,
      sequenceNumber: seq,
      nomorBak: nomorOtomatis,
      lampiran: '1 (Satu) Berkas',
      tanggalBak: defaultDate,
      hariBak: getIndonesianDayName(defaultDate),
      staffId: defaultStaff.id,
      pihakPertamaNama: defaultStaff.nama,
      pihakPertamaJabatan: defaultStaff.jabatan,
      pihakPertamaAlamat: defaultStaff.alamat,
      customerId: '',
      pihakKeduaPerusahaan: '',
      pihakKeduaNama: '',
      pihakKeduaJabatan: '',
      pihakKeduaAlamat: '',
      pihakKeduaTelepon: '',
      pihakKeduaEmail: '',
      nomorSurat: '',
      tanggalSurat: defaultDate,
      perihalSurat: 'Permohonan Tiket Rombongan',
      bankAccountId: defaultBank?.id || 'bank-1',
      statusPembayaran: 'Belum Dibayar',
      statusDokumen: 'Draft',
      signatureMode: 'digital',
      digitalSignHash: `KAWISATA-SIG-${seq}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      verificationCode: `KAW-${seq}-X2026`,
      version: 1,
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [trips, setTrips] = useState<BakTrip[]>(() => {
    if (initialTrips && initialTrips.length > 0) {
      return initialTrips.map((t) => ({ ...t }));
    }
    return [
      {
        id: `trip-${Date.now()}-1`,
        bakId: docState.id,
        urutan: 1,
        hari: getIndonesianDayName('2026-10-15'),
        tanggal: '2026-10-15',
        namaKa: 'Argo Parahyangan',
        nomorKa: '36',
        relasiAsal: 'Gambir (GMR)',
        relasiTujuan: 'Bandung (BD)',
        kelas: 'Eksekutif',
        subclass: 'AA',
        jamBerangkat: '07:25',
        jamTiba: '10:10',
        jumlahPax: 21,
        tarifSubclass: 320000,
        beaAdmin: 7500,
        tarifTiketPlusAdmin: 327500,
        jumlahBiaya: 6877500,
      },
    ];
  });

  const [payments, setPayments] = useState<BakPayment[]>(() => {
    if (initialPayments && initialPayments.length > 0) {
      return initialPayments.map((p) => ({ ...p }));
    }
    return [];
  });

  const [terms, setTerms] = useState<BakTermItem[]>(() => {
    if (initialTerms && initialTerms.length > 0) {
      return initialTerms.map((t) => ({ ...t }));
    }
    return masterTerms
      .slice()
      .sort((a, b) => a.urutanTampil - b.urutanTampil)
      .map((mt, idx) => ({
        id: `term-${Date.now()}-${idx + 1}`,
        bakId: docState.id,
        nomorUrut: idx + 1,
        isiKetentuan: mt.isiKetentuan,
        aktif: mt.aktif,
      }));
  });

  const isRevisionMode =
    mode === 'edit' &&
    initialDoc &&
    ['Final', 'Signed', 'Completed'].includes(initialDoc.statusDokumen);

  const financials = useMemo(
    () => calculateBakFinancials(trips, payments),
    [trips, payments]
  );

  const isDuplicateNomorBak = useMemo(() => {
    const cleanNomor = docState.nomorBak.trim().toLowerCase();
    return existingDocs.some(
      (d) => d.id !== docState.id && d.nomorBak.trim().toLowerCase() === cleanNomor
    );
  }, [docState.id, docState.nomorBak, existingDocs]);

  const showTempToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTanggalBakChange = (newDate: string) => {
    const hari = getIndonesianDayName(newDate);
    const updatedNomor =
      mode === 'create'
        ? generateNomorBak(docState.sequenceNumber, newDate)
        : docState.nomorBak;
    setDocState((prev) => ({
      ...prev,
      tanggalBak: newDate,
      hariBak: hari,
      nomorBak: updatedNomor,
    }));
  };

  const handleSelectStaff = (staffId: string) => {
    const found = staffList.find((s) => s.id === staffId);
    if (!found) return;
    setDocState((prev) => ({
      ...prev,
      staffId: found.id,
      pihakPertamaNama: found.nama,
      pihakPertamaJabatan: found.jabatan,
      pihakPertamaAlamat: found.alamat,
    }));
  };

  const handleSelectCustomer = (customerId: string) => {
    const found = customers.find((c) => c.id === customerId);
    if (!found) return;
    setDocState((prev) => ({
      ...prev,
      customerId: found.id,
      pihakKeduaPerusahaan: found.namaPerusahaan,
      pihakKeduaNama: found.pic,
      pihakKeduaJabatan: found.jabatan,
      pihakKeduaAlamat: found.alamat,
      pihakKeduaTelepon: found.nomorHp,
      pihakKeduaEmail: found.email,
    }));
  };

  const handleAddTrip = () => {
    const nextOrder = trips.length + 1;
    const baseDate = trips[trips.length - 1]?.tanggal || docState.tanggalBak;
    setTrips((prev) => [
      ...prev,
      {
        id: `trip-${Date.now()}-${nextOrder}`,
        bakId: docState.id,
        urutan: nextOrder,
        hari: getIndonesianDayName(baseDate),
        tanggal: baseDate,
        namaKa: '',
        nomorKa: '',
        relasiAsal: 'Gambir (GMR)',
        relasiTujuan: '',
        kelas: 'Eksekutif',
        subclass: 'AA',
        jamBerangkat: '08:00',
        jamTiba: '14:00',
        jumlahPax: 20,
        tarifSubclass: 320000,
        beaAdmin: 7500,
        tarifTiketPlusAdmin: 327500,
        jumlahBiaya: 6550000,
      },
    ]);
  };

  const handleRemoveTrip = (tripId: string) => {
    if (trips.length <= 1) return;
    setTrips((prev) =>
      prev.filter((t) => t.id !== tripId).map((t, idx) => ({ ...t, urutan: idx + 1 }))
    );
  };

  const handleUpdateTrip = (
    tripId: string,
    field: keyof BakTrip,
    value: string | number
  ) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        const updated: BakTrip = { ...t, [field]: value };
        if (field === 'tanggal' && typeof value === 'string') {
          updated.hari = getIndonesianDayName(value);
        }
        const { tarifTiketPlusAdmin, jumlahBiaya } = calculateTripTotals(
          updated.tarifSubclass,
          updated.beaAdmin,
          updated.jumlahPax
        );
        updated.tarifTiketPlusAdmin = tarifTiketPlusAdmin;
        updated.jumlahBiaya = jumlahBiaya;
        return updated;
      })
    );
  };

  const handleApplyMasterTariff = (tripId: string, tariffId: string) => {
    const found = tariffs.find((tr) => tr.id === tariffId);
    if (!found) return;
    const [asal, tujuan] = (found.relasiDefault || '').split('–').map((s) => s.trim());
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        const { tarifTiketPlusAdmin, jumlahBiaya } = calculateTripTotals(
          found.tarif,
          found.beaAdmin,
          t.jumlahPax
        );
        return {
          ...t,
          namaKa: found.namaKaDefault || t.namaKa,
          nomorKa: found.nomorKaDefault || t.nomorKa,
          relasiAsal: asal || t.relasiAsal,
          relasiTujuan: tujuan || t.relasiTujuan,
          kelas: found.jenisKelas,
          subclass: found.subclass,
          tarifSubclass: found.tarif,
          beaAdmin: found.beaAdmin,
          tarifTiketPlusAdmin,
          jumlahBiaya,
        };
      })
    );
  };

  const handleAddPayment = () => {
    const nextOrder = payments.length + 1;
    const remaining = Math.max(0, financials.sisaPembayaran);
    setPayments((prev) => [
      ...prev,
      {
        id: `pay-${Date.now()}-${nextOrder}`,
        bakId: docState.id,
        urutan: nextOrder,
        tanggal: docState.tanggalBak,
        bank: 'BCA',
        nominal: remaining > 0 ? remaining : 0,
        keterangan: `Pembayaran Tahap ${nextOrder}`,
      },
    ]);
  };

  const handleRemovePayment = (payId: string) => {
    setPayments((prev) =>
      prev.filter((p) => p.id !== payId).map((p, idx) => ({ ...p, urutan: idx + 1 }))
    );
  };

  const handleUpdatePayment = (
    payId: string,
    field: keyof BakPayment,
    value: string | number
  ) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === payId ? { ...p, [field]: value } : p))
    );
  };

  const handleSignatureImageUpload = (
    party: 'pihakPertamaSignature' | 'pihakKeduaSignature',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDocState((prev) => ({
          ...prev,
          signatureMode: 'upload',
          [party]: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const validateAllRequiredFields = (): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];
    if (!docState.nomorBak.trim()) missing.push('Nomor BAK');
    if (!docState.tanggalBak.trim()) missing.push('Tanggal BAK');
    if (isDuplicateNomorBak) missing.push('Nomor BAK sudah digunakan (duplikat)');
    if (!docState.pihakKeduaPerusahaan.trim()) missing.push('Pihak Kedua');
    if (!docState.pihakKeduaNama.trim()) missing.push('Nama perwakilan');
    if (!docState.pihakKeduaJabatan.trim()) missing.push('Jabatan');
    if (!docState.pihakKeduaAlamat.trim()) missing.push('Alamat');
    if (!docState.nomorSurat.trim()) missing.push('Nomor surat');
    if (!docState.tanggalSurat.trim()) missing.push('Tanggal surat');

    if (trips.length === 0) {
      missing.push('Minimal satu keberangkatan');
    } else {
      trips.forEach((tr, idx) => {
        const label = `Keberangkatan ${idx + 1}`;
        if (!tr.tanggal.trim()) missing.push(`Tanggal (${label})`);
        if (!tr.namaKa.trim()) missing.push(`Nama KA (${label})`);
        if (!tr.nomorKa.trim()) missing.push(`Nomor KA (${label})`);
        if (!tr.relasiAsal.trim() || !tr.relasiTujuan.trim())
          missing.push(`Relasi (${label})`);
        if (!tr.kelas.trim()) missing.push(`Kelas (${label})`);
        if (!tr.jumlahPax || tr.jumlahPax <= 0) missing.push(`Jumlah pax (${label})`);
        if (!tr.tarifSubclass || tr.tarifSubclass <= 0)
          missing.push(`Tarif (${label})`);
        if (tr.beaAdmin === undefined || tr.beaAdmin < 0)
          missing.push(`Bea admin (${label})`);
      });
    }
    return { valid: missing.length === 0, missing };
  };

  const handleSaveAsDraft = () => {
    if (isDuplicateNomorBak) {
      setValidationError('Nomor BAK sudah digunakan oleh dokumen lain.');
      return;
    }
    setValidationError(null);
    onSaveBak(
      {
        ...docState,
        statusPembayaran: financials.statusPembayaran,
        statusDokumen: 'Draft',
        updatedAt: new Date().toISOString(),
      },
      trips,
      payments,
      terms,
      true
    );
    showTempToast('Draft BAK berhasil disimpan.');
  };

  const handleFinalizeAndSave = (targetStatus?: DocumentStatus) => {
    const check = validateAllRequiredFields();
    if (!check.valid) {
      setValidationError('Data belum lengkap. Mohon lengkapi field yang wajib diisi.');
      setMissingFieldsList(check.missing);
      return;
    }
    setValidationError(null);
    setMissingFieldsList([]);
    onSaveBak(
      {
        ...docState,
        statusPembayaran: financials.statusPembayaran,
        statusDokumen:
          targetStatus ||
          (docState.statusDokumen === 'Draft' ? 'Final' : docState.statusDokumen),
        updatedAt: new Date().toISOString(),
      },
      trips,
      payments,
      terms,
      false,
      revisionNote
    );
  };

  const selectedBank = bankAccounts.find((b) => b.id === docState.bankAccountId);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Formulir Wizard BAK Rombongan</span>
            <span>·</span>
            <span className="font-mono-tabular font-semibold text-blue-700">
              {docState.nomorBak}
            </span>
            <span>·</span>
            <span>Versi v{docState.version}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            {mode === 'create'
              ? 'Buat Berita Acara Kesepakatan (BAK) Baru'
              : `Edit Dokumen BAK — ${docState.pihakKeduaPerusahaan || docState.nomorBak}`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan sebagai Draft
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(7)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            Preview BAK
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer whitespace-nowrap"
          >
            Tutup
          </button>
        </div>
      </div>

      {isRevisionMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 space-y-1 flex-1">
            <div className="font-semibold">
              Mode Revisi Dokumen ({initialDoc?.statusDokumen} — Versi v{initialDoc?.version})
            </div>
            <p>
              Perubahan pada dokumen berstatus <strong>{initialDoc?.statusDokumen}</strong> akan otomatis membuat snapshot <strong>Versi Revisi Baru (v{(initialDoc?.version || 1) + 1})</strong>.
            </p>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
          {missingFieldsList.length > 0 && (
            <div className="pl-6 text-xs text-red-800">
              Field wajib: <span className="font-medium">{missingFieldsList.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-x-auto">
        <div className="flex items-center min-w-[760px] justify-between gap-1">
          {WIZARD_STEPS.map((item) => {
            const isActive = activeStep === item.step;
            const isCompleted = activeStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(item.step)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono-tabular font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : item.step}
                </span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {activeStep === 1 && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-base font-bold text-slate-900">
              Step 1: Identitas &amp; Penomoran Dokumen BAK
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor BAK <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={docState.nomorBak}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, nomorBak: e.target.value }))
                    }
                    className="flex-1 px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDocState((prev) => ({
                        ...prev,
                        nomorBak: generateNomorBak(prev.sequenceNumber, prev.tanggalBak),
                      }))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Pola Otomatis
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal BAK <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={docState.tanggalBak}
                  onChange={(e) => handleTanggalBakChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hari &amp; Tanggal Indonesia (Otomatis)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatDayAndDateIndonesia(docState.tanggalBak, docState.hariBak)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lampiran
                </label>
                <input
                  type="text"
                  value={docState.lampiran}
                  onChange={(e) =>
                    setDocState((prev) => ({ ...prev, lampiran: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Dokumen
                </label>
                <select
                  value={docState.statusDokumen}
                  onChange={(e) =>
                    setDocState((prev) => ({
                      ...prev,
                      statusDokumen: e.target.value as DocumentStatus,
                    }))
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Review">Review</option>
                  <option value="Final">Final</option>
                  <option value="Signed">Signed</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  I. PIHAK PERTAMA — PT Kereta Api Pariwisata
                </h2>
                <select
                  value={docState.staffId}
                  onChange={(e) => handleSelectStaff(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {staffList
                    .filter((s) => s.aktif)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} — {s.jabatan}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Petugas <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakPertamaNama}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakPertamaNama: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakPertamaJabatan}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakPertamaJabatan: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Kantor <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakPertamaAlamat}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakPertamaAlamat: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  II. PIHAK KEDUA — Pelanggan / Agen / Perusahaan
                </h2>
                <select
                  value={docState.customerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Pilih dari Master Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.namaPerusahaan} ({c.pic})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Perusahaan / Agen <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakKeduaPerusahaan}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakKeduaPerusahaan: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Ketua / Perwakilan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakKeduaNama}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakKeduaNama: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakKeduaJabatan}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakKeduaJabatan: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={docState.pihakKeduaTelepon}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakKeduaTelepon: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={docState.pihakKeduaAlamat}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakKeduaAlamat: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={docState.pihakKeduaEmail}
                    onChange={(e) =>
                      setDocState((prev) => ({ ...prev, pihakKeduaEmail: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-base font-bold text-slate-900">
              Step 3: Informasi Surat Permohonan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Surat <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={docState.nomorSurat}
                  onChange={(e) =>
                    setDocState((prev) => ({ ...prev, nomorSurat: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Surat <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={docState.tanggalSurat}
                  onChange={(e) =>
                    setDocState((prev) => ({ ...prev, tanggalSurat: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Perihal
                </label>
                <input
                  type="text"
                  value={docState.perihalSurat}
                  onChange={(e) =>
                    setDocState((prev) => ({ ...prev, perihalSurat: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 4: Data Keberangkatan Rombongan
              </h2>
              <button
                type="button"
                onClick={handleAddTrip}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                + Tambah Keberangkatan
              </button>
            </div>

            <div className="space-y-6">
              {trips.map((trip, idx) => {
                const { tarifTiketPlusAdmin, jumlahBiaya } = calculateTripTotals(
                  trip.tarifSubclass,
                  trip.beaAdmin,
                  trip.jumlahPax
                );
                return (
                  <div
                    key={trip.id}
                    className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <span className="px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded">
                        KEBERANGKATAN {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          onChange={(e) =>
                            handleApplyMasterTariff(trip.id, e.target.value)
                          }
                          defaultValue=""
                          className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="">-- Isi Cepat dari Master Tarif --</option>
                          {tariffs.map((tr) => (
                            <option key={tr.id} value={tr.id}>
                              {tr.namaKaDefault} ({tr.nomorKaDefault}) · {tr.jenisKelas} ({tr.subclass}) — {formatRupiah(tr.tarif)}
                            </option>
                          ))}
                        </select>
                        {trips.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrip(trip.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tanggal <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={trip.tanggal}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'tanggal', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Hari (Otomatis)
                        </label>
                        <input
                          type="text"
                          value={trip.hari}
                          readOnly
                          className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama KA <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={trip.namaKa}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'namaKa', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nomor KA <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={trip.nomorKa}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'nomorKa', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Relasi Asal <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={trip.relasiAsal}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'relasiAsal', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Relasi Tujuan <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={trip.relasiTujuan}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'relasiTujuan', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Kelas <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={trip.kelas}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'kelas', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="Eksekutif">Eksekutif</option>
                          <option value="Priority">Priority</option>
                          <option value="Luxury">Luxury</option>
                          <option value="Panoramic">Panoramic</option>
                          <option value="Imperial">Imperial</option>
                          <option value="Bisnis">Bisnis</option>
                          <option value="Ekonomi Premium">Ekonomi Premium</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Subclass
                        </label>
                        <input
                          type="text"
                          value={trip.subclass}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'subclass', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Jam Berangkat
                        </label>
                        <input
                          type="time"
                          value={trip.jamBerangkat}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'jamBerangkat', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Jam Tiba
                        </label>
                        <input
                          type="time"
                          value={trip.jamTiba}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'jamTiba', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Jumlah Pax <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={trip.jumlahPax}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'jumlahPax', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tarif Subclass (Rp) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={trip.tarifSubclass}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'tarifSubclass', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bea Admin (Rp) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={trip.beaAdmin}
                          onChange={(e) =>
                            handleUpdateTrip(trip.id, 'beaAdmin', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tarif Tiket + Bea Admin (Otomatis)
                        </label>
                        <div className="px-3 py-2 text-sm font-mono-tabular bg-slate-100 border border-slate-200 rounded-lg">
                          {formatRupiah(trip.tarifSubclass)} + {formatRupiah(trip.beaAdmin)} ={' '}
                          <strong>{formatRupiah(tarifTiketPlusAdmin)}</strong> × {trip.jumlahPax}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Subtotal Keberangkatan {idx + 1}
                        </label>
                        <div className="px-3 py-2 text-sm font-mono-tabular font-bold bg-blue-50 border border-blue-200 rounded-lg text-blue-950">
                          {formatRupiah(jumlahBiaya)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-slate-300 rounded-xl p-5 bg-white space-y-2">
              <div className="divide-y divide-slate-200 text-sm">
                {trips.map((t, idx) => {
                  const { jumlahBiaya } = calculateTripTotals(
                    t.tarifSubclass,
                    t.beaAdmin,
                    t.jumlahPax
                  );
                  return (
                    <div key={t.id} className="py-2 flex items-center justify-between">
                      <span>
                        <strong>Subtotal Keberangkatan {idx + 1}</strong> ({t.jumlahPax} pax)
                      </span>
                      <span className="font-mono-tabular font-semibold">
                        {formatRupiah(jumlahBiaya)}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-3 flex items-center justify-between text-base font-bold text-slate-950">
                  <span>TOTAL BIAYA ({financials.totalPax} Pax)</span>
                  <span className="font-mono-tabular text-blue-700">
                    {formatRupiah(financials.totalBiaya)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 5: Mekanisme dan Pelaksanaan Pembayaran
              </h2>
              <button
                type="button"
                onClick={handleAddPayment}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                + Tambah Pembayaran
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-500">Total Biaya</div>
                <div className="mt-1 text-base font-bold font-mono-tabular">
                  {formatRupiah(financials.totalBiaya)}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-500">Total Pembayaran</div>
                <div className="mt-1 text-base font-bold font-mono-tabular text-emerald-700">
                  {formatRupiah(financials.totalPembayaran)}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-500">Sisa Pembayaran</div>
                <div className="mt-1 text-base font-bold font-mono-tabular text-amber-700">
                  {formatRupiah(financials.sisaPembayaran)}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-500">Status Otomatis</div>
                <div className="mt-1 text-base font-bold text-blue-800">
                  {financials.statusPembayaran}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {payments.map((pay, idx) => (
                <div
                  key={pay.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-2 text-xs font-bold py-2">
                    Pembayaran {idx + 1}
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={pay.tanggal}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, 'tanggal', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank
                    </label>
                    <input
                      type="text"
                      value={pay.bank}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, 'bank', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nominal (Rp)
                    </label>
                    <input
                      type="number"
                      value={pay.nominal}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, 'nominal', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      value={pay.keterangan}
                      onChange={(e) =>
                        handleUpdatePayment(pay.id, 'keterangan', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(pay.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 max-w-2xl">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rekening Tujuan Pembayaran Resmi PT Kereta Api Pariwisata
              </label>
              <select
                value={docState.bankAccountId}
                onChange={(e) =>
                  setDocState((prev) => ({ ...prev, bankAccountId: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bank} — {b.cabang} · No. Rek: {b.nomorRekening} a.n. {b.namaRekening}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeStep === 6 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">
              Step 6: Persyaratan dan Ketentuan
            </h2>
            <div className="space-y-3">
              {terms.map((term, idx) => (
                <div
                  key={term.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 flex items-start gap-3"
                >
                  <input
                    type="checkbox"
                    checked={term.aktif}
                    onChange={(e) =>
                      setTerms((prev) =>
                        prev.map((t) =>
                          t.id === term.id ? { ...t, aktif: e.target.checked } : t
                        )
                      )
                    }
                    className="mt-1.5 w-4 h-4 accent-blue-600"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-semibold text-slate-700">
                      Ketentuan #{idx + 1}
                    </div>
                    <textarea
                      rows={2}
                      value={term.isiKetentuan}
                      onChange={(e) =>
                        setTerms((prev) =>
                          prev.map((t) =>
                            t.id === term.id
                              ? { ...t, isiKetentuan: e.target.value }
                              : t
                          )
                        )
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === 7 && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'manual', label: 'Tanda Tangan Manual (Cetak PDF)' },
                    { id: 'upload', label: 'Upload Gambar Tanda Tangan' },
                    { id: 'digital', label: 'Digital Signature Terverifikasi' },
                  ] as { id: SignatureMode; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setDocState((prev) => ({ ...prev, signatureMode: opt.id }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      docState.signatureMode === opt.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {docState.signatureMode === 'upload' && (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload TTD Pihak I</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleSignatureImageUpload('pihakPertamaSignature', e)
                      }
                      className="hidden"
                    />
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload TTD Pihak II</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleSignatureImageUpload('pihakKeduaSignature', e)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <BakDocumentPreview
              document={{
                ...docState,
                statusPembayaran: financials.statusPembayaran,
              }}
              trips={trips}
              payments={payments}
              terms={terms}
              bankAccount={selectedBank}
              onOpenVerify={onOpenVerify}
            />
          </div>
        )}

        {activeStep === 8 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 text-center">
              Step 8: Finalisasi &amp; Generate Dokumen Resmi BAK
            </h2>
            {isRevisionMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Alasan Revisi Dokumen
                </label>
                <input
                  type="text"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFinalizeAndSave('Final')}
                className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Simpan &amp; Finalisasi BAK
              </button>
              <button
                type="button"
                onClick={() => handleFinalizeAndSave('Signed')}
                className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Simpan sebagai Signed
              </button>
              <button
                type="button"
                onClick={() => {
                  const check = validateAllRequiredFields();
                  if (!check.valid) {
                    setValidationError(
                      'Data belum lengkap. Mohon lengkapi field yang wajib diisi.'
                    );
                    setMissingFieldsList(check.missing);
                    return;
                  }
                  exportBakToPdf(
                    { ...docState, statusPembayaran: financials.statusPembayaran },
                    trips,
                    payments,
                    terms,
                    selectedBank
                  );
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-red-600" />
                Generate PDF (.pdf)
              </button>
              <button
                type="button"
                onClick={() => {
                  const check = validateAllRequiredFields();
                  if (!check.valid) {
                    setValidationError(
                      'Data belum lengkap. Mohon lengkapi field yang wajib diisi.'
                    );
                    setMissingFieldsList(check.missing);
                    return;
                  }
                  exportBakToDocx(
                    { ...docState, statusPembayaran: financials.statusPembayaran },
                    trips,
                    payments,
                    terms,
                    selectedBank
                  );
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Generate DOCX (.docx)
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(7);
                  setTimeout(() => window.print(), 150);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Langsung
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between no-print">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>
          <div className="text-xs text-slate-500 font-mono-tabular">
            Langkah {activeStep} dari {WIZARD_STEPS.length}
          </div>
          {activeStep < WIZARD_STEPS.length ? (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.min(WIZARD_STEPS.length, s + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinalizeAndSave()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Selesai &amp; Simpan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
