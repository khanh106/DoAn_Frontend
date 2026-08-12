
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Leaf, Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
            return;
        }

        try {
            const user = await login({ email, password });

            // Kiểm tra trạng thái tài khoản
            if (user.status === 'PENDING') {
                navigate('/auth/pending');
                return;
            }
            if (user.status === 'LOCKED') {
                navigate('/auth/locked');
                return;
            }

            // Điều hướng theo Role
            switch (user.role) {
                case 'ADMIN':
                    navigate('/admin/users');
                    break;
                case 'FARMER':
                    // Kiểm tra kích thước màn hình hoặc User-Agent để phát hiện điện thoại di động
                    const isMobileDevice = window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);

                    if (isMobileDevice) {
                        // Điều hướng sang trang di động chuẩn riêng biệt
                        navigate('/farmer/mobile');
                    } else {
                        // Điều hướng sang trang máy tính bình thường
                        navigate('/farmer/dashboard');
                    }
                    break;

                case 'PROCESSOR':
                case 'COOPERATIVE':
                    navigate('/cooperative/dashboard');
                    break;
                case 'RETAILER':
                    navigate('/retailer/dashboard');
                    break;
                default:
                    navigate('/trace');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
            setErrorMessage(msg);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#F4F5FA]">
            {/* Banner Cột Trái */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 text-emerald-300 mb-8">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                            <Leaf className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">FRUITCHAIN</h1>
                            <p className="text-xs text-emerald-200">Hệ thống Truy xuất Nguồn gốc Nông sản Blockchain</p>
                        </div>
                    </div>

                    <div className="mt-12 space-y-6">
                        <h2 className="text-3xl font-extrabold text-white leading-tight">
                            Minh bạch Nguồn gốc <br /> Nâng tầm Nông sản Việt
                        </h2>
                        <p className="text-emerald-100 text-sm leading-relaxed max-w-md">
                            Hệ thống theo dõi toàn bộ chuỗi cung ứng từ nông trại, hợp tác xã sơ chế đến các siêu thị phân phối trên nền tảng Blockchain minh bạch.
                        </p>

                        <div className="space-y-3 pt-4">
                            {[
                                'Xác thực và lưu trữ dữ liệu canh tác lên Blockchain',
                                'Quản lý lô hàng, mã QR truy xuất và nhật ký tự động',
                                'Phân quyền chặt chẽ cho Nông dân, HTX, Siêu thị & Admin',
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-3 text-sm text-emerald-100">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-emerald-300/80 border-t border-emerald-600/40 pt-6">
                    © 2026 FruitChain System. Bảo lưu mọi quyền.
                </div>
            </div>

            {/* Form Cột Phải */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Đăng nhập Cổng thông tin</h2>
                        <p className="text-sm text-gray-500 mt-1">Nhập tài khoản để tiếp tục truy cập hệ thống</p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2">
                            <span className="font-semibold">Lỗi:</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Email hoặc Số điện thoại
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@omfarm.vn"
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                <span className="text-gray-600 text-xs">Ghi nhớ đăng nhập</span>
                            </label>
                            <a href="#" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ Admin để khôi phục mật khẩu.'); }} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span>Đang xử lý...</span>
                            ) : (
                                <>
                                    <span>Đăng nhập</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-500">
                            Chưa có tài khoản tham gia hệ thống?{' '}
                            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                                Đăng ký tài khoản mới
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
