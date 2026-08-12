import React, { useEffect, useState } from 'react';
import { resolveIpfsUrl } from '../../services/ipfsService';
import { translateStage } from '../../types';
import { AppButton } from '../../components/ui/AppButton';
import { useUIStore } from '../../stores/uiStore';

import {
    CheckCircle,
    Calendar,
    ShieldCheck,
    AlertTriangle,
    FileText,
    Layers,
    Search,
    Clock,
    X,
    ExternalLink,
    Lock,
    UserCheck,
    Sparkles,
    CheckCircle2,
    Leaf,
    Filter,
    ArrowRight
} from 'lucide-react';
import { farmerService, type AssignedBatch, type HarvestResponse } from '../../services/farmerService';

export const FarmerHarvestPage: React.FC = () => {
    const [batches, setBatches] = useState<AssignedBatch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterStage, setFilterStage] = useState<string>('ALL');

    // Modal thu hoạch
    const [selectedBatch, setSelectedBatch] = useState<AssignedBatch | null>(null);
    const [harvestDate, setHarvestDate] = useState<string>(
        new Date().toISOString().slice(0, 16)
    );
    const [quantity, setQuantity] = useState<number | ''>('');
    const [unit, setUnit] = useState<string>('Kg');
    const [initialQuality, setInitialQuality] = useState<string>('Loại 1 (Xuất khẩu)');
    const [notes, setNotes] = useState<string>('');

    // State xử lý Ký Blockchain
    const submittingOperations = useUIStore((state) => state.submittingOperations);
    const setSubmittingOperation = useUIStore((state) => state.setSubmittingOperation);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [harvestResult, setHarvestResult] = useState<HarvestResponse | null>(null);

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            setLoading(true);
            const data = await farmerService.getAssignedBatches();
            // Lọc chỉ lấy các lô nông dân đã tiếp nhận (workerStatus === 'ACCEPTED')
            const acceptedBatches = (data || []).filter((b) => b.workerStatus === 'ACCEPTED');
            setBatches(acceptedBatches);
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách lô phân công:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleOpenHarvestModal = (batch: AssignedBatch) => {
        setSelectedBatch(batch);
        setHarvestDate(new Date().toISOString().slice(0, 16));
        setQuantity(batch.expectedQuantity || '');
        setUnit('Kg');
        setInitialQuality('Loại 1 (Xuất khẩu)');
        setNotes('');

        if (!batch.isRepresentative) {
            setErrorMsg('Lô này gồm nhiều nhân công. Chỉ Nông dân Đại diện (isRepresentative = true) mới có quyền ký giao dịch harvestBatch lên Smart Contract (Theo quy tắc BR-09, BR-10).');
        } else if (batch.currentStage !== 'STAGE_PLANTING' && batch.currentStage !== 'PLANTING') {
            setErrorMsg(`Lô hiện ở trạng thái ${translateStage(batch.currentStage)}, không thể thu hoạch (chỉ chấp nhận ${translateStage('STAGE_PLANTING')}).`);
        } else {

            setErrorMsg(null);
        }
    };

    const handleConfirmHarvest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch) return;

        if (!quantity || Number(quantity) <= 0) {
            setErrorMsg('Vui lòng nhập sản lượng thu hoạch hợp lệ (> 0).');
            return;
        }

        try {
            setSubmittingOperation('harvest', true); // Thay setSubmitting(true)
            setErrorMsg(null);
            const res = await farmerService.harvestBatch(selectedBatch.batchId, {
                harvestDate: new Date(harvestDate).toISOString(),
                quantity: Number(quantity),
                unit,
                initialQuality,
                notes: notes.trim() || undefined,
            });
            setHarvestResult(res);
            await loadBatches();
        } catch (err: any) {
            console.error('Lỗi xác nhận thu hoạch:', err);
            setErrorMsg(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                'Không thể xác nhận thu hoạch. Vui lòng kiểm tra lại quyền Đại diện hoặc trạng thái lô.'
            );
        } finally {
            setSubmittingOperation('harvest', false); // Thay setSubmitting(false)
        }
    };

    // Filter lô theo tìm kiếm & trạng thái
    const filteredBatches = batches.filter((b) => {
        const matchesSearch =
            b.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.fruitTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.farmAreaName?.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStage === 'ALL') return matchesSearch;
        if (filterStage === 'READY') return matchesSearch && (b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING');
        if (filterStage === 'HARVESTED') return matchesSearch && b.currentStage !== 'STAGE_PLANTING' && b.currentStage !== 'PLANTING';
        return matchesSearch;
    });

    // Thống kê nhanh
    const totalBatches = batches.length;
    const readyBatches = batches.filter((b) => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING').length;
    const harvestedBatches = batches.filter((b) => b.currentStage !== 'STAGE_PLANTING' && b.currentStage !== 'PLANTING').length;
    const repBatches = batches.filter((b) => b.isRepresentative).length;

    return (
        <div className="space-y-6 pb-12">
            {/* TOP BAR & TITLE */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 text-white p-6 rounded-2xl shadow-lg">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        Xác thực Smart Contract On-Chain
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                        Xác Nhận Thu Hoạch Lô Sản Xuất
                    </h1>
                    <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
                        Ghi nhận sản lượng thu hoạch chính thức, đồng bộ toàn bộ nhật ký canh tác lên IPFS và ký xác thực giao dịch thu hoạch trên Blockchain.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadBatches}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm rounded-xl transition flex items-center gap-2 border border-white/20"
                    >
                        <Clock className="w-4 h-4" /> Làm mới
                    </button>
                </div>
            </div>

            {/* THỐNG KÊ CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Lô Được Giao</p>
                        <p className="text-2xl font-bold text-slate-800">{totalBatches}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lô Chờ Thu Hoạch</p>
                        <p className="text-2xl font-bold text-amber-600">{readyBatches}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lô Đã Thu Hoạch</p>
                        <p className="text-2xl font-bold text-green-700">{harvestedBatches}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quyền Người Đại Diện</p>
                        <p className="text-2xl font-bold text-blue-700">{repBatches} <span className="text-xs font-normal text-slate-500">lô</span></p>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC TÌM KIẾM & TAB */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo Mã lô, Loại cây, Vùng trồng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <button
                        onClick={() => setFilterStage('ALL')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${filterStage === 'ALL'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Tất cả ({batches.length})
                    </button>
                    <button
                        onClick={() => setFilterStage('READY')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${filterStage === 'READY'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Chờ thu hoạch ({readyBatches})
                    </button>
                    <button
                        onClick={() => setFilterStage('HARVESTED')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${filterStage === 'HARVESTED'
                            ? 'bg-green-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Đã thu hoạch ({harvestedBatches})
                    </button>
                </div>
            </div>

            {/* DANH SÁCH LÔ SẢN XUẤT */}
            {loading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-500 font-medium text-sm">Đang tải danh sách lô phân công...</p>
                </div>
            ) : filteredBatches.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-semibold text-base">Không tìm thấy lô sản xuất nào</p>
                    <p className="text-slate-400 text-xs mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredBatches.map((batch) => {
                        const isHarvested = batch.currentStage !== 'STAGE_PLANTING' && batch.currentStage !== 'PLANTING';
                        const canHarvest = (batch.currentStage === 'STAGE_PLANTING' || batch.currentStage === 'PLANTING') && batch.isRepresentative;

                        return (
                            <div
                                key={batch.batchId}
                                className={`bg-white rounded-2xl border transition shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${isHarvested
                                    ? 'border-green-200 bg-green-50/20'
                                    : canHarvest
                                        ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                                        : 'border-slate-200'
                                    }`}
                            >
                                <div className="p-5 space-y-4">
                                    {/* Header thẻ lô */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg">
                                                {batch.batchCode}
                                            </span>
                                            <h3 className="font-bold text-slate-800 text-base mt-2">
                                                {batch.productName || batch.fruitTypeName || 'Nông sản canh tác'}
                                            </h3>
                                        </div>
                                        <div>
                                            {isHarvested ? (
                                                <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 font-semibold text-xs rounded-full flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã Thu Hoạch
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-full flex items-center gap-1">
                                                    <Leaf className="w-3.5 h-3.5" /> Đang Canh Tác
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Chi tiết lô */}
                                    <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Vùng trồng:</span>
                                            <span className="font-medium text-slate-700">{batch.farmAreaName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Sản lượng dự kiến:</span>
                                            <span className="font-medium text-slate-700">{batch.expectedQuantity ? `${batch.expectedQuantity} Kg` : 'Chưa thiết lập'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Vai trò của bạn:</span>
                                            {batch.isRepresentative ? (
                                                <span className="font-bold text-blue-700 flex items-center gap-1">
                                                    <UserCheck className="w-3.5 h-3.5" /> Người Đại Diện (Ký SC)
                                                </span>
                                            ) : (
                                                <span className="font-medium text-slate-500">Thành viên sản xuất</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cảnh báo quyền ký nếu không phải đại diện */}
                                    {!batch.isRepresentative && !isHarvested && (
                                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
                                            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <span>Chỉ <strong>Người đại diện</strong> lô này mới có quyền ký xác nhận thu hoạch lên Blockchain.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Bottom */}
                                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        {batch.assignedDate ? `Phân công: ${new Date(batch.assignedDate).toLocaleDateString('vi-VN')}` : ''}
                                    </span>

                                    {isHarvested ? (
                                        <button
                                            disabled
                                            className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Hoàn tất
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenHarvestModal(batch)}
                                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${canHarvest
                                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                                                }`}
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            Xác nhận Thu hoạch
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL FORM XÁC NHẬN THU HOẠCH & KÝ BLOCKCHAIN */}
            {selectedBatch && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-6 relative">
                            <button
                                onClick={() => setSelectedBatch(null)}
                                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                                Ký Giao Dịch Smart Contract
                            </div>
                            <h2 className="text-xl font-bold">Xác Nhận Thu Hoạch Lô {selectedBatch.batchCode}</h2>
                            <p className="text-emerald-100 text-xs mt-1">
                                {selectedBatch.productName || selectedBatch.fruitTypeName} • Vùng: {selectedBatch.farmAreaName}
                            </p>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleConfirmHarvest} className="p-6 space-y-5">
                            {errorMsg && (
                                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Lỗi xác nhận thu hoạch:</p>
                                        <p>{errorMsg}</p>
                                    </div>
                                </div>
                            )}

                            {/* Thông tin thời gian */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Ngày & Giờ thu hoạch thực tế <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={harvestDate}
                                    onChange={(e) => setHarvestDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                                />
                            </div>

                            {/* Sản lượng & Đơn vị */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Sản lượng thu hoạch thực tế <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        required
                                        placeholder="Ví dụ: 500"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Đơn vị tính <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                                    >
                                        <option value="Kg">Kg (Kilogram)</option>
                                        <option value="Tấn">Tấn</option>
                                        <option value="Tạ">Tạ</option>
                                        <option value="Thùng">Thùng</option>
                                        <option value="Hộp">Hộp</option>
                                    </select>
                                </div>
                            </div>

                            {/* Đánh giá chất lượng ban đầu */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Đánh giá chất lượng ban đầu <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={initialQuality}
                                    onChange={(e) => setInitialQuality(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                                >
                                    <option value="Loại 1 (Xuất khẩu)">Loại 1 (Xuất khẩu - Đạt chuẩn cao nhất)</option>
                                    <option value="Loại 2 (Tiêu chuẩn)">Loại 2 (Tiêu chuẩn thị trường nội địa)</option>
                                    <option value="Loại 3 (Chế biến)">Loại 3 (Dùng làm nguyên liệu chế biến)</option>
                                    <option value="Đạt chuẩn VietGAP">Đạt chuẩn VietGAP</option>
                                    <option value="Đạt chuẩn GlobalGAP">Đạt chuẩn GlobalGAP</option>
                                </select>
                            </div>

                            {/* Ghi chú thêm */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Ghi chú / Nhận xét thu hoạch
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Nhập ghi chú điều kiện thời tiết, màu sắc quả, độ đường..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                                />
                            </div>

                            {/* Lưu ý Smart contract */}
                            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    Cơ chế Bảo mật & Minh bạch Blockchain:
                                </div>
                                <p className="text-emerald-700">
                                    Khi bấm xác nhận, hệ thống sẽ gom toàn bộ nhật ký canh tác của lô, tải lên <strong>IPFS Decentralized Storage</strong> và ký giao dịch <code>harvestBatch</code> trực tiếp trên Blockchain bằng ví điện tử của Người đại diện.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedBatch(null)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                                >
                                    Hủy bỏ
                                </button>

                                <AppButton
                                    type="submit"
                                    disabled={!selectedBatch.isRepresentative || (selectedBatch.currentStage !== 'STAGE_PLANTING' && selectedBatch.currentStage !== 'PLANTING')}
                                    isLoading={submittingOperations['harvest']}
                                    variant="green"
                                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20"
                                >
                                    Ký & Xác Nhận Thu Hoạch
                                </AppButton>

                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÔNG BÁO KẾT QUẢ KÝ BLOCKCHAIN THÀNH CÔNG */}
            {harvestResult && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 text-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 border border-white/30">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black">Xác Nhận Thu Hoạch Thành Công!</h2>
                            <p className="text-emerald-100 text-xs mt-1">
                                Giao dịch thu hoạch lô <strong>{harvestResult.batchCode}</strong> đã được ghi nhận trên Blockchain.
                            </p>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <span className="text-slate-500 font-medium">Mã lô sản xuất:</span>
                                    <span className="font-bold text-emerald-800 font-mono">{harvestResult.batchCode}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Sản lượng thu hoạch:</span>
                                    <span className="font-bold text-slate-800">{harvestResult.quantity} {harvestResult.unit}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Chất lượng ban đầu:</span>
                                    <span className="font-bold text-slate-800">{harvestResult.initialQuality}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Người đại diện ký:</span>
                                    <span className="font-semibold text-blue-700">{harvestResult.representativeUserName || 'Bạn'}</span>
                                </div>
                            </div>

                            {/* Hash giao dịch Blockchain */}
                            {harvestResult.transactionHash && (
                                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl space-y-1 font-mono text-[11px]">
                                    <div className="text-emerald-400 font-bold flex items-center gap-1.5 font-sans">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        Blockchain Transaction Hash:
                                    </div>
                                    <p className="break-all text-slate-300">{harvestResult.transactionHash}</p>
                                </div>
                            )}

                            {/* Metadata URI */}
                            {harvestResult.metadataURI && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-800">
                                    <div className="truncate pr-2">
                                        <span className="font-bold block">IPFS Metadata URI:</span>
                                        <span className="font-mono text-[11px] text-blue-600 truncate block">{harvestResult.metadataURI}</span>
                                    </div>
                                    <a
                                        href={resolveIpfsUrl(harvestResult.metadataURI)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shrink-0"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}

                            <button
                                onClick={() => setHarvestResult(null)}
                                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-md shadow-emerald-700/20 text-sm mt-2"
                            >
                                Đóng & Hoàn Tất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerHarvestPage;
