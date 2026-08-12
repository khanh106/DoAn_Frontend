import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBaseLayout } from './AppBaseLayout';

export const FarmerLayout: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkDevice = () => {
            // Phát hiện thiết bị di động dựa trên kích thước màn hình hoặc User Agent
            const isMobileDevice = window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
            if (isMobileDevice) {
                // Tự động chuyển sang trang di động chuyên biệt
                navigate('/farmer/mobile', { replace: true });
            }
        };

        // Chạy kiểm tra ngay khi load layout
        checkDevice();

        // Lắng nghe sự kiện đổi kích thước trình duyệt (ví dụ khi bật/tắt F12 Mobile View)
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [navigate]);

    return <AppBaseLayout role="FARMER" portalTitle="PORTAL NÔNG DÂN & CÔNG NHÂN" />;
};
