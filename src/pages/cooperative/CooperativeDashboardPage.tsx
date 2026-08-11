
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { apiClient } from '../../services/api';
import {
    RotateCw,
    TrendingUp,
    Package,
    MapPin,
    Layers,
    Search,
    Plus,
    Users,
    QrCode,
    CheckCircle2,
    Activity,
    ArrowUpRight,
    Filter
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';

export interface ProductDto {
    id: string;
    name: string;
    shortName?: string;
    groupName?: string;
    variety?: string;
    status?: string;
}

export interface FarmAreaDto {
    id: string;
    name: string;
    ownerName?: string;
    province?: string;
    district?: string;
    ward?: string;
    area?: number;
    plantingCode?: string;
    soilType?: string;
}

export const CooperativeDashboardPage: React.FC = () => {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [farmAreas, setFarmAreas] = useState<FarmAreaDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State quản lý tab và ô tìm kiếm
    const [activeTab, setActiveTab] = useState<'farmAreas' | 'products'>('farmAreas');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Hàm gọi API đồng bộ dữ liệu từ Backend API (.NET Core MediatR)
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsRes, farmAreasRes] = await Promise.allSettled([
                apiClient.get<ProductDto[]>('/v1/processor/products'),
                apiClient.get<FarmAreaDto[]>('/v1/processor/farm-areas'),
            ]);

            if (productsRes.status === 'fulfilled') {
                setProducts(productsRes.value.data || []);
            }
            if (farmAreasRes.status === 'fulfilled') {
                setFarmAreas(farmAreasRes.value.data || []);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải dữ liệu Hợp tác xã:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể kết nối API Backend. Vui lòng kiểm tra lại dịch vụ.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchDashboardData();
    }, [fetchDashboardData]);

    // Tổng diện tích canh tác (ha)
    const totalArea = useMemo(() => {
        return farmAreas.reduce((acc, item) => acc + (item.area || 0), 0);
    }, [farmAreas]);

    // Tìm kiếm Vùng trồng theo từ khóa
    const filteredFarmAreas = useMemo(() => {
        if (!searchTerm.trim()) return farmAreas;
        const term = searchTerm.toLowerCase();
        return farmAreas.filter(item =>
            item.name.toLowerCase().includes(term) ||
            (item.plantingCode && item.plantingCode.toLowerCase().includes(term)) ||
            (item.ownerName && item.ownerName.toLowerCase().includes(term)) ||
            (item.province && item.province.toLowerCase().includes(term))
        );
    }, [farmAreas, searchTerm]);

    // Tìm kiếm Sản phẩm theo từ khóa
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return products;
        const term = searchTerm.toLowerCase();
        return products.filter(item =>
            item.name.toLowerCase().includes(term) ||
            (item.shortName && item.shortName.toLowerCase().includes(term)) ||
            (item.variety && item.variety.toLowerCase().includes(term))
        );
    }, [products, searchTerm]);

    // Định nghĩa cột cho Bảng Vùng Trồng
    const farmAreaColumns: Column<FarmAreaDto>[] = [
        {
            header: 'Mã Số Vùng',
            key: 'plantingCode',
            render: (item) => (
                <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                    {item.plantingCode || 'N/A'}
                </span>
            )
        },
        {
            header: 'Tên Vùng Trồng',
            key: 'name',
            render: (item) => <span className="font-semibold text-slate-900">{item.name}</span>
        },
        { header: 'Chủ Đơn Vị / Nông Dân', key: 'ownerName' },
        {
            header: 'Địa Chỉ Hành Chính',
            key: 'province',
            render: (item) => (
                <span className="text-slate-600">
                    {[item.ward, item.district, item.province].filter(Boolean).join(', ') || 'N/A'}
                </span>
            )
        },
        {
            header: 'Diện Tích',
            key: 'area',
            render: (item) => (
                <span className="font-bold text-emerald-700">
                    {item.area ? `${item.area} ha` : '0 ha'}
                </span>
            ),
        },
    ];

    // Định nghĩa cột cho Bảng Sản Phẩm
    const productColumns: Column<ProductDto>[] = [
        {
            header: 'Tên Nông Sản',
            key: 'name',
            render: (item) => <span className="font-bold text-slate-900">{item.name}</span>
        },
        { header: 'Tên Ngắn (Mã)', key: 'shortName' },
        { header: 'Nhóm / Chủng Loại', key: 'variety' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => (
                <AppBadge
                    status={item.status || 'ACTIVE'}
                    label={item.status === 'ACTIVE' ? 'Đang kinh doanh' : (item.status || 'Đang hoạt động')}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Tiêu Đề Màn Hình */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900">Bảng Điều Khiển Tổng Quan Hợp Tác Xã</h2>
                    </div>
                    <p className="text-xs text-slate-500 pl-11">
                        Quản lý quy trình sản xuất, giám sát vùng trồng & tiếp nhận nông sản từ nông dân.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold shadow-2xs"
                    >
                        <RotateCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
                        <span>Làm mới dữ liệu</span>
                    </button>
                </div>
            </div>

            {/* Thông báo lỗi nếu có */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* 4 Thẻ Thống Kê KPI Tổng Quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Sản phẩm */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sản Phẩm Đang Quản Lý</span>
                        <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                            <Package className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-slate-900">{products.length}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Nông sản
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Danh mục sản phẩm của HTX</p>
                </div>

                {/* Card 2: Vùng trồng */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vùng Trồng Đã Đăng Ký</span>
                        <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                            <MapPin className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-slate-900">{farmAreas.length}</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            Khu vực
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Liên kết Master Data vùng trồng</p>
                </div>

                {/* Card 3: Diện tích */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Diện Tích Canh Tác</span>
                        <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                            <Layers className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-emerald-700">{totalArea} <span className="text-base font-semibold text-slate-600">ha</span></span>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            Hợp tác
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Cập nhật trực tiếp từ hệ thống</p>
                </div>

                {/* Card 4: Trạng thái hệ thống */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hệ Thống Backend & SC</span>
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-emerald-600">SẴN SÀNG</span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-400">API Gateway v1 & Smart Contract</p>
                </div>
            </div>

            {/* Lối Tắt Hành Động Nhanh (Action Shortcuts) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl text-white shadow-xs flex items-center justify-between cursor-pointer hover:opacity-95 transition">
                    <div>
                        <p className="text-xs font-medium text-emerald-100">Tiếp nhận lô</p>
                        <p className="text-sm font-bold">Lô nông sản mới</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/80" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Sơ chế & Phân loại</p>
                        <p className="text-sm font-bold text-slate-800">Quy trình sơ chế</p>
                    </div>
                    <Layers className="w-5 h-5 text-slate-400" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Đóng gói thương mại</p>
                        <p className="text-sm font-bold text-slate-800">Tạo tem QR Code</p>
                    </div>
                    <QrCode className="w-5 h-5 text-slate-400" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Quản lý nhân sự</p>
                        <p className="text-sm font-bold text-slate-800">Phân công công nhân</p>
                    </div>
                    <Users className="w-5 h-5 text-slate-400" />
                </div>
            </div>

            {/* Khu vực Bảng Dữ Liệu Chi Tiết */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                {/* Thanh Chuyển Tab & Ô Tìm Kiếm */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('farmAreas')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'farmAreas'
                                ? 'bg-white text-emerald-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Vùng Trồng Canh Tác ({farmAreas.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'products'
                                ? 'bg-white text-emerald-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Package className="w-3.5 h-3.5" />
                            <span>Danh Mục Nông Sản ({products.length})</span>
                        </button>
                    </div>

                    {/* Ô Tìm kiếm */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={activeTab === 'farmAreas' ? 'Tìm vùng trồng, mã số, chủ đơn vị...' : 'Tìm tên nông sản, giống...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                    </div>
                </div>

                {/* Nội dung Tab 1: Vùng Trồng */}
                {activeTab === 'farmAreas' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>Danh Sách Vùng Trồng Quản Lý</span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                                    Thực tế
                                </span>
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-500 text-sm font-medium">
                                <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                                Đang tải danh sách vùng trồng từ Backend API...
                            </div>
                        ) : filteredFarmAreas.length > 0 ? (
                            <AppTable columns={farmAreaColumns} data={filteredFarmAreas} />
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-sm italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                {searchTerm ? 'Không tìm thấy vùng trồng phù hợp với từ khóa.' : 'Chưa có dữ liệu vùng trồng trong hệ thống.'}
                            </div>
                        )}
                    </div>
                )}

                {/* Nội dung Tab 2: Sản Phẩm Nông Sản */}
                {activeTab === 'products' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>Danh Mục Sản Phẩm Nông Nghiệp</span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                                    Kinh doanh
                                </span>
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-500 text-sm font-medium">
                                <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                                Đang tải danh mục sản phẩm từ Backend API...
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <AppTable columns={productColumns} data={filteredProducts} />
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-sm italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                {searchTerm ? 'Không tìm thấy sản phẩm phù hợp với từ khóa.' : 'Chưa có dữ liệu sản phẩm trong hệ thống.'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
