// src/components/ui/AppBadge.tsx
import React from 'react';

export type StatusType =
    | 'DA_DUYET'
    | 'DANG_XU_LY'
    | 'DA_HUY'
    | 'CAN_BO_SUNG'
    | 'HET_HAN'
    | 'TAM_KHOA'
    | 'READY_FOR_SALE'
    | 'IN_TRANSIT';

interface AppBadgeProps {
    status: StatusType | string;
    label?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({ status, label }) => {
    const getBadgeStyle = () => {
        switch (status) {
            case 'DA_DUYET':
            case 'READY_FOR_SALE':
                return 'bg-[#dcfce7] text-[#15803d] border-[#86efac]';
            case 'DANG_XU_LY':
            case 'IN_TRANSIT':
            case 'PENDING':
                return 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]';
            case 'DA_HUY':
            case 'HUY':
                return 'bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]';
            case 'CAN_BO_SUNG':
            case 'CAP_NHAT':
                return 'bg-[#e0f2fe] text-[#0284c7] border-[#7dd3fc]';
            case 'HET_HAN':
                return 'bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]';
            default:
                return 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]';
        }
    };

    return (
        <span className={`px-3 py-1 rounded-md text-xs font-bold border inline-block text-center ${getBadgeStyle()}`}>
            {label || status}
        </span>
    );
};
