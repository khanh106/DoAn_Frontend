import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import {
    QrCode,
    Printer,
    Search,
    Copy,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Store,
    ShoppingBag,
    Scan,
    Tag,
    Eye,
    RefreshCw,
    SlidersHorizontal,
    Check,
    Building2,
    MapPin,
    BadgeCheck,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppTabs, type TabItem } from '../../components/ui/AppTabs';
import { AppModal } from '../../components/ui/AppModal';
import { AppInput } from '../../components/ui/AppInput';
import {
    retailerService,
    type ShipmentHistoryDto,
    type ShelfItemConfig,
    type RetailerQualityRecord
} from '../../services/retailerService';
import { type QRCodeInfoDto, type QRTargetType } from '../../services/shippingAndQrService';

export const RetailerQRCodesPage: React.FC = () => {
    // Data States (Thuần dữ liệu thực từ Backend API)
    const [shipments, setShipments] = useState<ShipmentHistoryDto[]>([]);
    const [shelfConfigs, setShelfConfigs] = useState<Record<string, ShelfItemConfig>>({});
    const [qualityRecords, setQualityRecords] = useState<Record<string, RetailerQualityRecord>>({});
    const [qrCodeMap, setQrCodeMap] = useState<Record<string, QRCodeInfoDto[]>>({});

    // Page States
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('catalog'); // 'catalog' | 'scanner' | 'batch-print'

    // Filters
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [targetTypeFilter, setTargetTypeFilter] = useState<string>('ALL'); // 'ALL' | 'SUBBATCH' | 'BATCH'

    // Modals
    const [printModalShipment, setPrintModalShipment] = useState<ShipmentHistoryDto | null>(null);
    const [printLabelSize, setPrintLabelSize] = useState<'50x30' | '80x50'>('50x30');
    const [traceModalShipment, setTraceModalShipment] = useState<ShipmentHistoryDto | null>(null);
    const [traceData, setTraceData] = useState<any | null>(null);
    const [traceLoading, setTraceLoading] = useState<boolean>(false);

    // QR Generation Modal
    const [genModalShipment, setGenModalShipment] = useState<ShipmentHistoryDto | null>(null);
    const [genTargetType, setGenTargetType] = useState<QRTargetType>('COMMERCIAL');
    const [genLoading, setGenLoading] = useState<boolean>(false);
    const [genResult, setGenResult] = useState<any | null>(null);

    // Web Scanner Tab State
    const [scanInputCode, setScanInputCode] = useState<string>('');
    const [scanLoading, setScanLoading] = useState<boolean>(false);
    const [scanResult, setScanResult] = useState<any | null>(null);
    const [scanVerifyInfo, setScanVerifyInfo] = useState<any | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    // Batch Print State
    const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
    const [batchPrintPaper, setBatchPrintPaper] = useState<'A4_12' | 'A4_24'>('A4_12');

    // Toast copy state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Tải dữ liệu thực từ Backend API
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await retailerService.getMyShipments();
            const validData = Array.isArray(data) ? data : [];
            setShipments(validData);
            setShelfConfigs(retailerService.getAllShelfConfigs());
            setQualityRecords(retailerService.getAllQualityRecords());
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi tải dữ liệu Vận đơn Siêu thị:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể kết nối đến Backend API để lấy danh sách vận đơn siêu thị.');
            setShipments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Truy vấn nhật ký truy xuất nguồn gốc thực tế từ Backend API (/api/v1/public/trace/{code})
    const handleViewTraceability = async (shipment: ShipmentHistoryDto) => {
        setTraceModalShipment(shipment);
        setTraceLoading(true);
        setTraceData(null);
        const codeLookup = shipment.subBatchCode || shipment.batchCode || shipment.shippingCode || shipment.id;
        try {
            const res = await retailerService.getPublicTrace(codeLookup);
            setTraceData(res);
        } catch (err) {
            console.error('Lỗi tra cứu nguồn gốc thực tế:', err);
            setTraceData(null);
        } finally {
            setTraceLoading(false);
        }
    };

    // Gọi Backend API phát hành mã QR thương mại mới (POST /api/v1/processor/qrcodes/generate)
    const handleGenerateQr = async () => {
        if (!genModalShipment) return;
        setGenLoading(true);
        setGenResult(null);
        const targetId = genModalShipment.subBatchId || genModalShipment.batchId || genModalShipment.id;
        try {
            const result = await retailerService.generateQrCode(genTargetType, targetId);
            setGenResult(result);
            setSuccessMessage(`✅ Đã phát hành Mã QR thương mại (${genTargetType}) thành công trên hệ thống!`);
            void loadData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi phát hành QR:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể tạo mã QR. Vui lòng kiểm tra quyền truy cập.');
        } finally {
            setGenLoading(false);
        }
    };

    // Quét & tra cứu mã QR thực tế qua Backend API
    const handleExecuteScan = async (codeToScan?: string) => {
        const code = (codeToScan || scanInputCode).trim();
        if (!code) {
            setScanError('Vui lòng nhập mã QR, mã lô hoặc mã vận đơn.');
            return;
        }
        setScanLoading(true);
        setScanError(null);
        setScanResult(null);
        setScanVerifyInfo(null);

        try {
            // 1. Xác thực hợp lệ QR
            try {
                const verify = await retailerService.verifyQrCode(code);
                setScanVerifyInfo(verify);
            } catch {
                setScanVerifyInfo({ valid: false, message: 'Mã QR chưa kích hoạt hoặc không tìm thấy.' });
            }

            // 2. Lấy dữ liệu chuỗi cung ứng công khai
            const trace = await retailerService.getPublicTrace(code);
            setScanResult(trace);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi tra cứu QR:', errorObj);
            setScanError(errorObj.response?.data?.message || `Không tìm thấy dữ liệu nông sản với mã "${code}".`);
        } finally {
            setScanLoading(false);
        }
    };

    // Lọc danh sách lô hàng theo từ khóa và loại QR
    const filteredShipments = useMemo(() => {
        if (!Array.isArray(shipments)) return [];
        return shipments.filter((item) => {
            if (!item) return false;
            const code = (item.subBatchCode || item.batchCode || item.shippingCode || '').toLowerCase();
            const carrier = (item.carrierInfo || '').toLowerCase();
            const location = (item.destination || '').toLowerCase();
            const matchesSearch =
                code.includes(searchTerm.toLowerCase()) ||
                carrier.includes(searchTerm.toLowerCase()) ||
                location.includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (targetTypeFilter === 'SUBBATCH') return !!item.subBatchId;
            if (targetTypeFilter === 'BATCH') return !item.subBatchId && !!item.batchId;

            return true;
        });
    }, [shipments, searchTerm, targetTypeFilter]);

    // Chọn / Bỏ chọn cho in hàng loạt
    const toggleSelectShipment = (id: string) => {
        setSelectedShipmentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedShipmentIds.length === filteredShipments.length) {
            setSelectedShipmentIds([]);
        } else {
            setSelectedShipmentIds(filteredShipments.map((s) => s.id));
        }
    };

    // Tính toán chỉ số thống kê từ dữ liệu thực
    const totalShipments = Array.isArray(shipments) ? shipments.length : 0;
    const readyForSaleCount = Array.isArray(shipments) ? shipments.filter((s) => s?.readyForSaleDate).length : 0;

    const tabs: TabItem[] = [
        { id: 'catalog', label: 'Danh mục Mã QR & Nhãn Giá' },
        { id: 'scanner', label: 'Quét & Xác Thực QR Tức Thì' },
        { id: 'batch-print', label: 'In Tem Nhãn Khổ A4 Hàng Loạt' }
    ];

    // Các cột bảng danh mục tương thích chuẩn AppTable (dùng key và render)
    const catalogColumns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'MÃ LÔ / VẬN ĐƠN',
            key: 'shippingCode',
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-green-600 shrink-0" />
                        {item.subBatchCode || item.batchCode || item.shippingCode}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        Vận đơn: {item.shippingCode}
                    </div>
                </div>
            )
        },
        {
            header: 'LOẠI SẢN PHẨM & QR',
            key: 'qrType',
            render: (item) => {
                const isSub = !!item.subBatchId;
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <AppBadge variant={isSub ? 'purple' : 'blue'}>
                                {isSub ? 'Lô con (SubBatch)' : 'Lô gốc (Batch)'}
                            </AppBadge>
                            <AppBadge variant="green">QR On-Chain</AppBadge>
                        </div>
                        <span className="text-xs text-slate-500">
                            Mã chuỗi cung ứng chuẩn
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'GIÁ NIÊM YẾT & KỆ',
            key: 'shelfPrice',
            render: (item) => {
                const config = shelfConfigs?.[item.id];
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-green-700">
                            {config?.unitPriceVnd ? `${config.unitPriceVnd.toLocaleString('vi-VN')} đ/kg` : 'Chưa cài giá'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {config?.shelfLocation || 'Chưa gán kệ'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'KIỂM ĐỊNH QA',
            key: 'quality',
            render: (item) => {
                const qa = qualityRecords?.[item.id];
                if (!qa) {
                    return <AppBadge variant="yellow">Chưa kiểm định</AppBadge>;
                }
                return (
                    <div className="flex flex-col gap-1">
                        <AppBadge variant={qa.qaResult === 'PASSED' ? 'green' : 'red'}>
                            {qa.qaResult === 'PASSED' ? 'Đạt QA (Đã duyệt)' : 'Cảnh báo'}
                        </AppBadge>
                        <span className="text-[11px] text-slate-500">
                            {qa.sensoryGrade} • Tươi: {qa.freshnessRating}/5⭐
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'TRẠNG THÁI SIÊU THỊ',
            key: 'status',
            render: (item) => {
                if (item.readyForSaleDate) {
                    return <AppBadge variant="green">Đang bán trên kệ</AppBadge>;
                }
                if (item.receivedDate) {
                    return <AppBadge variant="blue">Đã tiếp nhận kho</AppBadge>;
                }
                return <AppBadge variant="gray">Đang vận chuyển</AppBadge>;
            }
        },
        {
            header: 'THAO TÁC QR',
            key: 'actions',
            render: (item) => {
                const qrValue = item.subBatchCode || item.batchCode || item.shippingCode;
                const traceUrl = `${window.location.origin}/trace/${qrValue}`;
                return (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => void handleViewTraceability(item)}
                            title="Xem chi tiết nguồn gốc & Blockchain"
                            className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setPrintModalShipment(item)}
                            title="In tem nhãn giá & Mã QR"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => {
                                setGenModalShipment(item);
                                setGenResult(null);
                            }}
                            title="Tạo mã QR thương mại mới"
                            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => handleCopy(traceUrl, item.id)}
                            title="Sao chép Link truy xuất công khai"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                            {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6 pb-12 select-none">
            {/* TOP HEADER BANNER */}
            <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium mb-1">
                            <Store className="w-4 h-4" />
                            <span>PORTAL SIÊU THỊ & CỬA HÀNG BÁN LẺ</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <QrCode className="w-8 h-8 text-emerald-300" />
                            Quản Lý Mã QR Sản Phẩm & Tem Nhãn Bán Lẻ
                        </h1>
                        <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
                            Niêm yết tem giá, in mã QR truy xuất nguồn gốc chuẩn on-chain, minh bạch chuỗi cung ứng cho người tiêu dùng tại siêu thị.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <AppButton
                            variant="secondary"
                            onClick={() => void loadData()}
                            disabled={loading}
                            className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm Mới
                        </AppButton>

                        <AppButton
                            onClick={() => {
                                setActiveTab('scanner');
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none shadow-lg shadow-emerald-500/20"
                        >
                            <Scan className="w-4 h-4 mr-2" />
                            Quét QR Tức Thì
                        </AppButton>
                    </div>
                </div>

                {/* METRICS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-600/40">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                        <div className="text-xs text-emerald-200 font-medium">Tổng Sản Phẩm Trong Kho</div>
                        <div className="text-2xl font-bold text-white mt-1">{totalShipments} lô</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                        <div className="text-xs text-emerald-200 font-medium">Đang Niêm Yết Kệ Bán</div>
                        <div className="text-2xl font-bold text-emerald-300 mt-1">{readyForSaleCount} mặt hàng</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                        <div className="text-xs text-emerald-200 font-medium">Mã QR Khả Dụng</div>
                        <div className="text-2xl font-bold text-teal-200 mt-1">{totalShipments} tem</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                        <div className="text-xs text-emerald-200 font-medium">Trạng Thái Chuỗi Blockchain</div>
                        <div className="text-2xl font-bold text-green-300 mt-1 flex items-center gap-1.5">
                            <BadgeCheck className="w-6 h-6 text-green-400" />
                            Đã Đồng Bộ
                        </div>
                    </div>
                </div>
            </div>

            {/* MESSAGES */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-sm">Đóng</button>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <span className="text-sm font-medium">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 text-sm">Đóng</button>
                </div>
            )}

            {/* TABS HEADER - CHUẨN PROPS: tabs, activeTabId, onTabChange */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <AppTabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* TAB 1: DANH MỤC MÃ QR & QUẢN LÝ NHÃN */}
            {activeTab === 'catalog' && (
                <div className="space-y-4">
                    {/* Filter Control Bar */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <AppInput
                                placeholder="Tìm kiếm theo tên sản phẩm, mã lô, mã vận đơn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600">Loại QR:</span>
                            </div>
                            <select
                                value={targetTypeFilter}
                                onChange={(e) => setTargetTypeFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="ALL">Tất cả loại lô</option>
                                <option value="SUBBATCH">Lô con (SubBatch)</option>
                                <option value="BATCH">Lô gốc (Batch)</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                            <span className="text-sm font-medium">Đang tải danh sách vận đơn và mã QR siêu thị...</span>
                        </div>
                    ) : filteredShipments.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                            <div className="font-bold text-slate-700">Chưa Có Vận Đơn Nào Trong Kho Siêu Thị</div>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                Hiện tại siêu thị chưa tiếp nhận lô hàng nào. Bạn có thể chuyển sang mục{' '}
                                <span className="font-semibold text-green-700">"Tiếp nhận lô hàng"</span> để thực hiện tiếp nhận các lô vận chuyển từ Nhà máy/HTX.
                            </p>
                        </div>
                    ) : (
                        <AppTable columns={catalogColumns} data={filteredShipments} showSTT={true} />
                    )}
                </div>
            )}

            {/* TAB 2: QUÉT & XÁC THỰC MÃ QR TỨC THÌ */}
            {activeTab === 'scanner' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Scanner Input Panel */}
                    <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                                <Scan className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Trình Quét & Tra Cứu QR</h3>
                                <p className="text-xs text-slate-500">Nhập mã QR hoặc quét trực tiếp để xác minh nguồn gốc</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Mã QR / QR Value / Mã Lô Nông Sản
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <AppInput
                                            placeholder="Ví dụ: BATCH-20260811-001 hoặc mã QR..."
                                            value={scanInputCode}
                                            onChange={(e) => setScanInputCode(e.target.value)}
                                            leftIcon={<QrCode className="w-4 h-4 text-slate-400" />}
                                        />
                                    </div>
                                    <AppButton
                                        onClick={() => void handleExecuteScan()}
                                        disabled={scanLoading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    >
                                        {scanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Quét / Tra Cứu'}
                                    </AppButton>
                                </div>
                            </div>

                            {/* Sample QR Codes for quick testing from real shipments */}
                            {shipments.length > 0 && (
                                <div>
                                    <div className="text-xs font-medium text-slate-500 mb-2">Thử nghiệm nhanh mã có sẵn tại Siêu thị:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {shipments.slice(0, 4).map((s) => {
                                            const code = s.subBatchCode || s.batchCode || s.shippingCode;
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        setScanInputCode(code);
                                                        void handleExecuteScan(code);
                                                    }}
                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-200"
                                                >
                                                    {code}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Camera Simulator visual */}
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 flex flex-col items-center justify-center min-h-[160px]">
                                <QrCode className="w-12 h-12 text-slate-300 mb-2 animate-pulse" />
                                <span className="text-xs text-slate-500 font-medium">Khung Quét QR Code Siêu Thị</span>
                                <span className="text-[11px] text-slate-400 mt-1">Đã sẵn sàng nhận diện camera / máy quét mã vạch</span>
                            </div>
                        </div>

                        {scanError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                                <span>{scanError}</span>
                            </div>
                        )}
                    </div>

                    {/* Scan Result Panel */}
                    <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        {!scanResult && !scanVerifyInfo ? (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-400">
                                <ShieldCheck className="w-16 h-16 text-slate-200 mb-3" />
                                <h4 className="font-bold text-slate-600">Chưa có dữ liệu tra cứu</h4>
                                <p className="text-xs max-w-sm mt-1">
                                    Vui lòng nhập mã QR hoặc chọn một lô hàng bên trái để thực hiện trích xuất nguồn gốc minh bạch.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Verification Status Header */}
                                <div className={`p-4 rounded-xl border flex items-center justify-between ${scanVerifyInfo?.valid ? 'bg-green-50 border-green-200 text-green-900' : 'bg-yellow-50 border-yellow-200 text-yellow-900'}`}>
                                    <div className="flex items-center gap-3">
                                        {scanVerifyInfo?.valid ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
                                        )}
                                        <div>
                                            <div className="font-bold text-sm">
                                                {scanVerifyInfo?.valid ? 'Mã QR Hợp Lệ Trên Blockchain' : 'Mã QR Chưa Được Kích Hoạt'}
                                            </div>
                                            <div className="text-xs opacity-80">
                                                {scanVerifyInfo?.targetType ? `Loại QR Target: ${scanVerifyInfo.targetType}` : 'Sử dụng mã định danh lô chuỗi cung ứng'}
                                            </div>
                                        </div>
                                    </div>

                                    <AppBadge variant={scanVerifyInfo?.valid ? 'green' : 'yellow'}>
                                        {scanVerifyInfo?.valid ? 'VERIFIED ON-CHAIN' : 'UNVERIFIED'}
                                    </AppBadge>
                                </div>

                                {scanResult && (
                                    <div className="space-y-4">
                                        <div className="border-b border-slate-100 pb-3">
                                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                                {scanResult.targetInfo?.productName || 'Nông Sản Chuẩn VietGAP'}
                                            </h4>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Mã lô: <span className="font-mono text-slate-800 font-semibold">{scanResult.targetInfo?.code || scanInputCode}</span>
                                            </div>
                                        </div>

                                        {/* Supply Chain Provenance Timeline */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hành Trình Chuỗi Cung Ứng Minh Bạch</h5>

                                            {/* Farm Step */}
                                            {scanResult.farmArea && (
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                                                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-xs text-slate-800">Nông Trại Canh Tác</div>
                                                        <div className="text-xs text-slate-600 mt-0.5">{scanResult.farmArea.name || 'Vùng trồng trái cây VietGAP'}</div>
                                                        <div className="text-[11px] text-slate-400">{scanResult.farmArea.location || 'Việt Nam'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Inspection Step */}
                                            {scanResult.inspection && (
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                                                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-xs text-slate-800">Kiểm Định Chất Lượng QA/QC</div>
                                                        <div className="text-xs text-slate-600 mt-0.5">Đơn vị: {scanResult.inspection.inspectionUnit || 'Trung Tâm Kiểm Định'}</div>
                                                        <div className="text-[11px] text-green-600 font-medium">Kết quả: {scanResult.inspection.result || 'PASSED'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Shipment Step */}
                                            {scanResult.shipment && (
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                                                    <div className="p-2 bg-purple-100 text-purple-800 rounded-lg shrink-0">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-xs text-slate-800">Đơn Vị Bán Lẻ / Siêu Thị</div>
                                                        <div className="text-xs text-slate-600 mt-0.5">Điểm đến: {scanResult.shipment.destination || 'Kho Siêu Thị'}</div>
                                                        <div className="text-[11px] text-slate-400">Đơn vị vận chuyển: {scanResult.shipment.carrierInfo}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Blockchain Transactions list */}
                                        {scanResult.blockchainHistory && scanResult.blockchainHistory.length > 0 && (
                                            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2">
                                                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                                    <BadgeCheck className="w-4 h-4" />
                                                    Lịch Sử Giao Dịch Smart Contract (On-Chain)
                                                </div>
                                                {scanResult.blockchainHistory.slice(0, 3).map((tx: any, idx: number) => (
                                                    <div key={idx} className="text-[11px] font-mono flex items-center justify-between border-t border-slate-800 pt-1.5">
                                                        <span className="text-slate-400">{tx.eventName || 'RecordEvent'}</span>
                                                        <span className="text-emerald-300 truncate max-w-[200px]">{tx.transactionHash || tx.txHash}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: IN TEM NHÃN HÀNG LOẠT KHỔ A4 */}
            {activeTab === 'batch-print' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <Printer className="w-5 h-5 text-green-600" />
                                In Tem Nhãn QR Hàng Loạt Khổ A4
                            </h3>
                            <p className="text-xs text-slate-500">
                                Chọn sản phẩm để tạo trang in tem nhãn siêu thị theo khổ giấy chuẩn A4
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={batchPrintPaper}
                                onChange={(e) => setBatchPrintPaper(e.target.value as 'A4_12' | 'A4_24')}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                            >
                                <option value="A4_12">Bố cục A4: 12 Tem/trang (Chuẩn Kệ)</option>
                                <option value="A4_24">Bố cục A4: 24 Tem/trang (Tem Bao Gói)</option>
                            </select>

                            <AppButton
                                onClick={() => window.print()}
                                disabled={selectedShipmentIds.length === 0}
                                className="bg-green-700 hover:bg-green-800 text-white font-bold"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                In Tất Cả Tem Đã Chọn ({selectedShipmentIds.length})
                            </AppButton>
                        </div>
                    </div>

                    {/* Checkbox Selector Bar */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedShipmentIds.length === filteredShipments.length && filteredShipments.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="text-xs font-bold text-slate-700">
                                Chọn tất cả ({selectedShipmentIds.length} / {filteredShipments.length} mặt hàng)
                            </span>
                        </div>
                    </div>

                    {/* Printable A4 Grid Preview */}
                    <div className="bg-slate-100 p-6 rounded-2xl overflow-auto border border-slate-300 max-h-[600px]">
                        <div className="print-area bg-white p-6 shadow-md mx-auto max-w-[800px] min-h-[1000px] border border-slate-200 rounded-xl">
                            <div className="text-center pb-4 mb-4 border-b border-slate-200">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trang In Tem Giá & QR Siêu Thị Khổ A4</div>
                                <div className="text-sm font-bold text-slate-800 mt-1">SIÊU THỊ NÔNG SẢN VIỆT NAM</div>
                            </div>

                            {selectedShipmentIds.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                    Vui lòng tích chọn các lô hàng phía trên để xem trước trang in tem nhãn.
                                </div>
                            ) : (
                                <div className={`grid ${batchPrintPaper === 'A4_12' ? 'grid-cols-2 gap-4' : 'grid-cols-3 gap-3'}`}>
                                    {selectedShipmentIds.map((id) => {
                                        const item = shipments.find((s) => s.id === id);
                                        if (!item) return null;
                                        const config = shelfConfigs[item.id];
                                        const code = item.subBatchCode || item.batchCode || item.shippingCode;
                                        return (
                                            <div
                                                key={item.id}
                                                className="border-2 border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 bg-white"
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="text-[10px] font-bold text-green-800 uppercase">SIÊU THỊ TRUY XUẤT</div>
                                                    <div className="text-xs font-bold text-slate-900 truncate">
                                                        {item.subBatchCode ? 'Trái Cây Lô Con' : 'Trái Cây VietGAP'}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-600">{code}</div>
                                                    <div className="text-sm font-extrabold text-green-700">
                                                        {config?.unitPriceVnd ? `${config.unitPriceVnd.toLocaleString('vi-VN')} đ/kg` : 'Chưa cài giá'}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center shrink-0">
                                                    {/* Visual QR Simulator */}
                                                    <div className="w-14 h-14 bg-slate-900 p-1 rounded flex items-center justify-center text-white">
                                                        <QrCode className="w-12 h-12 text-white" />
                                                    </div>
                                                    <span className="text-[9px] font-mono text-slate-500 mt-0.5">ON-CHAIN</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: SINGLE PRINT LABEL PREVIEW */}
            {printModalShipment && (
                <AppModal
                    isOpen={!!printModalShipment}
                    onClose={() => setPrintModalShipment(null)}
                    title="In Tem Giá & Mã QR Siêu Thị"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="text-xs font-semibold text-slate-700">Kích thước tem:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPrintLabelSize('50x30')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${printLabelSize === '50x30' ? 'bg-green-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                                >
                                    Tem dán khay (50x30mm)
                                </button>
                                <button
                                    onClick={() => setPrintLabelSize('80x50')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${printLabelSize === '80x50' ? 'bg-green-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                                >
                                    Tem kệ hàng (80x50mm)
                                </button>
                            </div>
                        </div>

                        {/* Visual Single Label Box */}
                        <div className="flex justify-center p-6 bg-slate-100 rounded-2xl">
                            <div className={`bg-white border-2 border-slate-900 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 ${printLabelSize === '50x30' ? 'w-[320px]' : 'w-[420px]'}`}>
                                <div className="space-y-1 flex-1">
                                    <div className="text-[10px] font-bold text-green-700 tracking-wider">SIÊU THỊ TRUY XUẤT NGUỒN GỐC</div>
                                    <div className="font-bold text-slate-900 text-sm">
                                        {printModalShipment.subBatchCode ? 'Trái Cây Tươi Loại 1' : 'Nông Sản VietGAP'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono">
                                        Mã lô: {printModalShipment.subBatchCode || printModalShipment.batchCode || printModalShipment.shippingCode}
                                    </div>
                                    <div className="text-lg font-extrabold text-green-800">
                                        {shelfConfigs[printModalShipment.id]?.unitPriceVnd
                                            ? `${shelfConfigs[printModalShipment.id].unitPriceVnd.toLocaleString('vi-VN')} đ/kg`
                                            : 'Chưa cài giá'}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-900 p-1.5 rounded-lg text-white flex items-center justify-center">
                                        <QrCode className="w-16 h-16 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 mt-1">QUÉT TRUY XUẤT</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <AppButton variant="secondary" onClick={() => setPrintModalShipment(null)}>
                                Hủy Bỏ
                            </AppButton>
                            <AppButton
                                onClick={() => window.print()}
                                className="bg-green-700 hover:bg-green-800 text-white font-bold"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                In Tem Nhãn Lựa Chọn
                            </AppButton>
                        </div>
                    </div>
                </AppModal>
            )}

            {/* MODAL 2: GENERATE COMMERCIAL QR */}
            {genModalShipment && (
                <AppModal
                    isOpen={!!genModalShipment}
                    onClose={() => setGenModalShipment(null)}
                    title="Phát Hành Mã QR Thương Mại Mới"
                >
                    <div className="space-y-4">
                        <p className="text-xs text-slate-600">
                            Phát hành mã QR Code chuẩn thương mại từ Backend API cho lô hàng:{' '}
                            <span className="font-bold text-slate-800">
                                {genModalShipment.subBatchCode || genModalShipment.batchCode || genModalShipment.shippingCode}
                            </span>
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Cấp Độ QR Code (TargetType)</label>
                            <select
                                value={genTargetType}
                                onChange={(e) => setGenTargetType(e.target.value as QRTargetType)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                            >
                                <option value="COMMERCIAL">COMMERCIAL (Tem thương mại bán lẻ)</option>
                                <option value="BOX">BOX (Tem dán thùng nông sản)</option>
                                <option value="SUBBATCH">SUBBATCH (Tem lô con)</option>
                                <option value="BATCH">BATCH (Tem lô gốc)</option>
                            </select>
                        </div>

                        {genResult && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                                <div className="text-xs font-bold text-green-800">Mã QR Đã Sinh Thành Công:</div>
                                <div className="text-xs font-mono text-slate-700">QR ID: {genResult.qrCodeId}</div>
                                {genResult.imageBase64 && (
                                    <div className="flex justify-center pt-2">
                                        <img
                                            src={`data:${genResult.imageContentType || 'image/png'};base64,${genResult.imageBase64}`}
                                            alt="Generated QR"
                                            className="w-32 h-32 border rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <AppButton variant="secondary" onClick={() => setGenModalShipment(null)}>
                                Đóng
                            </AppButton>
                            <AppButton
                                onClick={() => void handleGenerateQr()}
                                disabled={genLoading}
                                className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
                            >
                                {genLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                                Phát Hành QR
                            </AppButton>
                        </div>
                    </div>
                </AppModal>
            )}

            {/* MODAL 3: TRACEABILITY PROVENANCE DETAIL */}
            {traceModalShipment && (
                <AppModal
                    isOpen={!!traceModalShipment}
                    onClose={() => setTraceModalShipment(null)}
                    title="Nhật Ký Truy Xuất Nguồn Gốc On-Chain"
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        {traceLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                                <RefreshCw className="w-8 h-8 animate-spin text-green-600 mb-2" />
                                <span className="text-xs">Đang tải nhật ký chuỗi cung ứng từ Backend...</span>
                            </div>
                        ) : traceData ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-1">
                                    <div className="text-xs font-bold text-emerald-400">NÔNG SẢN MINH BẠCH</div>
                                    <div className="text-lg font-bold">
                                        {traceData.targetInfo?.productName || traceModalShipment.subBatchCode || traceModalShipment.batchCode}
                                    </div>
                                    <div className="text-xs text-slate-300 font-mono">
                                        Mã truy xuất: {traceData.targetInfo?.code || traceModalShipment.shippingCode}
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                    <h4 className="font-bold text-xs text-slate-700 uppercase">Thông Tin Chi Tiết Vận Đơn</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-slate-500">Người vận chuyển:</span> {traceModalShipment.carrierInfo}</div>
                                        <div><span className="text-slate-500">Điểm đến:</span> {traceModalShipment.destination || 'Siêu thị'}</div>
                                        <div><span className="text-slate-500">Trọng lượng:</span> {traceModalShipment.weight} kg</div>
                                        <div><span className="text-slate-500">Ngày tiếp nhận:</span> {traceModalShipment.receivedDate ? new Date(traceModalShipment.receivedDate).toLocaleDateString('vi-VN') : 'Đang bán'}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500">Không tìm thấy dữ liệu truy xuất cho lô hàng này.</div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-200">
                            <AppButton variant="secondary" onClick={() => setTraceModalShipment(null)}>
                                Đóng
                            </AppButton>
                        </div>
                    </div>
                </AppModal>
            )}
        </div>
    );
};

export default RetailerQRCodesPage;
