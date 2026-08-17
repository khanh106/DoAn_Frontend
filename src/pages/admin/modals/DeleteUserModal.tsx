import React, { useState } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { toast } from '../../../utils/toast';
import type { UserAccountResponse } from './ApproveUserModal';

interface DeleteUserModalProps {
    isOpen: boolean;
    user: UserAccountResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
    isOpen,
    user,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) return null;

    const isAdmin =
        user.email.toLowerCase() === 'admin@gmail.com' ||
        user.role.toUpperCase() === 'ADMIN';

    const handleDelete = async () => {
        if (isAdmin) {
            setError('Không thể xóa tài khoản Quản trị viên hệ thống.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/v1/users/${user.id}`);
            toast.success(`Đã xóa tài khoản "${user.fullName}" thành công!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.title ||
                'Có lỗi xảy ra khi xóa tài khoản.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="XÓA TÀI KHOẢN HỆ THỐNG"
            footer={
                <>
                    <AppButton variant="grey" onClick={onClose} disabled={loading}>
                        Hủy
                    </AppButton>
                    <button
                        onClick={handleDelete}
                        disabled={loading || isAdmin}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        {loading ? 'Đang xóa...' : 'Xác nhận Xóa tài khoản'}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {isAdmin ? (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs md:text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Tài khoản Quản trị viên được bảo vệ</p>
                            <p className="mt-1 text-slate-700">
                                Tài khoản <strong>{user.fullName}</strong> ({user.email}) có vai trò ADMIN tối cao và không thể bị xóa khỏi hệ thống.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-red-50/70 border border-red-200 text-red-900 rounded-2xl text-xs md:text-sm space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-800">Cảnh báo hành động xóa tài khoản:</p>
                                <p className="mt-1 text-slate-700">
                                    Bạn có chắc chắn muốn xóa tài khoản <strong>{user.fullName}</strong> (
                                    <span className="font-mono text-slate-900">{user.email}</span>) với vai trò{' '}
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-xs">
                                        {user.role}
                                    </span>?
                                </p>
                            </div>
                        </div>

                        {user.walletAddress && (
                            <div className="p-2.5 bg-white/80 border border-red-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                    Hệ thống sẽ đồng thời <strong>tự động thu hồi quyền Role Smart Contract</strong> trên Blockchain đối với ví: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-900">{user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}</code>
                                </span>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 italic">
                            * Sau khi xóa, người dùng này sẽ không thể đăng nhập vào hệ thống nữa.
                        </p>
                    </div>
                )}
            </div>
        </AppModal>
    );
};
export default DeleteUserModal;
