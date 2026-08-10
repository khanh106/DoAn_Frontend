// src/config/tokens.ts
export const themeColors = {
    // Thương hiệu FruitChain
    primary: '#16a34a',       // Xanh lá primary logo FruitChain
    primaryDark: '#15803d',   // Xanh lá đậm (Sidebar item Active / Header Logo)
    primaryLight: '#dcfce7',  // Nền xanh lá nhạt
    orangeBrand: '#f97316',   // Cam ruột quả cam & chữ "Chain"

    // Cấu trúc Bảng Dữ liệu chuẩn 7 ảnh chụp thực tế
    tableHeaderBg: '#F1F0FE', // Tím nhạt đặc trưng 100% của Header Bảng trong admin.png, hợp tác xã.png
    tableRowHover: '#f8fafc',
    appBackground: '#F4F5FA', // Nền xám tím nhạt toàn bộ Dashboard
    border: '#e2e8f0',

    // Nút bấm hành động (3 nhóm màu chuẩn giao diện)
    buttons: {
        green: '#15803d',       // Nút chính: [Thêm tài khoản], [Ghi nhật ký], [Nhập kho], [Xác nhận nhận hàng]
        orange: '#f97316',      // Nút cảnh báo: [Duyệt nhanh], [Thu hoạch], [Xuất kho], [READY FOR SALE]
        grey: '#64748b',        // Nút phụ: [Xuất file], [Lịch sử], [Hủy]
    },

    // Thẻ Trạng Thái (Badges) - Hỗ trợ cả Key Tiếng Việt và Key Enum Backend
    statusBadges: {
        // User Status Enums
        APPROVED: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
        PENDING: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
        REJECTED: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
        LOCKED: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },

        // Batch Stage Enums
        STAGE_PLANTING: { bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' },
        STAGE_HARVESTED: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
        STAGE_RECEIVED: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
        STAGE_PROCESSED: { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
        STAGE_SORTED: { bg: '#fae8ff', text: '#86198f', border: '#f5d0fe' },
        INSPECTION_PASSED: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
        PACKAGED: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
        STAGE_SHIPPING: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
        RECEIVED_AT_RETAILER: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
        READY_FOR_SALE: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },

        // Legacy / Vietnamese aliases
        daDuyet: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
        dangXuLy: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
        daHuy: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
        canBoSung: { bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' },
        hetHan: { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
        tamKhoa: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    }
};
