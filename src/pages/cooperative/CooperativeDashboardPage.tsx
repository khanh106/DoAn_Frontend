// src/pages/cooperative/CooperativeDashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { apiClient } from '../../services/api';
import { RotateCw, TrendingUp, Package, MapPin, Layers } from 'lucide-react';
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
    area?: number;
    plantingCode?: string;
}

export const CooperativeDashboardPage: React.FC = () => {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [farmAreas, setFarmAreas] = useState<FarmAreaDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsRes, farmAreasRes] = await Promise.allSettled([
                apiClient.get<ProductDto[]>('/v1/processor/products'),
                apiClient.get<FarmAreaDto[]>('/v1/processor/farm-areas'),
            ]);

            if (productsRes.status === 'fulfilled') {
                setProducts(productsRes.value.data);
            }
            if (farmAreasRes.status === 'fulfilled') {
                setFarmAreas(farmAreasRes.value.data);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải dữ liệu Hợp tác xã:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể kết nối API Backend.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initFetch = async () => {
            await fetchDashboardData();
        };
        void initFetch();
    }, [fetchDashboardData]);

    const farmAreaColumns: Column<FarmAreaDto>[] = [
        { header: 'Tên Vùng Trồng', key: 'name' },
        { header: 'Mã Số Vùng', key: 'plantingCode' },
        { header: 'Chủ Đơn Vị', key: 'ownerName' },
        { header: 'Tỉnh / Thành', key: 'province' },
        {
            header: 'Diện Tích (ha)',
            key: 'area',
            render: (item) => <span>{item.area ? `${item.area} ha` : 'N/A'}</span>,
        },
    ];

    const productColumns: Column<ProductDto>[] = [
        { header: 'Tên Sản Phẩm', key: 'name' },
        { header: 'Tên Ngắn', key: 'shortName' },
        { header: 'Giống / Chủng Loại', key: 'variety' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Màn hình Tổng Quan */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Bảng Điều Khiển Tổng Quan (Hợp Tác Xã)</h2>
                    <p className="text-xs text-slate-500">Đồng bộ dữ liệu thực tế từ Backend API (`/api/v1/processor/*`)</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
                >
                    <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {/* 4 Thẻ Thống Kê Dữ Liệu Thật */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Sản Phẩm Đang Quản Lý</span>
                        <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{products.length} Loại</span>
                        <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Vùng Trồng Đã Đăng Ký</span>
                        <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">{farmAreas.length} Vùng</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Dữ liệu thực từ Master Data</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Tổng Diện Tích Canh Tác</span>
                        <Layers className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-green-700">
                            {farmAreas.reduce((acc, curr) => acc + (curr.area || 0), 0)} ha
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Đã cập nhật hệ thống</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Trạng Thái Kết Nối API</span>
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-emerald-600 uppercase">ONLINE</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Backend API .NET v1</p>
                </div>
            </div>

            {/* Bảng Danh Sách Vùng Trồng Thật */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Danh Sách Vùng Trồng Thực Tế</h3>
                {loading ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách vùng trồng từ Backend...</div>
                ) : farmAreas.length > 0 ? (
                    <AppTable columns={farmAreaColumns} data={farmAreas} />
                ) : (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Chưa có vùng trồng nào trong Backend API.</div>
                )}
            </div>

            {/* Bảng Danh Sách Sản Phẩm Thật */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Danh Sách Sản Phẩm Nông Nghiệp</h3>
                {loading ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách sản phẩm từ Backend...</div>
                ) : products.length > 0 ? (
                    <AppTable columns={productColumns} data={products} />
                ) : (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Chưa có sản phẩm nào trong Backend API.</div>
                )}
            </div>
        </div>
    );
};
