export const categories = [
  { id: 'popular', label: 'Populer' },
  { id: 'health', label: 'Kesehatan' },
  { id: 'education', label: 'Pendidikan' },
  { id: 'transport', label: 'Transportasi' }
];

export const servicesByCategory = [
  {
    category: 'health',
    title: 'Kesehatan & Kesejahteraan',
    services: [
      {
        id: 'bpjs',
        title: 'Pendaftaran BPJS',
        description: 'Akses layanan jaminan kesehatan nasional.',
        icon: 'shield'
      },
      {
        id: 'imunisasi',
        title: 'Jadwal Imunisasi',
        description: 'Informasi dan pendaftaran imunisasi anak.',
        icon: 'activity'
      }
    ]
  },
  {
    category: 'population',
    title: 'Administrasi Kependudukan',
    services: [
      {
        id: 'ktp',
        title: 'Pembuatan KTP Elektronik',
        description: 'Pendaftaran kartu tanda penduduk baru.',
        icon: 'id-card'
      },
      {
        id: 'kk',
        title: 'Pendaftaran Kartu Keluarga',
        description: 'Pengurusan kartu keluarga baru atau perubahan.',
        icon: 'users'
      },
      {
        id: 'akta',
        title: 'Akta Kelahiran',
        description: 'Permohonan pembuatan akta kelahiran.',
        icon: 'smile'
      }
    ]
  },
  {
    category: 'transport',
    title: 'Transportasi',
    services: [
      {
        id: 'sim',
        title: 'Perpanjangan SIM',
        description: 'Layanan perpanjangan surat izin mengemudi.',
        icon: 'credit-card'
      }
    ]
  }
];
