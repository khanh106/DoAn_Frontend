// src/components/layout/AppSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Package,
    QrCode,
    Truck,
    MapPin,
    Calendar,
    FileText,
    CheckCircle,
    BookOpen,
    ShoppingBag,
    BarChart2,
    Sliders,
} from 'lucide-react';
import type { UserRole } from '../../types';

interface SidebarMenuItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

interface AppSidebarProps {
    role?: UserRole;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ role = 'ADMIN' }) => {
    const menuConfig: Record<UserRole, SidebarMenuItem[]> = {
        ADMIN: [
            { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin/dashboard' },
            { icon: Users, label: 'Quản lý tài khoản', path: '/admin/users' },
            { icon: Sliders, label: 'Phân quyền Role', path: '/admin/roles' },
            { icon: Package, label: 'Blockchain Smart Contract', path: '/admin/smart-contract' },
            { icon: BarChart2, label: 'Giám sát Giao dịch', path: '/admin/transactions' },
            { icon: FileText, label: 'Nhật ký Hệ thống', path: '/admin/logs' },
        ],
        COOPERATIVE: [
            { icon: LayoutDashboard, label: 'Tổng quan', path: '/cooperative/dashboard' },
            { icon: MapPin, label: 'Quản lý Vùng trồng', path: '/cooperative/farms' },
            { icon: Package, label: 'Quản lý Kho', path: '/cooperative/inventory' },
            { icon: BarChart2, label: 'Quy trình sản xuất', path: '/cooperative/process' },
            { icon: Calendar, label: 'Lập kế hoạch', path: '/cooperative/plan' },
            { icon: FileText, label: 'Nhật ký sản xuất', path: '/cooperative/logs' },
            { icon: QrCode, label: 'Mã QR & Vận chuyển', path: '/cooperative/shipment' },
        ],
        FARMER: [
            { icon: LayoutDashboard, label: 'Tổng quan', path: '/farmer/dashboard' },
            { icon: Calendar, label: 'Lô phân công', path: '/farmer/batches' },
            { icon: FileText, label: 'Nhật ký canh tác', path: '/farmer/logs' },
            { icon: BarChart2, label: 'Tiến độ công việc', path: '/farmer/progress' },
            { icon: CheckCircle, label: 'Xác nhận thu hoạch', path: '/farmer/harvest' },
            { icon: BookOpen, label: 'Hướng dẫn quy trình', path: '/farmer/guides' },
        ],
        PROCESSOR: [
            { icon: LayoutDashboard, label: 'Tổng quan', path: '/processor/dashboard' },
            { icon: Package, label: 'Nhập kho nguyên liệu', path: '/processor/inbound' },
            { icon: BarChart2, label: 'Dây chuyền chế biến', path: '/processor/processing' },
            { icon: CheckCircle, label: 'Kiểm định chất lượng', path: '/processor/inspection' },
            { icon: QrCode, label: 'Đóng gói & Tem QR', path: '/processor/packaging' },
        ],
        RETAILER: [
            { icon: LayoutDashboard, label: 'Tổng quan', path: '/retailer/dashboard' },
            { icon: Truck, label: 'Tiếp nhận lô hàng', path: '/retailer/shipments' },
            { icon: CheckCircle, label: 'Kiểm tra chất lượng', path: '/retailer/qa' },
            { icon: ShoppingBag, label: 'Kệ hàng / Bán lẻ', path: '/retailer/shelves' },
            { icon: QrCode, label: 'Mã QR sản phẩm', path: '/retailer/qr-codes' },
            { icon: BarChart2, label: 'Báo cáo bán hàng', path: '/retailer/reports' },
        ],
        GUEST: [],
    };

    const currentMenuItems = menuConfig[role] || menuConfig.ADMIN;

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 flex flex-col justify-between p-3 select-none">
            <nav className="space-y-1">
                {currentMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs md:text-sm transition-all duration-150 ${isActive
                                    ? 'bg-[#15803d] text-white font-bold shadow-md shadow-green-700/20'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};
