export const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
