
export interface AnalisisAI {
    id: number;
    kategori: 'FEEDBACK' | 'DARURAT' | 'PENGADUAN';
    hasilAnalisis: string;
    createdAt: string;
}

export interface AnalisisAIResponse {
    content: AnalisisAI[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    }
}
