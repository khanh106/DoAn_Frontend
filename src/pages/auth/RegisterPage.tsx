import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Leaf, UserCheck, Mail, Phone, Lock, Eye, EyeOff, Building, Tractor, ShoppingCart } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [roleRequested, setRoleRequested] = useState<'FARMER' | 'PROCESSOR' | 'RETAILER'>('FARMER');

    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!fullName || !email || !phone || !password || !confirmPassword) {
            setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu nhập lại không trùng khớp.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Mật khẩu tối thiểu phải từ 6 ký tự.');
            return;
        }

        try {
            await register({
                fullName,
                email,
                phone,
                password,
                roleRequested,
            });

            // Chuyển sang màn hình thông báo chờ duyệt
            navigate('/auth/pending');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại!';
            setErrorMessage(msg);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5FA] py-12 px-4 flex justify-center items-center">
            <div className="w-full max-w-xl bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Leaf className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">FruitChain</h1>
                        <p className="text-xs text-gray-500">Đăng ký tham gia hệ thống Truy xuất Nguồn gốc</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Đăng ký Tài khoản</h2>
                    <p className="text-xs text-gray-500 mt-1">Tài khoản mới đăng ký sẽ được phê duyệt bởi Quản trị viên</p>
                </div>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Lựa chọn Role */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                            Chọn vai trò của bạn <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'FARMER', title: 'Nông dân', desc: 'Canh tác / Thu hoạch', icon: Tractor },
                                { id: 'PROCESSOR', title: 'HTX / Chế biến', desc: 'Sơ chế / Đóng gói', icon: Building },
                                { id: 'RETAILER', title: 'Siêu thị', desc: 'Cửa hàng / Phân phối', icon: ShoppingCart },
                            ].map((item) => {
                                const Icon = item.icon;
                                const isSelected = roleRequested === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setRoleRequested(item.id as any)}
                                        className={`p-3 rounded-xl border text-left transition-all ${isSelected
                                                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <div className="font-semibold text-xs">{item.title}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0912 345 678"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Email đăng nhập <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nongdan@omfarm.vn"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Nhập lại mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm disabled:opacity-50"
                    >
                        {isLoading ? 'Đang gửi đăng ký...' : 'Đăng ký ngay'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
