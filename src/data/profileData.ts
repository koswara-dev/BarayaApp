export interface MenuItem {
    id: string;
    icon: string;
    title: string;
    iconColor: string;
    iconBg: string;
}

export interface UserProfile {
    name: string;
    email: string;
    avatar: any; // require() image path
}

export const userData: UserProfile = {
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    avatar: { uri: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=0D8ABC&color=fff' }, // Temporary placeholder
};

export const menuSection1: MenuItem[] = [
    {
        id: '1',
        icon: 'clockcircleo',
        title: 'Riwayat Pengajuan',
        iconColor: '#3B82F6',
        iconBg: '#EFF6FF',
    },
    {
        id: '2',
        icon: 'idcard',
        title: 'Dokumen Saya',
        iconColor: '#1D4ED8',
        iconBg: '#DBEAFE',
    },
];

export const menuSection2: MenuItem[] = [
    {
        id: '3',
        icon: 'setting',
        title: 'Pengaturan',
        iconColor: '#64748B',
        iconBg: '#F1F5F9',
    },
    {
        id: '4',
        icon: 'questioncircleo',
        title: 'Pusat Bantuan',
        iconColor: '#64748B',
        iconBg: '#F1F5F9',
    },
    {
        id: '5',
        icon: 'infocirlceo',
        title: 'Tentang Aplikasi',
        iconColor: '#64748B',
        iconBg: '#F1F5F9',
    },
];