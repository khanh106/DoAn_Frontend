import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { translateStage } from '../../types';

import {
    Search,
    CheckCircle2,
    QrCode,
    MapPin,
    Calendar,
    User,
    Truck,
    Award,
    Database,
    AlertTriangle,
    Package,
    Leaf,
    Scissors,
    ClipboardCheck,
    Users,
    Cog,
    BoxSelect,
    Image as ImageIcon,
    ShieldCheck,
    ExternalLink,
    Boxes,
    Store,
    Clock,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Activity,
    Map
} from 'lucide-react';
import {
    traceabilityService,
    type PublicTraceResponseDto
} from '../../services/traceabilityService';
import { VietGapModal } from '../../components/public/VietGapModal';
import { QrScannerModal } from '../../components/public/QrScannerModal';
import { resolveIpfsUrl } from '../../services/ipfsService';

/* ─────── Helper function to format TxHash and Wallet Address ─────── */
const formatHash = (hash: string | undefined): string => {
    if (!hash) return '';
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

/* ─────── Main Component ─────── */
export const TraceabilityPage: React.FC = () => {
    const { qrCode: urlParamCode } = useParams<{ qrCode?: string }>();

    const [searchCode, setSearchCode] = useState<string>(urlParamCode || '');
    const [traceData, setTraceData] = useState<PublicTraceResponseDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showVietGapModal, setShowVietGapModal] = useState<boolean>(false);
    const [showQrModal, setShowQrModal] = useState<boolean>(false);

    // Quản lý hiển thị danh sách nhật ký
    const [showAllLogs, setShowAllLogs] = useState<boolean>(false);
    // Quản lý copy giao dịch
    const [copiedTx, setCopiedTx] = useState<string | null>(null);
    // Quản lý Tabs trên giao diện Mobile
    const [activeTab, setActiveTab] = useState<'journey' | 'blockchain'>('journey');

    const handleTrace = useCallback(async (codeToSearch: string) => {
        if (!codeToSearch.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await traceabilityService.getTraceabilityInfo(codeToSearch);
            setTraceData(data);
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải dữ liệu từ Backend:', axiosErr);
            const serverMessage = axiosErr.response?.data?.message;
            setError(
                serverMessage ||
                `Không tìm thấy dữ liệu truy xuất cho mã '${codeToSearch}'. Vui lòng kiểm tra lại mã Lô hoặc QR Code.`
            );
            setTraceData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Đọc mã code từ URL query parameter "?code=..." của mã QR thật
        const urlParams = new URLSearchParams(window.location.search);
        const queryCode = urlParams.get('code');

        // Ưu tiên đường dẫn dạng /trace/:qrCode, sau đó tới query parameter ?code=...
        const codeToSearch = urlParamCode || queryCode || '';

        if (codeToSearch.trim()) {
            setSearchCode(codeToSearch);
            void handleTrace(codeToSearch);
        }
    }, [handleTrace, urlParamCode]);

    // Xử lý sao chép TxHash
    const handleCopyTx = (txHash: string) => {
        navigator.clipboard.writeText(txHash);
        setCopiedTx(txHash);
        setTimeout(() => setCopiedTx(null), 2000);
    };

    // Ánh xạ thứ tự trạng thái từ contract
    const getStageOrder = (stage: string | undefined): number => {
        if (!stage) return 0;
        const s = stage.toUpperCase().trim();
        if (s.includes('PLANTING') || s.includes('CREATED') || s.includes('ACCEPTED')) return 1;
        if (s.includes('HARVESTED')) return 2;
        if (s.includes('RECEIVED') && !s.includes('RETAILER')) return 3;
        if (s.includes('PROCESSED')) return 4;
        if (s.includes('SORTED')) return 5;
        if (s.includes('INSPECT')) return 6;
        if (s.includes('PACKAGED')) return 7;
        if (s.includes('SHIPP') || s.includes('TRANSIT')) return 8;
        if (s.includes('RETAILER')) return 9;
        if (s.includes('SALE') || s.includes('READY')) return 10;
        return 0;
    };

    // Hàm trả về trạng thái của từng bước supply chain (completed / active / pending)
    const getStepStatus = (stepId: number, currentStage: string | undefined) => {
        const order = getStageOrder(currentStage);
        let stepRank = 1;
        switch (stepId) {
            case 1: stepRank = 1; break; // Vùng trồng
            case 2: stepRank = 1; break; // Nhật ký chăm sóc (chạy song song lúc trồng)
            case 3: stepRank = 2; break; // Thu hoạch
            case 4: stepRank = 3; break; // HTX tiếp nhận & sơ chế
            case 5: stepRank = 5; break; // Phân loại
            case 6: stepRank = 6; break; // Kiểm định
            case 7: stepRank = 7; break; // Đóng gói
            case 8: stepRank = 8; break; // Vận chuyển
            case 9: stepRank = 9; break; // Điểm bán & Lên kệ
        }

        if (order > stepRank) return 'completed';
        if (order === stepRank) return 'active';

        // Điều kiện đặc biệt cho Nhật ký chăm sóc
        if (stepId === 2) {
            if (order > 1) return 'completed';
            if (order === 1) return 'active';
        }
        return 'pending';
    };

    // Tính toán tiến trình
    const currentOrder = traceData ? getStageOrder(traceData.targetInfo.currentStage) : 0;
    const progressPercent = Math.min(Math.round((currentOrder / 9) * 100), 100);

    const getNode4Status = (): 'completed' | 'active' | 'pending' => {
        if (currentOrder > 7) return 'completed';
        if (currentOrder >= 3) return 'active';
        return 'pending';
    };

    const getNode5Status = (): 'completed' | 'active' | 'pending' => {
        if (currentOrder >= 9) return 'completed';
        if (currentOrder === 8) return 'active';
        return 'pending';
    };

    // Helper function to render product card
    const renderProductCard = () => {
        if (!traceData) return null;

        // Tìm ảnh thu hoạch từ nhật ký canh tác (hoặc ảnh bất kỳ của nhật ký làm fallback)
        const harvestLog = traceData.cultivationLogs.find(
            (log) => log.activity.toLowerCase().includes('thu hoạch') || log.activity.toLowerCase().includes('harvest')
        );
        const harvestImage = harvestLog && harvestLog.images && harvestLog.images.length > 0
            ? resolveIpfsUrl(harvestLog.images[0])
            : '';

        const anyLogWithImage = traceData.cultivationLogs.find(
            (log) => log.images && log.images.length > 0
        );
        const logFallbackImage = anyLogWithImage && anyLogWithImage.images && anyLogWithImage.images.length > 0
            ? resolveIpfsUrl(anyLogWithImage.images[0])
            : '';

        const packagingImage = traceData.packaging?.imageUrl
            ? resolveIpfsUrl(traceData.packaging.imageUrl)
            : '';

        const finalProductImage = harvestImage || logFallbackImage || packagingImage;

        return (
            <div className="trace-hero-card">
                {finalProductImage ? (
                    <div className="trace-hero-img-wrap">
                        <img
                            src={finalProductImage}
                            alt={traceData.targetInfo.productName}
                            className="trace-hero-img"
                        />
                    </div>
                ) : (
                    <div className="trace-hero-img-placeholder">
                        <QrCode className="w-16 h-16 text-emerald-400 opacity-70" />
                    </div>
                )}
                <div className="trace-hero-info">
                    <span className="trace-hero-type-badge">
                        {traceData.targetInfo.type === 'SUBBATCH' ? 'Lô Con (Sub-batch)' : 'Lô Gốc (Batch)'}
                    </span>
                    <h2 className="trace-hero-name">{traceData.targetInfo.productName}</h2>

                    <div className="trace-hero-details">
                        <div className="trace-hero-detail-row">
                            <span className="trace-hero-label">Phân Loại Trái Cây:</span>
                            <span className="trace-hero-value">{traceData.targetInfo.fruitType}</span>
                        </div>
                        <div className="trace-hero-detail-row">
                            <span className="trace-hero-label">Định danh QR Code:</span>
                            <span className="trace-hero-value font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">{traceData.targetInfo.code}</span>
                        </div>
                        {traceData.parentBatch && (
                            <>
                                <div className="trace-hero-detail-row">
                                    <span className="trace-hero-label">Liên kết Lô gốc:</span>
                                    <span className="trace-hero-value font-mono text-[11px] font-bold text-slate-700">{traceData.parentBatch.batchCode}</span>
                                </div>
                                <div className="trace-hero-detail-row">
                                    <span className="trace-hero-label">Ngày xuống giống:</span>
                                    <span className="trace-hero-value">{new Date(traceData.parentBatch.plantingDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </>
                        )}
                        <div className="trace-hero-detail-row trace-coop-row">
                            <span className="trace-hero-label">Đơn vị quản lý:</span>
                            <span className="trace-hero-value flex items-center gap-1.5 font-bold text-slate-850">
                                <img src="/logo_icon.png" alt="logo" className="w-3.5 h-3.5 object-contain" />
                                {traceData.farmArea?.name ? (traceData.farmArea.name.includes("HTX") ? traceData.farmArea.name : `HTX ${traceData.farmArea.name}`) : 'Chưa cập nhật'}
                            </span>
                        </div>
                    </div>

                    {/* Thanh Tiến Trình Cung Ứng */}
                    <div className="trace-progress-container">
                        <div className="trace-progress-text">
                            <span>Trạng thái:</span>
                            <strong className="text-emerald-700">{traceData.targetInfo.currentStage ? translateStage(traceData.targetInfo.currentStage) : 'Khởi tạo'} ({currentOrder}/9 bước)</strong>
                        </div>
                        <div className="trace-progress-bar-bg">
                            <div className="trace-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="trace-page">
            <style>{tracePageStyles}</style>

            {/* ──── HEADER ──── */}
            <header className="trace-header">
                <div className="trace-header-inner">
                    <div className="trace-logo-group">
                        <img src="/logo_icon.png" alt="FruitChain" className="trace-logo-img" />
                        <span className="trace-logo-text">
                            <span className="trace-logo-fruit">Fruit</span>
                            <span className="trace-logo-chain">Chain</span>
                        </span>
                    </div>
                    <h1 className="trace-page-title">TRUY XUẤT NGUỒN GỐC SẢN PHẨM</h1>
                    <div className="trace-verified-badge">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <div className="trace-verified-badge-text">
                            <span>ĐÃ XÁC THỰC</span>
                            <strong>BLOCKCHAIN</strong>
                        </div>
                    </div>
                </div>
            </header>

            <main className="trace-main">
                {/* ──── SEARCH BAR ──── */}
                <div className="trace-search-bar">
                    <div className="trace-input-wrapper">
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void handleTrace(searchCode)}
                            placeholder="Nhập mã SubBatch / Batch / QR Code..."
                            className="trace-search-input"
                        />
                    </div>
                    <div className="trace-actions-wrapper">
                        <button onClick={() => setShowQrModal(true)} className="trace-qr-btn">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            <span>Quét QR</span>
                        </button>
                        <button
                            onClick={() => void handleTrace(searchCode)}
                            disabled={loading}
                            className="trace-search-btn"
                        >
                            <Search className="w-4 h-4" />
                            <span>Tra cứu</span>
                        </button>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="trace-error">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* LOADING */}
                {loading ? (
                    <div className="trace-loading">
                        <div className="trace-loading-spinner" />
                        <span>Đang tải dữ liệu thực tế được chứng thực bởi Smart Contract Blockchain...</span>
                    </div>
                ) : traceData ? (
                    <div className="trace-main-container">

                        {/* PRODUCT HERO CARD (Hiển thị đầu tiên trên Mobile, ẩn trên PC) */}
                        <div className="show-mobile-only w-full">
                            {renderProductCard()}
                        </div>

                        {/* MOBILE TAB BAR NAVIGATION */}
                        <div className="trace-mobile-tabs">
                            <button
                                onClick={() => setActiveTab('journey')}
                                className={`trace-mobile-tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
                            >
                                <Activity className="w-4 h-4" />
                                <span>Hành Trình</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('blockchain')}
                                className={`trace-mobile-tab-btn ${activeTab === 'blockchain' ? 'active' : ''}`}
                            >
                                <Database className="w-4 h-4" />
                                <span>Xác Thực</span>
                            </button>
                        </div>

                        {/* CONTENT GRID SPLIT */}
                        <div className="trace-content-grid">

                            {/* TAB 1: SUPPLY CHAIN TIMELINE (HÀNH TRÌNH) */}
                            <div className={`trace-timeline-col ${activeTab === 'journey' ? 'show-mobile' : 'hide-mobile'}`}>
                                <div className="trace-timeline-card-wrapper">
                                    <h3 className="trace-section-title">
                                        <Activity className="w-5 h-5 text-emerald-600" />
                                        HÀNH TRÌNH CHUỖI CUNG ỨNG
                                    </h3>

                                    <div className="trace-timeline">
                                        {/* 1. VÙNG TRỒNG */}
                                        <TimelineStep
                                            icon={null}
                                            title="Vùng Trồng"
                                            status={getStepStatus(1, traceData.targetInfo.currentStage)}
                                        >
                                            {traceData.farmArea ? (
                                                <div className="trace-step-details">
                                                    <p className="trace-step-main-title">{traceData.farmArea.name}</p>
                                                    <div className="trace-grid-details">
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">Mã vùng trồng:</span>
                                                            <span className="trace-detail-val">{traceData.farmArea.plantingCode || 'N/A'}</span>
                                                        </div>
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">GPS:</span>
                                                            <span className="trace-detail-val text-blue-600 font-semibold">{traceData.farmArea.gps}</span>
                                                        </div>
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">Địa phương:</span>
                                                            <span className="trace-detail-val">{traceData.farmArea.province}</span>
                                                        </div>
                                                        {traceData.parentBatch?.plantingDate && (
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Ngày canh tác:</span>
                                                                <span className="trace-detail-val">{new Date(traceData.parentBatch.plantingDate).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : <p className="trace-step-empty">Chưa có dữ liệu vùng trồng.</p>}
                                        </TimelineStep>

                                        {/* 2. NHẬT KÝ CANH TÁC */}
                                        <TimelineStep
                                            icon={null}
                                            title="Nhật Ký Canh Tác"
                                            status={getStepStatus(1, traceData.targetInfo.currentStage)}
                                        >
                                            {traceData.cultivationLogs.length > 0 ? (
                                                <div className="trace-step-details">
                                                    <div className="trace-logs-container">
                                                        {(showAllLogs ? traceData.cultivationLogs : traceData.cultivationLogs.slice(0, 3)).map((log, i) => (
                                                            <div key={i} className="trace-log-item-card">
                                                                <div className="trace-log-item-header">
                                                                    <span className="trace-log-item-activity">{log.activity}</span>
                                                                    <span className="trace-log-item-date">{new Date(log.date).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                                <div className="trace-log-item-footer">
                                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span>Nhân công: <strong>{log.worker}</strong></span>
                                                                </div>
                                                                {log.images && log.images.length > 0 && (
                                                                    <div className="trace-log-images-grid mt-2.5 flex flex-wrap gap-2">
                                                                        {log.images.map((imgUrl, imgIdx) => {
                                                                            const resolvedUrl = resolveIpfsUrl(imgUrl);
                                                                            return (
                                                                                <a
                                                                                    key={imgIdx}
                                                                                    href={resolvedUrl}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="trace-log-image-link block overflow-hidden rounded-lg border border-slate-200 hover:border-emerald-500 transition-all"
                                                                                    style={{ width: '80px', height: '80px' }}
                                                                                >
                                                                                    <img
                                                                                        src={resolvedUrl}
                                                                                        alt={`Ảnh nhật ký ${imgIdx + 1}`}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                </a>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {traceData.cultivationLogs.length > 3 && (
                                                        <button onClick={() => setShowAllLogs(!showAllLogs)} className="trace-toggle-logs-btn">
                                                            <span>{showAllLogs ? 'Thu gọn nhật ký' : `Xem thêm ${traceData.cultivationLogs.length - 3} nhật ký hoạt động`}</span>
                                                            {showAllLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : <p className="trace-step-empty">Chưa có nhật ký hoạt động nào được ghi nhận.</p>}
                                        </TimelineStep>

                                        {/* 3. THU HOẠCH */}
                                        <TimelineStep
                                            icon={null}
                                            title="Thu Hoạch"
                                            status={getStepStatus(2, traceData.targetInfo.currentStage)}
                                        >
                                            {traceData.harvest ? (
                                                <div className="trace-step-details">
                                                    <div className="trace-grid-details">
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">Ngày thu hoạch:</span>
                                                            <span className="trace-detail-val font-semibold">{new Date(traceData.harvest.harvestDate).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">Tổng sản lượng:</span>
                                                            <span className="trace-detail-val font-bold text-emerald-600">{traceData.harvest.quantity} {traceData.harvest.unit}</span>
                                                        </div>
                                                        <div className="trace-detail-item text-full-width">
                                                            <span className="trace-detail-lbl">Đại diện thu hoạch:</span>
                                                            <span className="trace-detail-val">{traceData.harvest.representativeWorker}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : <p className="trace-step-empty">Sản phẩm chưa được tiến hành thu hoạch.</p>}
                                        </TimelineStep>

                                        {/* 4. KIỂM ĐỊNH & ĐÓNG GÓI */}
                                        <TimelineStep
                                            icon={null}
                                            title="Kiểm Định & Đóng Gói"
                                            status={getNode4Status()}
                                        >
                                            <div className="space-y-4">
                                                {/* Sơ chế */}
                                                {traceData.processing && (
                                                    <div className="trace-sub-step-box border-b border-slate-100 pb-3">
                                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">1. Tiếp nhận & Sơ chế:</h5>
                                                        <div className="trace-grid-details">
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Loại sơ chế:</span>
                                                                <span className="trace-detail-val">{traceData.processing.processType}</span>
                                                            </div>
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Ngày thực hiện:</span>
                                                                <span className="trace-detail-val">{new Date(traceData.processing.startDate).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                            <div className="trace-detail-item text-full-width">
                                                                <span className="trace-detail-lbl">Mô tả công việc:</span>
                                                                <span className="trace-detail-val">{traceData.processing.description}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Kiểm định */}
                                                {traceData.inspection ? (
                                                    <div className="trace-sub-step-box border-b border-slate-100 pb-3">
                                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">2. Kiểm định chất lượng VietGAP:</h5>
                                                        <div className="trace-grid-details">
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Mã số:</span>
                                                                <span className="trace-detail-val font-mono">{traceData.inspection.documentNumber}</span>
                                                            </div>
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Kết quả:</span>
                                                                <span className="trace-result-pill passed">
                                                                    ĐẠT CHUẨN AN TOÀN
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setShowVietGapModal(true)} className="trace-cert-detail-btn w-full justify-center mt-2">
                                                            <Award className="w-4 h-4" />
                                                            <span>Xem chi tiết Giấy Chứng Nhận VietGAP</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="trace-sub-step-box border-b border-slate-100 pb-3">
                                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">2. Kiểm định chất lượng:</h5>
                                                        <p className="trace-step-empty">Chưa hoàn tất kiểm định chất lượng VietGAP.</p>
                                                    </div>
                                                )}

                                                {/* Đóng gói */}
                                                {traceData.packaging ? (
                                                    <div className="trace-sub-step-box">
                                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">3. Đóng gói thương phẩm:</h5>
                                                        <div className="trace-grid-details">
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Quy cách:</span>
                                                                <span className="trace-detail-val">{traceData.packaging.specification}</span>
                                                            </div>
                                                            <div className="trace-detail-item">
                                                                <span className="trace-detail-lbl">Ngày đóng gói:</span>
                                                                <span className="trace-detail-val">{new Date(traceData.packaging.packDate).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                            <div className="trace-detail-item text-full-width">
                                                                <span className="trace-detail-lbl">Tiêu chuẩn:</span>
                                                                <span className="trace-detail-val font-bold">{traceData.packaging.standard || 'VietGAP'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="trace-sub-step-box">
                                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">3. Đóng gói:</h5>
                                                        <p className="trace-step-empty">Chưa tiến hành đóng gói thương phẩm.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TimelineStep>

                                        {/* 5. VẬN CHUYỂN */}
                                        <TimelineStep
                                            icon={null}
                                            title="Vận Chuyển"
                                            status={getNode5Status()}
                                            isLast={true}
                                        >
                                            {traceData.shipment ? (
                                                <div className="trace-step-details space-y-4">
                                                    <div className="trace-grid-details">
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">Hãng vận chuyển:</span>
                                                            <span className="trace-detail-val font-bold">{traceData.shipment.carrier}</span>
                                                        </div>
                                                        <div className="trace-detail-item">
                                                            <span className="trace-detail-lbl">Mã vận đơn:</span>
                                                            <span className="trace-detail-val font-mono">{traceData.shipment.shippingCode}</span>
                                                        </div>
                                                        <div className="trace-detail-item text-full-width">
                                                            <span className="trace-detail-lbl">Lộ trình cung ứng:</span>
                                                            <div className="trace-route-display">
                                                                <span className="trace-route-node">{traceData.shipment.pickupLocation}</span>
                                                                <span className="trace-route-arrow">➔</span>
                                                                <span className="trace-route-node font-bold text-emerald-700">{traceData.shipment.destination}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bán lẻ */}
                                                    <div className="border-t border-slate-100 pt-3">
                                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-2">Điểm bán lẻ & lên kệ:</h5>
                                                        <div className="trace-grid-details">
                                                            <div className="trace-detail-item text-full-width">
                                                                <span className="trace-detail-lbl">Nhà bán lẻ:</span>
                                                                <span className="trace-detail-val font-bold text-slate-800">{traceData.shipment.retailerName}</span>
                                                            </div>
                                                            {traceData.shipment.readyForSaleDate && (
                                                                <div className="trace-detail-item">
                                                                    <span className="trace-detail-lbl">Sẵn sàng lên kệ:</span>
                                                                    <span className="trace-detail-val font-extrabold text-emerald-600">{new Date(traceData.shipment.readyForSaleDate).toLocaleString('vi-VN')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : <p className="trace-step-empty">Sản phẩm chưa được bàn giao vận chuyển.</p>}
                                        </TimelineStep>
                                    </div>
                                </div>
                            </div>

                            {/* TAB 2: BLOCKCHAIN & PERSONNEL DETAILS (CHỨNG THỰC) */}
                            <div className={`trace-hero-col ${activeTab === 'blockchain' ? 'show-mobile' : 'hide-mobile'}`}>

                                {/* PRODUCT HERO CARD (Hiển thị đầu tiên trên PC, ẩn trên Mobile) */}
                                <div className="hide-mobile-only w-full mb-5">
                                    {renderProductCard()}
                                </div>

                                {/* Personnel Card */}
                                {traceData.workers && traceData.workers.length > 0 && (
                                    <div className="trace-info-card">
                                        <h4 className="trace-info-card-title">
                                            <Users className="w-4 h-4 text-emerald-600" />
                                            Nhân Sự Sản Xuất Phụ Trách ({traceData.workers.length})
                                        </h4>
                                        <div className="trace-workers-list">
                                            {traceData.workers.map((w, idx) => (
                                                <div key={idx} className="trace-worker-item">
                                                    <div className="trace-worker-avatar">
                                                        <User className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="trace-worker-info">
                                                        <span className="trace-worker-name">{w.fullName}</span>
                                                        {w.isRepresentative && (
                                                            <span className="trace-worker-badge">Người đại diện</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Inspection Standard Card */}
                                {traceData.inspection && (
                                    <div className="trace-inspection-badge-card">
                                        <div className="trace-inspection-badge-header">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                            <span>TIÊU CHUẨN KIỂM ĐỊNH</span>
                                        </div>
                                        <div className="trace-inspection-badge-body">
                                            <p className="trace-cert-name">{traceData.inspection.documentName}</p>
                                            <p>Số: <strong>{traceData.inspection.documentNumber}</strong></p>
                                            <p>Kết quả: <strong className="text-emerald-700 font-extrabold uppercase">{traceData.inspection.result}</strong></p>
                                        </div>
                                        {traceData.inspection.certificateFileUrl && (
                                            <button onClick={() => setShowVietGapModal(true)} className="trace-cert-link border-0 w-full text-center" style={{ cursor: 'pointer' }}>
                                                <span>Xem Giấy chứng nhận (VietGAP)</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Blockchain History Card */}
                                {traceData.blockchainHistory && traceData.blockchainHistory.length > 0 && (
                                    <div className="trace-blockchain-card">
                                        <h4 className="trace-blockchain-title">
                                            <Database className="w-4 h-4 text-emerald-400 animate-pulse" />
                                            Nhật ký Smart Contract ({traceData.blockchainHistory.length})
                                        </h4>
                                        <div className="trace-blockchain-list">
                                            {traceData.blockchainHistory.map((tx, idx) => (
                                                <div key={idx} className="trace-blockchain-item">
                                                    <div className="trace-blockchain-row">
                                                        <span className="trace-blockchain-stage">{tx.stage}</span>
                                                        <span className="trace-blockchain-status">
                                                            <Check className="w-3 h-3 inline-block mr-0.5" />
                                                            {tx.status}
                                                        </span>
                                                    </div>
                                                    <p className="trace-blockchain-fn">
                                                        Hàm gọi: <span>{tx.functionName}()</span>
                                                    </p>

                                                    {/* Copy TxHash button */}
                                                    <div className="trace-blockchain-tx-wrapper">
                                                        <p className="trace-blockchain-tx" title={tx.txHash}>
                                                            TxHash: <span className="trace-blockchain-hash">{formatHash(tx.txHash)}</span>
                                                        </p>
                                                        <button
                                                            onClick={() => handleCopyTx(tx.txHash)}
                                                            className="trace-copy-btn"
                                                            title="Sao chép TxHash"
                                                        >
                                                            {copiedTx === tx.txHash ? (
                                                                <Check className="w-3 h-3 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-slate-400" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <p className="trace-blockchain-wallet" title={tx.actorWallet}>
                                                        Ký bởi ví: <span>{formatHash(tx.actorWallet)}</span>
                                                    </p>
                                                    <div className="trace-blockchain-footer">
                                                        <span className="trace-block-number">Block #{tx.blockNumber || 'N/A'}</span>
                                                        <span className="trace-block-time">{new Date(tx.timestamp).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : !loading && !error && (
                    <div className="trace-empty-state">
                        <QrCode className="w-16 h-16 text-slate-300" />
                        <h2>Chào mừng đến với FruitChain</h2>
                        <p>Vui lòng nhập mã lô hàng, mã lô con hoặc nhấn nút "Quét QR" bên trên để truy xuất toàn bộ thông tin nguồn gốc chất lượng sản phẩm.</p>
                    </div>
                )}
            </main>

            {/* FLOATING ACTION SCAN QR BUTTON FOR MOBILE */}
            <button onClick={() => setShowQrModal(true)} className="trace-floating-qr" title="Quét mã QR nhanh">
                <QrCode className="w-6 h-6" />
            </button>

            {/* ──── MODALS ──── */}
            {traceData?.inspection && (
                <VietGapModal
                    isOpen={showVietGapModal}
                    onClose={() => setShowVietGapModal(false)}
                    inspection={traceData.inspection}
                />
            )}
            <QrScannerModal
                isOpen={showQrModal}
                onClose={() => setShowQrModal(false)}
                onScanSuccess={(scannedText) => {
                    setSearchCode(scannedText);
                    void handleTrace(scannedText);
                }}
            />
        </div>
    );
};

/* ─────── Timeline Step Sub-component ─────── */
interface TimelineStepProps {
    icon: React.ReactNode;
    title: string;
    status: 'completed' | 'active' | 'pending';
    isLast?: boolean;
    children: React.ReactNode;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ icon, title, status, isLast = false, children }) => {
    return (
        <div className={`trace-timeline-step ${status}`}>
            {!isLast && <div className="trace-timeline-line" />}
            <div className={`trace-timeline-dot ${status}`}>
                {icon}
            </div>
            <div className={`trace-timeline-content ${status}`}>
                <div className="trace-timeline-header">
                    <h4 className="trace-timeline-title">{title}</h4>
                    {status === 'active' && <span className="trace-step-badge-indicator active">Đang thực hiện</span>}
                    {status === 'completed' && <span className="trace-step-badge-indicator completed">Đã hoàn thành</span>}
                    {status === 'pending' && <span className="trace-step-badge-indicator pending">Chưa thực hiện</span>}
                </div>
                <div className="trace-timeline-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

/* ─────── Premium CSS Styling (Optimized for Mobile) ─────── */
const tracePageStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

:root {
    --primary: #10b981;
    --primary-dark: #047857;
    --primary-light: #ecfdf5;
    --accent: #3b82f6;
    --bg-page: #f8fafc;
    --bg-card: #ffffff;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    
    --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 10px 20px -5px rgba(16, 185, 129, 0.04), 0 8px 16px -6px rgba(16, 185, 129, 0.04);
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.trace-page {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 100vh;
    font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    color: var(--text-main);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    width: 100%;
}

/* ===== Header ===== */
.trace-header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
}

.trace-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.trace-logo-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trace-logo-img {
    width: 34px;
    height: 34px;
    object-fit: contain;
}

.trace-logo-text {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.5px;
}

.trace-logo-fruit { color: #059669; }
.trace-logo-chain { color: #f59e0b; }

.trace-page-title {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-main);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    flex: 1;
    display: none;
}

@media (min-width: 768px) {
    .trace-page-title { display: block; }
}

.trace-verified-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #047857;
    color: #fff;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.2;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
    white-space: nowrap;
}

@media (max-width: 480px) {
    .trace-header-inner {
        padding: 10px 12px;
        gap: 6px;
    }
    .trace-logo-img {
        width: 28px;
        height: 28px;
    }
    .trace-logo-text {
        font-size: 16px;
    }
    .trace-verified-badge {
        padding: 4px 8px;
        gap: 4px;
    }
    .trace-verified-badge-text span {
        font-size: 7px;
    }
    .trace-verified-badge-text strong {
        font-size: 8px;
    }
}

.trace-verified-badge-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.trace-verified-badge-text span {
    font-size: 8px;
    font-weight: 500;
    opacity: 0.9;
}

.trace-verified-badge-text strong {
    font-size: 10px;
    font-weight: 900;
}

/* ===== Search Area ===== */
.trace-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 16px 100px;
}

.trace-search-bar {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 8px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.trace-search-bar:focus-within {
    border-color: rgba(16, 185, 129, 0.4);
}

.trace-input-wrapper {
    flex: 1;
}

.trace-search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-main);
    outline: none;
}

.trace-actions-wrapper {
    display: flex;
    gap: 6px;
    width: 100%;
}

@media (max-width: 360px) {
    .trace-actions-wrapper {
        flex-direction: column;
        gap: 6px;
    }
    .trace-search-btn, .trace-qr-btn {
        width: 100% !important;
        flex: none !important;
    }
}

@media (min-width: 768px) {
    .trace-search-bar {
        flex-direction: row;
        align-items: center;
        padding: 10px;
    }
    .trace-actions-wrapper {
        display: flex;
        width: auto;
    }
}

.trace-qr-btn {
    flex: 1;
    padding: 10px 14px;
    background: #1e293b;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 12.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

.trace-search-btn {
    flex: 1.5;
    padding: 10px 16px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 12.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

/* ===== Progress Bar ===== */
.trace-progress-container {
    margin-top: 14px;
    background: #f8fafc;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
}

.trace-progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 6px;
}

.trace-progress-text span {
    color: var(--text-muted);
}

.trace-progress-bar-bg {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
}

.trace-progress-bar-fill {
    height: 100%;
    background: linear-gradient(to right, #10b981, #3b82f6);
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== Main Layout Container ===== */
.trace-main-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ===== Product Card ===== */
.trace-hero-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
}

.trace-hero-img-wrap {
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: #f1f5f9;
}

.trace-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.trace-hero-img-placeholder {
    width: 100%;
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    display: flex;
    align-items: center;
    justify-content: center;
}

.trace-hero-info {
    padding: 16px;
}

.trace-hero-type-badge {
    display: inline-block;
    padding: 2px 8px;
    background: #ecfdf5;
    color: #047857;
    font-size: 9.5px;
    font-weight: 800;
    border-radius: 6px;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.trace-hero-name {
    font-size: 18px;
    font-weight: 900;
    color: var(--text-main);
    margin: 0 0 12px;
}

.trace-hero-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.trace-hero-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}

.trace-hero-label {
    color: var(--text-muted);
}

.trace-hero-value {
    color: var(--text-main);
    font-weight: 700;
}

/* ===== Mobile Tabs ===== */
.trace-mobile-tabs {
    display: flex;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    border-radius: 14px;
    padding: 4px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    gap: 4px;
}

.trace-mobile-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    font-weight: 700;
    font-size: 13px;
    border-radius: 10px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
}

.trace-mobile-tab-btn.active {
    background: #ffffff;
    color: var(--primary-dark);
    box-shadow: var(--shadow-sm);
}

/* ===== Responsive Grid logic ===== */
.trace-content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
}

.show-mobile-only {
    display: block !important;
}
.hide-mobile-only {
    display: none !important;
}

@media (max-width: 1023px) {
    .trace-timeline-col.hide-mobile,
    .trace-hero-col.hide-mobile {
        display: none !important;
    }
    .trace-timeline-col.show-mobile,
    .trace-hero-col.show-mobile {
        display: block !important;
    }
}

@media (min-width: 1024px) {
    .show-mobile-only {
        display: none !important;
    }
    .hide-mobile-only {
        display: block !important;
    }
    .trace-mobile-tabs {
        display: none !important;
    }
    .trace-content-grid {
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    }
    .trace-timeline-col,
    .trace-hero-col {
        display: block !important;
    }
    .trace-main-container {
        display: grid;
        grid-template-columns: 1fr;
    }
    .trace-hero-card {
        flex-direction: row;
        align-items: stretch;
    }
    .trace-hero-img-wrap, 
    .trace-hero-img-placeholder {
        width: 35%;
        aspect-ratio: auto;
        min-height: 160px;
    }
    .trace-hero-info {
        width: 65%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px;
    }
}

/* ===== Timeline Styling ===== */
.trace-timeline-card-wrapper {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 16px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
}

.trace-timeline {
    position: relative;
    padding-left: 4px;
}

.trace-timeline-step {
    position: relative;
    padding-left: 40px;
    padding-bottom: 24px;
}

.trace-timeline-step:last-child {
    padding-bottom: 0;
}

.trace-timeline-line {
    position: absolute;
    left: 12px;
    top: 26px;
    bottom: -10px;
    width: 2px;
    background: #e2e8f0;
    z-index: 1;
}

.trace-timeline-step.completed .trace-timeline-line {
    background: #10b981;
}

.trace-timeline-step.active .trace-timeline-line {
    background: #cbd5e1;
}

.trace-timeline-dot {
    position: absolute;
    left: 2px;
    top: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #ffffff;
    border: 3px solid #cbd5e1;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
}

.trace-timeline-dot.completed {
    border-color: #10b981;
    background: #ffffff;
}

.trace-timeline-dot.active {
    border-color: #059669;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
}

.trace-timeline-dot.active::after {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #059669;
}

.trace-timeline-dot.pending {
    border-color: #cbd5e1;
    background: #ffffff;
}

.trace-timeline-content {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 12px 14px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
    transition: transform 0.2s;
}

.trace-timeline-content.completed {
    border-left: 3px solid var(--primary);
}

.trace-timeline-content.active {
    border-left: 3px solid #3b82f6;
    background: linear-gradient(to right, #eff6ff, #ffffff);
}

.trace-timeline-content.pending {
    background: #fafafb;
    opacity: 0.7;
}

.trace-timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 6px;
}

.trace-timeline-title {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--text-main);
}

.trace-step-badge-indicator {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
}

.trace-step-badge-indicator.completed {
    background: #ecfdf5;
    color: #065f46;
}

.trace-step-badge-indicator.active {
    background: #eff6ff;
    color: #1e40af;
}

.trace-step-badge-indicator.pending {
    background: #f1f5f9;
    color: #475569;
}

/* Timeline grid & details */
.trace-step-main-title {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 6px;
}

.trace-grid-details {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
}

.trace-detail-item {
    font-size: 12px;
}

.trace-detail-lbl {
    color: var(--text-muted);
}

.trace-detail-val {
    color: var(--text-main);
    font-weight: 600;
}

.trace-detail-val.highlight {
    color: #059669;
    font-weight: 700;
}

.trace-step-empty {
    font-size: 11.5px;
    color: var(--text-muted);
    font-style: italic;
    margin: 0;
}

.trace-step-sub-info {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0;
}

/* Logs */
.trace-logs-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.trace-log-item-card {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 10px;
    padding: 8px 10px;
}

.trace-log-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.trace-log-item-activity {
    font-size: 11.5px;
    font-weight: 700;
}

.trace-log-item-date {
    font-size: 10.5px;
    color: var(--text-muted);
}

.trace-log-item-footer {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 4px;
}

.trace-log-images-grid {
    display: flex;
    gap: 4px;
    margin-top: 6px;
}

.trace-log-image-link {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    background: #e0f2fe;
    color: #0369a1;
    font-size: 10px;
    font-weight: 600;
    border-radius: 6px;
    text-decoration: none;
}

.trace-toggle-logs-btn {
    width: 100%;
    margin-top: 8px;
    padding: 6px;
    background: #f1f5f9;
    border: none;
    border-radius: 8px;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.trace-route-display {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f8fafc;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px dashed #cbd5e1;
}

.trace-route-node {
    font-size: 11.5px;
}

.trace-result-pill {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
}

.trace-result-pill.passed {
    background: #d1fae5;
    color: #065f46;
}

.trace-cert-detail-btn {
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Right panel details */
.trace-info-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border);
    padding: 16px;
    box-shadow: var(--shadow-sm);
}

.trace-info-card-title {
    font-size: 13.5px;
    font-weight: 800;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
}

.trace-workers-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.trace-worker-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trace-worker-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ecfdf5;
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
}

.trace-worker-info {
    display: flex;
    align-items: center;
    gap: 4px;
}

.trace-worker-name {
    font-size: 12.5px;
    font-weight: 700;
}

.trace-worker-badge {
    padding: 1px 6px;
    background: #fef3c7;
    color: #b45309;
    font-size: 8.5px;
    font-weight: 800;
    border-radius: 10px;
}

/* Inspection Badge Card */
.trace-inspection-badge-card {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.trace-inspection-badge-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
    color: #065f46;
}

.trace-inspection-badge-body {
    font-size: 12px;
    color: #065f46;
}

.trace-cert-name {
    font-size: 13px;
    font-weight: 700;
}

.trace-cert-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: #047857;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    border-radius: 10px;
    text-decoration: none;
}

/* Blockchain history styles */
.trace-blockchain-card {
    background: #0b0f19;
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 20px;
    padding: 16px;
}

.trace-blockchain-title {
    font-size: 13.5px;
    font-weight: 800;
    color: #10b981;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.trace-blockchain-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
}

.trace-blockchain-item {
    background: rgba(17, 24, 39, 0.85);
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid #1f2937;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.trace-blockchain-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.trace-blockchain-stage {
    font-size: 11.5px;
    font-weight: 800;
    color: #cbd5e1;
}

.trace-blockchain-status {
    font-size: 9.5px;
    color: #34d399;
    font-weight: 800;
}

.trace-blockchain-fn {
    font-size: 10.5px;
    color: #94a3b8;
    margin: 2px 0 0;
}

.trace-blockchain-fn span {
    color: #fbbf24;
}

.trace-blockchain-tx-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 6px;
    border-radius: 6px;
    margin-top: 4px;
    min-width: 0;
    overflow: hidden;
}

.trace-blockchain-tx {
    font-size: 10px;
    color: #64748b;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.trace-blockchain-hash {
    color: #60a5fa;
}

.trace-copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
}

.trace-blockchain-wallet {
    font-size: 9.5px;
    color: #64748b;
    margin: 2px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.trace-blockchain-wallet span {
    color: #c084fc;
}

.trace-blockchain-footer {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #4b5563;
    margin-top: 4px;
}

/* Floating button */
.trace-floating-qr {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    border: none;
    outline: none;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.trace-floating-qr:hover {
    transform: scale(1.08) rotate(90deg);
}

.trace-floating-qr:active {
    transform: scale(0.95);
}

@media (min-width: 1024px) {
    .trace-floating-qr {
        display: none !important;
    }
}

/* General states */
.trace-empty-state {
    background: var(--bg-card);
    padding: 40px 16px;
    text-align: center;
    border-radius: 24px;
    border: 1px solid var(--border);
    max-width: 500px;
    margin: 20px auto;
    box-shadow: var(--shadow-sm);
}

.trace-empty-state svg {
    margin-bottom: 12px;
}

.trace-empty-state h2 {
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 8px;
}

.trace-empty-state p {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
}

.trace-error {
    padding: 10px 14px;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #9f1239;
    border-radius: 12px;
    font-size: 12.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.trace-loading {
    background: var(--bg-card);
    padding: 60px 16px;
    text-align: center;
    color: var(--text-muted);
    border-radius: 24px;
    border: 1px solid var(--border);
    font-weight: 600;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
}

.trace-loading-spinner {
    width: 32px;
    height: 32px;
    border: 3.5px solid #f1f5f9;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;
