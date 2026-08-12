import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';
import { useAuthStore } from '../../stores/authStore';
import { translateStage } from '../../types';
import { useUIStore } from '../../stores/uiStore';

import {
    farmerService,
    type AssignedBatch,
    type CultivationLog,
} from '../../services/farmerService';
import {
    RefreshCw,
    Plus,
    Wheat,
    Crown,
    FileText,
    Search,
    AlertTriangle,
    Layers,
    Activity,
    UserCheck,
    Clock,
    BookOpen,
    Calendar,
    ShieldCheck,
    CheckCircle2,
} from 'lucide-react';

export const FarmerBatchesPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);

    const [batches, setBatches] = useState<AssignedBatch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [activeTab, setActiveTab] = useState<'batches' | 'logs'>('batches');

    // State Modal Ghi Nhật Ký
    const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
    const [logBatchId, setLogBatchId] = useState<string>('');
    const [activityType, setActivityType] = useState<string>('Bón phân');
    const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 16));
    const [description, setDescription] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // State Modal Thu Hoạch (Harvest)
    const [isHarvestModalOpen, setIsHarvestModalOpen] = useState<boolean>(false);
    const [harvestBatchId, setHarvestBatchId] = useState<string>('');
    const [harvestDate, setHarvestDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [harvestQuantity, setHarvestQuantity] = useState<number | ''>('');
    const [harvestUnit, setHarvestUnit] = useState<string>('kg');
    const [initialQuality, setInitialQuality] = useState<string>('Loại 1 (Xuất khẩu)');
    const [harvestNotes, setHarvestNotes] = useState<string>('');

    const submittingOperations = useUIStore((state) => state.submittingOperations);
    const setSubmittingOperation = useUIStore((state) => state.setSubmittingOperation);
    const [isAcceptSuccessOpen, setIsAcceptSuccessOpen] = useState<boolean>(false);
    const [selectedBatchForLogs, setSelectedBatchForLogs] = useState<string>('');
    const [batchLogs, setBatchLogs] = useState<CultivationLog[]>([]);
    const [logsLoading, setLogsLoading] = useState<boolean>(false);

    const fetchAssignedBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await farmerService.getAssignedBatches();
            setBatches(data);
            if (data.length > 0 && !selectedBatchForLogs) {
                setSelectedBatchForLogs(data[0].batchId);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            setError(errorObj.response?.data?.message || 'Không thể kết nối API danh sách lô phân công.');
        } finally {
            setLoading(false);
        }
    }, [selectedBatchForLogs]);

    useEffect(() => {
        void fetchAssignedBatches();
    }, [fetchAssignedBatches]);

    const fetchBatchLogs = useCallback(async (batchId: string) => {
        if (!batchId) return;
        setLogsLoading(true);
        try {
            const data = await farmerService.getCultivationLogsByBatch(batchId);
            setBatchLogs(data);
        } catch (err) {
            setBatchLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedBatchForLogs && activeTab === 'logs') {
            void fetchBatchLogs(selectedBatchForLogs);
        }
    }, [selectedBatchForLogs, activeTab, fetchBatchLogs]);

    const filteredBatches = useMemo(() => {
        return batches.filter((b) => {
            const matchesSearch =
                b.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.fruitTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.farmAreaName.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;
            if (statusFilter === 'PENDING') return b.workerStatus !== 'ACCEPTED';
            if (statusFilter === 'ACCEPTED') return b.workerStatus === 'ACCEPTED';
            if (statusFilter === 'REPRESENTATIVE') return b.isRepresentative;
            return true;
        });
    }, [batches, searchQuery, statusFilter]);

    const handleAcceptBatch = async (batchId: string) => {
        setSubmittingOperation(`accept-${batchId}`, true);
        try {
            await farmerService.acceptBatch(batchId);
            setIsAcceptSuccessOpen(true);
            await fetchAssignedBatches();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(errorObj.response?.data?.message || 'Xác nhận nhận lô thất bại!');
        } finally {
            setSubmittingOperation(`accept-${batchId}`, false);
        }
    };

    const handleCreateLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!logBatchId) {
            alert('Vui lòng chọn lô sản xuất!');
            return;
        }
        if (!description.trim()) {
            alert('Vui lòng nhập nội dung nhật ký!');
            return;
        }

        setSubmittingOperation('createLog', true);
        try {
            const formData = new FormData();
            formData.append('ActivityType', activityType);
            formData.append('Description', description);
            formData.append('LogDate', logDate);
            selectedFiles.forEach((file) => formData.append('Images', file));

            await farmerService.createCultivationLog(logBatchId, formData);
            alert('Đã ghi nhận nhật ký canh tác thành công!');
            setDescription('');
            setSelectedFiles([]);
            setIsLogModalOpen(false);

            if (activeTab === 'logs') void fetchBatchLogs(logBatchId);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(errorObj.response?.data?.message || 'Ghi nhật ký thất bại!');
        } finally {
            setSubmittingOperation('createLog', false);
        }
    };

    const handleHarvestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!harvestBatchId) {
            alert('Vui lòng chọn lô thu hoạch!');
            return;
        }
        if (!harvestQuantity || Number(harvestQuantity) <= 0) {
            alert('Sản lượng thu hoạch phải lớn hơn 0!');
            return;
        }

        setSubmittingOperation('harvest', true);
        try {
            const result = await farmerService.harvestBatch(harvestBatchId, {
                harvestDate: new Date(harvestDate).toISOString(),
                quantity: Number(harvestQuantity),
                unit: harvestUnit,
                initialQuality: initialQuality,
                notes: harvestNotes,
            });

            alert(`Xác nhận Thu Hoạch Lô ${result.batchCode} Thành Công! Trạng thái Smart Contract: ${result.stage}`);
            setIsHarvestModalOpen(false);
            setHarvestQuantity('');
            setHarvestNotes('');
            await fetchAssignedBatches();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(errorObj.response?.data?.message || 'Xác nhận thu hoạch thất bại! Bạn cần là Người Đại Diện của lô.');
        } finally {
            setSubmittingOperation('harvest', false);
        }
    };

    const columns: Column<AssignedBatch>[] = [
        {
            header: 'Mã Lô',
            key: 'batchCode',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.batchCode}</span>
                    {item.isRepresentative && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-600" /> Đại diện
                        </span>
                    )}
                </div>
            ),
        },
        { header: 'Tên Sản Phẩm', key: 'productName' },
        { header: 'Loại Trái Cây', key: 'fruitTypeName' },
        { header: 'Vùng Canh Tác', key: 'farmAreaName' },
        {
            header: 'Giai Đoạn',
            key: 'currentStage',
            render: (item) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    <Activity className="w-3.5 h-3.5 text-slate-600" />
                    {translateStage(item.currentStage)}
                </span>
            ),

        },
        {
            header: 'Trạng Thái Nông Dân',
            key: 'workerStatus',
            render: (item) => (
                <AppBadge
                    status={item.workerStatus === 'ACCEPTED' ? 'DA_DUYET' : 'DANG_XU_LY'}
                    label={item.workerStatus === 'ACCEPTED' ? 'Đã tiếp nhận' : 'Chờ xác nhận'}
                />
            ),
        },
        {
            header: 'Thao Tác',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    {item.workerStatus !== 'ACCEPTED' ? (
                        <AppButton
                            variant="green"
                            size="sm"
                            onClick={() => handleAcceptBatch(item.batchId)}
                            isLoading={submittingOperations[`accept-${item.batchId}`]}
                            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                            className="bg-slate-800 hover:bg-slate-900 text-white border-0 shadow-xs cursor-pointer"
                        >
                            Xác nhận nhận lô
                        </AppButton>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {(item.currentStage === 'STAGE_PLANTING' || item.currentStage === 'PLANTING') && (
                                <button
                                    onClick={() => {
                                        setLogBatchId(item.batchId);
                                        setIsLogModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5 text-slate-600" /> Ghi nhật ký
                                </button>
                            )}
                            {item.isRepresentative && (item.currentStage === 'STAGE_PLANTING' || item.currentStage === 'PLANTING') && (
                                <button
                                    onClick={() => {
                                        setHarvestBatchId(item.batchId);
                                        setIsHarvestModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Wheat className="w-3.5 h-3.5" /> Thu hoạch
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Trang Lô Phân Công */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <Layers className="w-7 h-7 text-emerald-600" />
                        Danh Sách Lô Phân Công Nông Dân
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Xem danh sách các lô nông sản được phân công, xác nhận tiếp nhận lô và ghi nhật ký canh tác.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AppButton 
                        variant="outline" 
                        onClick={fetchAssignedBatches} 
                        isLoading={loading}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                        Làm mới
                    </AppButton>
                    <AppButton
                        onClick={() => {
                            const activeBatches = batches.filter(b => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING');
                            if (activeBatches.length > 0) setLogBatchId(activeBatches[0].batchId);
                            setIsLogModalOpen(true);
                        }}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    >
                        Ghi Nhật Ký Canh Tác
                    </AppButton>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('batches')}
                    className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'batches'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Layers className="w-4 h-4" /> Danh Sách Lô Phân Công
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'logs'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <FileText className="w-4 h-4" /> Nhật Ký Canh Tác Đã Ghi
                </button>
            </div>

            {/* TAB 1: Danh sách Lô */}
            {activeTab === 'batches' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã lô, tên sp, vùng trồng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-bold text-slate-500">Lọc:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                            >
                                <option value="ALL">Tất cả lô</option>
                                <option value="PENDING">Chờ xác nhận tiếp nhận</option>
                                <option value="ACCEPTED">Đã tiếp nhận</option>
                                <option value="REPRESENTATIVE">Lô là Người đại diện</option>
                            </select>
                        </div>
                    </div>

                    <AppTable columns={columns} data={filteredBatches} isLoading={loading} />
                </div>
            )}

            {/* TAB 2: Nhật ký canh tác */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" /> Lịch Sử Nhật Ký Lô
                        </h2>
                        <select
                            value={selectedBatchForLogs}
                            onChange={(e) => setSelectedBatchForLogs(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                        >
                            {batches.map((b) => (
                                <option key={b.batchId} value={b.batchId}>
                                    Lô {b.batchCode} - {b.productName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {logsLoading ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Đang tải nhật ký...</div>
                    ) : batchLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm border border-dashed rounded-xl">Chưa có ghi chép nhật ký nào.</div>
                    ) : (
                        <div className="space-y-3">
                            {batchLogs.map((log) => (
                                <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">{log.activityType}</span>
                                        <span className="text-xs text-slate-500">{new Date(log.logDate).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <p className="text-xs text-slate-800">{log.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL GHI NHẬT KÝ */}
            <AppModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Ghi Nhật Ký Canh Tác">
                <form onSubmit={handleCreateLogSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lô Canh Tác *</label>
                        <select
                            value={logBatchId}
                            onChange={(e) => setLogBatchId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                        >
                            <option value="">-- Chọn Lô --</option>
                            {batches.filter((b) => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING').map((b) => (
                                <option key={b.batchId} value={b.batchId}>Lô {b.batchCode} - {b.productName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung công việc *</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <AppButton variant="outline" type="button" onClick={() => setIsLogModalOpen(false)}>Hủy</AppButton>
                        <AppButton className="bg-emerald-600 text-white" type="submit" isLoading={submittingOperations['createLog']}>Lưu & Upload IPFS</AppButton>
                    </div>
                </form>
            </AppModal>

            {/* MODAL THU HOẠCH */}
            <AppModal isOpen={isHarvestModalOpen} onClose={() => setIsHarvestModalOpen(false)} title="Thu Hoạch Lô Canh Tác">
                <form onSubmit={handleHarvestSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lô Thu Hoạch *</label>
                        <select
                            value={harvestBatchId}
                            onChange={(e) => setHarvestBatchId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                        >
                            <option value="">-- Chọn Lô Phụ Trách Đại Diện --</option>
                            {batches.filter((b) => b.isRepresentative && (b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING')).map((b) => (
                                <option key={b.batchId} value={b.batchId}>Lô {b.batchCode} - {b.productName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sản lượng (kg) *</label>
                        <input
                            type="number"
                            value={harvestQuantity}
                            onChange={(e) => setHarvestQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                            required
                            className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <AppButton variant="outline" type="button" onClick={() => setIsHarvestModalOpen(false)}>Hủy</AppButton>
                        <AppButton className="bg-emerald-600 text-white" type="submit" isLoading={submittingOperations['harvest']}>Ký & Gửi Giao Dịch Thu Hoạch</AppButton>
                    </div>
                </form>
            </AppModal>

            {/* POPUP THÀNH CÔNG TIẾP NHẬN LÔ */}
            <AppModal
                isOpen={isAcceptSuccessOpen}
                onClose={() => setIsAcceptSuccessOpen(false)}
                title="Thông báo thành công"
                maxWidth="sm"
            >
                <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-xs">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800 mb-2">Thao tác thành công</h3>
                    <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                        Bạn đã xác nhận tiếp nhận lô phân công thành công!
                    </p>
                    <AppButton
                        onClick={() => setIsAcceptSuccessOpen(false)}
                        variant="green"
                        className="w-full py-2.5 rounded-xl font-bold shadow-md shadow-emerald-500/20"
                    >
                        Đóng
                    </AppButton>
                </div>
            </AppModal>
        </div>
    );
};
