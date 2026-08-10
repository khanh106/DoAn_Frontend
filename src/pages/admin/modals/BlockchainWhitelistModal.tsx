
import React, { useState } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../../services/api';
import type { UserAccountResponse } from './ApproveUserModal';

interface BlockchainWhitelistModalProps {
    isOpen: boolean;
    user: UserAccountResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const BlockchainWhitelistModal: React.FC<BlockchainWhitelistModalProps> = ({
    isOpen,
    user,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) return null;

    const getContractRoleName = (role: string) => {
        switch (role) {
            case 'FARMER':
                return 'FARMER_ROLE';
            case 'PROCESSOR':
            case 'COOPERATIVE':
                return 'PROCESSOR_ROLE';
            case 'RETAILER':
                return 'RETAILER_ROLE';
            default:
                return 'DEFAULT_ADMIN_ROLE';
        }
    };

    const handleWhitelistAction = async (grant: boolean) => {
        if (!user.walletAddress) {
            setError('Tài khoản này chưa có địa chỉ ví Blockchain!');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const roleName = getContractRoleName(user.role);
            const endpoint = grant
                ? '/v1/admin/blockchain/whitelist/grant-role'
                : '/v1/admin/blockchain/whitelist/revoke-role';

            await apiClient.post(endpoint, {
                roleName,
                accountAddress: user.walletAddress,
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể thực thi lệnh Whitelist on-chain.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="CẤP / THU HỒI WHITELIST SMART CONTRACT"
            footer={
                <>
                    <AppButton variant="grey" onClick={onClose} disabled={loading}>
                        Hủy
                    </AppButton>
                    <button
                        onClick={() => handleWhitelistAction(false)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <ShieldAlert className="w-4 h-4" /> Thu hồi Role (revokeRole)
                    </button>
                    <AppButton
                        variant="green"
                        leftIcon={<ShieldCheck className="w-4 h-4" />}
                        onClick={() => handleWhitelistAction(true)}
                        disabled={loading}
                    >
                        {loading ? 'Đang thực thi On-chain...' : 'Cấp Role (grantRole)'}
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
                    <p><strong>Người dùng:</strong> {user.fullName}</p>
                    <p><strong>Role Smart Contract:</strong> <code className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">{getContractRoleName(user.role)}</code></p>
                    <p><strong>Địa chỉ ví On-chain:</strong> <code className="bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-900">{user.walletAddress || 'Chưa khởi tạo'}</code></p>
                </div>
            </div>
        </AppModal>
    );
};
