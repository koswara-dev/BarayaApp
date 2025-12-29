export interface Service {
    id: number;
    nama: string;
    nama_layanan?: string; // Some API responses might use this
    ikon?: string;         // Some API responses might use this
    urlGambar?: string;    // Some API responses might use this
    deskripsi: string;
    estimasiWaktu: number;
    phoneNumber: string;
    email: string;
    dinasId: number;
    dinasNama: string;
    kategori?: {
        id: number;
        nama: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Feedback {
    id: number;
    rating: number;
    ulasan: string;
    userId: number;
    userName: string;
    urlFoto: string;
    layananId: number;
    layananNama: string;
    dinasId: number;
    dinasNama: string;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceResponse {
    success: boolean;
    message: string;
    data: {
        content: Service[];
        page: {
            size: number;
            number: number;
            totalElements: number;
            totalPages: number;
        };
    };
}

export interface FeedbackResponse {
    success: boolean;
    message: string;
    data: {
        content: Feedback[];
        page: {
            size: number;
            number: number;
            totalElements: number;
            totalPages: number;
        };
    };
}
