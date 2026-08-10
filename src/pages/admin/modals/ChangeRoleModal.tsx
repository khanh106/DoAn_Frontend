import React, { useState, useEffect } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';
import { UserCog, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../../services/api';

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

interface ChangeRoleModalProps {
    isOpen: boolean;
    user: UserAccountResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

const ROLE_OPTIONS = [
    { value: 'FARMER', label: 'Nông dân (FARMER)' },
    { value: 'PROCESSOR', label: 'Nhà chế biến / HTX (PROCESSOR)' },
    { value: 'RETAILER', label: 'Nhà bán lẻ (RETAILER)' },
];

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ isOpen, user, onClose, onSuccess }) => {
    const [selectedRole, setSelectedRole] = useState<string>('FARMER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setSelectedRole(user.role);
            setError(null);
        }
    }, [user]);

    if (!user) return null;

    const isAdminAccount = user.email.toLowerCase() === 'admin@gmail.com';

    const handleSave = async () => {
        if (isAdminAccount) return;

        setLoading(true);
        setError(null);
        try {
            // RoleType Backend: ADMIN = 1, FARMER = 2, PROCESSOR = 3, RETAILER = 4
            const roleEnumMap: Record<string, number> = {
                ADMIN: 1,
                FARMER: 2,
                PROCESSOR: 3,
                RETAILER: 4,
            };

            const newRoleValue = roleEnumMap[selectedRole] ?? 2;

            await apiClient.put(`/v1/users/${user.id}/role`, { newRole: newRoleValue });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi phân quyền tài khoản.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="PHÂN QUYỀN VÀ ĐỔI VAI TRÒ TÀI KHOẢN"
            footer={
                <>
                    <AppButton variant="grey" onClick={onClose} disabled={loading}>
                        Hủy
                    </AppButton>
                    <AppButton
                        variant="green"
                        leftIcon={<UserCog className="w-4 h-4" />}
                        onClick={handleSave}
                        disabled={loading || isAdminAccount || selectedRole === user.role}
                    >
                        {loading ? 'Đang lưu...' : 'Xác nhận Đổi Role'}
                    </AppButton>
                </>
            }
        >
            <div className="space-y-4 text-xs md:text-sm text-slate-700">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {isAdminAccount ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Tài khoản Quản trị tối cao (admin@gmail.com)</p>
                            <p className="text-xs mt-1">Vai trò ADMIN của tài khoản này cố định theo chính sách an toàn hệ thống và không thể thay đổi.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                            <p><strong>Họ và tên:</strong> {user.fullName}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Vai trò hiện tại:</strong> <span className="font-bold text-purple-700">{user.role}</span></p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                Chọn Vai trò (Role) mới:
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {ROLE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400">
                                * Lưu ý: Chỉ tài khoản `admin@gmail.com` mới có quyền sở hữu vai trò ADMIN.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </AppModal>
    );
};
