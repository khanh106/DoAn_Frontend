import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';
import { useAuthStore } from '../../stores/authStore';
import { translateStage } from '../../types';
import { useUIStore } from '../../stores/uiStore';
import { useNavigate } from 'react-router-dom';

import {
    farmerService,
    type AssignedBatch,
    type CultivationLog,
} from '../../services/farmerService';
import { toast } from '../../utils/toast';
import {
    RefreshCw,
    Plus,
    Wheat,
    Crown,
    FileText,
    Search,
    AlertTriangle,
    ShieldCheck,
    Layers,
    Activity,
    UserCheck,
    Clock,
    BookOpen,
    Image as ImageIcon,
    Calendar,
    CheckCircle2,
    MapPin,
    User,
    LogOut,
    Bell,
    ChevronRight,
    QrCode,
    X
} from 'lucide-react';

export const FarmerMobilePage: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    // State quản lý Tab hiện tại trên di động: 'home' | 'logs' | 'harvest' | 'profile'
    const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'logs' | 'harvest' | 'profile'>('home');

    // State danh sách lô phân công từ API
    const [batches, setBatches] = useState<AssignedBatch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Lọc & tìm kiếm
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedBatchForLogs, setSelectedBatchForLogs] = useState<string>('');
    const [batchLogs, setBatchLogs] = useState<CultivationLog[]>([]);
    const [logsLoading, setLogsLoading] = useState<boolean>(false);

    // State Modals
    const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
    const [logBatchId, setLogBatchId] = useState<string>('');
    const [activityType, setActivityType] = useState<string>('Bón phân');
    const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 16));
    const [description, setDescription] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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

    // 1. Hook kiểm tra kích thước thiết bị để điều hướng ngược lại Desktop
    useEffect(() => {
        const checkDevice = () => {
            // Nếu màn hình lớn hơn 768px (Desktop), chuyển về giao diện Desktop
            const isMobileDevice = window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
            if (!isMobileDevice) {
                navigate('/farmer/dashboard', { replace: true });
            }
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [navigate]);

    // 2. Tự động giải phóng bộ nhớ tạm của ảnh khi đóng modal ghi nhật ký
    useEffect(() => {
        if (!isLogModalOpen) {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            setPreviewUrls([]);
            setSelectedFiles([]);
        }
    }, [isLogModalOpen]);

    // 3. Tải danh sách lô phân công
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
            const msg = errorObj.response?.data?.message || 'Không thể kết nối máy chủ.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [selectedBatchForLogs]);

    useEffect(() => {
        void fetchAssignedBatches();
    }, [fetchAssignedBatches]);

    // 4. Tải nhật ký canh tác của 1 lô cụ thể
    const fetchBatchLogs = useCallback(async (batchId: string) => {
        if (!batchId) return;
        setLogsLoading(true);
        try {
            const data = await farmerService.getCultivationLogsByBatch(batchId);
            setBatchLogs(data);
        } catch (err) {
            console.error('Lỗi tải nhật ký:', err);
            setBatchLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedBatchForLogs && activeMobileTab === 'logs') {
            void fetchBatchLogs(selectedBatchForLogs);
        }
    }, [selectedBatchForLogs, activeMobileTab, fetchBatchLogs]);

    // Thống kê nhanh (KPI)
    const stats = useMemo(() => {
        const total = batches.length;
        const pending = batches.filter((b) => b.workerStatus !== 'ACCEPTED').length;
        const representative = batches.filter((b) => b.isRepresentative).length;
        const harvested = batches.filter((b) => b.currentStage !== 'STAGE_PLANTING' && b.currentStage !== 'PLANTING').length;
        return { total, pending, representative, harvested };
    }, [batches]);

    // Tiếp nhận lô phân công
    const handleAcceptBatch = async (batchId: string) => {
        setSubmittingOperation(`accept-${batchId}`, true);
        try {
            await farmerService.acceptBatch(batchId);
            toast.success('Xác nhận tiếp nhận lô phân công thành công!');
            setIsAcceptSuccessOpen(true);
            await fetchAssignedBatches();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            toast.error(errorObj.response?.data?.message || 'Tiếp nhận lô thất bại!');
        } finally {
            setSubmittingOperation(`accept-${batchId}`, false);
        }
    };

    // Hàm xử lý chọn/chụp file thực địa (cộng dồn ảnh vào danh sách)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...filesArray]);

            // Tạo link xem trước (preview) tạm thời
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls((prev) => [...prev, ...newPreviews]);
        }
    };

    // Hàm xóa ảnh trong danh sách chờ tải lên
    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Gửi nhật ký canh tác (Upload API hỗ trợ Multipart Form)
    const handleCreateLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!logBatchId) {
            toast.warning('Vui lòng chọn lô!');
            return;
        }
        if (!description.trim()) {
            toast.warning('Vui lòng nhập nội dung!');
            return;
        }

        setSubmittingOperation('createLog', true);
        try {
            const formData = new FormData();
            formData.append('ActivityType', activityType);
            formData.append('Description', description);
            formData.append('LogDate', logDate);

            selectedFiles.forEach((file) => {
                formData.append('Images', file);
            });

            await farmerService.createCultivationLog(logBatchId, formData);
            toast.success('Đã lưu nhật ký canh tác thành công!');

            setDescription('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            setIsLogModalOpen(false);

            if (activeMobileTab === 'logs') {
                void fetchBatchLogs(logBatchId);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            toast.error(errorObj.response?.data?.message || 'Gửi thất bại!');
        } finally {
            setSubmittingOperation('createLog', false);
        }
    };

    // Ký Smart Contract thu hoạch
    const handleHarvestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!harvestBatchId) {
            toast.warning('Vui lòng chọn lô thu hoạch!');
            return;
        }
        if (!harvestQuantity || Number(harvestQuantity) <= 0) {
            toast.warning('Sản lượng thu hoạch phải lớn hơn 0!');
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

            toast.success(`Ký Smart Contract thu hoạch lô ${result.batchCode} thành công!`);
            setIsHarvestModalOpen(false);
            setHarvestQuantity('');
            setHarvestNotes('');
            await fetchAssignedBatches();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            toast.error(errorObj.response?.data?.message || 'Ký giao dịch thu hoạch thất bại!');
        } finally {
            setSubmittingOperation('harvest', false);
        }
    };

    // Danh sách lô được lọc theo từ khóa tìm kiếm
    const filteredBatches = useMemo(() => {
        return batches.filter((b) =>
            b.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.fruitTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.farmAreaName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [batches, searchQuery]);

    return (
        <div className="min-h-screen bg-[#F4F5FA] pb-20 text-slate-800 font-sans antialiased flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200">

            {/* 1. STICKY TOP BAR */}
            <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-black text-sm text-emerald-100 uppercase">
                        {user?.fullName ? user.fullName.substring(0, 2) : <User className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Cổng Nông Dân</p>
                        <h4 className="text-xs font-bold truncate max-w-[140px]">{user?.fullName || 'Nông Dân'}</h4>
                    </div>
                </div>

                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={() => void fetchAssignedBatches()}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center"
                    >
                        <RefreshCw className={`w-4 h-4 text-emerald-100 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => toast.info('Tính năng quét QR đang được phát triển.')}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center justify-center"
                    >
                        <QrCode className="w-4 h-4 text-emerald-100" />
                    </button>
                </div>
            </header>

            {/* Hiển thị thông báo lỗi hệ thống */}
            {error && (
                <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* 2. CHỨC NĂNG DỰA TRÊN TAB ĐANG CHỌN */}
            <main className="flex-1 p-4 overflow-y-auto space-y-4">

                {/* ================= TAB 1: TRANG CHỦ ================= */}
                {activeMobileTab === 'home' && (
                    <>
                        {/* KPI Bong Bóng */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Thống kê nhanh lô</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center gap-2.5">
                                    <Layers className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Tổng Lô</p>
                                        <p className="text-sm font-extrabold text-slate-800">{stats.total}</p>
                                    </div>
                                </div>
                                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 flex items-center gap-2.5">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Chờ nhận</p>
                                        <p className="text-sm font-extrabold text-amber-700">{stats.pending}</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-2.5">
                                    <Crown className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Đại diện</p>
                                        <p className="text-sm font-extrabold text-emerald-700">{stats.representative}</p>
                                    </div>
                                </div>
                                <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 flex items-center gap-2.5">
                                    <Wheat className="w-5 h-5 text-purple-600" />
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Đã thu</p>
                                        <p className="text-sm font-extrabold text-purple-700">{stats.harvested}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thanh tìm kiếm */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm nhanh mã lô, tên cây trồng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                        </div>

                        {/* Danh sách lô dạng thẻ di động */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Danh sách lô phân công</h4>
                                <span className="text-[10px] font-bold text-slate-400">Có {filteredBatches.length} lô</span>
                            </div>

                            {filteredBatches.map((item) => {
                                const isPlanting = item.currentStage === 'STAGE_PLANTING' || item.currentStage === 'PLANTING';
                                return (
                                    <div key={item.batchId} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                        <div className="flex items-start justify-between gap-1">
                                            <div>
                                                <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded">
                                                    {item.batchCode}
                                                </span>
                                                <h3 className="font-bold text-slate-850 text-sm mt-1.5 leading-snug">{item.productName}</h3>
                                                <div className="flex items-center text-[10px] text-slate-400 mt-1">
                                                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-350" />
                                                    <span>{item.farmAreaName}</span>
                                                </div>
                                            </div>

                                            {item.isRepresentative && (
                                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200 shrink-0">
                                                    Đại diện
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                            <AppBadge
                                                status={item.workerStatus === 'ACCEPTED' ? 'DA_DUYET' : 'DANG_XU_LY'}
                                                label={item.workerStatus === 'ACCEPTED' ? 'Đã nhận' : 'Chờ nhận'}
                                            />

                                            <div className="flex items-center gap-1.5">
                                                {item.workerStatus !== 'ACCEPTED' ? (
                                                    <button
                                                        onClick={() => handleAcceptBatch(item.batchId)}
                                                        disabled={submittingOperations[`accept-${item.batchId}`]}
                                                        className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                                    >
                                                        {submittingOperations[`accept-${item.batchId}`] ? 'Đang nhận...' : 'Xác nhận nhận lô'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        {isPlanting && (
                                                            <button
                                                                onClick={() => {
                                                                    setLogBatchId(item.batchId);
                                                                    setIsLogModalOpen(true);
                                                                }}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Ghi nhật ký
                                                            </button>
                                                        )}
                                                        {item.isRepresentative && isPlanting && (
                                                            <button
                                                                onClick={() => {
                                                                    setHarvestBatchId(item.batchId);
                                                                    setIsHarvestModalOpen(true);
                                                                }}
                                                                className="px-2.5 py-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                                                            >
                                                                <Wheat className="w-3.5 h-3.5" /> Thu hoạch
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ================= TAB 2: NHẬT KÝ CANH TÁC ================= */}
                {activeMobileTab === 'logs' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn Lô xem nhật ký:</label>
                            <select
                                value={selectedBatchForLogs}
                                onChange={(e) => setSelectedBatchForLogs(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            >
                                {batches.map((b) => (
                                    <option key={b.batchId} value={b.batchId}>
                                        Lô: {b.batchCode}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {logsLoading ? (
                            <div className="p-8 text-center text-xs font-bold text-slate-400">
                                Đang tải lịch sử nhật ký...
                            </div>
                        ) : batchLogs.length === 0 ? (
                            <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
                                Chưa có ghi chép nhật ký nào cho lô này.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {batchLogs.map((log) => (
                                    <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[9px] font-extrabold">
                                                {log.activityType}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.logDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                            {log.description}
                                        </p>

                                        {log.images && log.images.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {log.images.map((imgUrl, idx) => (
                                                    <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={imgUrl} alt="Nhật ký thực địa" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {log.createdByName && (
                                            <p className="text-[9px] text-slate-400 font-bold">Người tạo: {log.createdByName}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= TAB 3: THU HOẠCH ================= */}
                {activeMobileTab === 'harvest' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-3xl shadow-sm">
                            <h4 className="font-extrabold text-xs flex items-center">
                                <ShieldCheck className="w-4 h-4 mr-1 text-white" />
                                Ký số Blockchain (On-Chain)
                            </h4>
                            <p className="text-[9px] text-orange-50 opacity-90 mt-1 leading-relaxed">
                                Giao dịch thu hoạch nông sản sẽ được đồng bộ và lưu trữ vĩnh viễn trên Blockchain FruitChain. Chỉ Nông Dân Đại Diện mới được quyền thực hiện ký giao dịch.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Danh sách Lô sẵn sàng thu hoạch</h4>

                            {batches
                                .filter(b => b.isRepresentative && (b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING'))
                                .map((batch) => (
                                    <div key={batch.batchId} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="font-mono font-bold text-[9px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                                                    {batch.batchCode}
                                                </span>
                                                <h5 className="font-bold text-slate-800 text-sm mt-1">{batch.productName}</h5>
                                                <p className="text-[10px] text-slate-450 mt-0.5">{batch.farmAreaName}</p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-bold rounded-full">
                                                Chờ thu hoạch
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setHarvestBatchId(batch.batchId);
                                                setIsHarvestModalOpen(true);
                                            }}
                                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <Wheat className="w-4.5 h-4.5" />
                                            Kích hoạt ký thu hoạch
                                        </button>
                                    </div>
                                ))}

                            {batches.filter(b => b.isRepresentative && (b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING')).length === 0 && (
                                <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
                                    Không có lô nào do bạn đại diện đang trong giai đoạn chờ thu hoạch.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= TAB 4: THÔNG TIN CÁ NHÂN ================= */}
                {activeMobileTab === 'profile' && (
                    <div className="space-y-4">
                        {/* Thẻ cá nhân */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-black text-xl border border-emerald-200">
                                {user?.fullName ? user.fullName.substring(0, 2) : 'ND'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-855 text-sm">{user?.fullName || 'Nông Dân'}</h4>
                                <p className="text-[11px] text-slate-400 font-semibold">{user?.email || 'farmer@caolanh.vn'}</p>
                            </div>
                        </div>

                        {/* Danh sách thông tin chi tiết */}
                        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs font-bold text-slate-700">
                            <div className="p-3.5 flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Hợp tác xã:</span>
                                <span className="text-slate-700">Hợp tác xã Cao Lãnh</span>
                            </div>
                            <div className="p-3.5 flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Chức vụ:</span>
                                <span className="text-slate-700">Xác thực Blockchain</span>
                            </div>
                            <div className="p-3.5 flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Địa chỉ ví ví:</span>
                                <span className="text-slate-700 font-mono text-[10px]">0x3C44...7e59</span>
                            </div>
                        </div>

                        {/* Nút Đăng xuất */}
                        <button
                            onClick={logout}
                            className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                        >
                            <LogOut className="w-4.5 h-4.5" />
                            <span>Đăng xuất tài khoản</span>
                        </button>
                    </div>
                )}
            </main>

            {/* 3. STICKY BOTTOM TAB NAVIGATION (Thanh Tab Bar di động cố định bên dưới) */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 w-full max-w-md h-16 flex items-center justify-around px-2 shadow-lg">
                {[
                    { id: 'home', label: 'Trang chủ', icon: Wheat },
                    { id: 'logs', label: 'Nhật ký', icon: FileText },
                    { id: 'harvest', label: 'Thu hoạch', icon: ShieldCheck },
                    { id: 'profile', label: 'Tài khoản', icon: User }
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeMobileTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveMobileTab(tab.id as any)}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${isActive ? 'text-emerald-700 font-black scale-105' : 'text-slate-400 font-semibold hover:text-slate-600'}`}
                        >
                            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5px] text-emerald-700' : 'text-slate-400'}`} />
                            <span className="text-[10px] tracking-tight">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* MODAL GHI NHẬT KÝ CANH TÁC */}
            <AppModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                title="Ghi Nhật Ký Thực Địa"
            >
                <form onSubmit={handleCreateLogSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chọn Lô Canh Tác *</label>
                        <select
                            value={logBatchId}
                            onChange={(e) => setLogBatchId(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                        >
                            <option value="">-- Chọn Lô Canh Tác --</option>
                            {batches
                                .filter((b) => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING')
                                .map((b) => (
                                    <option key={b.batchId} value={b.batchId}>
                                        Lô {b.batchCode} - {b.productName}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Loại Hoạt Động *</label>
                            <select
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                            >
                                <option value="Bón phân">Bón phân</option>
                                <option value="Tưới nước">Tưới nước</option>
                                <option value="Phun thuốc">Phun thuốc bảo vệ</option>
                                <option value="Cắt tỉa">Cắt tỉa / Tỉa cành</option>
                                <option value="Kiểm tra sâu bệnh">Kiểm tra sâu bệnh</option>
                                <option value="Làm cỏ">Làm cỏ / Vệ sinh</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Thời Gian Thực Hiện *</label>
                            <input
                                type="datetime-local"
                                value={logDate}
                                onChange={(e) => setLogDate(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-850"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mô Tả Chi Tiết Công Việc *</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả liều lượng phân bón hoặc hoạt động..."
                            required
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                        />
                    </div>

                    {/* KHU VỰC CHỤP ẢNH / CHỌN FILE DI ĐỘNG */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Ảnh thực địa đính kèm</label>

                        {/* Hàng 2 nút bấm thao tác di động */}
                        <div className="grid grid-cols-2 gap-3 mb-3">

                            {/* Nút 1: Chụp ảnh bằng Camera trực tiếp */}
                            <label className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl cursor-pointer active:scale-95 transition-all text-center">
                                <ImageIcon className="w-4.5 h-4.5 text-emerald-700" />
                                <span className="text-xs font-bold">Chụp ảnh</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment" // Kích hoạt camera sau trên di động
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            {/* Nút 2: Chọn nhiều ảnh từ Thư viện ảnh của máy */}
                            <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl cursor-pointer active:scale-95 transition-all text-center">
                                <Plus className="w-4.5 h-4.5 text-slate-500" />
                                <span className="text-xs font-bold">Chọn từ máy</span>
                                <input
                                    type="file"
                                    multiple // Cho phép chọn nhiều ảnh cùng lúc
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Danh sách ảnh xem trước đã chụp/chọn */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 border border-slate-100 p-2.5 rounded-2xl bg-slate-50/50">
                                {previewUrls.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />

                                        {/* Nút Xóa ảnh xem trước */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(idx)}
                                            className="absolute top-1 right-1 bg-rose-600/90 text-white rounded-full p-1 shadow-md hover:bg-rose-700 active:scale-95 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedFiles.length > 0 && (
                            <p className="text-[10px] font-bold text-emerald-600 mt-1">
                                Đã sẵn sàng {selectedFiles.length} tệp ảnh để lưu lên IPFS.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <AppButton variant="outline" type="button" onClick={() => setIsLogModalOpen(false)}>
                            Hủy bỏ
                        </AppButton>
                        <AppButton
                            variant="green"
                            className="bg-emerald-600 text-white border-0"
                            type="submit"
                            isLoading={submittingOperations['createLog']}
                        >
                            Đẩy Lên IPFS
                        </AppButton>
                    </div>
                </form>
            </AppModal>

            {/* MODAL THU HOẠCH LÔ SẢN XUẤT */}
            <AppModal
                isOpen={isHarvestModalOpen}
                onClose={() => setIsHarvestModalOpen(false)}
                title="Ký Số Xác Nhận Thu Hoạch"
            >
                <form onSubmit={handleHarvestSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chọn Lô Thu Hoạch *</label>
                        <select
                            value={harvestBatchId}
                            onChange={(e) => setHarvestBatchId(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                        >
                            <option value="">-- Chọn Lô Thu Hoạch --</option>
                            {batches
                                .filter((b) => b.isRepresentative && (b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING'))
                                .map((b) => (
                                    <option key={b.batchId} value={b.batchId}>
                                        Lô {b.batchCode} - {b.productName}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ngày Thu Hoạch *</label>
                            <input
                                type="date"
                                value={harvestDate}
                                onChange={(e) => setHarvestDate(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sản Lượng *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="1500"
                                    value={harvestQuantity}
                                    onChange={(e) => setHarvestQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                    required
                                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Đơn vị *</label>
                                <select
                                    value={harvestUnit}
                                    onChange={(e) => setHarvestUnit(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    <option value="kg">kg</option>
                                    <option value="Tấn">Tấn</option>
                                    <option value="Tạ">Tạ</option>
                                    <option value="Thùng">Thùng</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chất lượng ban đầu *</label>
                        <select
                            value={initialQuality}
                            onChange={(e) => setInitialQuality(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-850"
                        >
                            <option value="Loại 1 (Xuất khẩu)">Loại 1 (Đạt chuẩn Xuất khẩu)</option>
                            <option value="Loại 2 (Tiêu chuẩn)">Loại 2 (Nội địa tiêu chuẩn)</option>
                            <option value="VietGAP">Đạt chuẩn VietGAP</option>
                            <option value="GlobalGAP">Đạt chuẩn GlobalGAP</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ghi Chú Thu Hoạch</label>
                        <textarea
                            rows={2}
                            value={harvestNotes}
                            onChange={(e) => setHarvestNotes(e.target.value)}
                            placeholder="Mô tả điều kiện thời tiết hoặc chất lượng..."
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <AppButton variant="outline" type="button" onClick={() => setIsHarvestModalOpen(false)}>
                            Hủy bỏ
                        </AppButton>
                        <AppButton
                            variant="orange"
                            className="bg-emerald-600 text-white border-0"
                            type="submit"
                            isLoading={submittingOperations['harvest']}
                        >
                            Ký Giao Dịch
                        </AppButton>
                    </div>
                </form>
            </AppModal>

            {/* POPUP THÀNH CÔNG TIẾP NHẬN LÔ */}
            <AppModal
                isOpen={isAcceptSuccessOpen}
                onClose={() => setIsAcceptSuccessOpen(false)}
                title="Xác nhận thành công"
                maxWidth="sm"
            >
                <div className="flex flex-col items-center text-center p-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-850 mb-1.5">Đã Nhận Lô Phân Công</h3>
                    <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                        Hệ thống đã xác nhận bạn tham gia quản lý lô hàng. Lịch sử đã được ghi nhận trên cơ sở dữ liệu.
                    </p>
                    <AppButton
                        onClick={() => setIsAcceptSuccessOpen(false)}
                        variant="green"
                        className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl border-0"
                    >
                        Đóng thông báo
                    </AppButton>
                </div>
            </AppModal>
        </div>
    );
};

export default FarmerMobilePage;
