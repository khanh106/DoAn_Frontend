/**
 * Resolve đường dẫn ảnh trả về từ backend (VD: "/uploads/avatars/abc.png")
 * thành URL đầy đủ trỏ về backend host.
 *
 * Lý do cần helper này:
 * - Backend lưu URL relative trong DB (VD: "/uploads/avatars/abc.png")
 * - Frontend chạy ở Vite (port 5173) nhưng ảnh thực sự nằm trên backend (port 5126)
 * - Nếu gắn `<img src="/uploads/avatars/abc.png">` thì browser sẽ gọi 5173 → 404
 * - Phải ghép với API base URL (bỏ phần "/api") để ra URL đầy đủ
 *
 * Hỗ trợ cả 2 trường hợp:
 * - URL đã là absolute (http://..., https://..., data:...) → trả về nguyên
 * - URL relative ("/uploads/...") → ghép với base URL của backend
 * - URL null/undefined/rỗng → trả về rỗng để caller xử lý
 */
export const resolveAssetUrl = (path?: string | null): string => {
    if (!path) return '';

    // Đã là absolute URL (http, https, data:) hoặc blob: → giữ nguyên
    if (/^(https?:|data:|blob:)/i.test(path)) return path;

    // Lấy API base URL từ env, bỏ phần "/api" ở cuối
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendBase = apiBase.replace(/\/api\/?$/, '');

    // Đảm bảo path bắt đầu bằng "/"
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${backendBase}${normalizedPath}`;
};
