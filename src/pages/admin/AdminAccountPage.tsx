import React, { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { apiClient } from '../../services/api';
import { Plus, Download, RefreshCw, CheckCircle, Lock } from 'lucide-react';

export interface UserAccountResponse {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    walletAddress?: string;
    status: string;
    createdAt?: string;
}

export const AdminAccountPage: React.FC = () => {
    const [users, setUsers] = useState<UserAccountResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<UserAccountResponse[]>('/v1/users/pending');
            setUsers(response.data);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải danh sách người dùng:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể tải danh sách tài khoản từ Backend API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initFetch = async () => {
            await fetchUsers();
        };
        void initFetch();
    }, [fetchUsers]);

    const handleApprove = async (id: string, action: 'APPROVE' | 'REJECT') => {
        setActionLoading(id);
        try {
            await apiClient.put(`/v1/users/${id}/approve`, { action });
            fetchUsers();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(errorObj.response?.data?.message || 'Thao tác duyệt thất bại!');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLock = async (id: string, lock: boolean) => {
        setActionLoading(id);
        try {
            await apiClient.put(`/v1/users/${id}/lock`, { lock });
            fetchUsers();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(errorObj.response?.data?.message || 'Thao tác khóa thất bại!');
        } finally {
            setActionLoading(null);
        }
    };

    const columns: Column<UserAccountResponse>[] = [
        {
            header: 'Họ và tên',
            key: 'fullName',
            render: (item) => (
                <div>
                    <p className="font-bold text-slate-900">{item.fullName}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                </div>
            ),
        },
        { header: 'Số điện thoại', key: 'phone' },
        { header: 'Vai trò (Role)', key: 'role' },
        {
            header: 'Ví Blockchain',
            key: 'walletAddress',
            render: (item) => (
                <span className="font-mono text-xs font-semibold text-slate-600">
                    {item.walletAddress ? `${item.walletAddress.slice(0, 6)}...${item.walletAddress.slice(-4)}` : 'Chưa liên kết'}
                </span>
            ),
        },
        {
            header: 'Trạng thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status} label={item.status} />,
        },
        {
            header: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleApprove(item.id, 'APPROVE')}
                        disabled={actionLoading === item.id}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Duyệt</span>
                    </button>
                    <button
                        onClick={() => handleLock(item.id, true)}
                        disabled={actionLoading === item.id}
                        className="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Khóa</span>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Quản lý Tài khoản Hệ thống</h2>
                    <p className="text-xs text-slate-500">Đồng bộ dữ liệu thực tế từ Backend API (`/api/v1/users`)</p>
                </div>
                <div className="flex gap-3">
                    <AppButton
                        variant="grey"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        onClick={fetchUsers}
                    >
                        Làm mới
                    </AppButton>
                    <AppButton variant="grey" leftIcon={<Download className="w-4 h-4" />}>
                        Xuất file
                    </AppButton>
                    <AppButton variant="green" leftIcon={<Plus className="w-4 h-4" />}>
                        Thêm tài khoản
                    </AppButton>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
                    Đang kết nối Backend API và tải danh sách tài khoản...
                </div>
            ) : (
                <AppTable columns={columns} data={users} />
            )}
        </div>
    );
};
