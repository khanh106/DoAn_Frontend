const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5126';

/**
 * Chuyển URI IPFS thành URL truy cập được trên trình duyệt.
 * - "/api/v1/ipfs/..." → backend proxy URL
 * - "ipfs://Qm..."    → public gateway
 * - "https://..."      → giữ nguyên
 */
export const resolveIpfsUrl = (uri: string): string => {
    if (!uri) return '';

    // Trường hợp 1: link proxy từ backend (bắt đầu bằng /api/)
    if (uri.startsWith('/api/')) {
        // Loại bỏ phần '/api' hoặc '/api/' ở cuối API_BASE (nếu có) để tránh bị trùng lặp
        const base = API_BASE.replace(/\/api\/?$/, '');
        return `${base}${uri}`;
    }


    // Trường hợp 2: ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
        const cid = uri.replace('ipfs://', '');
        return `https://ipfs.filebase.io/ipfs/${cid}`;
    }

    // Trường hợp 3: đã là full URL
    return uri;
};

export const uploadToIPFS = async (file: File): Promise<string> => {
    console.log("Tải file lên IPFS:", file.name);
    return `ipfs://QmDemoHash${Date.now()}`;
};
