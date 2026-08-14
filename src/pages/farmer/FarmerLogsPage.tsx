import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';


import {
    farmerService,
    type AssignedBatch,
    type CultivationLog,
} from '../../services/farmerService';
import { resolveIpfsUrl } from '../../services/ipfsService';
import { toast } from '../../utils/toast';

import {
    FileText,
    Plus,
    RefreshCw,
    Search,
    Calendar,
    Filter,
    Droplets,
    Sprout,
    ShieldAlert,
    Scissors,
    CheckCircle2,
    Upload,
    X,
    Eye,
    Tag,
    Clock,
    UserCheck,
    Layers,
    Sparkles,
    Image as ImageIcon,
} from 'lucide-react';

// Các loại hoạt động canh tác phổ biến
const ACTIVITY_TYPES = [
    { label: 'Tất cả hoạt động', value: 'ALL', icon: Layers, color: 'text-slate-600' },
    { label: 'Bón phân', value: 'Bón phân', icon: Sprout, color: 'text-emerald-600' },
    { label: 'Tưới nước', value: 'Tưới nước', icon: Droplets, color: 'text-blue-600' },
    { label: 'Phun thuốc bảo vệ', value: 'Phun thuốc', icon: ShieldAlert, color: 'text-amber-600' },
    { label: 'Cắt tỉa / Chăm sóc', value: 'Cắt tỉa', icon: Scissors, color: 'text-purple-600' },
    { label: 'Kiểm tra sâu bệnh', value: 'Kiểm tra sâu bệnh', icon: Search, color: 'text-rose-600' },
    { label: 'Làm cỏ / Vệ sinh', value: 'Làm cỏ', icon: CheckCircle2, color: 'text-teal-600' },
    { label: 'Thu hoạch', value: 'Thu hoạch', icon: Sparkles, color: 'text-orange-600' },
];

