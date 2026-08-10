import React, { useState, useEffect, useCallback } from 'react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppTabs, type TabItem } from '../../components/ui/AppTabs';
import { Pagination } from '../../components/ui/Pagination';
import { apiClient } from '../../services/api';
import {
    Plus,
    Download,
    RefreshCw,
    CheckCircle,
    Copy,
    Check,
    Search,
    MoreHorizontal,
    Shield,
    Lock,
    UserCog,
} from 'lucide-react';

// Modals
import { AddUserModal } from './modals/AddUserModal';
import { ApproveUserModal } from './modals/ApproveUserModal';
import { LockUserModal } from './modals/LockUserModal';
import { BlockchainWhitelistModal } from './modals/BlockchainWhitelistModal';
import { ChangeRoleModal } from './modals/ChangeRoleModal';
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

export const AccountManagementPage: React.FC = () => {
    const [users, setUsers] = useState<UserAccountResponse[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserAccountResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Clipboard Copy feedback
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Modal Control State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserAccountResponse | null>(null);
    const [activeModal, setActiveModal] = useState<'APPROVE' | 'LOCK' | 'WHITELIST' | 'ROLE' | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // KẾT NỐI API LẤY USER THỰC TẾ
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let response;
            try {
                response = await apiClient.get<UserAccountResponse[]>('/v1/users');
            } catch {
                response = await apiClient.get<UserAccountResponse[]>('/v1/users/pending');
            }
            setUsers(response.data);
        } catch (err: any) {
            console.error('Lỗi kết nối Backend API:', err);
            setError(err.response?.data?.message || 'Không thể lấy danh sách người dùng từ Backend API.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    // Lọc dữ liệu theo Tab, Tìm kiếm và Role
    useEffect(() => {
        let result = users;

        if (activeTab === 'pending') {
            result = result.filter((u) => u.status === 'PENDING');
        } else if (activeTab === 'active') {
            result = result.filter((u) => u.status === 'APPROVED');
        } else if (activeTab === 'locked') {
            result = result.filter((u) => u.status === 'LOCKED');
        } else if (activeTab === 'whitelist') {
            result = result.filter((u) => Boolean(u.walletAddress));
        }

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
        setCurrentPage(1);
    }, [users, activeTab, searchQuery, roleFilter]);

    const handleCopyWallet = (address: string, index: number) => {
        navigator.clipboard.writeText(address);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Duyệt nhanh danh sách tài khoản PENDING
    const handleBatchApprove = async () => {
        const pendingUsers = users.filter((u) => u.status === 'PENDING');
        if (pendingUsers.length === 0) {
            alert('Không có tài khoản nào đang chờ duyệt!');
            return;
        }
        if (!window.confirm(`Bạn có chắc chắn muốn duyệt nhanh ${pendingUsers.length} tài khoản đang chờ duyệt?`)) {
            return;
        }
        setLoading(true);
        try {
            await Promise.all(
                pendingUsers.map((u) => apiClient.put(`/v1/users/${u.id}/approve`, { action: 'APPROVE' }))
            );
            alert(`Đã duyệt nhanh thành công ${pendingUsers.length} tài khoản!`);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt nhanh danh sách tài khoản.');
            fetchUsers();
        } finally {
            setLoading(false);
        }
    };

    const pendingCount = users.filter((u) => u.status === 'PENDING').length;

    const tabs: TabItem[] = [
        { id: 'all', label: 'Tất cả tài khoản' },
        { id: 'pending', label: 'Tài khoản Chờ duyệt', count: pendingCount },
        { id: 'active', label: 'Tài khoản Hoạt động' },
        { id: 'locked', label: 'Bị khóa' },
        { id: 'whitelist', label: 'Whitelist Blockchain' },
    ];
    // Hàm Xuất danh sách tài khoản ra file CSV (Chuẩn UTF-8 mở đẹp trên Excel)
    const handleExportCSV = () => {
        if (filteredUsers.length === 0) {
            alert('Không có dữ liệu tài khoản nào để xuất file!');
            return;
        }

        // Tiêu đề các cột trong file CSV
        const headers = [
            'STT',
            'ID Tài khoản',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Vai trò (Role)',
            'Địa chỉ ví Blockchain',
            'Trạng thái',
            'Ngày tạo'
        ];

        // Dữ liệu dòng
        const rows = filteredUsers.map((u, index) => [
            index + 1,
            `"${u.id}"`,
            `"${u.fullName.replace(/"/g, '""')}"`,
            `"${u.email}"`,
            `"${u.phone}"`,
            `"${u.role}"`,
            `"${u.walletAddress || 'Chưa liên kết'}"`,
            `"${u.status}"`,
            `"${u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''}"`
        ]);

        // Thêm BOM '\uFEFF' để Excel đọc tiếng Việt không bị lỗi font
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        // Tạo file và kích hoạt Tải xuống
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Danh_Sach_Tai_Khoan_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const paginatedData = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns: Column<UserAccountResponse>[] = [
        {
            header: 'Họ và tên',
            key: 'fullName',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
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
            header: 'Role',
            key: 'role',
            render: (item) => (
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold">
                    {item.role}
                </span>
            ),
        },
        {
            header: 'Địa chỉ ví Blockchain',
            key: 'walletAddress',
            render: (item, idx) =>
                item.walletAddress ? (
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                            {item.walletAddress.slice(0, 6)}...{item.walletAddress.slice(-4)}
                        </span>
                        <button
                            onClick={() => handleCopyWallet(item.walletAddress!, idx)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Sao chép ví"
                        >
                            {copiedIndex === idx ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 font-italic">Chưa liên kết</span>
                ),
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
            header: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="relative">
                    <button
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                        <span>Thao tác</span>
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuId === item.id && (
                        <>
                            {/* Lớp màn ẩn giúp click ra ngoài bất kỳ đâu sẽ tự động đóng Menu */}
                            <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveMenuId(null)}
                            />

                            {/* Dropdown Menu nổi lên trên z-30 */}
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-left text-xs">
                                <button
                                    onClick={() => {
                                        setSelectedUser(item);
                                        setActiveModal('APPROVE');
                                        setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Duyệt / Từ chối
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedUser(item);
                                        setActiveModal('WHITELIST');
                                        setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                    <Shield className="w-3.5 h-3.5 text-blue-600" /> Cấp Whitelist
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedUser(item);
                                        setActiveModal('ROLE');
                                        setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                    <UserCog className="w-3.5 h-3.5 text-purple-600" /> Đổi vai trò (Role)
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedUser(item);
                                        setActiveModal('LOCK');
                                        setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold border-t border-slate-100 cursor-pointer"
                                >
                                    <Lock className="w-3.5 h-3.5" /> Khóa / Mở khóa
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ),
        },

    ];

    return (
        <div className="space-y-6">
            {/* HEADER TIÊU ĐỀ VÀ 4 NÚT HÀNH ĐỘNG */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Quản lý Tài khoản Hệ thống</h2>
                    <p className="text-xs text-slate-500">Đồng bộ trực tiếp Backend API (`/api/v1/users`)</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <AppButton
                        variant="grey"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        onClick={fetchUsers}
                    >
                        Làm mới
                    </AppButton>
                    <AppButton
                        variant="grey"
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={handleExportCSV}
                    >
                        Xuất file
                    </AppButton>

                    <button
                        onClick={handleBatchApprove}
                        disabled={loading || pendingCount === 0}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                        <CheckCircle className="w-4 h-4" /> Duyệt nhanh ({pendingCount})
                    </button>
                    <AppButton
                        variant="green"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Thêm tài khoản
                    </AppButton>
                </div>
            </div>


            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
                <AppTabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />
            </div>

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
                    <span className="text-xs font-bold text-slate-600">Lọc Role:</span>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                    >
                        <option value="ALL">Tất cả Roles</option>
                        <option value="FARMER">FARMER</option>
                        <option value="PROCESSOR">PROCESSOR</option>
                        <option value="RETAILER">RETAILER</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium text-xs">
                    Đang kết nối Backend API và lấy danh sách tài khoản...
                </div>
            ) : paginatedData.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-medium text-xs">
                    Chưa có tài khoản nào thuộc danh mục này.
                </div>
            ) : (
                <div className="space-y-4">
                    <AppTable columns={columns} data={paginatedData} showSTT={true} />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* MODALS */}
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchUsers}
            />

            <ApproveUserModal
                isOpen={activeModal === 'APPROVE'}
                user={selectedUser}
                onClose={() => {
                    setActiveModal(null);
                    setSelectedUser(null);
                }}
                onSuccess={fetchUsers}
            />

            <LockUserModal
                isOpen={activeModal === 'LOCK'}
                user={selectedUser}
                onClose={() => {
                    setActiveModal(null);
                    setSelectedUser(null);
                }}
                onSuccess={fetchUsers}
            />

            <BlockchainWhitelistModal
                isOpen={activeModal === 'WHITELIST'}
                user={selectedUser}
                onClose={() => {
                    setActiveModal(null);
                    setSelectedUser(null);
                }}
                onSuccess={fetchUsers}
            />
            <ChangeRoleModal
                isOpen={activeModal === 'ROLE'}
                user={selectedUser}
                onClose={() => {
                    setActiveModal(null);
                    setSelectedUser(null);
                }}
                onSuccess={fetchUsers}
            />

        </div>
    );
};

export default AccountManagementPage;
