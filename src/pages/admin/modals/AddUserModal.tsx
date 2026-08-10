// src/pages/admin/modals/AddUserModal.tsx
import React, { useState } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppInput } from '../../../components/ui/AppInput';
import { AppSelect } from '../../../components/ui/AppSelect';
import { AppButton } from '../../../components/ui/AppButton';
import { UserPlus } from 'lucide-react';
import { apiClient } from '../../../services/api';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: 'Password@123',
        roleRequested: 1, // 1: FARMER, 2: PROCESSOR, 3: RETAILER, 4: ADMIN
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Gọi API thực tế POST /api/v1/auth/register
            await apiClient.post('/v1/auth/register', {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                roleRequested: Number(formData.roleRequested),
            });
            onSuccess();
            onClose();
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                password: 'Password@123',
                roleRequested: 1,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tạo tài khoản từ Backend API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="THÊM MỚI TÀI KHOẢN HỆ THỐNG"
            footer={
                <>
                    <AppButton variant="grey" onClick={onClose} disabled={loading}>
                        Hủy bỏ
                    </AppButton>
                    <AppButton
                        variant="green"
                        leftIcon={<UserPlus className="w-4 h-4" />}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Đang khởi tạo...' : 'Khởi tạo tài khoản'}
                    </AppButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}
                <AppInput
                    label="Họ và tên"
                    placeholder="VD: Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AppInput
                        label="Email"
                        type="email"
                        placeholder="an@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <AppInput
                        label="Số điện thoại"
                        placeholder="0981234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />
                </div>
                <AppSelect
                    label="Vai trò (Role)"
                    value={String(formData.roleRequested)}
                    onChange={(e) => setFormData({ ...formData, roleRequested: Number(e.target.value) })}
                    options={[
                        { value: '1', label: 'Nông dân (FARMER)' },
                        { value: '2', label: 'Nhà chế biến / HTX (PROCESSOR)' },
                        { value: '3', label: 'Siêu thị / Cửa hàng (RETAILER)' },
                        { value: '4', label: 'Quản trị hệ thống (ADMIN)' },
                    ]}
                />
                <AppInput
                    label="Mật khẩu mặc định"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />
            </form>
        </AppModal>
    );
};
