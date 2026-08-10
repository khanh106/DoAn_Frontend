
import React, { useState } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';
import { CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../../services/api';

// Khai báo interface trực tiếp (Không import từ AccountManagementPage để tránh circular dependency)
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

interface ApproveUserModalProps {
    isOpen: boolean;
    user: UserAccountResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const ApproveUserModal: React.FC<ApproveUserModalProps> = ({ isOpen, user, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) return null;

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.put(`/v1/users/${user.id}/approve`, { action });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Thao tác phê duyệt thất bại trên Backend API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="PHÊ DUYỆT TÀI KHOẢN HỆ THỐNG"
            footer={
                <>
                    <AppButton variant="grey" onClick={onClose} disabled={loading}>
                        Hủy
                    </AppButton>
                    <button
                        onClick={() => handleAction('REJECT')}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <XCircle className="w-4 h-4" /> Từ chối
                    </button>
                    <AppButton
                        variant="green"
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => handleAction('APPROVE')}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Phê duyệt tài khoản'}
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
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p><strong>ID Tài khoản:</strong> <span className="font-mono text-slate-600">{user.id}</span></p>
                    <p><strong>Họ và tên:</strong> {user.fullName}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Số điện thoại:</strong> {user.phone}</p>
                    <p><strong>Vai trò yêu cầu:</strong> <span className="font-bold text-purple-700">{user.role}</span></p>
                </div>
            </div>
        </AppModal>
    );
};
