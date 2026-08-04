import { SampleDataset } from '../types';

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'nasabah-bank',
    title: 'Data Master Nasabah Bank (Raw)',
    category: 'kependudukan',
    description: 'Data mentah nasabah dengan NIK tidak standar, format telepon acak, nama bercampur huruf besar/kecil, email berjarak, dan duplikasi.',
    governanceDictionary: {
      id: 'gov-nasabah-v1',
      name: 'Standar Governance Data Master Nasabah (DG-NAS-2026)',
      description: 'Acuan Tata Kelola Data Nasabah: NIK 16 digit, Nama TitleCase, No Telp +62, Email valid lowercase, Tanggal YYYY-MM-DD.',
      nullStrategy: 'fill_default',
      deduplicationKeys: ['nik', 'email'],
      rules: [
        {
          id: 'rule-nik',
          columnName: 'no_ktp',
          targetColumnName: 'nik',
          dataType: 'nik',
          isRequired: true,
          casing: 'none',
          trimWhitespace: true,
          defaultValue: '3171000000000000',
          description: 'NIK Kependudukan harus 16 digit angka valid.'
        },
        {
          id: 'rule-nama',
          columnName: 'nama LENGKAP',
          targetColumnName: 'nama_lengkap',
          dataType: 'string',
          isRequired: true,
          casing: 'titlecase',
          trimWhitespace: true,
          defaultValue: 'Tanpa Nama',
          description: 'Nama Lengkap wajib Title Case tanpa spasi ganda.'
        },
        {
          id: 'rule-telepon',
          columnName: 'no_hp',
          targetColumnName: 'no_telepon',
          dataType: 'phone',
          isRequired: true,
          casing: 'none',
          trimWhitespace: true,
          defaultValue: '+628000000000',
          description: 'Nomor HP diformat standar internasional Indonesia (+628...).'
        },
        {
          id: 'rule-email',
          columnName: 'e-mail',
          targetColumnName: 'email',
          dataType: 'email',
          isRequired: true,
          casing: 'lowercase',
          trimWhitespace: true,
          defaultValue: 'no-email@perusahaan.co.id',
          description: 'Email resmi lowercase tanpa spasi.'
        },
        {
          id: 'rule-tgl',
          columnName: 'tgl_lahir',
          targetColumnName: 'tanggal_lahir',
          dataType: 'date',
          isRequired: false,
          casing: 'none',
          trimWhitespace: true,
          defaultValue: '1990-01-01',
          description: 'Format tanggal standar ISO 8601 (YYYY-MM-DD).'
        },
        {
          id: 'rule-kota',
          columnName: 'kota_domisili',
          targetColumnName: 'kota_domisili',
          dataType: 'string',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          defaultValue: 'JAKARTA',
          description: 'Kota Domisili diseragamkan ke UPPERCASE.'
        },
        {
          id: 'rule-status',
          columnName: 'status_pembayaran',
          targetColumnName: 'status_nasabah',
          dataType: 'enum',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          allowedValues: ['AKTIF', 'SUSPEND', 'NON_AKTIF'],
          defaultValue: 'NON_AKTIF',
          description: 'Status hanya boleh enum: AKTIF, SUSPEND, NON_AKTIF.'
        },
        {
          id: 'rule-gaji',
          columnName: 'gaji_per_bulan',
          targetColumnName: 'nominal_gaji',
          dataType: 'currency',
          isRequired: false,
          casing: 'none',
          trimWhitespace: true,
          defaultValue: '0',
          description: 'Nominal dalam bentuk angka tanpa simbol Rp / koma desimal.'
        }
      ]
    },
    rawCsv: `no_ktp,nama LENGKAP,no_hp,e-mail,tgl_lahir,kota_domisili,status_pembayaran,gaji_per_bulan
3171011508920001,budi SANTOSO,0812-3456-7890, Budi.Santoso@gmail.com ,15/08/1992,jakarta selatan,aktif,12500000
3171011508920001,budi SANTOSO,0812-3456-7890, Budi.Santoso@gmail.com ,15/08/1992,jakarta selatan,aktif,12500000
3275022104880003,SITI AMINAH SH,628189876543,siti.aminah@yahoo.co.id,1988-04-21,Bandung,AKTIF,Rp 8.500.000
3173099001,ahmad  FAUZI,085711223344,ahmad_fauzi@outlook,10 Jan 1995,SuraBaya,active,7.000.000
3578010203910005,RINA WIJAYA,0813 9988 7766,rina.wijaya@gmail.com,1991/03/02,MEDAN,SUSPEND,15000000
,Dewi Sartika,+6281122334455,dewi.sartika@gov.id,1993-11-20,Semarang,NON AKTIF,
3174051212850009,HENDRA GUNAWAN,,hendra.g@corp.com,12-12-1985,jak-Pus,lunas,10500000`
  },
  {
    id: 'karyawan-hris',
    title: 'Data Pegawai HRIS Enterprise (Raw)',
    category: 'karyawan',
    description: 'Data mentah pegawai dengan ID Karyawan inkonsisten, jabatan tidak standar, dan email kantor acak.',
    governanceDictionary: {
      id: 'gov-hris-v1',
      name: 'Standar Governance Data Kepegawaian (DG-HRIS-2026)',
      description: 'Standar HRIS: ID Pegawai EMP-xxxx, Nama TitleCase, Email Corporate @perusahaan.com, Status Karyawan enum.',
      nullStrategy: 'fill_default',
      deduplicationKeys: ['id_karyawan', 'email_perusahaan'],
      rules: [
        {
          id: 'rule-emp-id',
          columnName: 'NIK_KARYAWAN',
          targetColumnName: 'id_karyawan',
          dataType: 'string',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          defaultValue: 'EMP-0000',
          description: 'ID Karyawan format standar EMP-XXXX.'
        },
        {
          id: 'rule-emp-nama',
          columnName: 'Nama Karyawan',
          targetColumnName: 'nama_karyawan',
          dataType: 'string',
          isRequired: true,
          casing: 'titlecase',
          trimWhitespace: true,
          defaultValue: 'Pegawai Anonim',
          description: 'Nama Karyawan wajib TitleCase.'
        },
        {
          id: 'rule-emp-jabatan',
          columnName: 'Jabatan',
          targetColumnName: 'jabatan',
          dataType: 'string',
          isRequired: true,
          casing: 'titlecase',
          trimWhitespace: true,
          defaultValue: 'Staff',
          description: 'Jabatan resmi diseragamkan.'
        },
        {
          id: 'rule-emp-dept',
          columnName: 'Departemen',
          targetColumnName: 'departemen',
          dataType: 'enum',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          allowedValues: ['IT', 'HR', 'FINANCE', 'MARKETING', 'OPERATIONAL'],
          defaultValue: 'OPERATIONAL',
          description: 'Departemen resmi: IT, HR, FINANCE, MARKETING, OPERATIONAL.'
        },
        {
          id: 'rule-emp-email',
          columnName: 'Email Perusahaan',
          targetColumnName: 'email_perusahaan',
          dataType: 'email',
          isRequired: true,
          casing: 'lowercase',
          trimWhitespace: true,
          defaultValue: 'emp@company.com',
          description: 'Email corporate resmi @company.com.'
        },
        {
          id: 'rule-emp-status',
          columnName: 'Status Kerja',
          targetColumnName: 'status_kerja',
          dataType: 'enum',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          allowedValues: ['PERMANENT', 'CONTRACT', 'PROBATION'],
          defaultValue: 'CONTRACT',
          description: 'Status kerja enum: PERMANENT, CONTRACT, PROBATION.'
        }
      ]
    },
    rawCsv: `NIK_KARYAWAN,Nama Karyawan,Jabatan,Departemen,Email Perusahaan,Status Kerja
emp001,ANDI WIJAYA,Senior Software Engineer,it,andi.w@company.com,KONTRAK
EMP-002,BETA PRATAMA,Hr Specialist,HR,beta.pratama@gmail.com,Tetap
EMP-003,CHARLIE SIREGAR,head of finance,Keuangan,charlie.s@company.com,PERMANENT
EMP-003,CHARLIE SIREGAR,head of finance,Keuangan,charlie.s@company.com,PERMANENT
emp004,DINI ANGGRAENI,marketing manager,mkt,dini.a@company.com,Probation
EMP-005,EKO PURWANTO,,IT,eko.p@company.com,`
  },
  {
    id: 'transaksi-keuangan',
    title: 'Data Jurnal Transaksi Keuangan (Raw)',
    category: 'keuangan',
    description: 'Data mentah mutasi keuangan dengan tanggal acak, nilai nominal berformat campuran, dan status transaksi ambigu.',
    governanceDictionary: {
      id: 'gov-fin-v1',
      name: 'Standar Governance Laporan Keuangan (DG-FIN-2026)',
      description: 'Acuan Governance Keuangan: ID Transaksi TRX-YYYYMMDD-XXX, Nominal Positif, Status SETTLED/PENDING/FAILED.',
      nullStrategy: 'flag_anomaly',
      deduplicationKeys: ['id_transaksi'],
      rules: [
        {
          id: 'rule-trx-id',
          columnName: 'no_ref',
          targetColumnName: 'id_transaksi',
          dataType: 'string',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          defaultValue: 'TRX-UNKNOWN',
          description: 'No Referensi Transaksi UPPERCASE.'
        },
        {
          id: 'rule-trx-date',
          columnName: 'tanggal_trx',
          targetColumnName: 'tanggal_transaksi',
          dataType: 'date',
          isRequired: true,
          casing: 'none',
          trimWhitespace: true,
          defaultValue: '2026-01-01',
          description: 'Tanggal Transaksi ISO YYYY-MM-DD.'
        },
        {
          id: 'rule-trx-desc',
          columnName: 'keterangan_mutasi',
          targetColumnName: 'keterangan',
          dataType: 'string',
          isRequired: true,
          casing: 'titlecase',
          trimWhitespace: true,
          defaultValue: 'Transaksi Tanpa Keterangan',
          description: 'Deskripsi transaksi diseragamkan TitleCase.'
        },
        {
          id: 'rule-trx-amount',
          columnName: 'jumlah_nominal',
          targetColumnName: 'nominal_rupiah',
          dataType: 'currency',
          isRequired: true,
          casing: 'none',
          trimWhitespace: true,
          defaultValue: '0',
          description: 'Nominal bersih dalam angka integer.'
        },
        {
          id: 'rule-trx-status',
          columnName: 'st_trx',
          targetColumnName: 'status_transaksi',
          dataType: 'enum',
          isRequired: true,
          casing: 'uppercase',
          trimWhitespace: true,
          allowedValues: ['SETTLED', 'PENDING', 'FAILED'],
          defaultValue: 'PENDING',
          description: 'Status transaksi: SETTLED, PENDING, FAILED.'
        }
      ]
    },
    rawCsv: `no_ref,tanggal_trx,keterangan_mutasi,jumlah_nominal,st_trx
trx-20260801-001,01/08/2026,pembayaran tagihan listrik pln,Rp 1.500.000,sukses
TRX-20260801-002,2026-08-01,transfer antar bank ke bca,2500000,SETTLED
TRX-20260801-002,2026-08-01,transfer antar bank ke bca,2500000,SETTLED
trx-20260802-003,2 Aug 2026,pembelian inventaris kantor,Rp 4.750.000,00,pending
TRX-20260802-004,2026-08-02,pembayaran gaji karyawan,"125,000,000",berhasil
,2026-08-03,biaya administrasi bank,15000,gagal`
  }
];
