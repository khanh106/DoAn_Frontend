import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Calendar,
    Clock,
    Sprout,
    Search,
    Filter,
    Eye,
    Layers,
    MapPin,
    TrendingUp,
    AlertCircle,
    FileText,
    RefreshCw,
    CheckSquare,
    Crown,
    Wheat
} from 'lucide-react';
import { farmerService, type AssignedBatch, type CultivationLog } from '../../services/farmerService';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';

export const FarmerProgressPage: React.FC = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState<AssignedBatch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [stageFilter, setStageFilter] = useState<string>('ALL');

    // State Modal Lịch trình chi tiết
    const [selectedBatch, setSelectedBatch] = useState<AssignedBatch | null>(null);
    const [batchLogs, setBatchLogs] = useState<CultivationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

    // Fetch danh sách lô phân công từ Backend
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const data = await farmerService.getAssignedBatches();
            setBatches(data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách lô tiến độ:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchBatches();
    }, [fetchBatches]);

    // Chuẩn hóa tên Giai đoạn (xử lý cả trường hợp STAGE_PLANTING và PLANTING từ Backend EF Core Enum)
    const getStageDetails = (rawStage: string) => {
        const stage = (rawStage || '').toUpperCase().replace('STAGE_', '');

        switch (stage) {
            case 'PLANTING':
                return {
                    label: 'Xuống giống / Gieo trồng',
                    percent: 25,
                    barColor: 'bg-blue-500',
                    textColor: 'text-blue-700',
                    bgColor: 'bg-blue-50 border-blue-200',
                    dotColor: 'bg-blue-500'
                };
            case 'CARE':
            case 'GROWING':
                return {
                    label: 'Chăm sóc & Phun bón',
                    percent: 65,
                    barColor: 'bg-amber-500',
                    textColor: 'text-amber-700',
                    bgColor: 'bg-amber-50 border-amber-200',
                    dotColor: 'bg-amber-500'
                };
            case 'HARVESTED':
                return {
                    label: 'Đã Thu Hoạch',
                    percent: 90,
                    barColor: 'bg-purple-500',
                    textColor: 'text-purple-700',
                    bgColor: 'bg-purple-50 border-purple-200',
                    dotColor: 'bg-purple-500'
                };
            case 'RECEIVED':
            case 'PROCESSED':
            case 'SORTED':
            case 'INSPECTION_PASSED':
            case 'PACKAGED':
            case 'SHIPPING':
            case 'RECEIVED_AT_RETAILER':
            case 'READY_FOR_SALE':
            case 'COMPLETED':
                return {
                    label: 'Bàn giao Chế biến',
                    percent: 100,
                    barColor: 'bg-emerald-500',
                    textColor: 'text-emerald-700',
                    bgColor: 'bg-emerald-50 border-emerald-200',
                    dotColor: 'bg-emerald-500'
                };
            default:
                return {
                    label: 'Đang Canh Tác',
                    percent: 30,
                    barColor: 'bg-emerald-500',
                    textColor: 'text-emerald-700',
                    bgColor: 'bg-emerald-50 border-emerald-200',
                    dotColor: 'bg-emerald-500'
                };
        }
    };

    // Lọc danh sách lô theo từ khóa và giai đoạn
    const filteredBatches = useMemo(() => {
        return batches.filter((b) => {
            const matchesSearch =
                b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.fruitTypeName && b.fruitTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (b.productName && b.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (b.farmAreaName && b.farmAreaName.toLowerCase().includes(searchTerm.toLowerCase()));

            const cleanStage = (b.currentStage || '').toUpperCase().replace('STAGE_', '');
            const matchesStage =
                stageFilter === 'ALL' ||
                cleanStage === stageFilter.toUpperCase() ||
                (stageFilter === 'HARVESTED' && ['HARVESTED', 'RECEIVED', 'PROCESSED', 'COMPLETED'].includes(cleanStage));

            return matchesSearch && matchesStage;
        });
    }, [batches, searchTerm, stageFilter]);

    // Thống kê chỉ số KPI
    const stats = useMemo(() => {
        const total = batches.length;
        const inCare = batches.filter((b) => {
            const st = (b.currentStage || '').toUpperCase().replace('STAGE_', '');
            return st === 'PLANTING' || st === 'CARE' || st === 'GROWING';
        }).length;
        const harvested = batches.filter((b) => {
            const st = (b.currentStage || '').toUpperCase().replace('STAGE_', '');
            return ['HARVESTED', 'RECEIVED', 'PROCESSED', 'COMPLETED'].includes(st);
        }).length;
        const avgPercent = total > 0
            ? Math.round(
                batches.reduce((acc, b) => acc + getStageDetails(b.currentStage).percent, 0) / total
            )
            : 0;

        return { total, inCare, harvested, avgPercent };
    }, [batches]);

    // Mở modal xem Timeline chi tiết
    const handleOpenDetailModal = async (batch: AssignedBatch) => {
        setSelectedBatch(batch);
        setLoadingLogs(true);
        try {
            const logs = await farmerService.getCultivationLogsByBatch(batch.batchId);
            setBatchLogs(logs || []);
        } catch (err) {
            console.error('Lỗi tải nhật ký lô:', err);
            setBatchLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Trang Tiến độ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <Activity className="w-7 h-7 text-emerald-600" />
                        Tiến Độ Công Việc Canh Tác
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Theo dõi phần trăm hoàn thành, giai đoạn sinh trưởng và mốc lịch trình nhật ký thực địa của các lô sản xuất.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AppButton
                        variant="outline"
                        onClick={fetchBatches}
                        isLoading={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Làm mới
                    </AppButton>
                    <AppButton
                        onClick={() => navigate('/farmer/logs')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> + Ghi Nhật Ký
                    </AppButton>
                </div>
            </div>

            {/* KPI Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Lô Canh Tác</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Lô được phân công</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang Chăm Sóc</p>
                        <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.inCare}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Gieo trồng & bón phân</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Sprout className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Thu Hoạch</p>
                        <h3 className="text-2xl font-black text-purple-600 mt-1">{stats.harvested}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Đã bàn giao sản lượng</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Wheat className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiến Độ Trung Bình</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.avgPercent}%</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Tổng thể các lô</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo Mã lô, Trái cây, Vùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
                    {[
                        { key: 'ALL', label: 'Tất cả lô' },
                        { key: 'PLANTING', label: 'Đang gieo trồng' },
                        { key: 'HARVESTED', label: 'Đã thu hoạch' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setStageFilter(tab.key)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${stageFilter === tab.key
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Batch Cards Grid */}
            {loading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Đang tải dữ liệu tiến độ...</p>
                </div>
            ) : filteredBatches.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-700 font-bold text-base">Chưa có dữ liệu tiến độ</h3>
                    <p className="text-slate-400 text-xs mt-1">
                        Hiện chưa có lô canh tác nào khớp với từ khóa tìm kiếm của bạn.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredBatches.map((b) => {
                        const stageInfo = getStageDetails(b.currentStage);
                        return (
                            <div
                                key={b.batchId}
                                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Batch header & Stage badge */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
                                                    {b.batchCode}
                                                </span>
                                                {b.isRepresentative && (
                                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                                                        <Crown className="w-3 h-3 text-amber-600" /> Đại diện
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-bold text-slate-800 mt-2">
                                                {b.productName || b.fruitTypeName || 'Nông sản'}
                                            </h3>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${stageInfo.bgColor} ${stageInfo.textColor}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dotColor}`} />
                                            {stageInfo.label}
                                        </span>
                                    </div>

                                    {/* Dynamic Progress Bar */}
                                    <div className="my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-600">Phần trăm hoàn thành quy trình</span>
                                            <span className={stageInfo.textColor}>{stageInfo.percent}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${stageInfo.barColor} transition-all duration-500 rounded-full`}
                                                style={{ width: `${stageInfo.percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Vùng: <strong className="text-slate-800">{b.farmAreaName || 'N/A'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Ngày trồng: <strong>{b.plantingDate ? new Date(b.plantingDate).toLocaleDateString('vi-VN') : 'N/A'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Sprout className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Dự kiến: <strong className="text-slate-800">{b.expectedQuantity ? `${b.expectedQuantity} kg` : 'Chưa rõ'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Trạng thái: <strong className="text-emerald-700">{b.workerStatus === 'ACCEPTED' ? 'Đã nhận' : 'Chờ xác nhận'}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handleOpenDetailModal(b)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Xem Lịch trình & Log</span>
                                    </button>

                                    <button
                                        onClick={() => navigate('/farmer/logs')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>+ Ghi Nhật ký</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Detail Timeline Nhật ký Canh tác */}
            <AppModal
                isOpen={!!selectedBatch}
                onClose={() => setSelectedBatch(null)}
                title={selectedBatch ? `Lịch Trình Canh Tác - Lô ${selectedBatch.batchCode}` : ''}
            >
                {selectedBatch && (
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <p>Sản phẩm: <strong className="text-slate-800">{selectedBatch.productName || selectedBatch.fruitTypeName}</strong></p>
                            <p>Vùng trồng: <strong className="text-slate-800">{selectedBatch.farmAreaName}</strong></p>
                            <p>Giai đoạn: <strong className="text-emerald-700">{getStageDetails(selectedBatch.currentStage).label}</strong></p>
                        </div>

                        <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-600" /> Các Hoạt Động Nhật Ký Đã Ghi Chép
                        </h4>

                        {loadingLogs ? (
                            <div className="py-6 text-center text-xs text-slate-500">Đang tải danh sách nhật ký...</div>
                        ) : batchLogs.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200 text-xs text-slate-500">
                                Lô này chưa có nhật ký thực địa nào được ghi nhận.
                            </div>
                        ) : (
                            <div className="relative pl-5 border-l-2 border-emerald-200 space-y-4 my-2">
                                {batchLogs.map((log) => (
                                    <div key={log.id} className="relative">
                                        <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                                    {log.activityType}
                                                </span>
                                                <span className="text-slate-400">
                                                    {log.logDate ? new Date(log.logDate).toLocaleString('vi-VN') : ''}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 pt-1">{log.description}</p>
                                            {log.images && log.images.length > 0 && (
                                                <div className="flex gap-2 pt-2">
                                                    {log.images.map((img, idx) => (
                                                        <a key={idx} href={img} target="_blank" rel="noreferrer">
                                                            <img src={img} alt="Nông trại" className="w-12 h-12 object-cover rounded-lg border" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end pt-3 border-t">
                            <AppButton variant="outline" onClick={() => setSelectedBatch(null)}>
                                Đóng
                            </AppButton>
                        </div>
                    </div>
                )}
            </AppModal>
        </div>
    );
};
