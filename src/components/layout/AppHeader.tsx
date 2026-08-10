import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Shield, Leaf } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface AppHeaderProps {
    portalTitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    portalTitle = 'HỆ THỐNG QUẢN TRỊ NGUỒN GỐC BLOCKCHAIN',
}) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Quản Trị - System Admin';
            case 'FARMER':
                return 'Nông Dân / Nhà Vườn';
            case 'PROCESSOR':
            case 'COOPERATIVE':
                return 'HTX / Nhà Máy Chế Biến';
            case 'RETAILER':
                return 'Siêu Thị / Cửa Hàng';
            default:
                return 'Người Dùng System';
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-4">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate('/trace')}
                >
                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                        <Leaf className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-slate-900">
                        OM<span className="text-emerald-600">FARM</span>
                    </span>
                </div>

                <span className="text-slate-300 font-light text-2xl">|</span>

                <h1 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {portalTitle}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="text-left hidden sm:block">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900">{user?.fullName || 'Tài khoản'}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{getRoleLabel(user?.role)}</p>
                        </div>
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs">
                            <div className="px-4 py-2.5 border-b border-slate-100">
                                <p className="font-bold text-slate-900 truncate">{user?.fullName}</p>
                                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">
                                    {user?.role}
                                </span>
                            </div>

                            <div className="py-1">
                                <div className="px-4 py-2 text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    <span>Trạng thái: <strong className="text-emerald-600">{user?.status || 'APPROVED'}</strong></span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Đăng xuất tài khoản</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs font-bold text-slate-700">
                    <span className="w-5 h-3.5 bg-red-600 flex items-center justify-center rounded-xs overflow-hidden relative">
                        <span className="text-yellow-400 text-[10px] leading-none">★</span>
                    </span>
                    <span>VIE</span>
                </div>

                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                    <Bell className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};
