import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { QRCodeSVG } from 'qrcode.react';

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
    Download,
    ExternalLink,
    Info,
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
import { type QRCodeInfoDto } from '../../services/shippingAndQrService';
import { toast } from '../../utils/toast';

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

    // QR View Modal (Xem QR tạo sẵn từ HTX)
    const [viewQrShipment, setViewQrShipment] = useState<ShipmentHistoryDto | null>(null);
    const [viewQrCodes, setViewQrCodes] = useState<QRCodeInfoDto[]>([]);
    const [viewQrLoading, setViewQrLoading] = useState<boolean>(false);

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
            const msg = errorObj.response?.data?.message || 'Không thể kết nối đến Backend API để lấy danh sách vận đơn siêu thị.';
            setError(msg);
            toast.error(msg);
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

    // Tải ảnh SVG của mã QR về máy tính
    const handleDownloadQrSvg = (code: string) => {
        const svgElement = document.getElementById(`qr-modal-svg-${code}`);
        if (!svgElement) {
            toast.error('Không tìm thấy ảnh mã QR để tải về.');
            return;
        }
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `QR-Code-${code}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
        toast.success(`Đã tải ảnh mã QR [${code}] về máy.`);
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

    // Lấy danh sách QR code đã tạo sẵn từ HTX cho vận đơn
    const handleViewExistingQr = async (shipment: ShipmentHistoryDto) => {
        setViewQrShipment(shipment);
        setViewQrLoading(true);
        setViewQrCodes([]);
        try {
            const codes = await retailerService.getQrCodesForShipment(shipment.id);
            setViewQrCodes(Array.isArray(codes) ? codes : []);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi lấy QR codes:', errorObj);
            setViewQrCodes([]);
        } finally {
            setViewQrLoading(false);
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

    // Các cột bảng danh mục tương thích chuẩn AppTable đã được tinh giản & hiển thị ảnh QR
    const catalogColumns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'MÃ QR',
            key: 'qrThumbnail',
            align: 'center',
            render: (item) => {
                const code = item.subBatchCode || item.batchCode || item.shippingCode;
                const traceUrl = `${window.location.origin}/trace/${code}`;
                return (
                    <div className="flex flex-col items-center justify-center gap-1">
                        <button
                            type="button"
                            onClick={() => void handleViewExistingQr(item)}
                            title="Bấm để xem ảnh phóng to và tải mã QR"
                            className="p-1.5 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all cursor-pointer group inline-flex flex-col items-center justify-center"
                        >
                            <QRCodeSVG
                                value={traceUrl}
                                size={44}
                                level="M"
                                includeMargin={false}
                                className="transition-transform group-hover:scale-105"
                            />
                        </button>
                        <span
                            onClick={() => void handleViewExistingQr(item)}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                        >
                            <QrCode className="w-3 h-3 shrink-0" />
                            <span>Xem ảnh</span>
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'SẢN PHẨM & MÃ LÔ',
            key: 'shippingCode',
            render: (item) => {
                const code = item.subBatchCode || item.batchCode || item.shippingCode;
                const isSub = !!item.subBatchId;
                return (
                    <div className="flex flex-col gap-1 max-w-[220px]">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate text-sm">
                            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{item.subBatchCode ? 'Trái Cây Lô Con Hạng A' : 'Nông Sản Chuẩn VietGAP'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate">
                                {code}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(code, item.id + '-code')}
                                className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer inline-flex items-center justify-center shrink-0"
                                title="Sao chép mã lô"
                            >
                                {copiedId === item.id + '-code' ? (
                                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 shrink-0" />
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <AppBadge variant={isSub ? 'purple' : 'blue'}>
                                {isSub ? 'Lô con (SubBatch)' : 'Lô gốc (Batch)'}
                            </AppBadge>
                            <span className="truncate">Vận đơn: <strong className="font-mono text-slate-700">{item.shippingCode}</strong></span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'TRỌNG LƯỢNG & GIÁ KỆ',
            key: 'shelfPrice',
            render: (item) => {
                const config = shelfConfigs?.[item.id];
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-xs">
                                {item.weight.toLocaleString('vi-VN')} kg
                            </span>
                            {config?.unitPriceVnd ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-black rounded-lg border border-emerald-200">
                                    <Tag className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                                    {config.unitPriceVnd.toLocaleString('vi-VN')} đ/kg
                                </span>
                            ) : (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Chưa cài giá
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Kệ: <strong className="text-slate-700">{config?.shelfLocation || 'Chưa gán kệ'}</strong></span>
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'TRẠNG THÁI & KIỂM ĐỊNH',
            key: 'status',
            render: (item) => {
                const qa = qualityRecords?.[item.id];
                return (
                    <div className="flex flex-col gap-1.5">
                        {item.readyForSaleDate ? (
                            <AppBadge variant="green">Đang bán trên kệ</AppBadge>
                        ) : item.receivedDate ? (
                            <AppBadge variant="blue">Đã tiếp nhận kho</AppBadge>
                        ) : (
                            <AppBadge variant="gray">Đang vận chuyển</AppBadge>
                        )}
                        <div className="flex items-center gap-1.5">
                            {qa ? (
                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                    qa.qaResult === 'PASSED'
                                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                                }`}>
                                    <ShieldCheck className="w-3 h-3 shrink-0" />
                                    <span>{qa.qaResult === 'PASSED' ? 'Đạt QA Siêu thị' : 'Chờ xử lý QA'}</span>
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-400 italic">Chưa kiểm định QA</span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'THAO TÁC',
            key: 'actions',
            align: 'center',
            render: (item) => {
                const qrValue = item.subBatchCode || item.batchCode || item.shippingCode;
                const traceUrl = `${window.location.origin}/trace/${qrValue}`;
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Xem ảnh QR to */}
                        <button
                            type="button"
                            onClick={() => void handleViewExistingQr(item)}
                            title="Xem và tải ảnh mã QR"
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors cursor-pointer border border-purple-200 inline-flex items-center justify-center gap-1 text-xs font-semibold"
                        >
                            <QrCode className="w-3.5 h-3.5 shrink-0" />
                            <span>Mã QR</span>
                        </button>

                        {/* 2. In tem */}
                        <button
                            type="button"
                            onClick={() => setPrintModalShipment(item)}
                            title="In tem nhãn giá & Mã QR"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                        >
                            <Printer className="w-4 h-4 shrink-0" />
                        </button>

                        {/* 3. Xem chi tiết truy xuất */}
                        <button
                            type="button"
                            onClick={() => void handleViewTraceability(item)}
                            title="Xem chi tiết nguồn gốc & Blockchain"
                            className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                        >
                            <Eye className="w-4 h-4 shrink-0" />
                        </button>

                        {/* 4. Copy link */}
                        <button
                            type="button"
                            onClick={() => handleCopy(traceUrl, item.id)}
                            title="Sao chép Link truy xuất công khai"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                        >
                            {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-green-600 shrink-0" />
                            ) : (
                                <Copy className="w-4 h-4 shrink-0" />
                            )}
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6 pb-12 select-none">
            {/* Tối ưu hóa layout in ấn cho Siêu thị */}
            <style>{`
                @media print {
                    body {
                        background: white !important;
                    }
                    /* Ẩn toàn bộ thành phần trên màn hình */
                    body * {
                        visibility: hidden;
                    }
                    /* Chỉ hiển thị vùng có class print-area */
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    /* Đưa vùng in ra sát góc trang giấy */
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 10px !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

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
                            variant="grey"
                            onClick={() => void loadData()}
                            disabled={loading}
                            className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md cursor-pointer"
                            leftIcon={<RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Làm Mới
                        </AppButton>

                        <AppButton
                            onClick={() => {
                                setActiveTab('scanner');
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none shadow-lg shadow-emerald-500/20 cursor-pointer"
                            leftIcon={<Scan className="w-4 h-4 shrink-0" />}
                        >
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
                            <BadgeCheck className="w-6 h-6 text-green-400 shrink-0" />
                            Đã Đồng Bộ
                        </div>
                    </div>
                </div>
            </div>

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
                                        variant="green"
                                        leftIcon={scanLoading ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Scan className="w-4 h-4 shrink-0" />}
                                    >
                                        Quét / Tra Cứu
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
                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-200 cursor-pointer inline-flex items-center justify-center"
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
                                                <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>{scanResult.targetInfo?.productName || 'Nông Sản Chuẩn VietGAP'}</span>
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
                                                    <BadgeCheck className="w-4 h-4 shrink-0" />
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
                                <Printer className="w-5 h-5 text-green-600 shrink-0" />
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
                                variant="green"
                                leftIcon={<Printer className="w-4 h-4 shrink-0" />}
                            >
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
                                                className={`border-2 border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 bg-white ${batchPrintPaper === 'A4_12' ? 'h-[140px]' : 'h-[110px]'
                                                    }`}
                                            >
                                                <div className="flex-1 space-y-1 min-w-0">
                                                    <div className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-wider">GREEN-MART TRUY XUẤT</div>
                                                    <div className="text-xs font-bold text-slate-900 truncate">
                                                        {item.subBatchCode ? 'Trái Cây Lô Con Hạng A' : 'Nông Sản VietGAP'}
                                                    </div>
                                                    <div className="text-[9px] font-mono text-slate-500 truncate">{code}</div>
                                                    <div className="text-sm font-black text-red-600">
                                                        {config?.unitPriceVnd ? `${config.unitPriceVnd.toLocaleString('vi-VN')} đ/kg` : 'Chưa cài giá'}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400">
                                                        TL: {item.weight} kg | Kệ: {config?.shelfLocation || 'Kho'}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center justify-center shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                                    <QRCodeSVG
                                                        value={`${window.location.origin}/trace/${code}`}
                                                        size={batchPrintPaper === 'A4_12' ? 60 : 45}
                                                        level="M"
                                                        includeMargin={false}
                                                    />
                                                    <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase">ON-CHAIN</span>
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
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center ${printLabelSize === '50x30' ? 'bg-green-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                                >
                                    Tem dán khay (50x30mm)
                                </button>
                                <button
                                    onClick={() => setPrintLabelSize('80x50')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center ${printLabelSize === '80x50' ? 'bg-green-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                                >
                                    Tem kệ hàng (80x50mm)
                                </button>
                            </div>
                        </div>

                        {/* Visual Single Label Box */}
                        <div className="flex justify-center p-6 bg-slate-100 rounded-2xl print:bg-white print:p-0">
                            {printLabelSize === '50x30' ? (
                                /* Tem dán khay 50x30mm */
                                <div className="print-area bg-white border-2 border-dashed border-slate-800 p-3 rounded-lg shadow-md flex items-center justify-between gap-3 w-[320px] h-[180px] print:shadow-none print:border-solid">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="text-[9px] font-extrabold text-emerald-700 tracking-wider uppercase">★ GREEN-MART STICKER ★</div>
                                        <h4 className="font-bold text-slate-900 text-sm truncate">
                                            {printModalShipment.subBatchCode ? 'Trái Cây Tươi Hạng A' : 'Nông Sản Chuẩn VietGAP'}
                                        </h4>
                                        <div className="text-[10px] text-slate-500 font-mono truncate">
                                            Lô: {printModalShipment.subBatchCode || printModalShipment.batchCode || printModalShipment.shippingCode}
                                        </div>
                                        <div className="text-base font-black text-slate-900 mt-1">
                                            {shelfConfigs[printModalShipment.id]?.unitPriceVnd
                                                ? `${shelfConfigs[printModalShipment.id].unitPriceVnd.toLocaleString('vi-VN')} đ/kg`
                                                : 'Chưa cài giá'}
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-medium">
                                            TL: {printModalShipment.weight} kg
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center shrink-0 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/trace/${printModalShipment.subBatchCode || printModalShipment.batchCode || printModalShipment.shippingCode}`}
                                            size={60}
                                            level="M"
                                            includeMargin={false}
                                        />
                                        <span className="text-[7px] font-black text-emerald-800 mt-1 uppercase tracking-tighter">TRUY XUẤT</span>
                                    </div>
                                </div>
                            ) : (
                                /* Tem kệ hàng 80x50mm Premium */
                                <div className="print-area bg-white border-2 border-slate-900 rounded-xl shadow-lg flex flex-col justify-between w-[400px] h-[240px] overflow-hidden print:shadow-none print:m-0">
                                    <div className="bg-emerald-700 text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                                            Bảo Chứng Blockchain
                                        </span>
                                        <span className="text-emerald-100">VietGAP Quality</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 gap-3 flex-1">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 text-base leading-tight truncate">
                                                {printModalShipment.subBatchCode ? 'Trái Cây Tươi Hạng A' : 'Nông Sản Chuẩn VietGAP'}
                                            </h4>

                                            <div className="text-[10px] text-slate-500 font-mono truncate">
                                                Mã lô: <span className="font-semibold text-slate-800">{printModalShipment.subBatchCode || printModalShipment.batchCode || printModalShipment.shippingCode}</span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                                                    ĐẠT QA
                                                </span>
                                                <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                                    TL: {printModalShipment.weight} kg
                                                </span>
                                            </div>

                                            <div className="text-2xl font-black text-red-600 leading-none pt-1">
                                                {shelfConfigs[printModalShipment.id]?.unitPriceVnd
                                                    ? `${shelfConfigs[printModalShipment.id].unitPriceVnd.toLocaleString('vi-VN')} đ/kg`
                                                    : 'Chưa cài giá'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
                                            <div className="bg-white p-1 rounded-lg border border-slate-100">
                                                <QRCodeSVG
                                                    value={`${window.location.origin}/trace/${printModalShipment.subBatchCode || printModalShipment.batchCode || printModalShipment.shippingCode}`}
                                                    size={80}
                                                    level="H"
                                                    includeMargin={false}
                                                />
                                            </div>
                                            <span className="text-[8px] font-black text-slate-700 mt-1 uppercase tracking-wider">QUÉT TRUY XUẤT</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 px-3 py-1 border-t border-slate-100 flex items-center justify-between text-[8px] font-semibold text-slate-500">
                                        <span>Kệ hàng: {shelfConfigs[printModalShipment.id]?.shelfLocation || 'Khu Trưng Bày'}</span>
                                        <span className="font-mono text-emerald-700">On-Chain QR Code</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <AppButton variant="secondary" onClick={() => setPrintModalShipment(null)}>
                                Hủy Bỏ
                            </AppButton>
                            <AppButton
                                onClick={() => window.print()}
                                variant="green"
                                leftIcon={<Printer className="w-4 h-4 shrink-0" />}
                            >
                                In Tem Nhãn Lựa Chọn
                            </AppButton>
                        </div>
                    </div>
                </AppModal>
            )}

            {/* MODAL 2: XEM VÀ TẢI ẢNH MÃ QR */}
            {viewQrShipment && (
                <AppModal
                    isOpen={!!viewQrShipment}
                    onClose={() => setViewQrShipment(null)}
                    title={`MÃ QR TRUY XUẤT NGUỒN GỐC - LÔ [${viewQrShipment.subBatchCode || viewQrShipment.batchCode || viewQrShipment.shippingCode}]`}
                    maxWidth="md"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <AppButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadQrSvg(viewQrShipment.subBatchCode || viewQrShipment.batchCode || viewQrShipment.shippingCode)}
                                    leftIcon={<Download className="w-4 h-4 shrink-0" />}
                                >
                                    Tải ảnh QR (.svg)
                                </AppButton>
                                <AppButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const ship = viewQrShipment;
                                        setViewQrShipment(null);
                                        setPrintModalShipment(ship);
                                    }}
                                    leftIcon={<Printer className="w-4 h-4 shrink-0 text-blue-600" />}
                                >
                                    In Tem Nhãn
                                </AppButton>
                            </div>
                            <AppButton variant="grey" size="sm" onClick={() => setViewQrShipment(null)}>
                                Đóng
                            </AppButton>
                        </div>
                    }
                >
                    {(() => {
                        const code = viewQrShipment.subBatchCode || viewQrShipment.batchCode || viewQrShipment.shippingCode;
                        const traceUrl = `${window.location.origin}/trace/${code}`;
                        return (
                            <div className="space-y-4 text-center">
                                {/* Khung Hiển Thị Ảnh QR Code */}
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-md flex flex-col items-center">
                                        <QRCodeSVG
                                            id={`qr-modal-svg-${code}`}
                                            value={traceUrl}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                        />
                                        <div className="mt-2 text-center">
                                            <span className="text-[10px] font-black tracking-wider text-emerald-800 uppercase block">
                                                ★ GREEN-MART TRUY XUẤT ON-CHAIN ★
                                            </span>
                                            <span className="text-xs font-mono font-bold text-slate-800">{code}</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-slate-500 mt-3 font-medium">
                                        Quét mã bằng Camera điện thoại hoặc Zalo để mở trang truy xuất
                                    </span>
                                </div>

                                {/* Thông tin lô hàng */}
                                <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-left text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Sản phẩm:</span>
                                        <span className="font-bold text-slate-900">
                                            {viewQrShipment.subBatchCode ? 'Trái Cây Lô Con Hạng A' : 'Nông Sản Chuẩn VietGAP'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Mã vận đơn:</span>
                                        <span className="font-mono font-bold text-slate-800">{viewQrShipment.shippingCode}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-medium">Trọng lượng:</span>
                                        <span className="font-bold text-emerald-700">{viewQrShipment.weight} kg</span>
                                    </div>
                                </div>

                                {/* Link tra cứu công khai & Copy */}
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-left space-y-1.5">
                                    <div className="flex items-center justify-between font-bold">
                                        <span className="flex items-center gap-1.5">
                                            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                                            Đường dẫn quét tem trực tiếp:
                                        </span>
                                        <a
                                            href={traceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 underline"
                                        >
                                            <span>Mở tab mới</span>
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                        </a>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200 text-[11px] font-mono break-all gap-2">
                                        <span className="truncate">{traceUrl}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(traceUrl, 'modal-qr-copy')}
                                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer shrink-0 inline-flex items-center justify-center"
                                            title="Sao chép liên kết"
                                        >
                                            {copiedId === 'modal-qr-copy' ? (
                                                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Danh sách QR phụ nếu HTX cấp */}
                                {viewQrLoading ? (
                                    <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                                        <span>Đang kiểm tra các mã QR định danh khác từ HTX...</span>
                                    </div>
                                ) : viewQrCodes.length > 0 ? (
                                    <div className="space-y-2 text-left pt-2 border-t border-slate-200">
                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <BadgeCheck className="w-4 h-4 text-purple-600 shrink-0" />
                                            <span>Mã định danh QR phụ từ HTX ({viewQrCodes.length})</span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                                            {viewQrCodes.map((qr) => (
                                                <div key={qr.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <AppBadge variant={qr.targetType === 'SUBBATCH' ? 'purple' : 'blue'}>
                                                                {qr.targetType}
                                                            </AppBadge>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(qr.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                        <div className="font-mono text-[11px] text-slate-700 truncate">{qr.qrValue}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(qr.qrValue, qr.id)}
                                                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-200 rounded cursor-pointer inline-flex items-center justify-center"
                                                            title="Sao chép mã"
                                                        >
                                                            {copiedId === qr.id ? (
                                                                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })()}
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
