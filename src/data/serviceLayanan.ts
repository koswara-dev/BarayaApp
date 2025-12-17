export const CATEGORIES = [
  { id: 'popular', label: 'Populer' },
  { id: 'kesehatan', label: 'Kesehatan' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'transportasi', label: 'Transportasi' },
];

export const SECTIONS = [
  {
    id: 'kesehatan',
    title: 'Kesehatan & Kesejahteraan',
    data: [
      {
        id: 'bpjs',
        title: 'Pendaftaran BPJS',
        desc: 'Akses layanan jaminan kesehatan nasional.',
        icon: 'shield-checkmark',
      },
      {
        id: 'imunisasi',
        title: 'Jadwal Imunisasi',
        desc: 'Informasi dan pendaftaran imunisasi anak.',
        icon: 'medical',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administrasi Kependudukan',
    data: [
      {
        id: 'ktp',
        title: 'Pembuatan KTP Elektronik',
        desc: 'Pendaftaran kartu tanda penduduk baru.',
        icon: 'card',
      },
      {
        id: 'kk',
        title: 'Pendaftaran Kartu Keluarga',
        desc: 'Pengurusan kartu keluarga baru atau perubahan.',
        icon: 'people',
      },
      {
        id: 'akta',
        title: 'Akta Kelahiran',
        desc: 'Permohonan pembuatan akta kelahiran.',
        icon: 'happy',
      },
    ],
  },
  {
    id: 'transportasi',
    title: 'Transportasi',
    data: [
      {
        id: 'sim',
        title: 'Perpanjangan SIM',
        desc: 'Layanan perpanjangan surat izin mengemudi.',
        icon: 'car',
      },
    ],
  },
];
