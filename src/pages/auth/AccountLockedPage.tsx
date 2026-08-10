
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Lock, LogOut, PhoneCall } from 'lucide-react';

export const AccountLockedPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
                    <Lock className="w-8 h-8 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản đã bị tạm khóa</h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Tài khoản của <span className="font-semibold text-gray-900">{user?.fullName || user?.email}</span> hiện đang tạm dừng hoạt động do chính sách quản trị hoặc theo yêu cầu cá nhân.
                </p>

                <div className="bg-red-50/60 border border-red-200/60 rounded-xl p-4 text-left text-xs text-red-900 space-y-2 mb-6">
                    <div className="flex items-center space-x-2 font-semibold">
                        <PhoneCall className="w-4 h-4 text-red-600" />
                        <span>Hỗ trợ mở khóa tài khoản:</span>
                    </div>
                    <p>• Hotline Admin: <span className="font-medium">1900 6868</span></p>
                    <p>• Email Hỗ trợ: <span className="font-medium">support@omfarm.vn</span></p>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center space-x-2 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};
