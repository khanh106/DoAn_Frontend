import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Leaf,
    ShieldCheck,
    Search,
    Tractor,
    Building2,
    ShoppingCart,
    QrCode,
    ArrowRight,
    CheckCircle2,
    Lock,
    Globe
} from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchCode, setSearchCode] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchCode.trim()) {
            navigate(`/trace/${searchCode.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5FA] flex flex-col font-sans">
            {/* Header / Navbar */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm shadow-emerald-200">
                            <Leaf className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-gray-900 tracking-wide">FruitChain</span>
                            <span className="hidden sm:inline-block text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full ml-2 border border-emerald-100">
                                BLOCKCHAIN TRACE
                            </span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
                        <a href="#hero" className="hover:text-emerald-600 transition-colors">Trang chủ</a>
                        <a href="#search" className="hover:text-emerald-600 transition-colors">Tra cứu QR</a>
                        <a href="#features" className="hover:text-emerald-600 transition-colors">Tính năng</a>
                        <a href="#workflow" className="hover:text-emerald-600 transition-colors">Quy trình</a>
                    </nav>

                    <div className="flex items-center space-x-3">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                        >
                            Đăng ký
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section id="hero" className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs text-emerald-200 border border-white/10">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Nền tảng Truy xuất Nguồn gốc Chuỗi Cung ứng Nông nghiệp</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
                        Minh Bạch Nguồn Gốc <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                            Nâng Tầm Nông Sản Việt
                        </span>
                    </h1>

                    <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                        Hệ thống theo dõi toàn bộ chuỗi cung ứng từ nông trại, hợp tác xã sơ chế đến các siêu thị phân phối trên nền tảng Blockchain không thể sửa đổi.
                    </p>

                    {/* Form Tra cứu Nhanh QR */}
                    <div id="search" className="pt-6 max-w-2xl mx-auto">
                        <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl flex items-center space-x-2 border border-emerald-100">
                            <div className="pl-3 text-gray-400">
                                <QrCode className="w-6 h-6 text-emerald-600" />
                            </div>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="Nhập mã QR hoặc Mã lô hàng..."
                                className="w-full py-3 px-2 text-sm text-gray-800 focus:outline-none placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all shrink-0"
                            >
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline">Tra cứu ngay</span>
                            </button>
                        </form>
                    </div>

                    {/* Stat Badges */}
                    <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-emerald-100 text-xs">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">100%</div>
                            <div>Minh bạch Blockchain</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">4 Role</div>
                            <div>Phân quyền chặt chẽ</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">Real-time</div>
                            <div>Nhật ký canh tác</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">Mã QR</div>
                            <div>Truy xuất tức thì</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold text-gray-900">Tính năng nổi bật cho các bên tham gia</h2>
                    <p className="text-sm text-gray-500 mt-2">Dành cho Nông dân, Hợp tác xã, Siêu thị và Người tiêu dùng</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                            <Tractor className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Dành cho Nông dân</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Dễ dàng ghi chép nhật ký phân bón, tưới tiêu, phun thuốc và thời điểm thu hoạch trực tiếp trên giao diện di động.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Dành cho HTX & Chế biến</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Quản lý quy trình sơ chế, đóng gói sản phẩm, phân loại chất lượng và tạo mã QR lô hàng chuẩn xác.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Dành cho Siêu thị & Cửa hàng</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Xác nhận nhận hàng, kiểm tra tính toàn vẹn của lô hàng và cung cấp thông tin minh bạch tới người tiêu dùng.
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="py-16 bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">Quy trình Truy xuất Nguồn gốc 4 Bước</h2>
                        <p className="text-sm text-gray-500 mt-2">Dữ liệu được mã hóa và lưu trữ minh bạch trên Blockchain</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { step: '01', title: 'Canh tác & Thu hoạch', desc: 'Nông dân cập nhật nhật ký trồng trọt' },
                            { step: '02', title: 'Sơ chế & Đóng gói', desc: 'HTX tạo lô hàng và in mã QR code' },
                            { step: '03', title: 'Vận chuyển & Siêu thị', desc: 'Siêu thị quét mã và nhập kho bán hàng' },
                            { step: '04', title: 'Khách hàng Quét QR', desc: 'Người dùng xem đầy đủ lịch sử nông sản' }
                        ].map((item, idx) => (
                            <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                <div className="text-3xl font-extrabold text-emerald-600/30 mb-2">{item.step}</div>
                                <h4 className="text-base font-bold text-gray-900 mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:say-o text-xs">
                    <div className="flex items-center space-x-2 text-white">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-sm">FRUITCHAIN SYSTEM</span>
                    </div>
                    <div>© 2026 FruitChain. Hệ thống Truy xuất Nguồn gốc Nông sản Blockchain.</div>
                </div>
            </footer>
        </div>
    );
};
