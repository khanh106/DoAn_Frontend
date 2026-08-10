// src/components/layout/AppHeader.tsx
import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

interface AppHeaderProps {
    portalTitle?: string;
    userName?: string;
    userRole?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    portalTitle = 'HỆ THỐNG QUẢN TRỊ NGUỒN GỐC BLOCKCHAIN',
    userName = 'Nguyễn Văn A',
    userRole = 'Quản Trị - System Admin',
}) => {
    return (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            {/* Bên trái: Logo FruitChain chuẩn ảnh + Tiêu đề Portal */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 cursor-pointer">
                    {/* SVG Logo Quả Cam 2 Màu (Xanh lá & Vàng cam) */}
                    <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none">
                        <path d="M50 10 C25 10 10 30 10 55 C10 80 30 95 55 95 C80 95 95 75 95 50 C95 25 75 10 50 10 Z" fill="#16a34a" />
                        <path d="M50 25 C65 25 80 35 80 50 C80 65 65 80 50 80 Z" fill="#f97316" />
                        <circle cx="35" cy="40" r="4" fill="#ffffff" />
                        <path d="M45 15 Q60 5 75 15 Q60 25 45 15 Z" fill="#15803d" />
                    </svg>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                        Fruit<span className="text-[#f97316]">Chain</span>
                    </span>
                </div>

                <span className="text-slate-300 font-light text-2xl">|</span>

                <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {portalTitle}
                </h1>
            </div>

            {/* Bên phải: Avatar User + Cờ Việt Nam + Thông báo */}
            <div className="flex items-center gap-4">
                {/* User Card */}
                <div className="flex items-center gap-2.5">
                    <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
                        alt="User Avatar"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200"
                    />
                    <div className="text-left">
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900">{userName}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{userRole}</p>
                    </div>
                </div>

                {/* Cờ Việt Nam + VIE Selector */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                    <span className="w-5 h-3.5 bg-red-600 flex items-center justify-center rounded-xs overflow-hidden relative">
                        <span className="text-yellow-400 text-[10px] leading-none">★</span>
                    </span>
                    <span>VIE</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>

                {/* Notification Bell */}
                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                    <Bell className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};
