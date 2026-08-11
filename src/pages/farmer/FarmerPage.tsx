import React, { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { apiClient } from '../../services/api';
import { RefreshCw, CheckCircle, Plus } from 'lucide-react';

export interface AssignedBatchResponse {
    batchId: string;
    batchCode: string;
    fruitTypeName: string;
    productName: string;
    farmAreaName: string;
    currentStage: string;
    plantingDate?: string;
    expectedQuantity?: number;
    isRepresentative: boolean;
    assignedDate?: string;
    workerStatus: string;
}

export const FarmerPage: React.FC = () => {
    const [batches, setBatches] = useState<AssignedBatchResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    const handleRespondInvitation = async (invitationId: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            await apiClient.put(`/v1/farmer/invitations/${invitationId}/respond`, { action });
            alert(action === 'ACCEPT' ? 'Đã chấp nhận liên kết với Hợp tác xã!' : 'Đã từ chối lời mời!');
            // Refresh lại danh sách nếu cần
        } catch (err) {
            alert('Phản hồi lời mời thất bại.');
        }
    };

    const fetchAssignedBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<AssignedBatchResponse[]>('/v1/farmer/batches/assigned');
            setBatches(response.data);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi tải danh sách lô phân công:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể tải danh sách lô phân công từ Backend API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initFetch = async () => {
            await fetchAssignedBatches();
        };
        void initFetch();
    }, [fetchAssignedBatches]);

    const handleAcceptBatch = async (batchId: string) => {
        setAcceptingId(batchId);
        try {
            await apiClient.put(`/v1/farmer/batches/${batchId}/accept`);
            alert('Đã xác nhận nhận lô phân công thành công!');
            fetchAssignedBatches();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(errorObj.response?.data?.message || 'Xác nhận nhận lô thất bại!');
        } finally {
            setAcceptingId(null);
        }
    };

    const columns: Column<AssignedBatchResponse>[] = [
        { header: 'Mã lô', key: 'batchCode' },
        { header: 'Tên sản phẩm', key: 'productName' },
        { header: 'Loại trái cây', key: 'fruitTypeName' },
        { header: 'Vùng canh tác', key: 'farmAreaName' },
        { header: 'Giai đoạn', key: 'currentStage' },
        {
            header: 'Trạng thái công nhân',
            key: 'workerStatus',
            render: (item) => <AppBadge status={item.workerStatus} label={item.workerStatus} />,
        },
        {
            header: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    {item.workerStatus !== 'ACCEPTED' ? (
                        <button
                            onClick={() => handleAcceptBatch(item.batchId)}
                            disabled={acceptingId === item.batchId}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Xác nhận nhận lô</span>
                        </button>
                    ) : (
                        <span className="text-xs font-bold text-green-700">✓ Đã tiếp nhận</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Lô Phân Công Canh Tác (Nông Dân)</h2>
                    <p className="text-xs text-slate-500">Đồng bộ trực tiếp dữ liệu API Backend (`/api/v1/farmer/batches/assigned`)</p>
                </div>
                <div className="flex gap-3">
                    <AppButton
                        variant="grey"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        onClick={fetchAssignedBatches}
                    >
                        Làm mới
                    </AppButton>
                    <AppButton variant="green" leftIcon={<Plus className="w-4 h-4" />}>
                        Ghi nhật ký mới
                    </AppButton>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
                    Đang kết nối Backend API và tải danh sách lô phân công...
                </div>
            ) : (
                <AppTable columns={columns} data={batches} />
            )}
        </div>
    );
};
