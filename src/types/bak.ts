export type UserRole = 'ADMIN' | 'PETUGAS_TICKETING' | 'VIEWER';

export type DocumentStatus =
  | 'Draft'
  | 'Review'
  | 'Final'
  | 'Signed'
  | 'Completed'
  | 'Archived';

export type PaymentStatus =
  | 'Belum Dibayar'
  | 'DP'
  | 'Sebagian Dibayar'
  | 'Lunas';

export type SignatureMode = 'manual' | 'upload' | 'digital';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  nipp: string;
  jabatan: string;
}

export interface StaffMember {
  id: string;
  nama: string;
  nipp: string;
  jabatan: string;
  alamat: string;
  aktif: boolean;
}

export interface Customer {
  id: string;
  namaPerusahaan: string;
  alamat: string;
  pic: string;
  jabatan: string;
  nomorHp: string;
  email: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  cabang: string;
  nomorRekening: string;
  namaRekening: string;
  aktif: boolean;
}

export interface MasterTerm {
  id: string;
  nomorKetentuan: number;
  isiKetentuan: string;
  aktif: boolean;
  urutanTampil: number;
}

export interface MasterTariff {
  id: string;
  namaKaDefault?: string;
  nomorKaDefault?: string;
  relasiDefault?: string;
  jenisKelas: string;
  subclass: string;
  tarif: number;
  beaAdmin: number;
  periodeBerlaku: string;
}

export interface BakTrip {
  id: string;
  bakId: string;
  urutan: number;
  hari: string;
  tanggal: string; // YYYY-MM-DD
  namaKa: string;
  nomorKa: string;
  relasiAsal: string;
  relasiTujuan: string;
  kelas: string;
  subclass: string;
  jamBerangkat: string; // HH:mm
  jamTiba: string; // HH:mm
  jumlahPax: number;
  tarifSubclass: number;
  beaAdmin: number;
  tarifTiketPlusAdmin: number;
  jumlahBiaya: number;
}

export interface BakPayment {
  id: string;
  bakId: string;
  urutan: number;
  tanggal: string; // YYYY-MM-DD
  bank: string;
  nominal: number;
  keterangan: string;
}

export interface BakTermItem {
  id: string;
  bakId: string;
  nomorUrut: number;
  isiKetentuan: string;
  aktif: boolean;
}

export interface BakDocument {
  id: string;
  sequenceNumber: number;
  nomorBak: string;
  lampiran: string;
  tanggalBak: string; // YYYY-MM-DD
  hariBak: string;

  // Pihak Pertama
  staffId: string;
  pihakPertamaNama: string;
  pihakPertamaJabatan: string;
  pihakPertamaAlamat: string;

  // Pihak Kedua
  customerId: string;
  pihakKeduaPerusahaan: string;
  pihakKeduaNama: string;
  pihakKeduaJabatan: string;
  pihakKeduaAlamat: string;
  pihakKeduaTelepon: string;
  pihakKeduaEmail: string;

  // Surat Permohonan
  nomorSurat: string;
  tanggalSurat: string; // YYYY-MM-DD
  perihalSurat: string;

  // Rekening Pembayaran
  bankAccountId: string;

  // Status & Tanda Tangan
  statusPembayaran: PaymentStatus;
  statusDokumen: DocumentStatus;
  signatureMode: SignatureMode;
  pihakPertamaSignature?: string;
  pihakKeduaSignature?: string;
  digitalSignHash?: string;

  // Metadata & Verifikasi
  verificationCode: string;
  version: number;
  catatanRevisi?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO
  formattedTime: string; // DD/MM/YYYY HH:mm
  user: string;
  role: UserRole;
  bakId?: string;
  nomorBak?: string;
  activity: string;
  beforeData: string;
  afterData: string;
}

export interface DocumentVersionSnapshot {
  id: string;
  bakId: string;
  nomorBak: string;
  version: number;
  savedAt: string;
  savedBy: string;
  reason: string;
  snapshot: {
    document: BakDocument;
    trips: BakTrip[];
    payments: BakPayment[];
    terms: BakTermItem[];
  };
}

export interface RelationalDatabase {
  users: UserAccount[];
  customers: Customer[];
  staff: StaffMember[];
  bak_documents: BakDocument[];
  bak_trips: BakTrip[];
  bak_payments: BakPayment[];
  bak_terms: BakTermItem[];
  master_terms: MasterTerm[];
  bank_accounts: BankAccount[];
  tariffs: MasterTariff[];
  audit_logs: AuditLogEntry[];
  document_versions: DocumentVersionSnapshot[];
}