export const FarmerLogsPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);

    // State danh sách lô phân công & nhật ký
    const [batches, setBatches] = useState<AssignedBatch[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
    const [logs, setLogs] = useState<CultivationLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [logsLoading, setLogsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // State bộ lọc
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>('ALL');

    // State Modal Tạo Nhật Ký Mới
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [formBatchId, setFormBatchId] = useState<string>('');
    const [formActivityType, setFormActivityType] = useState<string>('Bón phân');
    const [formLogDate, setFormLogDate] = useState<string>(new Date().toISOString().slice(0, 16));
    const [formDescription, setFormDescription] = useState<string>('');
    const [formFiles, setFormFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const submittingOperations = useUIStore((state) => state.submittingOperations);
    const setSubmittingOperation = useUIStore((state) => state.setSubmittingOperation);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // State Xem Ảnh Chi Tiết (Lightbox)
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // 1. Tải danh sách lô phân công của Nông dân
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await farmerService.getAssignedBatches();
            // Lọc chỉ lấy các lô nông dân đã tiếp nhận (workerStatus === 'ACCEPTED')
            const acceptedBatches = (data || []).filter((b) => b.workerStatus === 'ACCEPTED');
            setBatches(acceptedBatches);
            if (acceptedBatches.length > 0 && !formBatchId) {
                const activeBatches = acceptedBatches.filter((b) => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING');
                if (activeBatches.length > 0) {
                    setFormBatchId(activeBatches[0].batchId);
                }
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Không thể tải danh sách lô phân công.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [formBatchId]);


    // 2. Tải nhật ký canh tác của tất cả các lô hoặc lô được chọn
    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            if (selectedBatchId !== 'ALL') {
                const data = await farmerService.getCultivationLogsByBatch(selectedBatchId);
                setLogs(data);
            } else {
                // Tải nhật ký cho tất cả các lô phân công
                if (batches.length === 0) {
                    setLogs([]);
                    return;
                }
                const allLogPromises = batches.map((b) =>
                    farmerService.getCultivationLogsByBatch(b.batchId).catch(() => [])
                );
                const results = await Promise.all(allLogPromises);
                const combinedLogs = results.flat().sort((a, b) => {
                    return new Date(b.logDate).getTime() - new Date(a.logDate).getTime();
                });
                setLogs(combinedLogs);
            }
        } catch (err) {
            console.error('Lỗi tải nhật ký canh tác:', err);
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, [selectedBatchId, batches]);

    useEffect(() => {
        void fetchBatches();
    }, [fetchBatches]);

    useEffect(() => {
        if (batches.length >= 0) {
            void fetchLogs();
        }
    }, [fetchLogs, batches]);

    // Xử lý chọn tệp ảnh & preview
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setFormFiles((prev) => [...prev, ...filesArray]);

            const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file));
            setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFormFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Reset Form Modal
    const resetForm = () => {
        const activeBatches = batches.filter((b) => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING');
        if (activeBatches.length > 0) {
            setFormBatchId(activeBatches[0].batchId);
        } else {
            setFormBatchId('');
        }
        setFormActivityType('Bón phân');
        setFormLogDate(new Date().toISOString().slice(0, 16));
        setFormDescription('');
        setFormFiles([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setFormError(null);
        setFormSuccess(null);
    };

    // Gửi Form tạo Nhật ký canh tác mới
    const handleSubmitLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        if (!formBatchId) {
            setFormError('Vui lòng chọn Lô sản xuất!');
            toast.warning('Vui lòng chọn Lô sản xuất!');
            return;
        }

        if (!formDescription.trim()) {
            setFormError('Vui lòng nhập mô tả chi tiết hoạt động canh tác!');
            toast.warning('Vui lòng nhập mô tả chi tiết hoạt động canh tác!');
            return;
        }

        setSubmittingOperation('createLog', true);
        try {
            const formData = new FormData();
            formData.append('ActivityType', formActivityType);
            formData.append('Description', formDescription);
            formData.append('LogDate', formLogDate);
            formFiles.forEach((file) => {
                formData.append('Images', file);
            });

            await farmerService.createCultivationLog(formBatchId, formData);
            toast.success('Ghi nhật ký canh tác thành công!');
            setFormSuccess('Ghi nhật ký canh tác thành công!');

            setTimeout(() => {
                setIsCreateModalOpen(false);
                resetForm();
                void fetchLogs();
            }, 1200);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Không thể ghi nhật ký. Vui lòng thử lại!';
            setFormError(msg);
            toast.error(msg);
        } finally {
            setSubmittingOperation('createLog', false);
        }
    };

    // Lọc danh sách nhật ký hiển thị
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesActivity =
                selectedActivityFilter === 'ALL' || log.activityType === selectedActivityFilter;
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !query ||
                log.description.toLowerCase().includes(query) ||
                log.activityType.toLowerCase().includes(query) ||
                (log.batchCode && log.batchCode.toLowerCase().includes(query));
            return matchesActivity && matchesSearch;
        });
    }, [logs, selectedActivityFilter, searchQuery]);

    // Thống kê nhanh
    const stats = useMemo(() => {
        return {
            totalLogs: logs.length,
            totalBatches: batches.length,
            bonPhanCount: logs.filter((l) => l.activityType === 'Bón phân').length,
            tuoiNuocCount: logs.filter((l) => l.activityType === 'Tưới nước').length,
            phunThuocCount: logs.filter((l) => l.activityType === 'Phun thuốc').length,
        };
    }, [logs, batches]);

    return (
        <div className="space-y-6 pb-12">
            {/* 1. HEADER CHÍNH */}
            <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider text-emerald-100 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> PORTAL NÔNG DÂN
                            </span>
                            <span className="bg-emerald-500/30 backdrop-blur-md text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                                Off-Chain SQL + IPFS
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            Nhật Ký Canh Tác Nông Nghiệp
                        </h1>
                        <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
                            Theo dõi, ghi chép nhật ký hoạt động tưới nước, bón phân, chăm sóc thực địa từng lô nông sản.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <AppButton
                            variant="outline"
                            leftIcon={<RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />}
                            onClick={() => void fetchLogs()}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md"
                        >
                            Làm mới
                        </AppButton>

                        <AppButton
                            variant="orange"
                            leftIcon={<Plus className="w-5 h-5" />}
                            onClick={() => {
                                resetForm();
                                setIsCreateModalOpen(true);
                            }}
                            className="shadow-lg shadow-orange-500/30"
                        >
                            Ghi nhật ký mới
                        </AppButton>
                    </div>
                </div>
            </div>

            {/* 2. KHU VỰC THỐNG KÊ NHANH */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Tổng nhật ký</p>
                        <p className="text-2xl font-extrabold text-slate-800">{stats.totalLogs}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Lô đang canh tác</p>
                        <p className="text-2xl font-extrabold text-slate-800">{stats.totalBatches}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <Sprout className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Lần bón phân</p>
                        <p className="text-2xl font-extrabold text-slate-800">{stats.bonPhanCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                        <Droplets className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Lần tưới nước</p>
                        <p className="text-2xl font-extrabold text-slate-800">{stats.tuoiNuocCount}</p>
                    </div>
                </div>
            </div>

            {/* 3. BỘ LỌC VÀ TÌM KIẾM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Ô tìm kiếm */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung nhật ký, loại hoạt động, mã lô..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                        />
                    </div>

                    {/* Lọc theo Lô sản xuất */}
                    <div className="flex items-center gap-2 min-w-[240px]">
                        <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Lô sản xuất:</span>
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            <option value="ALL">--- Tất cả các lô ---</option>
                            {batches.map((b) => (
                                <option key={b.batchId} value={b.batchId}>
                                    {b.batchCode} ({b.fruitTypeName} - {b.productName})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tabs lọc loại hoạt động */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {ACTIVITY_TYPES.map((act) => {
                        const Icon = act.icon;
                        const isActive = selectedActivityFilter === act.value;
                        return (
                            <button
                                key={act.value}
                                onClick={() => setSelectedActivityFilter(act.value)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
                                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{act.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. DANH SÁCH NHẬT KÝ CANH TÁC (TIMELINE FEED VIEW) */}
            {logsLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-600 font-semibold text-sm">Đang tải nhật ký canh tác thực địa...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-extrabold text-slate-700">Chưa có nhật ký nào</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                        Không tìm thấy nhật ký phù hợp với bộ lọc. Hãy thêm mới nhật ký canh tác đầu tiên!
                    </p>
                    <AppButton
                        variant="green"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => {
                            resetForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="mt-4"
                    >
                        Tạo nhật ký mới ngay
                    </AppButton>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredLogs.map((log) => {
                        const actInfo = ACTIVITY_TYPES.find((a) => a.value === log.activityType) || {
                            label: log.activityType,
                            icon: Tag,
                            color: 'text-emerald-600',
                        };
                        const Icon = actInfo.icon;
                        const imagesList = log.imageUrls || log.images || [];

                        return (
                            <div
                                key={log.id}
                                className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
                            >
                                {/* Log Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-slate-900 text-base">
                                                    {log.activityType}
                                                </span>
                                                {log.batchCode && (
                                                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-slate-200">
                                                        Lô: {log.batchCode}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(log.logDate).toLocaleString('vi-VN')}
                                                </span>
                                                {log.userFullName && (
                                                    <span className="flex items-center gap-1">
                                                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                                        {log.userFullName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <AppBadge status="DA_DUYET" label="Đã lưu SQL + IPFS" />
                                    </div>
                                </div>

                                {/* Log Description */}
                                <p className="text-slate-700 text-sm font-normal leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                                    {log.description}
                                </p>

                                {/* Gallery Ảnh Đính Kèm */}
                                {imagesList.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                                            Hình ảnh thực địa đính kèm ({imagesList.length})
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                            {imagesList.map((imgUrl, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setLightboxImage(imgUrl)}
                                                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-xs hover:shadow-md transition-all"
                                                >
                                                    <img
                                                        src={resolveIpfsUrl(imgUrl)}
                                                        alt={`Thực địa ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500';
                                                        }}
                                                    />

                                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <Eye className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 5. MODAL TẠO NHẬT KÝ CANH TÁC MỚI */}
            <AppModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Ghi Nhật Ký Canh Tác Thực Địa Mới"
                maxWidth="lg"
            >
                <form onSubmit={handleSubmitLog} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                            {formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl">
                            {formSuccess}
                        </div>
                    )}

                    {/* Lô sản xuất */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                            Chọn Lô sản xuất <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={formBatchId}
                            onChange={(e) => setFormBatchId(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                            {batches
                                .filter((b) => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING')
                                .map((b) => (
                                    <option key={b.batchId} value={b.batchId}>
                                        Mã lô: {b.batchCode} - {b.fruitTypeName} ({b.productName})
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Loại hoạt động & Thời gian */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                                Loại hoạt động <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={formActivityType}
                                onChange={(e) => setFormActivityType(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                                <option value="Bón phân">Bón phân</option>
                                <option value="Tưới nước">Tưới nước</option>
                                <option value="Phun thuốc">Phun thuốc bảo vệ</option>
                                <option value="Cắt tỉa">Cắt tỉa / Tỉa cành</option>
                                <option value="Kiểm tra sâu bệnh">Kiểm tra sâu bệnh</option>
                                <option value="Làm cỏ">Làm cỏ / Vệ sinh vườn</option>

                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                                Thời gian thực hiện <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={formLogDate}
                                onChange={(e) => setFormLogDate(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Mô tả hoạt động */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                            Mô tả chi tiết công việc <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Ví dụ: Bón 5kg phân hữu cơ vi sinh NPK cho mỗi gốc xoài. Thời tiết nắng ráo..."
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                        />
                    </div>

                    {/* Tải ảnh thực địa */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                            Ảnh thực địa đính kèm (Lưu trữ IPFS)
                        </label>
                        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="log-image-input"
                            />
                            <label htmlFor="log-image-input" className="cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                                <p className="text-xs font-bold text-slate-700">Nhấn để chọn ảnh từ máy tính/điện thoại</p>
                                <p className="text-[11px] text-slate-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 50MB tổng dung lượng)</p>
                            </label>
                        </div>

                        {/* List preview ảnh */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {previewUrls.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(idx)}
                                            className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <AppButton type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Hủy bỏ
                        </AppButton>
                        <AppButton type="submit" variant="green" isLoading={submittingOperations['createLog']} leftIcon={<Plus className="w-4 h-4" />}>
                            Xác nhận ghi nhật ký
                        </AppButton>
                    </div>
                </form>
            </AppModal>

            {/* 6. MODAL LIGHTBOX XEM ẢNH LỚN */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img src={resolveIpfsUrl(lightboxImage)} alt="Thực địa lớn" className="max-w-full max-h-[85vh] object-contain mx-auto" />

                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerLogsPage;
