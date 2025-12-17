import { Service } from "../types/service";

export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Register: undefined;
    Main: undefined;
    ServiceDetail: { service: any };
    Notifikasi: undefined;
    MapEmergency: { onLocationSelect: (loc: any) => void };
};

export type BottomTabParamList = {
    Beranda: undefined;
    Layanan: undefined;
    Darurat: undefined;
    Profil: undefined;
};