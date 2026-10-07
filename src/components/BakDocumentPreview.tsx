import React from 'react';
import {
  BakDocument,
  BakPayment,
  BakTermItem,
  BakTrip,
  BankAccount,
} from '../types/bak';
import {
  calculateBakFinancials,
  calculateTripTotals,
  formatDayAndDateIndonesia,
  formatIndonesianDate,
  formatRupiah,
} from '../utils/formatters';
import { QrCodeSvg } from './QrCodeSvg';

interface BakDocumentPreviewProps {
  document: BakDocument;
  trips: BakTrip[];
  payments: BakPayment[];
  terms: BakTermItem[];
  bankAccount?: BankAccount;
  onOpenVerify?: (code: string) => void;
}

export const BakDocumentPreview: React.FC<BakDocumentPreviewProps> = ({
  document: doc,
  trips,
  payments,
  terms,
  bankAccount,
  onOpenVerify,
}) => {
  const financials = calculateBakFinancials(trips, payments);
  const activeTerms = terms.filter((t) => t.aktif);

  return (
    <div className="a4-document-sheet mx-auto w-full max-w-[820px] bg-white border border-slate-300 shadow-sm px-8 py-10 sm:px-14 sm:py-12 text-slate-950 font-formal text-[14.5px] leading-relaxed">
      {/* Kop Surat Resmi PT Kereta Api Pariwisata */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded bg-blue-900 text-white flex flex-col items-center justify-center font-sans font-bold tracking-tight shrink-0">
            <span className="text-xs leading-none">KAI</span>
            <span className="text-[9px] font-medium tracking-wider text-amber-300 mt-0.5">
              WISATA
            </span>
          </div>
          <div>
            <div className="font-sans font-bold text-base tracking-tight text-slate-900 uppercase">
              PT Kereta Api Pariwisata
            </div>
            <div className="font-sans text-xs text-slate-600">
              Stasiun Gondangdia, Pintu Selatan – Lantai Dasar, Jakarta Pusat 10340
            </div>
            <div className="font-sans text-[11px] text-slate-500">
              Layanan Angkutan Rombongan &amp; Kereta Wisata · www.kawisata.id
            </div>
          </div>
        </div>
        <div className="text-right font-sans text-xs text-slate-500">
          <div>Dokumen Resmi Ticketing</div>
          <div className="font-mono-tabular font-medium text-slate-800">
            Versi v{doc.version || 1} · {doc.statusDokumen}
          </div>
        </div>
      </div>

      {/* Judul Dokumen */}
      <div className="text-center mb-6">
        <h1 className="text-lg sm:text-xl font-bold tracking-wide uppercase underline decoration-slate-900 underline-offset-4">
          BERITA ACARA KESEPAKATAN
        </h1>
        <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase mt-1">
          PERJALANAN ANGKUTAN ROMBONGAN
        </h2>
        <div className="mt-3 inline-block text-left font-mono-tabular text-[13px] space-y-0.5">
          <div className="grid grid-cols-[85px_12px_1fr]">
            <span>Nomor</span>
            <span>:</span>
            <span className="font-semibold text-slate-900">{doc.nomorBak || '-'}</span>
          </div>
          <div className="grid grid-cols-[85px_12px_1fr]">
            <span>Lampiran</span>
            <span>:</span>
            <span>{doc.lampiran || '-'}</span>
          </div>
        </div>
      </div>

      {/* Kalimat Pembukaan */}
      <p className="text-justify mb-5">
        Pada hari ini <span className="font-semibold">{doc.hariBak || '-'}</span>,{' '}
        <span className="font-semibold">{formatIndonesianDate(doc.tanggalBak)}</span>{' '}
        bertempat di kantor pusat PT Kereta Api Pariwisata telah ditandatangani Berita
        Acara Kesepakatan (BAK) perjalanan angkutan rombongan antara:
      </p>

      {/* I. PIHAK PERTAMA */}
      <div className="mb-5">
        <div className="font-bold uppercase text-sm mb-1.5">
          I. PIHAK PERTAMA — PT Kereta Api Pariwisata
        </div>
        <div className="pl-4 space-y-1 text-[14px]">
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Nama</span>
            <span>:</span>
            <span className="font-semibold">{doc.pihakPertamaNama || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Jabatan</span>
            <span>:</span>
            <span>{doc.pihakPertamaJabatan || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Alamat</span>
            <span>:</span>
            <span>{doc.pihakPertamaAlamat || '-'}</span>
          </div>
        </div>
        <p className="pl-4 mt-1 text-xs italic text-slate-700">
          Selanjutnya dalam Berita Acara Kesepakatan ini disebut sebagai{' '}
          <strong className="not-italic">PIHAK PERTAMA</strong>.
        </p>
      </div>

      {/* II. PIHAK KEDUA */}
      <div className="mb-5">
        <div className="font-bold uppercase text-sm mb-1.5">II. PIHAK KEDUA</div>
        <div className="pl-4 space-y-1 text-[14px]">
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Nama Perusahaan/Agen</span>
            <span>:</span>
            <span className="font-semibold">{doc.pihakKeduaPerusahaan || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Nama Ketua/Perwakilan</span>
            <span>:</span>
            <span className="font-semibold">{doc.pihakKeduaNama || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Jabatan</span>
            <span>:</span>
            <span>{doc.pihakKeduaJabatan || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Alamat</span>
            <span>:</span>
            <span>{doc.pihakKeduaAlamat || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Nomor Telepon</span>
            <span>:</span>
            <span className="font-mono-tabular">{doc.pihakKeduaTelepon || '-'}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Email</span>
            <span>:</span>
            <span className="font-sans text-[13px]">{doc.pihakKeduaEmail || '-'}</span>
          </div>
        </div>
        <p className="pl-4 mt-1 text-xs italic text-slate-700">
          Selanjutnya dalam Berita Acara Kesepakatan ini disebut sebagai{' '}
          <strong className="not-italic">PIHAK KEDUA</strong>.
        </p>
      </div>

      {/* Informasi Surat Permohonan */}
      <div className="mb-6">
        <p className="text-justify mb-2">
          Berdasarkan surat permohonan angkutan rombongan dari PIHAK KEDUA dengan rincian
          sebagai berikut:
        </p>
        <div className="pl-4 space-y-1 text-[14px]">
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Nomor Surat</span>
            <span>:</span>
            <span className="font-mono-tabular font-semibold">
              {doc.nomorSurat || '-'}
            </span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Tanggal Surat</span>
            <span>:</span>
            <span>{formatIndonesianDate(doc.tanggalSurat)}</span>
          </div>
          <div className="grid grid-cols-[180px_14px_1fr]">
            <span>Perihal</span>
            <span>:</span>
            <span className="font-semibold">{doc.perihalSurat || '-'}</span>
          </div>
        </div>
      </div>

      {/* Data Keberangkatan (Multiple) */}
      <div className="mb-6">
        <p className="mb-3 font-semibold">
          Kedua belah pihak sepakat untuk melaksanakan perjalanan angkutan rombongan
          Kereta Api dengan rincian keberangkatan dan biaya sebagai berikut:
        </p>

        <div className="space-y-4">
          {trips.map((trip, index) => {
            const { tarifTiketPlusAdmin, jumlahBiaya } = calculateTripTotals(
              trip.tarifSubclass,
              trip.beaAdmin,
              trip.jumlahPax
            );
            return (
              <div
                key={trip.id || index}
                className="border border-slate-300 p-4 bg-slate-50/40"
              >
                <div className="font-bold uppercase tracking-wide text-sm border-b border-slate-200 pb-1.5 mb-2.5">
                  KEBERANGKATAN {index + 1}
                </div>
                <div className="space-y-1 text-[13.5px]">
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Hari/Tanggal</span>
                    <span>:</span>
                    <span className="font-semibold">
                      {formatDayAndDateIndonesia(trip.tanggal, trip.hari)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Nama/No KA</span>
                    <span>:</span>
                    <span className="font-semibold">
                      {trip.namaKa || '-'} ({trip.nomorKa || '-'})
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Relasi (Asal – Tujuan)</span>
                    <span>:</span>
                    <span>
                      {trip.relasiAsal || '-'} – {trip.relasiTujuan || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Kelas</span>
                    <span>:</span>
                    <span>
                      {trip.kelas || '-'}
                      {trip.subclass ? ` (Subclass ${trip.subclass})` : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Jam Berangkat</span>
                    <span>:</span>
                    <span className="font-mono-tabular">
                      Pukul {trip.jamBerangkat || '--:--'} – {trip.jamTiba || '--:--'} WIB
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Jumlah/Kapasitas</span>
                    <span>:</span>
                    <span className="font-mono-tabular font-semibold">
                      {trip.jumlahPax} pax
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Tarif Subclass</span>
                    <span>:</span>
                    <span className="font-mono-tabular">
                      {formatRupiah(trip.tarifSubclass)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr]">
                    <span>Tarif Tiket + Bea Admin</span>
                    <span>:</span>
                    <span className="font-mono-tabular">
                      {formatRupiah(trip.tarifSubclass)} + {formatRupiah(trip.beaAdmin)} ={' '}
                      <strong>{formatRupiah(tarifTiketPlusAdmin)}</strong> x{' '}
                      {trip.jumlahPax}
                    </span>
                  </div>
                  <div className="grid grid-cols-[195px_14px_1fr] pt-1 border-t border-slate-200/80">
                    <span className="font-bold">Jumlah</span>
                    <span className="font-bold">:</span>
                    <span className="font-mono-tabular font-bold text-slate-950">
                      {formatRupiah(jumlahBiaya)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rekapitulasi Subtotal & Total Biaya */}
        <div className="mt-4 border-t-2 border-b-2 border-slate-900 py-3 px-4 bg-slate-50">
          <div className="space-y-1 text-[13.5px]">
            {trips.map((trip, idx) => {
              const { jumlahBiaya } = calculateTripTotals(
                trip.tarifSubclass,
                trip.beaAdmin,
                trip.jumlahPax
              );
              return (
                <div key={trip.id || idx} className="flex justify-between items-center">
                  <span>
                    Subtotal Keberangkatan {idx + 1} ({trip.namaKa} · {trip.jumlahPax} pax)
                  </span>
                  <span className="font-mono-tabular font-medium">
                    {formatRupiah(jumlahBiaya)}
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t border-slate-300 text-base font-bold">
              <span>TOTAL BIAYA ({financials.totalPax} Pax)</span>
              <span className="font-mono-tabular text-blue-950">
                {formatRupiah(financials.totalBiaya)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mekanisme dan Pelaksanaan Pembayaran */}
      <div className="mb-6">
        <div className="font-bold uppercase text-sm mb-2">
          Mekanisme dan Pelaksanaan Pembayaran
        </div>
        <div className="pl-4 space-y-2 text-[13.5px]">
          <div className="grid grid-cols-[195px_14px_1fr]">
            <span>Status Pembayaran</span>
            <span>:</span>
            <span className="font-bold">{financials.statusPembayaran}</span>
          </div>

          {payments.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {payments.map((pay, idx) => (
                <div
                  key={pay.id || idx}
                  className="grid grid-cols-[195px_14px_1fr] items-baseline"
                >
                  <span className="font-semibold">Pembayaran {idx + 1}</span>
                  <span>:</span>
                  <div>
                    <span>Tanggal {formatIndonesianDate(pay.tanggal)}</span>
                    <span className="mx-1.5">·</span>
                    <span>Bank {pay.bank}</span>
                    <span className="mx-1.5">·</span>
                    <span className="font-mono-tabular font-semibold">
                      {formatRupiah(pay.nominal)}
                    </span>
                    {pay.keterangan && (
                      <span className="text-slate-600"> ({pay.keterangan})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[195px_14px_1fr]">
              <span>Riwayat Pembayaran</span>
              <span>:</span>
              <span className="italic text-slate-600">
                Belum terdapat realisasi pembayaran tercatat
              </span>
            </div>
          )}

          <div className="grid grid-cols-[195px_14px_1fr] pt-1 border-t border-slate-200">
            <span>Total Biaya</span>
            <span>:</span>
            <span className="font-mono-tabular font-semibold">
              {formatRupiah(financials.totalBiaya)}
            </span>
          </div>
          <div className="grid grid-cols-[195px_14px_1fr]">
            <span>Total Pembayaran</span>
            <span>:</span>
            <span className="font-mono-tabular font-semibold text-emerald-800">
              {formatRupiah(financials.totalPembayaran)}
            </span>
          </div>
          <div className="grid grid-cols-[195px_14px_1fr]">
            <span className="font-bold">Sisa Pembayaran</span>
            <span className="font-bold">:</span>
            <span className="font-mono-tabular font-bold text-slate-950">
              {formatRupiah(financials.sisaPembayaran)}
            </span>
          </div>

          {bankAccount && (
            <div className="mt-3 p-3 border border-slate-300 bg-white">
              <div className="text-xs uppercase font-sans font-semibold text-slate-600 mb-1">
                Rekening Pembayaran Resmi PIHAK PERTAMA:
              </div>
              <div className="text-[13.5px] font-semibold text-slate-900">
                {bankAccount.bank} — {bankAccount.cabang}
              </div>
              <div className="text-[13.5px] font-mono-tabular">
                Nomor Rekening: <strong>{bankAccount.nomorRekening}</strong>
              </div>
              <div className="text-[13.5px]">
                Atas Nama: <strong>{bankAccount.namaRekening}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persyaratan dan Ketentuan */}
      <div className="mb-8">
        <div className="font-bold uppercase text-sm mb-2">
          Persyaratan dan Ketentuan Perjalanan Angkutan Rombongan
        </div>
        <ol className="list-decimal pl-6 space-y-1.5 text-[13.5px] text-justify">
          {activeTerms.map((term, index) => (
            <li key={term.id || index}>{term.isiKetentuan}</li>
          ))}
        </ol>
      </div>

      {/* Penutup */}
      <p className="text-justify mb-8 text-[14px]">
        Demikian Berita Acara Kesepakatan (BAK) Perjalanan Angkutan Rombongan ini dibuat
        dalam rangkap 2 (dua) bermeterai cukup dan mempunyai kekuatan hukum yang sama
        untuk dipergunakan sebagaimana mestinya.
      </p>

      {/* Area Tanda Tangan */}
      <div className="grid grid-cols-2 gap-6 pt-2 text-center text-[14px]">
        <div className="flex flex-col items-center justify-between min-h-[165px]">
          <div>
            <div className="font-bold uppercase">PIHAK KEDUA,</div>
            <div className="font-bold">{doc.pihakKeduaPerusahaan || '-'}</div>
          </div>

          <div className="my-3 flex items-center justify-center min-h-[68px]">
            {doc.signatureMode === 'upload' && doc.pihakKeduaSignature ? (
              <img
                src={doc.pihakKeduaSignature}
                alt="Tanda Tangan Pihak Kedua"
                referrerPolicy="no-referrer"
                className="max-h-16 object-contain"
              />
            ) : doc.signatureMode === 'digital' ? (
              <div className="px-3 py-1.5 border border-slate-300 text-[11px] font-sans text-slate-600 bg-slate-50">
                Ditandatangani Secara Elektronik
                <div className="font-mono-tabular text-[10px] text-slate-800">
                  {doc.pihakKeduaNama}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic font-sans">
                (Tanda tangan &amp; stempel perusahaan)
              </div>
            )}
          </div>

          <div>
            <div className="font-bold underline decoration-slate-800 underline-offset-2">
              {doc.pihakKeduaNama || '....................................'}
            </div>
            <div className="text-[13px]">{doc.pihakKeduaJabatan || '-'}</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between min-h-[165px]">
          <div>
            <div className="font-bold uppercase">PIHAK PERTAMA,</div>
            <div className="font-bold uppercase">PT KERETA API PARIWISATA</div>
          </div>

          <div className="my-3 flex items-center justify-center min-h-[68px]">
            {doc.signatureMode === 'upload' && doc.pihakPertamaSignature ? (
              <img
                src={doc.pihakPertamaSignature}
                alt="Tanda Tangan Pihak Pertama"
                referrerPolicy="no-referrer"
                className="max-h-16 object-contain"
              />
            ) : doc.signatureMode === 'digital' ? (
              <div className="px-3 py-1.5 border border-blue-200 text-[11px] font-sans text-blue-900 bg-blue-50/60">
                Digital Signature Terverifikasi KAI Wisata
                <div className="font-mono-tabular text-[10px] font-semibold">
                  {doc.digitalSignHash || doc.verificationCode}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic font-sans">
                (Tanda tangan basah setelah cetak)
              </div>
            )}
          </div>

          <div>
            <div className="font-bold underline decoration-slate-800 underline-offset-2">
              {doc.pihakPertamaNama || 'Sumarjiyono'}
            </div>
            <div className="text-[13px]">
              {doc.pihakPertamaJabatan || 'Pelaksana Ticketing'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Verifikasi QR Code */}
      <div className="mt-10 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-slate-600">
        <div className="space-y-1">
          <div className="font-semibold text-slate-800">
            Verifikasi Keaslian Dokumen BAK KAI Wisata
          </div>
          <div>
            Pindai QR Code atau kunjungi halaman verifikasi publik:{' '}
            <button
              type="button"
              onClick={() => onOpenVerify?.(doc.verificationCode)}
              className="font-mono-tabular text-blue-700 underline hover:text-blue-900 cursor-pointer"
            >
              /verify/{doc.verificationCode}
            </button>
          </div>
          <div className="font-mono-tabular text-[11px] text-slate-500">
            Nomor BAK: {doc.nomorBak} · Kode: {doc.verificationCode}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QrCodeSvg
            value={`${window.location.origin}/verify/${doc.verificationCode}`}
            size={76}
            onClick={() => onOpenVerify?.(doc.verificationCode)}
          />
        </div>
      </div>
    </div>
  );
};
