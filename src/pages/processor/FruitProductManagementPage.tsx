
import React, { useState, useEffect, useCallback } from 'react';
import { Package, RefreshCw, AlertCircle } from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { processorService, type FruitTypeDto, type ProductDto } from '../../services/processorService';

export const FruitProductManagementPage: React.FC = () => {
    const [fruitTypes, setFruitTypes] = useState<FruitTypeDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [ftRes, pRes] = await Promise.allSettled([
                processorService.getFruitTypes(),
                processorService.getProducts(),
            ]);

            if (ftRes.status === 'fulfilled') {
                setFruitTypes(ftRes.value);
            }
            if (pRes.status === 'fulfilled') {
                setProducts(pRes.value);
            }
        } catch (err) {
            console.error('Lỗi tải dữ liệu danh bản:', err);
            setError('Không thể lấy dữ liệu từ Backend API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const fruitColumns: Column<FruitTypeDto>[] = [
        { header: 'Tên Loại Trái Cây', key: 'name' },
        { header: 'Mã Viết Tắt', key: 'code' },
        { header: 'Mô Tả Ghi Chú', key: 'description' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    const productColumns: Column<ProductDto>[] = [
        { header: 'Tên Sản Phẩm', key: 'name' },
        { header: 'Tên Viết Tắt', key: 'shortName' },
        { header: 'Chủng Loại / Giống', key: 'variety' },
        { header: 'Nhóm Sản Phẩm', key: 'groupName' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Quản Lý Danh Bản Loại Trái Cây & Sản Phẩm</h2>
                    <p className="text-xs text-slate-500">Đồng bộ trực tiếp dữ liệu danh bản từ Backend API (`/api/v1/processor/fruit-types` và `/api/v1/processor/products`)</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Bảng 1: Danh sách loại hoa quả */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        <span>Danh Sách Loại Trái Cây ({fruitTypes.length})</span>
                    </h3>
                </div>
                {loading ? (
                    <div className="py-8 text-center text-slate-500 text-sm">Đang tải loại trái cây...</div>
                ) : fruitTypes.length > 0 ? (
                    <AppTable columns={fruitColumns} data={fruitTypes} showSTT={true} />
                ) : (
                    <div className="py-8 text-center text-slate-400 italic text-sm">Chưa có loại trái cây nào trong Database Backend.</div>
                )}
            </div>

            {/* Bảng 2: Danh sách sản phẩm thương mại */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span>Danh Mục Sản Phẩm Đóng Gói ({products.length})</span>
                    </h3>
                </div>
                {loading ? (
                    <div className="py-8 text-center text-slate-500 text-sm">Đang tải sản phẩm...</div>
                ) : products.length > 0 ? (
                    <AppTable columns={productColumns} data={products} showSTT={true} />
                ) : (
                    <div className="py-8 text-center text-slate-400 italic text-sm">Chưa có sản phẩm nào trong Database Backend.</div>
                )}
            </div>
        </div>
    );
};
