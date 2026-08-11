import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck,
    Search,
    QrCode,
    CheckCircle2,
    Award,
    Sparkles,
    Check,
    Lock,
    Tractor,
    Building2,
    ShoppingCart,
    Users,
    Database,
    ChevronRight,
    FileCheck2,
    Layers,
    FileCode2
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
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
            {/* Header / Navigation Bar - CHỈ GIỮ 1 LOGO HÌNH ẢNH NGUYÊN BẢN */}
            <header className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50 transition-all shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logo duy nhất (Đã xóa dòng chữ lặp lại bên cạnh) */}
                    <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <img
                            src="/logo.png"
                            alt="FruitChain Logo"
                            className="h-10 sm:h-12 w-auto object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>

                    <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
                        <a href="#hero" className="hover:text-emerald-600 transition-colors">Trang chủ</a>
                        <a href="#search" className="hover:text-emerald-600 transition-colors">Tra cứu QR</a>
                        <a href="#features" className="hover:text-emerald-600 transition-colors">Tính năng</a>
                        <a href="#blockchain" className="hover:text-emerald-600 transition-colors">Công nghệ Blockchain</a>
                        <a href="#workflow" className="hover:text-emerald-600 transition-colors">Quy trình</a>
                        <a href="#certification" className="hover:text-emerald-600 transition-colors">Tiêu chuẩn</a>
                    </nav>

                    <div className="flex items-center space-x-3">
                        <Link
                            to="/login"
                            className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            to="/register"
                            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all transform active:scale-95"
                        >
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section id="hero" className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Background overlay */}
                <div
                    className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
                    style={{ backgroundImage: `url('/hero_background.png')` }}
                />

                {/* Decorative glows */}
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                    {/* Cột trái: Tiêu đề & Form tra cứu */}
                    <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/15 shadow-inner">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Nền tảng Truy xuất Nguồn gốc Nông sản trên Blockchain</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Minh Bạch Nguồn Gốc <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-green-300">
                                Nâng Tầm Nông Sản Việt
                            </span>
                        </h1>

                        <p className="text-emerald-100/90 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
                            Hệ thống quản lý minh bạch toàn bộ chuỗi cung ứng từ nông trại, hợp tác xã sơ chế đến hệ thống siêu thị và người tiêu dùng cuối cùng với công nghệ Blockchain chống giả mạo.
                        </p>

                        {/* Form Tra cứu QR Nhanh */}
                        <div id="search" className="pt-2 max-w-xl mx-auto lg:mx-0">
                            <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-2xl flex items-center space-x-2 border border-emerald-200">
                                <div className="pl-3 text-emerald-600 flex items-center justify-center">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value)}
                                    placeholder="Nhập mã tem QR hoặc Mã lô hàng (ví dụ: LOT-2026...)"
                                    className="w-full py-3 px-2 text-sm font-medium text-slate-800 focus:outline-none placeholder-slate-400"
                                />
                                <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all shrink-0 shadow-md shadow-emerald-600/30"
                                >
                                    <Search className="w-4 h-4" />
                                    <span className="hidden sm:inline">Tra cứu</span>
                                </button>
                            </form>
                            <p className="text-[11px] text-emerald-200/80 mt-2 text-left pl-2 flex items-center gap-1">
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                                Nhập mã tem trên bao bì sản phẩm để tra cứu nhật ký canh tác & Hợp đồng thông minh.
                            </p>
                        </div>
                    </div>

                    {/* Cột phải: Mockup Dashboard */}
                    <div className="lg:col-span-6 flex justify-center relative mt-4 lg:mt-0">
                        <div className="relative w-full max-w-xl bg-gradient-to-b from-emerald-500/20 to-teal-500/10 p-5 rounded-3xl backdrop-blur-xl border border-white/25 shadow-2xl">
                            <img
                                src="/dashboard_mockup.png"
                                alt="FruitChain Dashboard Mockup"
                                className="rounded-2xl w-full h-auto object-cover shadow-xl border border-white/40"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/nhan_xuong_com_vang.png';
                                }}
                            />

                            {/* Badge Smart Contract Verified */}
                            <div className="absolute -bottom-5 -left-5 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center space-x-3.5">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500">Mã hóa tự động</div>
                                    <div className="text-sm font-extrabold text-emerald-900">Smart Contract Verified</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DẢI THỐNG KÊ (STATS COUNTER BAR) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 w-full">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-slate-100">
                    <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2 text-emerald-600 mb-1">
                            <Database className="w-6 h-6" />
                            <span className="text-3xl sm:text-4xl font-black text-slate-900">100%</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-700">Minh bạch Blockchain</div>
                        <div className="text-[11px] text-slate-400">Dữ liệu bất biến chống sửa đổi</div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2 text-teal-600 mb-1">
                            <Users className="w-6 h-6" />
                            <span className="text-3xl sm:text-4xl font-black text-slate-900">4 Portal</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-700">Phân quyền vai trò</div>
                        <div className="text-[11px] text-slate-400">Nông dân, HTX, Siêu thị, Người dùng</div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-1">
                            <Layers className="w-6 h-6" />
                            <span className="text-3xl sm:text-4xl font-black text-slate-900">Real-time</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-700">Nhật ký canh tác số</div>
                        <div className="text-[11px] text-slate-400">Đồng bộ tức thì trên thiết bị</div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2 text-amber-600 mb-1">
                            <Award className="w-6 h-6" />
                            <span className="text-3xl sm:text-4xl font-black text-slate-900">VietGAP</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-700">Tiêu chuẩn An toàn</div>
                        <div className="text-[11px] text-slate-400">Cấp chứng chỉ mã vùng trồng</div>
                    </div>
                </div>
            </div>

            {/* FEATURES SECTION - 4 THẺ VAI TRÒ DÀNH CHO NÔNG DÂN, HTX, SIÊU THỊ & KHÁCH HÀNG */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase rounded-full tracking-wider">
                        Phân Quyền Chuyên Biệt
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Công Cụ Dành Cho Toàn Bộ Chuỗi Cung Ứng
                    </h2>
                    <p className="text-base text-slate-600 font-medium">
                        Mỗi bên tham gia được trang bị giao diện và tính năng tối ưu đúng với chuyên môn
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Card 1: Nông dân */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                        <div>
                            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-5 bg-emerald-50 border border-emerald-100 flex items-center justify-center relative">
                                <img
                                    src="/feature_farmer_v2.png"
                                    alt="Dành cho Nông dân"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/icon_farmer.png';
                                    }}
                                />
                                <div className="absolute top-3 left-3 bg-emerald-600 text-white p-2 rounded-xl shadow-md">
                                    <Tractor className="w-5 h-5" />
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase rounded-full tracking-wider">
                                Portal Nông Dân
                            </span>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-3 mb-2">Canh Tác & Nhật Ký</h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                Dễ dàng ghi chép nhật ký phân bón, tưới tiêu, phun thuốc và sản lượng thu hoạch trực tiếp trên di động.
                            </p>
                            <ul className="space-y-2 text-xs font-medium text-slate-700">
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Nhật ký thời gian thực</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Tải lên ảnh chụp đồng ruộng</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Ghi nhận vật tư & phân bón</span>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-6">
                            <Link to="/login" className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-1 transition-transform">
                                <span>Khám phá Portal Nông dân</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Card 2: HTX */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                        <div>
                            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-5 bg-teal-50 border border-teal-100 flex items-center justify-center relative">
                                <img
                                    src="/feature_cooperative_v2.png"
                                    alt="Dành cho HTX & Chế biến"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/icon_cooperative.png';
                                    }}
                                />
                                <div className="absolute top-3 left-3 bg-teal-600 text-white p-2 rounded-xl shadow-md">
                                    <Building2 className="w-5 h-5" />
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-teal-100 text-teal-800 text-[11px] font-extrabold uppercase rounded-full tracking-wider">
                                Portal HTX / Chế Biến
                            </span>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-3 mb-2">Sơ Chế & Đóng Gói</h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                Quản lý quy trình sơ chế, đóng gói sản phẩm, phân loại chất lượng và phát hành mã QR lô hàng.
                            </p>
                            <ul className="space-y-2 text-xs font-medium text-slate-700">
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-teal-600 shrink-0" />
                                    <span>Tạo & In mã tem QR lô hàng</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-teal-600 shrink-0" />
                                    <span>Quản lý kho & Nhập xuất kho</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-teal-600 shrink-0" />
                                    <span>Phát hành chứng chỉ lô hàng</span>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-6">
                            <Link to="/login" className="inline-flex items-center space-x-1 text-xs font-bold text-teal-700 hover:text-teal-800 group-hover:translate-x-1 transition-transform">
                                <span>Khám phá Portal HTX</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Card 3: Siêu thị */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                        <div>
                            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-5 bg-blue-50 border border-blue-100 flex items-center justify-center relative">
                                <img
                                    src="/feature_enterprise_v2.png"
                                    alt="Dành cho Siêu thị"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/icon_enterprise.png';
                                    }}
                                />
                                <div className="absolute top-3 left-3 bg-blue-600 text-white p-2 rounded-xl shadow-md">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase rounded-full tracking-wider">
                                Portal Siêu Thị
                            </span>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-3 mb-2">Phân Phối & Bán Hàng</h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                Xác nhận tiếp nhận hàng, kiểm tra tính toàn vẹn của lô hàng và phân phối tới hệ thống siêu thị.
                            </p>
                            <ul className="space-y-2 text-xs font-medium text-slate-700">
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Nghiệm thu chất lượng lô hàng</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Xác nhận vận chuyển trên web</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Cung cấp dữ liệu cho người mua</span>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-6">
                            <Link to="/login" className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-800 group-hover:translate-x-1 transition-transform">
                                <span>Khám phá Portal Siêu thị</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Card 4: Người tiêu dùng */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                        <div>
                            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-5 bg-amber-50 border border-amber-100 flex items-center justify-center relative">
                                <img
                                    src="/feature_consumer_v2.png"
                                    alt="Dành cho Người tiêu dùng"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/icon_consumer.png';
                                    }}
                                />
                                <div className="absolute top-3 left-3 bg-amber-600 text-white p-2 rounded-xl shadow-md">
                                    <QrCode className="w-5 h-5" />
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase rounded-full tracking-wider">
                                Khách Hàng Quét QR
                            </span>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-3 mb-2">Tra Cứu Minh Bạch</h3>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                Người mua quét mã QR trên quả/hộp để kiểm tra toàn bộ thông tin nông trại, chứng nhận an toàn và nguồn gốc.
                            </p>
                            <ul className="space-y-2 text-xs font-medium text-slate-700">
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Quét QR trên camera di động</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Xem bản đồ vị trí nông trại</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Xem chứng chỉ VietGAP trực tiếp</span>
                                </li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-6">
                            <a href="#search" className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-800 group-hover:translate-x-1 transition-transform">
                                <span>Thử Tra cứu Mã QR ngay</span>
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

            </section>

            {/* BLOCKCHAIN TECHNOLOGY SPOTLIGHT SECTION (KHÔNG CHỨA YẾU TỐ AI) */}
            <section id="blockchain" className="py-20 bg-slate-900 text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase rounded-full tracking-wider border border-emerald-500/30">
                            Công Nghệ Cốt Lõi
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Bảo Vệ Nguồn Gốc Với Hợp Đồng Thông Minh Smart Contract
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Mỗi sự kiện canh tác, sơ chế và vận chuyển nông sản đều được mã hóa bằng thuật toán mật mã học và lưu trữ bất biến trên Blockchain, chống mọi hành vi sửa đổi hoặc giả mạo dữ liệu.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
                                <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-sm text-white">Smart Contract Verified</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">Dữ liệu được băm (hash) và lưu lại trên Blockchain không thể bị can thiệp hay xóa bỏ.</p>
                            </div>

                            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
                                <div className="w-9 h-9 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center font-bold">
                                    <FileCode2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-sm text-white">Xác Thực Chuỗi Cung Ứng</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">Mỗi lô hàng được gắn mã định danh duy nhất và theo dõi minh bạch 24/7.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 flex justify-center">
                        <div className="w-full bg-gradient-to-br from-emerald-900/40 to-teal-900/30 p-8 rounded-3xl border border-white/15 backdrop-blur-xl text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/40 shadow-xl">
                                <Database className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">Hệ Thống Lưu Trữ Bất Biến</h3>
                                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-sm mx-auto">
                                    Toàn bộ hợp đồng thông minh được triển khai công khai, cho phép người tiêu dùng tra cứu tính xác thực bất kỳ lúc nào.
                                </p>
                            </div>
                            <div className="pt-2">
                                <a href="#search" className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30">
                                    <QrCode className="w-4 h-4" />
                                    <span>Thử tra cứu mã QR</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WORKFLOW 4 BƯỚC */}
            <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase rounded-full tracking-wider">
                        Quy Trình Chuẩn
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Hành Trình Nông Sản 4 Bước
                    </h2>
                    <p className="text-sm text-slate-600 font-medium">
                        Mỗi sự kiện được ghi nhận bất biến và ký số trực tiếp vào Blockchain
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {[
                        { step: '01', role: 'Nông Dân', title: 'Gieo Trồng & Thu Hoạch', desc: 'Cập nhật nhật ký tưới tiêu, bón phân, sinh trưởng và sản lượng thu hoạch.' },
                        { step: '02', role: 'Hợp Tác Xã', title: 'Sơ Chế & Đóng Gói', desc: 'Kiểm tra chất lượng, đóng gói lô hàng và in tem QR truy xuất.' },
                        { step: '03', role: 'Siêu Thị', title: 'Vận Chuyển & Tiếp Nhận', desc: 'Quét mã xác nhận nhận hàng, kiểm tra hợp đồng và lưu kho bán hàng.' },
                        { step: '04', role: 'Người Dùng', title: 'Quét QR & Tiêu Dùng', desc: 'Xem chi tiết nguồn gốc, hình ảnh thực tế và các chứng nhận VietGAP.' }
                    ].map((item, idx) => (
                        <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all group">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl font-black text-emerald-600/30 group-hover:text-emerald-600 transition-colors">{item.step}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                                        {item.role}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700 space-x-1">
                                <span>Ký số Blockchain</span>
                                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CHỨNG NHẬN & TIÊU CHUẨN (VIETGAP BANNER & SẢN PHẨM MẪU) */}
            <section id="certification" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl text-center lg:text-left">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-emerald-200">
                            <Award className="w-4 h-4 text-emerald-400" />
                            <span>Cam kết Tiêu chuẩn An toàn</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black">
                            Đạt Tiêu Chuẩn VietGAP & Chứng Nhận Quốc Tế
                        </h2>
                        <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed">
                            Mỗi lô trái cây lưu thông qua hệ thống FruitChain đều được kiểm định nguồn gốc vùng trồng, quy trình canh tác an toàn không hóa chất độc hại và cấp chứng chỉ truy xuất số.
                        </p>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                            <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Không dư lượng thuốc BVTV</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Mã vùng trồng hợp quy</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                        <img
                            src="/vietgap_certificate.png"
                            alt="Chứng nhận VietGAP"
                            className="h-36 sm:h-44 w-auto object-contain drop-shadow-2xl bg-white/10 p-2 rounded-2xl border border-white/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <img
                            src="/nhan_xuong_com_vang.png"
                            alt="Nông sản đạt chuẩn"
                            className="h-36 sm:h-44 w-auto object-contain drop-shadow-2xl hidden sm:block bg-white/10 p-2 rounded-2xl border border-white/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* CTA BANNER */}
            <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="bg-emerald-50 rounded-3xl p-8 sm:p-10 border border-emerald-200/80 text-center space-y-4 max-w-4xl mx-auto shadow-sm">
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-950">Sẵn Sàng Minh Bạch Hóa Nông Sản Của Bạn?</h3>
                    <p className="text-sm text-slate-600 max-w-xl mx-auto">
                        Đăng ký tài khoản dành cho Nông dân, Hợp tác xã hoặc Siêu thị ngay hôm nay để bắt đầu số hóa quy trình và nâng tầm giá trị nông sản.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                        <Link to="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all">
                            Đăng ký tài khoản miễn phí
                        </Link>
                        <a href="#search" className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-xl border border-slate-300 transition-all">
                            Tra cứu mã QR ngay
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER - CHỈ GIỮ 1 LOGO HÌNH ẢNH NGUYÊN BẢN */}
            <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-900 mt-auto">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
                    <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center">
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                        </div>
                        <p className="text-slate-400 max-w-sm leading-relaxed">
                            Hệ thống Truy xuất Nguồn gốc Hoa quả sạch áp dụng công nghệ Blockchain mã hóa minh bạch toàn diện từ Nông trại đến Bàn ăn.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white text-sm mb-3">Liên kết nhanh</h4>
                        <ul className="space-y-2">
                            <li><a href="#hero" className="hover:text-emerald-400">Trang chủ</a></li>
                            <li><a href="#search" className="hover:text-emerald-400">Tra cứu tem QR</a></li>
                            <li><a href="#features" className="hover:text-emerald-400">Portal Phân quyền</a></li>
                            <li><Link to="/login" className="hover:text-emerald-400">Đăng nhập hệ thống</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white text-sm mb-3">Liên hệ hỗ trợ</h4>
                        <p className="text-slate-400 leading-relaxed">
                            Email: support@fruitchain.vn<br />
                            Hotline: 1900 6868<br />
                            Địa chỉ: Khu Công Nghệ Cao, Hà Nội
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
                    <div>© 2026 FruitChain. Bảo lưu mọi quyền.</div>
                    <div className="flex space-x-4 mt-2 sm:mt-0">
                        <span>Điều khoản sử dụng</span>
                        <span>•</span>
                        <span>Chính sách bảo mật</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
