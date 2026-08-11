import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    Search,
    RefreshCw,
    Layers,
    Calendar,
    User,
    Image as ImageIcon,
    ExternalLink,
    Filter,
    Droplets,
    Sprout,
    ShieldAlert,
    Scissors,
    CheckCircle2,
    Eye,
    X,
    Users
} from 'lucide-react';
import {
    processorService,
    type BatchDto,
    type CultivationLogDto
} from '../../services/processorService';

// Cấu hình loại hoạt động canh tác & badge hiển thị
const ACTIVITY_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    'Tưới nước': { label: 'Tưới nước', bg: 'bg-blue-100 border-blue-200', text: 'text-blue-800', icon: Droplets },
    'Bón phân': { label: 'Bón phân', bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', icon: Sprout },
    'Phun thuốc': { label: 'Phun thuốc', bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', icon: ShieldAlert },
    'Chăm sóc': { label: 'Chăm sóc / Tỉa cành', bg: 'bg-purple-100 border-purple-200', text: 'text-purple-800', icon: Scissors },
    'Thu hoạch': { label: 'Thu hoạch', bg: 'bg-orange-100 border-orange-200', text: 'text-orange-800', icon: CheckCircle2 },
};

const DEFAULT_ACTIVITY = { label: 'Hoạt động khác', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800', icon: FileText };

export const ProductionLogManagementPage: React.FC = () => {
    // State dữ liệu Lô sản xuất & Nhật ký canh tác của nông dân
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [logs, setLogs] = useState<CultivationLogDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [logsLoading, setLogsLoading] = useState<boolean>(false);

    // State tìm kiếm & lọc loại hoạt động
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activityFilter, setActivityFilter] = useState<string>('ALL');

    // State Lightbox xem ảnh phóng to
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // 1. Tải danh sách Lô sản xuất thuộc Hợp tác xã
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const batchList = await processorService.getBatches();
            setBatches(batchList);
            if (batchList.length > 0) {
                setSelectedBatchId(batchList[0].id);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách lô sản xuất:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchBatches();
    }, [fetchBatches]);

    // 2. Tải Nhật ký canh tác do Nông dân ghi nhận trên Lô được chọn
    const fetchLogsForBatch = useCallback(async (batchId: string) => {
        if (!batchId) {
            setLogs([]);
            return;
        }
        setLogsLoading(true);
        try {
            const data = await processorService.getCultivationLogsByBatch(batchId);
            setLogs(data);
        } catch (err) {
            console.error(`Lỗi khi tải nhật ký của lô ${batchId}:`, err);
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedBatchId) {
            void fetchLogsForBatch(selectedBatchId);
        }
    }, [selectedBatchId, fetchLogsForBatch]);

    // Lọc danh sách nhật ký theo từ khóa và loại hoạt động
    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.activityType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesActivity = activityFilter === 'ALL' || log.activityType === activityFilter;
        return matchesSearch && matchesActivity;
    });

    const selectedBatchInfo = batches.find((b) => b.id === selectedBatchId);
    const assignedFarmersCount = selectedBatchInfo?.workers?.length || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Nền Trắng Chữ Đen */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
                            <FileText className="w-7 h-7 text-emerald-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Giám Sát Nhật Ký Canh Tác Nông Dân
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Theo dõi quá trình thực hiện canh tác thực tế của các nông dân/xã viên đang thực hiện trên lô hàng được giao.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (selectedBatchId) void fetchLogsForBatch(selectedBatchId);
                        }}
                        disabled={logsLoading}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-600 ${logsLoading ? 'animate-spin' : ''}`} />
                        <span>Làm mới dữ liệu</span>
                    </button>
                </div>
            </div>

            {/* Thanh Chọn Lô Sản Xuất & Thống Kê Giám Sát */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dropdown Chọn Lô Sản Xuất */}
                <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>Chọn Lô Sản Xuất Đang Giám Sát</span>
                    </label>

                    {loading ? (
                        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                    ) : (
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                            {batches.length === 0 ? (
                                <option value="">Chưa có lô sản xuất nào</option>
                            ) : (
                                batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        [{b.batchCode}] {b.productName || b.fruitTypeName} - Vùng trồng: {b.farmAreaName || 'N/A'} (Ngày xuống giống: {new Date(b.plantingDate).toLocaleDateString('vi-VN')})
                                    </option>
                                ))
                            )}
                        </select>
                    )}

                    {selectedBatchInfo && (
                        <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                            <span><strong>Mã Lô:</strong> {selectedBatchInfo.batchCode}</span>
                            <span><strong>Trạng thái:</strong> {selectedBatchInfo.currentStage}</span>
                            <span><strong>Sản lượng dự kiến:</strong> {selectedBatchInfo.expectedQuantity} kg</span>
                            <span><strong>Đại diện hộ trồng:</strong> {selectedBatchInfo.representativeWorkerName || 'N/A'}</span>
                        </div>
                    )}
                </div>

                {/* Thẻ Thống Kê Tổng Quan */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Quan Giám Sát</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900">{logs.length}</span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            Hoạt động đã ghi
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                        <p className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nông dân tham gia: <strong>{assignedFarmersCount} nông dân</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nhật ký có ảnh IPFS: <strong>{logs.filter(l => l.imageUrls && l.imageUrls.length > 0).length}</strong></span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Thanh Tìm Kiếm & Bộ Lọc Loại Công Việc */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên nông dân, nội dung công việc, loại vật tư..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
                        <button
                            onClick={() => setActivityFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activityFilter === 'ALL'
                                ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Tất cả
                        </button>
                        {Object.keys(ACTIVITY_CONFIG).map((actKey) => {
                            const conf = ACTIVITY_CONFIG[actKey];
                            return (
                                <button
                                    key={actKey}
                                    onClick={() => setActivityFilter(actKey)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activityFilter === actKey
                                        ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {conf.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Danh Sách Nhật Ký Canh Tác Do Nông Dân Thực Hiện */}
            {logsLoading ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Đang tải dữ liệu canh tác của nông dân...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">Chưa có nhật ký canh tác nào</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Nông dân được phân công vào lô này chưa gửi nhật ký công việc thực địa.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredLogs.map((log) => {
                        const actConf = ACTIVITY_CONFIG[log.activityType] || DEFAULT_ACTIVITY;
                        const ActIcon = actConf.icon;

                        return (
                            <div
                                key={log.id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-4"
                            >
                                {/* Thông tin Nông dân thực hiện & Ngày ghi */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl border ${actConf.bg} ${actConf.text}`}>
                                            <ActIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${actConf.bg} ${actConf.text}`}>
                                                    {actConf.label}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    Lô: <strong>{log.batchCode || selectedBatchInfo?.batchCode}</strong>
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Ngày thực hiện: {new Date(log.logDate).toLocaleDateString('vi-VN')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nông dân/Xã viên thực hiện */}
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs self-start sm:self-auto font-semibold">
                                        <User className="w-4 h-4 text-emerald-700" />
                                        <span>Nông dân canh tác: <strong>{log.userFullName || 'Xã viên liên kết'}</strong></span>
                                    </div>
                                </div>

                                {/* Nội dung mô tả chi tiết từ Nông dân */}
                                <div className="text-sm text-slate-800 leading-relaxed font-medium">
                                    {log.description}
                                </div>

                                {/* Ảnh bằng chứng thực địa IPFS từ Nông dân */}
                                {log.imageUrls && log.imageUrls.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Ảnh chụp bằng chứng thực địa ({log.imageUrls.length} ảnh):</span>
                                        </span>
                                        <div className="flex flex-wrap gap-3">
                                            {log.imageUrls.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setPreviewImage(url)}
                                                    className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group cursor-pointer shadow-sm hover:ring-2 hover:ring-emerald-500 transition-all"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Evidence ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                        <Eye className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metadata IPFS */}
                                {log.metadataURI && (
                                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-mono border-t border-slate-50">
                                        <span className="text-slate-400">Xác thực Metadata IPFS:</span>
                                        <a
                                            href={log.metadataURI}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-700 hover:underline flex items-center gap-1 truncate max-w-xs"
                                        >
                                            <span className="truncate">{log.metadataURI}</span>
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox xem phóng to ảnh */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={previewImage}
                            alt="Full Preview"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/20 object-contain"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-4 -right-4 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 border border-white/20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
