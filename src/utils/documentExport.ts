import { jsPDF } from 'jspdf';
import {
  BakDocument,
  BakPayment,
  BakTermItem,
  BakTrip,
  BankAccount,
} from '../types/bak';
import {
  buildDocumentFilename,
  calculateBakFinancials,
  calculateTripTotals,
  formatDayAndDateIndonesia,
  formatIndonesianDate,
  formatRupiah,
} from './formatters';

export function exportBakToPdf(
  docData: BakDocument,
  trips: BakTrip[],
  payments: BakPayment[],
  terms: BakTermItem[],
  bankAccount?: BankAccount
): string {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }
  };

  const writeKeyValueRow = (label: string, value: string, indent = 0) => {
    ensureSpace(7);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10.5);
    pdf.text(label, marginX + indent, y);
    pdf.text(':', marginX + indent + 48, y);
    const wrapped = pdf.splitTextToSize(value || '-', contentWidth - indent - 52);
    pdf.text(wrapped, marginX + indent + 52, y);
    y += Math.max(5.5, wrapped.length * 5);
  };

  // Header / Kop Dokumen Resmi KAI Wisata
  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.text('PT KERETA API PARIWISATA (KAI WISATA)', pageWidth / 2, y, {
    align: 'center',
  });
  y += 5;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  pdf.text(
    'Stasiun Gondangdia, Pintu Selatan – Lantai Dasar, Jakarta Pusat 10340',
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 3.5;
  pdf.setLineWidth(0.5);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 1;
  pdf.setLineWidth(0.2);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // Judul BAK
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text('BERITA ACARA KESEPAKATAN', pageWidth / 2, y, { align: 'center' });
  y += 5.5;
  pdf.text('PERJALANAN ANGKUTAN ROMBONGAN', pageWidth / 2, y, {
    align: 'center',
  });
  y += 7;

  // Nomor & Lampiran
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.5);
  pdf.text(`Nomor     : ${docData.nomorBak}`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 5;
  pdf.text(`Lampiran  : ${docData.lampiran || '-'}`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 8;

  // Pembukaan
  const openingText = `Pada hari ini ${docData.hariBak}, ${formatIndonesianDate(
    docData.tanggalBak
  )} bertempat di kantor pusat PT Kereta Api Pariwisata telah ditandatangani Berita Acara Kesepakatan (BAK) perjalanan angkutan rombongan antara:`;
  const openingLines = pdf.splitTextToSize(openingText, contentWidth);
  pdf.text(openingLines, marginX, y);
  y += openingLines.length * 5 + 3;

  // PIHAK PERTAMA
  pdf.setFont('times', 'bold');
  pdf.text('I. PIHAK PERTAMA (PT Kereta Api Pariwisata)', marginX, y);
  y += 5.5;
  writeKeyValueRow('Nama', docData.pihakPertamaNama, 4);
  writeKeyValueRow('Jabatan', docData.pihakPertamaJabatan, 4);
  writeKeyValueRow('Alamat', docData.pihakPertamaAlamat, 4);
  y += 2;

  // PIHAK KEDUA
  pdf.setFont('times', 'bold');
  pdf.text('II. PIHAK KEDUA', marginX, y);
  y += 5.5;
  writeKeyValueRow('Perusahaan / Agen', docData.pihakKeduaPerusahaan, 4);
  writeKeyValueRow('Nama Ketua / Perwakilan', docData.pihakKeduaNama, 4);
  writeKeyValueRow('Jabatan', docData.pihakKeduaJabatan, 4);
  writeKeyValueRow('Alamat', docData.pihakKeduaAlamat, 4);
  writeKeyValueRow('Nomor Telepon', docData.pihakKeduaTelepon, 4);
  writeKeyValueRow('Email', docData.pihakKeduaEmail, 4);
  y += 3;

  // Dasar Surat Permohonan
  ensureSpace(22);
  pdf.setFont('times', 'bold');
  pdf.text('DASAR SURAT PERMOHONAN', marginX, y);
  y += 5.5;
  writeKeyValueRow('Nomor Surat', docData.nomorSurat, 4);
  writeKeyValueRow('Tanggal Surat', formatIndonesianDate(docData.tanggalSurat), 4);
  writeKeyValueRow('Perihal', docData.perihalSurat, 4);
  y += 3;

  // DATA KEBERANGKATAN
  ensureSpace(20);
  pdf.setFont('times', 'bold');
  pdf.text('RINCIAN PERJALANAN / KEBERANGKATAN ROMBONGAN', marginX, y);
  y += 6;

  trips.forEach((trip, idx) => {
    ensureSpace(52);
    const { tarifTiketPlusAdmin, jumlahBiaya } = calculateTripTotals(
      trip.tarifSubclass,
      trip.beaAdmin,
      trip.jumlahPax
    );

    pdf.setFont('times', 'bold');
    pdf.setFontSize(10.5);
    pdf.text(`KEBERANGKATAN ${idx + 1}`, marginX + 2, y);
    y += 5.5;

    writeKeyValueRow(
      'Hari/Tanggal',
      formatDayAndDateIndonesia(trip.tanggal, trip.hari),
      4
    );
    writeKeyValueRow('Nama/No KA', `${trip.namaKa} (${trip.nomorKa})`, 4);
    writeKeyValueRow(
      'Relasi (Asal – Tujuan)',
      `${trip.relasiAsal} – ${trip.relasiTujuan}`,
      4
    );
    writeKeyValueRow(
      'Kelas',
      `${trip.kelas}${trip.subclass ? ` (Subclass ${trip.subclass})` : ''}`,
      4
    );
    writeKeyValueRow(
      'Jam Berangkat',
      `Pukul ${trip.jamBerangkat} – ${trip.jamTiba} WIB`,
      4
    );
    writeKeyValueRow('Jumlah/Kapasitas', `${trip.jumlahPax} pax`, 4);
    writeKeyValueRow('Tarif Subclass', formatRupiah(trip.tarifSubclass), 4);
    writeKeyValueRow(
      'Tarif Tiket + Bea Admin',
      `${formatRupiah(trip.tarifSubclass)} + ${formatRupiah(
        trip.beaAdmin
      )} = ${formatRupiah(tarifTiketPlusAdmin)} x ${trip.jumlahPax}`,
      4
    );
    writeKeyValueRow('Jumlah', formatRupiah(jumlahBiaya), 4);
    y += 3;
  });

  // Ringkasan Perhitungan & Total Biaya
  const financials = calculateBakFinancials(trips, payments);
  ensureSpace(35);
  pdf.setLineWidth(0.3);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 5;

  trips.forEach((trip, idx) => {
    const { jumlahBiaya } = calculateTripTotals(
      trip.tarifSubclass,
      trip.beaAdmin,
      trip.jumlahPax
    );
    pdf.setFont('times', 'normal');
    pdf.text(`Subtotal Keberangkatan ${idx + 1}`, marginX + 4, y);
    pdf.text(formatRupiah(jumlahBiaya), pageWidth - marginX - 4, y, {
      align: 'right',
    });
    y += 5;
  });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.text(
    `TOTAL BIAYA (${financials.totalPax} Pax)`,
    marginX + 4,
    y
  );
  pdf.text(formatRupiah(financials.totalBiaya), pageWidth - marginX - 4, y, {
    align: 'right',
  });
  y += 4;
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 7;

  // Mekanisme dan Pelaksanaan Pembayaran
  ensureSpace(45);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('MEKANISME DAN PELAKSANAAN PEMBAYARAN', marginX, y);
  y += 5.5;

  writeKeyValueRow('Status Pembayaran', financials.statusPembayaran, 4);
  if (payments.length === 0) {
    writeKeyValueRow('Riwayat Pembayaran', 'Belum ada pembayaran tercatat', 4);
  } else {
    payments.forEach((pay, idx) => {
      writeKeyValueRow(
        `Pembayaran ${idx + 1}`,
        `${formatIndonesianDate(pay.tanggal)} | Bank ${pay.bank} | ${formatRupiah(
          pay.nominal
        )}${pay.keterangan ? ` (${pay.keterangan})` : ''}`,
        4
      );
    });
  }
  writeKeyValueRow('Total Pembayaran', formatRupiah(financials.totalPembayaran), 4);
  writeKeyValueRow('Sisa Pembayaran', formatRupiah(financials.sisaPembayaran), 4);

  if (bankAccount) {
    y += 2;
    writeKeyValueRow(
      'Rekening Tujuan',
      `${bankAccount.bank} - ${bankAccount.cabang} | No. Rek: ${bankAccount.nomorRekening} a.n. ${bankAccount.namaRekening}`,
      4
    );
  }
  y += 4;

  // Persyaratan dan Ketentuan
  const activeTerms = terms.filter((t) => t.aktif);
  if (activeTerms.length > 0) {
    ensureSpace(30);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10.5);
    pdf.text('PERSYARATAN DAN KETENTUAN', marginX, y);
    y += 5.5;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    activeTerms.forEach((term, idx) => {
      const wrapped = pdf.splitTextToSize(term.isiKetentuan, contentWidth - 10);
      ensureSpace(wrapped.length * 4.8 + 3);
      pdf.text(`${idx + 1}.`, marginX + 2, y);
      pdf.text(wrapped, marginX + 8, y);
      y += wrapped.length * 4.6 + 2;
    });
  }

  // Penutup & Tanda Tangan
  ensureSpace(65);
  y += 4;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.5);
  const closingLines = pdf.splitTextToSize(
    'Demikian Berita Acara Kesepakatan (BAK) Perjalanan Angkutan Rombongan ini dibuat dengan sebenarnya untuk dipatuhi dan dilaksanakan oleh kedua belah pihak.',
    contentWidth
  );
  pdf.text(closingLines, marginX, y);
  y += closingLines.length * 5 + 8;

  const leftColX = marginX + 30;
  const rightColX = pageWidth - marginX - 35;

  pdf.setFont('times', 'bold');
  pdf.text('PIHAK KEDUA,', leftColX, y, { align: 'center' });
  pdf.text('PIHAK PERTAMA,', rightColX, y, { align: 'center' });
  y += 5;
  pdf.text(docData.pihakKeduaPerusahaan || '-', leftColX, y, {
    align: 'center',
  });
  pdf.text('PT KERETA API PARIWISATA', rightColX, y, { align: 'center' });

  y += 22;
  if (docData.signatureMode === 'digital') {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8.5);
    pdf.text('[Ditandatangani Secara Elektronik]', leftColX, y - 8, {
      align: 'center',
    });
    pdf.text(
      `[Digital Sign: ${docData.digitalSignHash || docData.verificationCode}]`,
      rightColX,
      y - 8,
      { align: 'center' }
    );
  }

  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(docData.pihakKeduaNama || '-', leftColX, y, { align: 'center' });
  pdf.text(docData.pihakPertamaNama || '-', rightColX, y, { align: 'center' });
  y += 5;
  pdf.setFont('times', 'normal');
  pdf.text(docData.pihakKeduaJabatan || '-', leftColX, y, { align: 'center' });
  pdf.text(docData.pihakPertamaJabatan || '-', rightColX, y, {
    align: 'center',
  });

  y += 10;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(
    `Kode Verifikasi Dokumen: ${docData.verificationCode} | Verifikasi Online: /verify/${docData.verificationCode}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  const filename = buildDocumentFilename(
    docData.nomorBak,
    docData.pihakKeduaPerusahaan,
    'pdf'
  );
  pdf.save(filename);
  return filename;
}

export function exportBakToDocx(
  docData: BakDocument,
  trips: BakTrip[],
  payments: BakPayment[],
  terms: BakTermItem[],
  bankAccount?: BankAccount
): string {
  const financials = calculateBakFinancials(trips, payments);
  const activeTerms = terms.filter((t) => t.aktif);

  const tripsHtml = trips
    .map((trip, idx) => {
      const { tarifTiketPlusAdmin, jumlahBiaya } = calculateTripTotals(
        trip.tarifSubclass,
        trip.beaAdmin,
        trip.jumlahPax
      );
      return `
      <div style="margin-bottom: 14pt;">
        <p style="font-weight: bold; margin: 0 0 4pt 0;">KEBERANGKATAN ${idx + 1}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
          <tr><td style="width: 190pt; padding: 2pt 0;">Hari/Tanggal</td><td style="width: 12pt;">:</td><td>${formatDayAndDateIndonesia(trip.tanggal, trip.hari)}</td></tr>
          <tr><td style="padding: 2pt 0;">Nama/No KA</td><td>:</td><td>${trip.namaKa} (${trip.nomorKa})</td></tr>
          <tr><td style="padding: 2pt 0;">Relasi (Asal – Tujuan)</td><td>:</td><td>${trip.relasiAsal} – ${trip.relasiTujuan}</td></tr>
          <tr><td style="padding: 2pt 0;">Kelas</td><td>:</td><td>${trip.kelas}${trip.subclass ? ` (Subclass ${trip.subclass})` : ''}</td></tr>
          <tr><td style="padding: 2pt 0;">Jam Berangkat</td><td>:</td><td>Pukul ${trip.jamBerangkat} – ${trip.jamTiba} WIB</td></tr>
          <tr><td style="padding: 2pt 0;">Jumlah/Kapasitas</td><td>:</td><td>${trip.jumlahPax} pax</td></tr>
          <tr><td style="padding: 2pt 0;">Tarif Subclass</td><td>:</td><td>${formatRupiah(trip.tarifSubclass)}</td></tr>
          <tr><td style="padding: 2pt 0;">Tarif Tiket + Bea Admin</td><td>:</td><td>${formatRupiah(trip.tarifSubclass)} + ${formatRupiah(trip.beaAdmin)} = ${formatRupiah(tarifTiketPlusAdmin)} x ${trip.jumlahPax}</td></tr>
          <tr><td style="padding: 2pt 0; font-weight: bold;">Jumlah</td><td>:</td><td style="font-weight: bold;">${formatRupiah(jumlahBiaya)}</td></tr>
        </table>
      </div>`;
    })
    .join('');

  const paymentsHtml =
    payments.length === 0
      ? '<p style="margin: 4pt 0;">Belum ada pembayaran tercatat.</p>'
      : payments
          .map(
            (p, idx) =>
              `<p style="margin: 3pt 0;"><b>Pembayaran ${idx + 1}:</b> Tanggal ${formatIndonesianDate(
                p.tanggal
              )} | Bank ${p.bank} | Nominal ${formatRupiah(p.nominal)} ${
                p.keterangan ? `(${p.keterangan})` : ''
              }</p>`
          )
          .join('');

  const termsHtml = activeTerms
    .map(
      (t) =>
        `<li style="margin-bottom: 5pt; text-align: justify;">${t.isiKetentuan}</li>`
    )
    .join('');

  const wordDocumentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>BAK ${docData.nomorBak}</title>
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2cm 2.2cm 2cm 2.2cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6pt; margin-bottom: 12pt;">
        <div style="font-size: 12pt; font-weight: bold;">PT KERETA API PARIWISATA (KAI WISATA)</div>
        <div style="font-size: 9.5pt;">Stasiun Gondangdia, Pintu Selatan – Lantai Dasar, Jakarta Pusat 10340</div>
      </div>

      <div style="text-align: center; margin-bottom: 14pt;">
        <div style="font-size: 13pt; font-weight: bold; text-decoration: underline;">BERITA ACARA KESEPAKATAN</div>
        <div style="font-size: 12pt; font-weight: bold; margin-bottom: 8pt;">PERJALANAN ANGKUTAN ROMBONGAN</div>
        <div>Nomor : ${docData.nomorBak}</div>
        <div>Lampiran : ${docData.lampiran}</div>
      </div>

      <p style="text-align: justify;">
        Pada hari ini <b>${docData.hariBak}</b>, <b>${formatIndonesianDate(
    docData.tanggalBak
  )}</b> bertempat di kantor pusat PT Kereta Api Pariwisata telah ditandatangani Berita Acara Kesepakatan (BAK) perjalanan angkutan rombongan antara:
      </p>

      <p style="font-weight: bold; margin-bottom: 4pt;">I. PIHAK PERTAMA (PT Kereta Api Pariwisata)</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10pt;">
        <tr><td style="width: 190pt;">Nama</td><td style="width: 12pt;">:</td><td>${docData.pihakPertamaNama}</td></tr>
        <tr><td>Jabatan</td><td>:</td><td>${docData.pihakPertamaJabatan}</td></tr>
        <tr><td>Alamat</td><td>:</td><td>${docData.pihakPertamaAlamat}</td></tr>
      </table>

      <p style="font-weight: bold; margin-bottom: 4pt;">II. PIHAK KEDUA</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10pt;">
        <tr><td style="width: 190pt;">Nama Perusahaan / Agen</td><td style="width: 12pt;">:</td><td><b>${docData.pihakKeduaPerusahaan}</b></td></tr>
        <tr><td>Nama Ketua / Perwakilan</td><td>:</td><td>${docData.pihakKeduaNama}</td></tr>
        <tr><td>Jabatan</td><td>:</td><td>${docData.pihakKeduaJabatan}</td></tr>
        <tr><td>Alamat</td><td>:</td><td>${docData.pihakKeduaAlamat}</td></tr>
        <tr><td>Nomor Telepon</td><td>:</td><td>${docData.pihakKeduaTelepon}</td></tr>
        <tr><td>Email</td><td>:</td><td>${docData.pihakKeduaEmail}</td></tr>
      </table>

      <p style="font-weight: bold; margin-bottom: 4pt;">INFORMASI SURAT PERMOHONAN</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;">
        <tr><td style="width: 190pt;">Nomor Surat</td><td style="width: 12pt;">:</td><td>${docData.nomorSurat}</td></tr>
        <tr><td>Tanggal Surat</td><td>:</td><td>${formatIndonesianDate(docData.tanggalSurat)}</td></tr>
        <tr><td>Perihal</td><td>:</td><td><b>${docData.perihalSurat}</b></td></tr>
      </table>

      <hr/>
      ${tripsHtml}
      <hr/>

      <table style="width: 100%; border-collapse: collapse; margin: 10pt 0;">
        <tr>
          <td style="font-weight: bold; font-size: 12pt;">TOTAL BIAYA (${financials.totalPax} PAX)</td>
          <td style="text-align: right; font-weight: bold; font-size: 12pt;">${formatRupiah(financials.totalBiaya)}</td>
        </tr>
      </table>

      <p style="font-weight: bold; margin-bottom: 4pt;">MEKANISME DAN PELAKSANAAN PEMBAYARAN</p>
      ${paymentsHtml}
      <p style="margin: 4pt 0;">
        <b>Status Pembayaran:</b> ${financials.statusPembayaran} |
        <b>Total Pembayaran:</b> ${formatRupiah(financials.totalPembayaran)} |
        <b>Sisa Pembayaran:</b> ${formatRupiah(financials.sisaPembayaran)}
      </p>
      ${
        bankAccount
          ? `<p style="margin: 4pt 0;"><b>Rekening Pembayaran:</b> ${bankAccount.bank} (${bankAccount.cabang}) – No. Rekening: <b>${bankAccount.nomorRekening}</b> a.n. <b>${bankAccount.namaRekening}</b></p>`
          : ''
      }

      <p style="font-weight: bold; margin-top: 12pt; margin-bottom: 4pt;">PERSYARATAN DAN KETENTUAN</p>
      <ol style="margin-top: 2pt; padding-left: 18pt;">
        ${termsHtml}
      </ol>

      <table style="width: 100%; margin-top: 28pt; text-align: center;">
        <tr>
          <td style="width: 50%;">
            <b>PIHAK KEDUA,</b><br/>
            <b>${docData.pihakKeduaPerusahaan}</b>
            <br/><br/><br/><br/>
            <b><u>${docData.pihakKeduaNama}</u></b><br/>
            ${docData.pihakKeduaJabatan}
          </td>
          <td style="width: 50%;">
            <b>PIHAK PERTAMA,</b><br/>
            <b>PT KERETA API PARIWISATA</b>
            <br/><br/><br/><br/>
            <b><u>${docData.pihakPertamaNama}</u></b><br/>
            ${docData.pihakPertamaJabatan}
          </td>
        </tr>
      </table>

      <p style="margin-top: 18pt; font-size: 8.5pt; text-align: center; color: #475569;">
        Kode Verifikasi BAK: ${docData.verificationCode} | Dokumen Resmi Ticketing Rombongan PT Kereta Api Pariwisata
      </p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const filename = buildDocumentFilename(
    docData.nomorBak,
    docData.pihakKeduaPerusahaan,
    'docx'
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}

export function exportBakReportToExcel(
  docs: BakDocument[],
  allTrips: BakTrip[],
  allPayments: BakPayment[]
): string {
  const headers = [
    'Nomor BAK',
    'Tanggal BAK',
    'Pihak Kedua (Perusahaan/Agen)',
    'Perwakilan',
    'Nomor Surat',
    'Jumlah Keberangkatan',
    'Daftar KA & Relasi',
    'Total Pax',
    'Total Biaya (Rp)',
    'Total Pembayaran (Rp)',
    'Sisa Pembayaran (Rp)',
    'Status Pembayaran',
    'Status Dokumen',
    'Kode Verifikasi',
  ];

  const rows = docs.map((doc) => {
    const docTrips = allTrips.filter((t) => t.bakId === doc.id);
    const docPays = allPayments.filter((p) => p.bakId === doc.id);
    const fin = calculateBakFinancials(docTrips, docPays);
    const kaSummary = docTrips
      .map(
        (t) =>
          `${t.namaKa} (${t.nomorKa}) ${t.relasiAsal}-${t.relasiTujuan} [${t.jumlahPax} pax]`
      )
      .join('; ');

    return [
      doc.nomorBak,
      doc.tanggalBak,
      doc.pihakKeduaPerusahaan,
      doc.pihakKeduaNama,
      doc.nomorSurat,
      String(docTrips.length),
      kaSummary,
      String(fin.totalPax),
      String(fin.totalBiaya),
      String(fin.totalPembayaran),
      String(fin.sisaPembayaran),
      fin.statusPembayaran,
      doc.statusDokumen,
      doc.verificationCode,
    ];
  });

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `Laporan_BAK_Rombongan_KAI_Wisata_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}
