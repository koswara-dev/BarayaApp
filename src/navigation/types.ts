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
    MapEmergency: { onLocationSelect: (loc: any) => void };
    ProfileDetail: undefined;
    OtpVerification: { email: string };
    RegisterForm: { formData: any };
    ForgotPassword: undefined;
    ServiceHistory: undefined;
    ComplaintHistory: undefined;
};

export type BottomTabParamList = {
    Beranda: undefined;
    Layanan: undefined;
    Darurat: undefined;
    Berita: undefined;
    Profil: undefined;
};