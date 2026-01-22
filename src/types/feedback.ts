export interface Feedback {
    id: number;
    rating: number;
    ulasan: string;
    userId: number;
    userName: string;
    urlFoto: string | null;
    layananId: number;
    layananNama: string;
    dinasId: number;
    dinasNama: string;
    status: string;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FeedbackResponse {
    content: Feedback[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}
