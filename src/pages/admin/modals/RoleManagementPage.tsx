import React, { useState, useEffect, useCallback } from 'react';
import { AppTable, type Column } from '../../../components/ui/AppTable';
import { AppBadge } from '../../../components/ui/AppBadge';
import { AppButton } from '../../../components/ui/AppButton';
import { apiClient } from '../../../services/api';

import {
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    UserCog,
    Users,
    CheckCircle,
} from 'lucide-react';
import { ChangeRoleModal, type UserAccountResponse } from './ChangeRoleModal';


export const RoleManagementPage: React.FC = () => {
    const [users, setUsers] = useState<UserAccountResponse[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserAccountResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Modal State
    const [selectedUser, setSelectedUser] = useState<UserAccountResponse | null>(null);
    const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);

    // Lấy danh sách tài khoản
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<UserAccountResponse[]>('/v1/users');
            setUsers(response.data);
        } catch (err: any) {
            console.error('Lỗi lấy danh sách tài khoản:', err);
            setError(err.response?.data?.message || 'Không thể lấy danh sách người dùng.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    // Lọc theo tìm kiếm & Role
    useEffect(() => {
        let result = users;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (u) =>
                    u.fullName.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    u.phone.includes(query)
            );
        }

        if (roleFilter !== 'ALL') {
            result = result.filter((u) => u.role === roleFilter);
        }

        setFilteredUsers(result);
    }, [users, searchQuery, roleFilter]);

    // Thống kê số lượng từng Role
    const countAdmin = users.filter((u) => u.role === 'ADMIN').length;
    const countFarmer = users.filter((u) => u.role === 'FARMER').length;
    const countProcessor = users.filter((u) => u.role === 'PROCESSOR').length;
    const countRetailer = users.filter((u) => u.role === 'RETAILER').length;

    const columns: Column<UserAccountResponse>[] = [
        {
            header: 'Họ và tên',
            key: 'fullName',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{item.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {item.id.substring(0, 8)}...</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Email / SĐT',
            key: 'email',
            render: (item) => (
                <div>
                    <p className="font-medium text-slate-800">{item.email}</p>
                    <p className="text-xs text-slate-500 font-mono">{item.phone}</p>
                </div>
            ),
        },
        {
            header: 'Vai trò (Role) hiện tại',
            key: 'role',
            render: (item) => {
                const isSystemAdmin = item.email.toLowerCase() === 'admin@gmail.com';
                return (
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${item.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : item.role === 'FARMER'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : item.role === 'PROCESSOR'
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                            {item.role}
                        </span>
                        {isSystemAdmin && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                                ADMIN TỐI CAO
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Trạng thái',
            key: 'status',
            render: (item) => {
                const statusMap: Record<string, { label: string; status: string }> = {
                    APPROVED: { label: 'Đã duyệt', status: 'DA_DUYET' },
                    PENDING: { label: 'Chờ duyệt', status: 'PENDING' },
                    LOCKED: { label: 'Bị khóa', status: 'DA_HUY' },
                };
                const config = statusMap[item.status] || { label: item.status, status: 'DEFAULT' };
                return <AppBadge status={config.status} label={config.label} />;
            },
        },
        {
            header: 'Hành động Phân quyền',
            key: 'actions',
            align: 'center',
            render: (item) => {
                const isSystemAdmin = item.email.toLowerCase() === 'admin@gmail.com';
                return (
                    <button
                        onClick={() => {
                            setSelectedUser(item);
                            setIsChangeRoleModalOpen(true);
                        }}
                        disabled={isSystemAdmin}
                        className={`px-3.5 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${isSystemAdmin
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                    >
                        <UserCog className="w-4 h-4" />
                        {isSystemAdmin ? 'Role Cố định' : 'Phân quyền Role'}
                    </button>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* HEADER TIÊU ĐỀ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Quản lý Phân quyền Role Hệ thống</h2>
                    <p className="text-xs text-slate-500">Cấp phát và điều chỉnh vai trò hoạt động cho các tài khoản trong hệ thống FruitChain</p>
                </div>
                <AppButton
                    variant="grey"
                    leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                    onClick={fetchUsers}
                >
                    Làm mới dữ liệu
                </AppButton>
            </div>

            {/* CẢNH BÁO QUY TẮC RÀNG BUỘC PHÂN QUYỀN */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                    <p className="font-bold text-sm">Chính sách Phân quyền An toàn (Role Access Policy):</p>
                    <p>1. <strong>Tài khoản Quản trị tối cao (`admin@gmail.com`)</strong>: Độc quyền sở hữu vai trò <span className="font-bold text-red-700">ADMIN</span>. Không tài khoản nào khác được phép gán role ADMIN.</p>
                    <p>2. <strong>Người dùng hệ thống</strong>: Được phân quyền linh hoạt giữa 3 vai trò: <span className="font-bold text-emerald-700">FARMER (Nông dân)</span>, <span className="font-bold text-purple-700">PROCESSOR (HTX / Chế biến)</span>, và <span className="font-bold text-blue-700">RETAILER (Nhà bán lẻ)</span>.</p>
                </div>
            </div>

            {/* THỐNG KÊ SỐ LƯỢNG TÀI KHOẢN THEO ROLE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-500">QUẢN TRỊ VIÊN (ADMIN)</p>
                    <p className="text-2xl font-black text-red-600 mt-1">{countAdmin}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-500">NÔNG DÂN (FARMER)</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{countFarmer}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-500">CHẾ BIẾN / HTX (PROCESSOR)</p>
                    <p className="text-2xl font-black text-purple-600 mt-1">{countProcessor}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-500">BÁN LẺ (RETAILER)</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{countRetailer}</p>
                </div>
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên, Email, SĐT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-600">Lọc theo Role:</span>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                        <option value="ALL">Tất cả Vai trò</option>
                        <option value="FARMER">FARMER (Nông dân)</option>
                        <option value="PROCESSOR">PROCESSOR (HTX / Chế biến)</option>
                        <option value="RETAILER">RETAILER (Nhà bán lẻ)</option>
                        <option value="ADMIN">ADMIN (Quản trị)</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {/* BẢNG PHÂN QUYỀN */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium text-xs">
                    Đang tải danh sách tài khoản phân quyền...
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-medium text-xs">
                    Không tìm thấy tài khoản nào khớp với bộ lọc.
                </div>
            ) : (
                <AppTable columns={columns} data={filteredUsers} showSTT={true} />
            )}

            {/* MODAL PHÂN QUYỀN ROLE */}
            <ChangeRoleModal
                isOpen={isChangeRoleModalOpen}
                user={selectedUser}
                onClose={() => {
                    setIsChangeRoleModalOpen(false);
                    setSelectedUser(null);
                }}
                onSuccess={fetchUsers}
            />
        </div>
    );
};

export default RoleManagementPage;
