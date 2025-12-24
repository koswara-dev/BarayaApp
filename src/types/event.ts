export interface Event {
    id: number;
    judul: string;
    deskripsi: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    lokasi: string;
    latitude: number;
    longitude: number;
    urlGambar: string | null;
    dinasId: number;
    dinasNama: string;
    createdAt: string;
    updatedAt: string;
}

export interface EventCreatePayload {
    judul: string;
    deskripsi: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    lokasi: string;
    latitude: number | null;
    longitude: number | null;
    dinasId: number;
    urlGambar?: string | null;
}

export interface EventUpdatePayload extends Partial<EventCreatePayload> {
    id: number;
}
