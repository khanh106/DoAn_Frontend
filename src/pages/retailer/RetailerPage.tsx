// src/pages/retailer/RetailerPage.tsx
import React, { useState, useEffect } from 'react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { apiClient } from '../../services/api';
import { RefreshCw, Truck, ShoppingBag } from 'lucide-react';

// DTO khớp 100% với ShipmentHistoryDto của Backend .NET API
export interface ShipmentResponse {
    id: string;
    shipmentCode: string;
    senderName: string;
    receiverName: string;
    productName: string;
    departureDate?: string;
    arrivalDate?: string;
    status: string;
}

export const RetailerPage: React.FC = () => {
    const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Gọi API Backend: GET /api/v1/retailer/shipments
    const fetchShipments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<ShipmentResponse[]>('/v1/retailer/shipments');
            setShipments(response.data);
        } catch (err: any) {
            console.error('Lỗi tải danh sách vận đơn Retailer:', err);
            setError(err?.response?.data?.message || 'Không thể tải danh sách lô hàng từ Backend API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    // Gọi API Tiếp nhận lô hàng: POST /api/v1/retailer/shipments/{id}/receive
    const handleReceiveShipment = async (id: string) => {
        setActionLoading(id);
        try {
            await apiClient.post(`/v1/retailer/shipments/${id}/receive`);
            alert('Tiếp nhận lô hàng thành công!');
            fetchShipments();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Tiếp nhận lô hàng thất bại!');
        } finally {
            setActionLoading(null);
        }
    };

    // Gọi API Đưa sản phẩm lên kệ (READY FOR SALE): POST /api/v1/retailer/shipments/{id}/ready-for-sale
    const handleReadyForSale = async (id: string) => {
        setActionLoading(id);
        try {
            await apiClient.post(`/v1/retailer/shipments/${id}/ready-for-sale`);
            alert('Đã chuyển trạng thái READY FOR SALE thành công!');
            fetchShipments();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Chuyển trạng thái bán thất bại!');
        } finally {
            setActionLoading(null);
        }
    };

    const columns: Column<ShipmentResponse>[] = [
        { header: 'Mã vận đơn', key: 'shipmentCode' },
        { header: 'Sản phẩm', key: 'productName' },
        { header: 'Đơn vị gửi', key: 'senderName' },
        { header: 'Đơn vị nhận', key: 'receiverName' },
        {
            header: 'Trạng thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status} label={item.status} />,
        },
        {
            header: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleReceiveShipment(item.id)}
                        disabled={actionLoading === item.id || item.status !== 'IN_TRANSIT'}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Tiếp nhận</span>
                    </button>
                    <button
                        onClick={() => handleReadyForSale(item.id)}
                        disabled={actionLoading === item.id || item.status === 'READY_FOR_SALE'}
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Ready for Sale</span>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Quản lý Kệ hàng & Bán lẻ (Retailer)</h2>
                    <p className="text-xs text-slate-500">Đồng bộ trực tiếp dữ liệu API Backend (`/api/v1/retailer/shipments`)</p>
                </div>
                <AppButton
                    variant="grey"
                    leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                    onClick={fetchShipments}
                >
                    Làm mới
                </AppButton>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
                    Đang kết nối Backend API và tải danh sách lô hàng...
                </div>
            ) : (
                <AppTable columns={columns} data={shipments} />
            )}
        </div>
    );
};
