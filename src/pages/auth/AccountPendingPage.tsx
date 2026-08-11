import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';

export const AccountPendingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-100">
                    <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản đang chờ phê duyệt</h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Cảm ơn <span className="font-semibold text-gray-900">{user?.fullName || 'bạn'}</span> đã đăng ký tài khoản tại hệ thống FruitChain. Yêu cầu của bạn đang được Quản trị viên (Admin) xem xét.
                </p>

                <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 text-left text-xs text-amber-900 space-y-2 mb-6">
                    <div className="flex items-center space-x-2 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Thông tin tài khoản:</span>
                    </div>
                    <p>• Email: <span className="font-medium">{user?.email}</span></p>
                    <p>• Vai trò đăng ký: <span className="font-medium">{user?.role}</span></p>
                    <p>• Trạng thái: <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold text-[10px]">PENDING</span></p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center space-x-2 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất & Quay lại Đăng nhập</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
