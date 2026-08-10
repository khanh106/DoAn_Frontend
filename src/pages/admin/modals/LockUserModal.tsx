
import React, { useState } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';
import { Lock, Unlock } from 'lucide-react';
import { apiClient } from '../../../services/api';
import type { UserAccountResponse } from './ApproveUserModal';

interface LockUserModalProps {
    isOpen: boolean;
    user: UserAccountResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const LockUserModal: React.FC<LockUserModalProps> = ({ isOpen, user, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) return null;

    const isLocked = user.status === 'LOCKED';

    const handleToggleLock = async () => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.put(`/v1/users/${user.id}/lock`, { lock: !isLocked });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật trạng thái khóa thất bại từ Backend API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title={isLocked ? 'MỞ KHÓA TÀI KHOẢN' : 'KHÓA TÀI KHOẢN HỆ THỐNG'}
            footer={
                <>
                    <AppButton variant="grey" onClick={onClose} disabled={loading}>
                        Hủy
                    </AppButton>
                    <button
                        onClick={handleToggleLock}
                        disabled={loading}
                        className={`px-4 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer ${isLocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                    >
                        {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {isLocked ? 'Xác nhận Mở khóa' : 'Xác nhận Khóa tài khoản'}
                    </button>
                </>
            }
        >
            <div className="space-y-3">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs md:text-sm leading-relaxed">
                    <p>
                        Bạn có chắc chắn muốn {isLocked ? 'mở khóa' : 'khóa'} tài khoản{' '}
                        <strong>{user.fullName}</strong> ({user.email})?
                    </p>
                </div>
            </div>
        </AppModal>
    );
};
