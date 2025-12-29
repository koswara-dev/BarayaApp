import { Service } from "../types/service";

export type RootStackParamList = {
    Splash: undefined;
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    Main: undefined;
    AdminMain: undefined;
    ServiceDetail: { service: any };
    Notifikasi: undefined;
    NotificationDetail: { id: string };
    MapEmergency: { onLocationSelect: (loc: any) => void };
    ProfileDetail: undefined;
    OtpVerification: { email: string };
    Berita: undefined;
    RegisterForm: { formData: any };
    ForgotPassword: undefined;
    ServiceHistory: undefined;
    ComplaintHistory: undefined;
    Pengaturan: undefined;
    EventList: undefined;
    DinasList: undefined;
    CreateEvent: undefined;
    CreateDinas: undefined;
    CreateLayanan: undefined;
    CreatePengaduan: undefined;
    PengaduanList: undefined;
    PengaduanDetail: { item: any; id?: string | number };
    AdminPengaduanList: undefined;
    AdminPengaduanDetail: { item: any };
    EmergencyDetail: { report: any };
    EventDetail: { event: any };
};

export type BottomTabParamList = {
    Beranda: undefined;
    Layanan: undefined;
    Darurat: undefined;
    Berita: undefined;
    Profil: undefined;
};