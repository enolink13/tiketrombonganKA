import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, Lock } from 'lucide-react';
import {
  BankAccount,
  Customer,
  MasterTariff,
  MasterTerm,
  StaffMember,
  UserRole,
} from '../types/bak';
import { formatRupiah } from '../utils/formatters';

interface MasterCustomersProps {
  customers: Customer[];
  role: UserRole;
  onSaveCustomer: (customer: Customer, isNew: boolean) => void;
  onDeleteCustomer: (id: string) => void;
}

export const MasterCustomersView: React.FC<MasterCustomersProps> = ({
  customers,
  role,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const canEdit = role === 'ADMIN' || role === 'PETUGAS_TICKETING';
  const [editing, setEditing] = useState<Customer | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Master Pelanggan / Agen Perjalanan
          </h1>
          <p className="text-xs text-slate-500">
            Data perusahaan dan agen travel untuk PIHAK KEDUA pada dokumen BAK.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditing({
                id: `cust-${Date.now()}`,
                namaPerusahaan: '',
                alamat: '',
                pic: '',
                jabatan: '',
                nomorHp: '',
                email: '',
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Pelanggan / Agen
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              {isNew ? 'Tambah Pelanggan / Agen Baru' : 'Edit Data Pelanggan / Agen'}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan
              </label>
              <input
                type="text"
                value={editing.namaPerusahaan}
                onChange={(e) =>
                  setEditing({ ...editing, namaPerusahaan: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIC / Perwakilan
              </label>
              <input
                type="text"
                value={editing.pic}
                onChange={(e) => setEditing({ ...editing, pic: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan
              </label>
              <input
                type="text"
                value={editing.jabatan}
                onChange={(e) => setEditing({ ...editing, jabatan: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor HP
              </label>
              <input
                type="text"
                value={editing.nomorHp}
                onChange={(e) => setEditing({ ...editing, nomorHp: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat
              </label>
              <input
                type="text"
                value={editing.alamat}
                onChange={(e) => setEditing({ ...editing, alamat: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editing.namaPerusahaan.trim()) return;
                onSaveCustomer(editing, isNew);
                setEditing(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Nama Perusahaan / Agen</th>
                <th className="py-3 px-4">PIC &amp; Jabatan</th>
                <th className="py-3 px-4">Alamat</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {c.namaPerusahaan}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{c.pic}</div>
                    <div className="text-slate-500">{c.jabatan}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{c.alamat}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono-tabular text-slate-800">{c.nomorHp}</div>
                    <div className="text-slate-500">{c.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {canEdit ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNew(false);
                            setEditing({ ...c });
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 rounded cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c.id)}
                            className="p-1.5 text-slate-600 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">Read-only</span>
                    )}
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

interface MasterTariffsProps {
  tariffs: MasterTariff[];
  role: UserRole;
  onSaveTariff: (tariff: MasterTariff, isNew: boolean) => void;
  onDeleteTariff: (id: string) => void;
}

export const MasterTariffsView: React.FC<MasterTariffsProps> = ({
  tariffs,
  role,
  onSaveTariff,
  onDeleteTariff,
}) => {
  const isAdmin = role === 'ADMIN';
  const [editing, setEditing] = useState<MasterTariff | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Master Tarif Subclass &amp; Bea Admin KA
          </h1>
          <p className="text-xs text-slate-500">
            Referensi tarif dasar subclass Kereta Api dan bea admin.
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditing({
                id: `trf-${Date.now()}`,
                namaKaDefault: '',
                nomorKaDefault: '',
                relasiDefault: 'Gambir (GMR) – Bandung (BD)',
                jenisKelas: 'Eksekutif',
                subclass: 'AA',
                tarif: 320000,
                beaAdmin: 7500,
                periodeBerlaku: 'Januari – Desember 2026',
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Master Tarif
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            Hanya Admin yang dapat mengubah Master Tarif
          </div>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nama KA"
              value={editing.namaKaDefault || ''}
              onChange={(e) =>
                setEditing({ ...editing, namaKaDefault: e.target.value })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Nomor KA"
              value={editing.nomorKaDefault || ''}
              onChange={(e) =>
                setEditing({ ...editing, nomorKaDefault: e.target.value })
              }
              className="px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Relasi"
              value={editing.relasiDefault || ''}
              onChange={(e) =>
                setEditing({ ...editing, relasiDefault: e.target.value })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Kelas"
              value={editing.jenisKelas}
              onChange={(e) =>
                setEditing({ ...editing, jenisKelas: e.target.value })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Subclass"
              value={editing.subclass}
              onChange={(e) =>
                setEditing({ ...editing, subclass: e.target.value })
              }
              className="px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Tarif"
              value={editing.tarif}
              onChange={(e) =>
                setEditing({ ...editing, tarif: Number(e.target.value) })
              }
              className="px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Bea Admin"
              value={editing.beaAdmin}
              onChange={(e) =>
                setEditing({ ...editing, beaAdmin: Number(e.target.value) })
              }
              className="px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Periode Berlaku"
              value={editing.periodeBerlaku}
              onChange={(e) =>
                setEditing({ ...editing, periodeBerlaku: e.target.value })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg sm:col-span-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveTariff(editing, isNew);
                setEditing(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg cursor-pointer"
            >
              Simpan Tarif
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Nama KA &amp; Relasi</th>
                <th className="py-3 px-4">Kelas / Subclass</th>
                <th className="py-3 px-4 text-right">Tarif Subclass</th>
                <th className="py-3 px-4 text-right">Bea Admin</th>
                <th className="py-3 px-4 text-right">Tarif + Admin</th>
                <th className="py-3 px-4">Periode Berlaku</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {tariffs.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {tr.namaKaDefault || '-'} ({tr.nomorKaDefault || '-'})
                    </div>
                    <div className="text-slate-500">{tr.relasiDefault}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {tr.jenisKelas} · <span className="font-mono-tabular font-semibold">{tr.subclass}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">
                    {formatRupiah(tr.tarif)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular">
                    {formatRupiah(tr.beaAdmin)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-blue-800">
                    {formatRupiah(tr.tarif + tr.beaAdmin)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{tr.periodeBerlaku}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {isAdmin ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNew(false);
                            setEditing({ ...tr });
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTariff(tr.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">Read-only</span>
                    )}
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

interface MasterBanksProps {
  banks: BankAccount[];
  role: UserRole;
  onSaveBank: (bank: BankAccount, isNew: boolean) => void;
  onDeleteBank: (id: string) => void;
}

export const MasterBanksView: React.FC<MasterBanksProps> = ({
  banks,
  role,
  onSaveBank,
  onDeleteBank,
}) => {
  const isAdmin = role === 'ADMIN';
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Master Rekening Pembayaran Perusahaan
          </h1>
          <p className="text-xs text-slate-500">
            Default: Bank Central Asia (BCA) Cab. Pasar Baru Jakarta — 002 3044 151 a.n. PT Kereta Api Pariwisata.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditing({
                id: `bank-${Date.now()}`,
                bank: '',
                cabang: '',
                nomorRekening: '',
                namaRekening: 'PT Kereta Api Pariwisata',
                aktif: true,
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Rekening
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nama Bank"
              value={editing.bank}
              onChange={(e) => setEditing({ ...editing, bank: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Cabang"
              value={editing.cabang}
              onChange={(e) => setEditing({ ...editing, cabang: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Nomor Rekening"
              value={editing.nomorRekening}
              onChange={(e) =>
                setEditing({ ...editing, nomorRekening: e.target.value })
              }
              className="px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Atas Nama"
              value={editing.namaRekening}
              onChange={(e) =>
                setEditing({ ...editing, namaRekening: e.target.value })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editing.bank.trim()) return;
                onSaveBank(editing, isNew);
                setEditing(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg cursor-pointer"
            >
              Simpan Rekening
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Bank</th>
              <th className="py-3 px-4">Cabang</th>
              <th className="py-3 px-4">Nomor Rekening</th>
              <th className="py-3 px-4">Atas Nama</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {banks.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">{b.bank}</td>
                <td className="py-3.5 px-4 text-slate-700">{b.cabang}</td>
                <td className="py-3.5 px-4 font-mono-tabular font-bold text-blue-900">
                  {b.nomorRekening}
                </td>
                <td className="py-3.5 px-4 text-slate-800">{b.namaRekening}</td>
                <td className="py-3.5 px-4">
                  <span className={b.aktif ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                    {b.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {isAdmin ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing({ ...b });
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBank(b.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">Read-only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface MasterTermsProps {
  terms: MasterTerm[];
  role: UserRole;
  onSaveTerm: (term: MasterTerm, isNew: boolean) => void;
  onDeleteTerm: (id: string) => void;
}

export const MasterTermsView: React.FC<MasterTermsProps> = ({
  terms,
  role,
  onSaveTerm,
  onDeleteTerm,
}) => {
  const isAdmin = role === 'ADMIN';
  const [editing, setEditing] = useState<MasterTerm | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Master Persyaratan dan Ketentuan BAK
          </h1>
          <p className="text-xs text-slate-500">
            Kelola ketentuan pembatalan, manifest penumpang, waktu kedatangan, dan boarding.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              const nextNum = terms.length + 1;
              setIsNew(true);
              setEditing({
                id: `mterm-${Date.now()}`,
                nomorKetentuan: nextNum,
                isiKetentuan: '',
                aktif: true,
                urutanTampil: nextNum,
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Ketentuan Baru
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4">
          <textarea
            rows={3}
            placeholder="Isi Ketentuan Resmi"
            value={editing.isiKetentuan}
            onChange={(e) =>
              setEditing({ ...editing, isiKetentuan: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editing.isiKetentuan.trim()) return;
                onSaveTerm(editing, isNew);
                setEditing(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg cursor-pointer"
            >
              Simpan Ketentuan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {terms
          .slice()
          .sort((a, b) => a.urutanTampil - b.urutanTampil)
          .map((t) => (
            <div
              key={t.id}
              className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded bg-slate-900 text-white text-xs font-mono-tabular font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {t.urutanTampil}
                </span>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {t.isiKetentuan}
                  </p>
                  <div className="text-[11px] text-slate-500">
                    Status: <span className="text-emerald-700 font-semibold">{t.aktif ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNew(false);
                      setEditing({ ...t });
                    }}
                    className="p-1.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTerm(t.id)}
                    className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

interface MasterStaffProps {
  staff: StaffMember[];
  role: UserRole;
  onSaveStaff: (member: StaffMember, isNew: boolean) => void;
  onDeleteStaff: (id: string) => void;
}

export const MasterStaffView: React.FC<MasterStaffProps> = ({
  staff,
  role,
  onSaveStaff,
  onDeleteStaff,
}) => {
  const isAdmin = role === 'ADMIN';
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Master Petugas Ticketing (PIHAK PERTAMA)
          </h1>
          <p className="text-xs text-slate-500">
            Default: Sumarjiyono — Pelaksana Ticketing, Stasiun Gondangdia, Jakarta Pusat.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditing({
                id: `stf-${Date.now()}`,
                nama: '',
                nipp: '',
                jabatan: 'Pelaksana Ticketing',
                alamat:
                  'Stasiun Gondangdia, Pintu Selatan – Lantai Dasar, Jakarta Pusat 10340',
                aktif: true,
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Petugas
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={editing.nama}
              onChange={(e) => setEditing({ ...editing, nama: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="NIPP"
              value={editing.nipp}
              onChange={(e) => setEditing({ ...editing, nipp: e.target.value })}
              className="px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Jabatan"
              value={editing.jabatan}
              onChange={(e) =>
                setEditing({ ...editing, jabatan: e.target.value })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Alamat Kantor"
              value={editing.alamat}
              onChange={(e) => setEditing({ ...editing, alamat: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg sm:col-span-3"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editing.nama.trim()) return;
                onSaveStaff(editing, isNew);
                setEditing(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg cursor-pointer"
            >
              Simpan Petugas
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Nama Petugas</th>
              <th className="py-3 px-4">NIPP</th>
              <th className="py-3 px-4">Jabatan</th>
              <th className="py-3 px-4">Alamat</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">{s.nama}</td>
                <td className="py-3.5 px-4 font-mono-tabular text-slate-700">{s.nipp}</td>
                <td className="py-3.5 px-4 text-slate-800">{s.jabatan}</td>
                <td className="py-3.5 px-4 text-slate-600">{s.alamat}</td>
                <td className="py-3.5 px-4">
                  <span className={s.aktif ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                    {s.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {isAdmin ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing({ ...s });
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStaff(s.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">Read-only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
