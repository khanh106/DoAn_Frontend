/**
 * Tiện ích lấy URL truy xuất nguồn gốc công khai (Public Traceability URL)
 * Cho phép cấu hình qua biến môi trường để khi quét QR trên điện thoại
 * sẽ tự động trỏ đến địa chỉ VPS / Domain công khai thay vì localhost.
 */

export const getPublicTraceBaseUrl = (): string => {
    // 1. Ưu tiên cấu hình biến môi trường VITE_PUBLIC_TRACE_URL (ví dụ: http://103.x.x.x:5173/trace hoặc https://mydomain.com/trace)
    const envTraceUrl = import.meta.env.VITE_PUBLIC_TRACE_URL;
    if (envTraceUrl && typeof envTraceUrl === 'string' && envTraceUrl.trim()) {
        return envTraceUrl.trim().replace(/\/+$/, '');
    }

    // 2. Nếu có VITE_APP_URL
    const envAppUrl = import.meta.env.VITE_APP_URL;
    if (envAppUrl && typeof envAppUrl === 'string' && envAppUrl.trim()) {
        return `${envAppUrl.trim().replace(/\/+$/, '')}/trace`;
    }

    // 3. Fallback theo window.location.origin
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/trace`;
    }

    return 'http://localhost:5173/trace';
};

/**
 * Trả về URL hoàn chỉnh cho mã lô/kiện hàng để render mã QR Code
 */
export const getPublicTraceUrl = (code: string): string => {
    const base = getPublicTraceBaseUrl();
    if (!code || !code.trim()) return base;
    return `${base}/${encodeURIComponent(code.trim())}`;
};
