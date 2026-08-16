import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    Leaf,
    Scissors,
    ShieldCheck,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Activity,
    Share2,
    Printer,
    Sparkles,
    Maximize2,
    X,
    Cpu,
    ArrowRight,
    Layers,
    Store,
    Clock,
    Camera,
    Image as ImageIcon
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
    if (hash.length <= 14) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
};

interface ProductPhotoItem {
    url: string;
    logDate: string;
    worker: string;
    activity: string;
    isHarvestPhoto: boolean;
}

/* ─────── Main Traceability Component ─────── */
export const TraceabilityPage: React.FC = () => {
    const { qrCode: urlParamCode } = useParams<{ qrCode?: string }>();

    const [searchCode, setSearchCode] = useState<string>(urlParamCode || '');
    const [traceData, setTraceData] = useState<PublicTraceResponseDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showVietGapModal, setShowVietGapModal] = useState<boolean>(false);
    const [showQrModal, setShowQrModal] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

    // Quản lý hiển thị danh sách nhật ký
    const [showAllLogs, setShowAllLogs] = useState<boolean>(false);
    // Quản lý copy trạng thái
    const [copiedTx, setCopiedTx] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);
    const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

    // Các mã gợi ý để người dùng test nhanh
    const sampleCodes = ['SUB-001', 'BATCH-2026-001', 'SUB-2026-001'];

    const handleTrace = useCallback(async (codeToSearch: string) => {
        if (!codeToSearch.trim()) return;
        setLoading(true);
        setError(null);
        setActivePhotoIdx(0);
        try {
            const data = await traceabilityService.getTraceabilityInfo(codeToSearch.trim());
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
        const urlParams = new URLSearchParams(window.location.search);
        const queryCode = urlParams.get('code');
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

    // Sao chép mã sản phẩm
    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    // Chia sẻ trang
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Truy xuất nguồn gốc: ${traceData?.targetInfo.productName || 'FruitChain'}`,
                text: `Tra cứu thông tin nguồn gốc blockchain sản phẩm ${traceData?.targetInfo.code || ''}`,
                url: window.location.href
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2500);
        }
    };

    // Ánh xạ thứ tự trạng thái từ contract
    const getStageOrder = (stage: string | undefined): number => {
        if (!stage) return 0;
        const s = stage.toUpperCase().trim();
        if (s.includes('PLANTING') || s.includes('CREATED') || s.includes('ACCEPTED') || s.includes('CANH_TAC')) return 1;
        if (s.includes('HARVESTED') || s.includes('THU_HOACH')) return 2;
        if (s.includes('RECEIVED') && !s.includes('RETAILER')) return 3;
        if (s.includes('PROCESSED') || s.includes('CHE_BIEN')) return 4;
        if (s.includes('SORTED') || s.includes('PHAN_LOAI')) return 5;
        if (s.includes('INSPECT') || s.includes('KIEM_DINH')) return 6;
        if (s.includes('PACKAGED') || s.includes('DONG_GOI')) return 7;
        if (s.includes('SHIPP') || s.includes('TRANSIT') || s.includes('VAN_CHUYEN')) return 8;
        if (s.includes('RETAILER') || s.includes('DAI_LY')) return 9;
        if (s.includes('SALE') || s.includes('READY') || s.includes('LEN_KE')) return 10;
        return 0;
    };

    const getStepStatus = (stepId: number, currentStage: string | undefined) => {
        const order = getStageOrder(currentStage);
        let stepRank = 1;
        switch (stepId) {
            case 1: stepRank = 1; break; // Vùng trồng
            case 2: stepRank = 1; break; // Nhật ký chăm sóc
            case 3: stepRank = 2; break; // Thu hoạch
            case 4: stepRank = 3; break; // HTX tiếp nhận & Sơ chế
            case 5: stepRank = 6; break; // Kiểm định & Đóng gói
            case 6: stepRank = 8; break; // Vận chuyển & Phân phối
        }

        if (order > stepRank) return 'completed';
        if (order === stepRank) return 'active';
        return 'pending';
    };

    const currentOrder = traceData ? getStageOrder(traceData.targetInfo.currentStage) : 0;
    const progressPercent = Math.min(Math.round((currentOrder / 9) * 100), 100);

    // ─── TỔNG HỢP ẢNH THỰC TẾ CỦA SẢN PHẨM (ƯU TIÊN ẢNH LÚC THU HOẠCH) ───
    const getAllProductRealPhotos = (): ProductPhotoItem[] => {
        if (!traceData) return [];
        const photos: ProductPhotoItem[] = [];

        // 1. Tìm các ảnh trong nhật ký canh tác có hoạt động "Thu hoạch" / "Harvest" / "Hái"
        (traceData.cultivationLogs || []).forEach((log) => {
            const isHarvest =
                log.activity.toLowerCase().includes('thu hoạch') ||
                log.activity.toLowerCase().includes('harvest') ||
                log.activity.toLowerCase().includes('hái');

            (log.images || []).forEach((img) => {
                const resolved = resolveIpfsUrl(img);
                if (resolved && !photos.some((p) => p.url === resolved)) {
                    photos.push({
                        url: resolved,
                        logDate: log.date,
                        worker: log.worker,
                        activity: log.activity,
                        isHarvestPhoto: isHarvest
                    });
                }
            });
        });

        // 2. Ảnh từ giai đoạn đóng gói (nếu có)
        if (traceData.packaging?.imageUrl) {
            const pkgResolved = resolveIpfsUrl(traceData.packaging.imageUrl);
            if (pkgResolved && !photos.some((p) => p.url === pkgResolved)) {
                photos.push({
                    url: pkgResolved,
                    logDate: traceData.packaging.packDate,
                    worker: 'Tổ đóng gói HTX',
                    activity: 'Đóng gói thương phẩm',
                    isHarvestPhoto: false
                });
            }
        }

        // Sắp xếp: Ưu tiên ảnh thu hoạch lên đầu danh sách
        photos.sort((a, b) => (b.isHarvestPhoto ? 1 : 0) - (a.isHarvestPhoto ? 1 : 0));
        return photos;
    };

    const productPhotos = getAllProductRealPhotos();
    const harvestOnlyPhotos = productPhotos.filter((p) => p.isHarvestPhoto);

    // Ảnh chính hiển thị
    const currentHeroPhoto = productPhotos.length > 0
        ? productPhotos[Math.min(activePhotoIdx, productPhotos.length - 1)]
        : null;

    const heroImageUrl = currentHeroPhoto?.url || '/nhan_xuong_com_vang.png';
    const isRealHarvestPhoto = currentHeroPhoto?.isHarvestPhoto ?? false;

    return (
        <div className="trace-app-root">
            <style>{traceModernStyles}</style>

            {/* ─────── TOP NAVIGATION BAR ─────── */}
            <header className="trace-navbar">
                <div className="trace-nav-container">
                    <Link to="/" className="trace-brand-link">
                        <div className="trace-brand-icon-box">
                            <img src="/logo_icon.png" alt="FruitChain" className="trace-brand-img" />
                        </div>
                        <div className="trace-brand-text-wrap">
                            <span className="trace-brand-title">
                                <span className="trace-brand-green">Fruit</span>
                                <span className="trace-brand-gold">Chain</span>
                            </span>
                            <span className="trace-brand-sub">Hệ Thống Nông Sản Minh Bạch</span>
                        </div>
                    </Link>

                    <div className="trace-nav-right">
                        <div className="trace-blockchain-badge-pill">
                            <span className="trace-pulse-dot" />
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="trace-badge-text">BLOCKCHAIN VERIFIED</span>
                        </div>

                        <button onClick={handleShare} className="trace-nav-action-btn" title="Chia sẻ trang này">
                            {copiedShareLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copiedShareLink ? 'Đã chép link' : 'Chia sẻ'}</span>
                        </button>

                        <button onClick={() => window.print()} className="trace-nav-action-btn hidden md:flex" title="In phiếu nguồn gốc">
                            <Printer className="w-4 h-4" />
                            <span>In phiếu</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="trace-body-container">

                {/* ─────── HERO SEARCH & BANNER ─────── */}
                <section className="trace-search-hero-card">
                    <div className="trace-search-header-group">
                        <span className="trace-tag-pill">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            Cổng Tra Cứu Chuỗi Cung Ứng Trực Tuyến
                        </span>
                        <h1 className="trace-main-heading">
                            TRUY XUẤT NGUỒN GỐC NÔNG SẢN
                        </h1>
                        <p className="trace-sub-heading">
                            Toàn bộ lịch sử từ đất trồng, ảnh chụp thực tế lúc thu hoạch, kiểm nghiệm VietGAP đến phân phối bán lẻ được xác thực bất biến bởi Smart Contract.
                        </p>
                    </div>

                    {/* Search Input Bar */}
                    <div className="trace-search-box-wrapper">
                        <div className="trace-input-inner">
                            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-3" />
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && void handleTrace(searchCode)}
                                placeholder="Nhập mã Lô (Batch) hoặc quét QR..."
                                className="trace-native-input"
                            />
                            {searchCode && (
                                <button
                                    onClick={() => setSearchCode('')}
                                    className="trace-clear-btn"
                                    title="Xoá nội dung"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            )}
                        </div>

                        <div className="trace-search-buttons-group">
                            <button
                                onClick={() => setShowQrModal(true)}
                                className="trace-scan-qr-btn"
                                type="button"
                            >
                                <QrCode className="w-4 h-4 text-emerald-500" />
                                <span>Quét QR</span>
                            </button>
                            <button
                                onClick={() => void handleTrace(searchCode)}
                                disabled={loading || !searchCode.trim()}
                                className="trace-submit-btn"
                                type="button"
                            >
                                {loading ? (
                                    <span className="trace-inline-spinner" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                <span>Tra Cứu</span>
                            </button>
                        </div>
                    </div>

                    {/* Sample Tags Bar */}
                    <div className="trace-sample-tags-bar">
                        <span className="trace-sample-title">Mã mẫu thử nghiệm:</span>
                        <div className="trace-sample-list">
                            {sampleCodes.map((code) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => {
                                        setSearchCode(code);
                                        void handleTrace(code);
                                    }}
                                    className="trace-sample-chip"
                                >
                                    {code}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─────── ERROR DISPLAY ─────── */}
                {error && (
                    <div className="trace-alert-box error">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="trace-alert-content">
                            <h4>Không tìm thấy kết quả</h4>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {/* ─────── LOADING SKELETON / SPINNER ─────── */}
                {loading && (
                    <div className="trace-loading-card">
                        <div className="trace-loading-pulse-logo">
                            <img src="/logo_icon.png" alt="FruitChain" className="w-12 h-12 object-contain animate-bounce" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-base mt-4">Đang đồng bộ dữ liệu Blockchain & IPFS...</h3>
                        <p className="text-slate-500 text-xs text-center mt-1">
                            Vui lòng chờ trong giây lát trong khi hệ thống truy xuất các bản ghi Smart Contract.
                        </p>
                    </div>
                )}

                {/* ─────── TRACE DATA PRESENTATION ─────── */}
                {!loading && traceData && (
                    <div className="trace-result-wrapper">

                        {/* 1. PRODUCT MASTER HERO CARD */}
                        <div className="trace-product-hero-container">
                            <div className="trace-product-hero-grid">
                                
                                {/* Cột trái: Ảnh sản phẩm thực tế */}
                                <div className="trace-product-media-column">
                                    <div className="trace-product-image-card">
                                        <img
                                            src={heroImageUrl}
                                            alt={traceData.targetInfo.productName}
                                            className="trace-product-main-img"
                                            onError={(e) => {
                                                e.currentTarget.src = '/nhan_xuong_com_vang.png';
                                            }}
                                        />
                                        
                                        {/* Tag ảnh thực tế lúc thu hoạch */}
                                        <div className={`trace-image-glass-tag ${isRealHarvestPhoto ? 'harvest-tag' : ''}`}>
                                            {isRealHarvestPhoto ? (
                                                <>
                                                    <Camera className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                                    <span className="text-amber-200 font-extrabold text-[11px]">📸 ẢNH THỰC TẾ LÚC THU HOẠCH</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Nông Sản Xác Thực</span>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setPreviewImage(heroImageUrl)}
                                            className="trace-image-zoom-btn"
                                            title="Xem ảnh phóng to"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Danh sách ảnh thực tế lúc thu hoạch (Thumbnail Strip) */}
                                    {productPhotos.length > 1 && (
                                        <div className="trace-hero-thumb-strip">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="trace-thumb-strip-lbl">
                                                    <Camera className="w-3 h-3 text-emerald-600 inline mr-1" />
                                                    Ảnh thực tế vườn ({productPhotos.length} ảnh):
                                                </span>
                                            </div>
                                            <div className="trace-hero-thumbs-list">
                                                {productPhotos.map((photo, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setActivePhotoIdx(idx)}
                                                        className={`trace-hero-thumb-btn ${activePhotoIdx === idx ? 'active' : ''}`}
                                                        title={`${photo.activity} - ${new Date(photo.logDate).toLocaleDateString('vi-VN')}`}
                                                    >
                                                        <img src={photo.url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                                                        {photo.isHarvestPhoto && (
                                                            <span className="trace-thumb-harvest-indicator" title="Ảnh lúc thu hoạch">🌾</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Chú thích thông tin ảnh */}
                                    {currentHeroPhoto && (
                                        <div className="trace-photo-caption-card">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                                                <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span className="truncate">{currentHeroPhoto.activity}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-500 font-normal shrink-0">{new Date(currentHeroPhoto.logDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                Bởi: <strong className="text-slate-700">{currentHeroPhoto.worker}</strong> (Lưu trữ IPFS)
                                            </div>
                                        </div>
                                    )}

                                    {/* Con dấu chứng nhận VietGAP */}
                                    {traceData.inspection && (
                                        <div
                                            onClick={() => setShowVietGapModal(true)}
                                            className="trace-vietgap-seal-card cursor-pointer"
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="trace-seal-icon-wrap">
                                                <Award className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="trace-seal-text min-w-0">
                                                <span className="trace-seal-lbl">Chứng nhận chất lượng</span>
                                                <strong className="trace-seal-val truncate">VietGAP Quốc Gia</strong>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                                        </div>
                                    )}
                                </div>

                                {/* Cột phải: Thông số sản phẩm & Tiến trình */}
                                <div className="trace-product-info-column">
                                    <div className="trace-product-title-row">
                                        <span className="trace-batch-badge shrink-0">
                                            {traceData.targetInfo.type === 'SUBBATCH' ? 'Lô Con (Thương phẩm)' : 'Lô Gốc (Canh tác)'}
                                        </span>
                                        <div className="trace-code-copy-pill" onClick={() => handleCopyCode(traceData.targetInfo.code)}>
                                            <span className="text-slate-400 text-xs shrink-0">Mã QR:</span>
                                            <strong className="font-mono text-xs text-slate-800 truncate">{traceData.targetInfo.code}</strong>
                                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                        </div>
                                    </div>

                                    <h2 className="trace-product-title">
                                        {traceData.targetInfo.productName}
                                    </h2>

                                    {/* Bảng 4 thuộc tính sản phẩm */}
                                    <div className="trace-attributes-grid">
                                        <div className="trace-attr-item">
                                            <span className="trace-attr-icon"><Leaf className="w-4 h-4 text-emerald-600" /></span>
                                            <div className="min-w-0 flex-1">
                                                <span className="trace-attr-label">Chủng loại</span>
                                                <strong className="trace-attr-val truncate">{traceData.targetInfo.fruitType}</strong>
                                            </div>
                                        </div>

                                        <div className="trace-attr-item">
                                            <span className="trace-attr-icon"><MapPin className="w-4 h-4 text-blue-600" /></span>
                                            <div className="min-w-0 flex-1">
                                                <span className="trace-attr-label">Vùng canh tác</span>
                                                <strong className="trace-attr-val truncate">{traceData.farmArea?.name || 'Vùng trồng ĐBSCL'}</strong>
                                            </div>
                                        </div>

                                        <div className="trace-attr-item">
                                            <span className="trace-attr-icon"><Calendar className="w-4 h-4 text-amber-600" /></span>
                                            <div className="min-w-0 flex-1">
                                                <span className="trace-attr-label">Ngày thu hoạch</span>
                                                <strong className="trace-attr-val truncate">
                                                    {traceData.harvest?.harvestDate ? new Date(traceData.harvest.harvestDate).toLocaleDateString('vi-VN') : 'Đang canh tác'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="trace-attr-item">
                                            <span className="trace-attr-icon"><Store className="w-4 h-4 text-purple-600" /></span>
                                            <div className="min-w-0 flex-1">
                                                <span className="trace-attr-label">Hợp tác xã</span>
                                                <strong className="trace-attr-val truncate">
                                                    {traceData.farmArea?.name ? (traceData.farmArea.name.includes("HTX") ? traceData.farmArea.name : `HTX ${traceData.farmArea.name}`) : 'Hợp Tác Xã Nông Sản'}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thanh tiến trình chuỗi cung ứng (Stepper) */}
                                    <div className="trace-stepper-card">
                                        <div className="trace-stepper-header">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 truncate">Tiến trình chuỗi cung ứng</span>
                                            </div>
                                            <span className="trace-step-counter font-extrabold text-emerald-700 text-xs shrink-0">
                                                {traceData.targetInfo.currentStage ? translateStage(traceData.targetInfo.currentStage) : 'Khởi tạo'} ({progressPercent}%)
                                            </span>
                                        </div>
                                        <div className="trace-stepper-track">
                                            <div
                                                className="trace-stepper-fill"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        <div className="trace-stepper-markers">
                                            <span className={`trace-milestone-tag ${currentOrder >= 1 ? 'active' : ''}`}>1. Vùng trồng</span>
                                            <span className={`trace-milestone-tag ${currentOrder >= 2 ? 'active' : ''}`}>2. Thu hoạch</span>
                                            <span className={`trace-milestone-tag ${currentOrder >= 4 ? 'active' : ''}`}>3. Sơ chế</span>
                                            <span className={`trace-milestone-tag ${currentOrder >= 6 ? 'active' : ''}`}>4. VietGAP</span>
                                            <span className={`trace-milestone-tag ${currentOrder >= 7 ? 'active' : ''}`}>5. Đóng gói</span>
                                            <span className={`trace-milestone-tag ${currentOrder >= 8 ? 'active' : ''}`}>6. Vận chuyển</span>
                                            <span className={`trace-milestone-tag ${currentOrder >= 9 ? 'active' : ''}`}>7. Lên kệ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. MAIN DETAILS 2-COLUMN GRID (Desktop 2 cols, Mobile responsive) */}
                        <div className="trace-details-grid">

                            {/* ─── CỘT 1: HÀNH TRÌNH CHUỖI CUNG ỨNG (5 CHẶNG) ─── */}
                            <div className="trace-column-journey">
                                <div className="trace-card-section">
                                    <div className="trace-section-header">
                                        <div className="trace-section-title-wrap">
                                            <Activity className="w-4 h-4 text-emerald-600" />
                                            <h3 className="trace-section-title">Hành Trình Chuỗi Cung Ứng</h3>
                                        </div>
                                        <span className="trace-section-badge">5 Chặng Khép Kín</span>
                                    </div>

                                    <div className="trace-timeline-flow">

                                        {/* CHẶNG 1: VÙNG TRỒNG & XUẤT XỨ */}
                                        <TimelineNode
                                            stepNumber={1}
                                            title="Vùng Trồng & Xuất Xứ Nông Trại"
                                            status={getStepStatus(1, traceData.targetInfo.currentStage)}
                                            icon={<Leaf className="w-4 h-4 text-emerald-600" />}
                                        >
                                            {traceData.farmArea ? (
                                                <div className="trace-node-content">
                                                    <div className="trace-node-headline">
                                                        <h4 className="font-bold text-slate-900 text-sm">{traceData.farmArea.name}</h4>
                                                        <span className="text-xs text-slate-500">{traceData.farmArea.province}</span>
                                                    </div>

                                                    <div className="trace-node-props-grid">
                                                        <div className="trace-prop-box">
                                                            <span className="trace-prop-label">Mã số vùng trồng (PUC):</span>
                                                            <span className="trace-prop-value font-mono">{traceData.farmArea.plantingCode || 'PUC-VN-2026'}</span>
                                                        </div>
                                                        <div className="trace-prop-box">
                                                            <span className="trace-prop-label">Tọa độ định vị GPS:</span>
                                                            <span className="trace-prop-value text-blue-600 font-mono flex items-center gap-1">
                                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate">{traceData.farmArea.gps || '10.2536° N, 105.9722° E'}</span>
                                                            </span>
                                                        </div>
                                                        {traceData.parentBatch?.plantingDate && (
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Thời điểm xuống giống:</span>
                                                                <span className="trace-prop-value">
                                                                    {new Date(traceData.parentBatch.plantingDate).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {traceData.parentBatch?.batchCode && (
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Mã lô gốc:</span>
                                                                <span className="trace-prop-value font-mono font-bold text-slate-700 truncate">{traceData.parentBatch.batchCode}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {traceData.farmArea.gps && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${encodeURIComponent(traceData.farmArea.gps)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="trace-map-link-btn"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                            <span>Xem vị trí vườn trên Google Maps</span>
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="trace-empty-text">Dữ liệu vùng trồng đang được đồng bộ.</p>
                                            )}
                                        </TimelineNode>

                                        {/* CHẶNG 2: NHẬT KÝ CANH TÁC & CHĂM SÓC */}
                                        <TimelineNode
                                            stepNumber={2}
                                            title={`Nhật Ký Canh Tác (${traceData.cultivationLogs.length} hoạt động)`}
                                            status={getStepStatus(2, traceData.targetInfo.currentStage)}
                                            icon={<Layers className="w-4 h-4 text-emerald-600" />}
                                        >
                                            {traceData.cultivationLogs.length > 0 ? (
                                                <div className="trace-node-content">
                                                    <div className="trace-logs-list">
                                                        {(showAllLogs ? traceData.cultivationLogs : traceData.cultivationLogs.slice(0, 3)).map((log, idx) => (
                                                            <div key={idx} className="trace-log-item">
                                                                <div className="trace-log-top">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="trace-log-activity-badge">{log.activity}</span>
                                                                        <span className="trace-log-date">
                                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                                            {new Date(log.date).toLocaleDateString('vi-VN')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="trace-log-worker">
                                                                        <User className="w-3 h-3 text-slate-400" />
                                                                        <span>{log.worker}</span>
                                                                    </div>
                                                                </div>

                                                                {log.images && log.images.length > 0 && (
                                                                    <div className="trace-log-gallery">
                                                                        {log.images.map((imgUrl, imgIdx) => {
                                                                            const resolvedUrl = resolveIpfsUrl(imgUrl);
                                                                            return (
                                                                                <div
                                                                                    key={imgIdx}
                                                                                    className="trace-log-thumb-wrap"
                                                                                    onClick={() => setPreviewImage(resolvedUrl)}
                                                                                    title="Click để phóng to ảnh"
                                                                                >
                                                                                    <img
                                                                                        src={resolvedUrl}
                                                                                        alt={`Hoạt động ${imgIdx + 1}`}
                                                                                        className="trace-log-thumb-img"
                                                                                    />
                                                                                    <div className="trace-thumb-overlay">
                                                                                        <Maximize2 className="w-3.5 h-3.5 text-white" />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {traceData.cultivationLogs.length > 3 && (
                                                        <button
                                                            onClick={() => setShowAllLogs(!showAllLogs)}
                                                            className="trace-expand-logs-btn"
                                                        >
                                                            {showAllLogs ? (
                                                                <>
                                                                    <span>Thu gọn nhật ký</span>
                                                                    <ChevronUp className="w-4 h-4" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span>Xem thêm {traceData.cultivationLogs.length - 3} nhật ký canh tác</span>
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="trace-empty-text">Chưa ghi nhận nhật ký canh tác phát sinh.</p>
                                            )}
                                        </TimelineNode>

                                        {/* CHẶNG 3: THU HOẠCH & ẢNH CHỤP THỰC TẾ LÚC THU HOẠCH */}
                                        <TimelineNode
                                            stepNumber={3}
                                            title="Thu Hoạch & Phân Tuyển Nông Sản"
                                            status={getStepStatus(3, traceData.targetInfo.currentStage)}
                                            icon={<Scissors className="w-4 h-4 text-emerald-600" />}
                                        >
                                            {traceData.harvest ? (
                                                <div className="trace-node-content space-y-3">
                                                    <div className="trace-node-props-grid">
                                                        <div className="trace-prop-box">
                                                            <span className="trace-prop-label">Ngày thu hoạch:</span>
                                                            <span className="trace-prop-value font-bold text-slate-800">
                                                                {new Date(traceData.harvest.harvestDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                        <div className="trace-prop-box">
                                                            <span className="trace-prop-label">Sản lượng thu hoạch:</span>
                                                            <span className="trace-prop-value font-extrabold text-emerald-600">
                                                                {traceData.harvest.quantity.toLocaleString('vi-VN')} {traceData.harvest.unit}
                                                            </span>
                                                        </div>
                                                        <div className="trace-prop-box col-span-full">
                                                            <span className="trace-prop-label">Đại diện phụ trách thu hoạch:</span>
                                                            <span className="trace-prop-value font-semibold flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                                <span className="truncate">{traceData.harvest.representativeWorker || 'Nông dân đại diện HTX'}</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ảnh thực tế lúc thu hoạch */}
                                                    {harvestOnlyPhotos.length > 0 ? (
                                                        <div className="trace-harvest-photos-section">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                                                                <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                <span>Ảnh thực tế khi thu hoạch tại vườn ({harvestOnlyPhotos.length} ảnh):</span>
                                                            </div>
                                                            <div className="trace-harvest-photos-grid">
                                                                {harvestOnlyPhotos.map((photo, pIdx) => (
                                                                    <div
                                                                        key={pIdx}
                                                                        className="trace-harvest-photo-card"
                                                                        onClick={() => setPreviewImage(photo.url)}
                                                                        title="Nhấp để phóng to ảnh thu hoạch"
                                                                    >
                                                                        <img src={photo.url} alt={`Ảnh thu hoạch ${pIdx + 1}`} className="trace-harvest-photo-img" />
                                                                        <div className="trace-harvest-photo-meta">
                                                                            <span className="trace-harvest-photo-worker">{photo.worker}</span>
                                                                            <span className="trace-harvest-photo-date">{new Date(photo.logDate).toLocaleDateString('vi-VN')}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="trace-harvest-no-photos">
                                                            <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                            <span className="text-xs text-slate-500 leading-relaxed">Đợt thu hoạch đã được nông dân đại diện ký số và chứng thực trên Smart Contract.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="trace-empty-text">Lô nông sản đang trong giai đoạn canh tác, chưa thu hoạch.</p>
                                            )}
                                        </TimelineNode>

                                        {/* CHẶNG 4: SƠ CHẾ, KIỂM ĐỊNH VIETGAP & ĐÓNG GÓI */}
                                        <TimelineNode
                                            stepNumber={4}
                                            title="Sơ Chế, Kiểm Định VietGAP & Đóng Gói"
                                            status={getStepStatus(4, traceData.targetInfo.currentStage)}
                                            icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                                        >
                                            <div className="trace-node-content space-y-3">
                                                {/* Sơ chế */}
                                                {traceData.processing && (
                                                    <div className="trace-sub-step-card">
                                                        <span className="trace-sub-step-tag">1. Sơ Chế & Phân Loại</span>
                                                        <div className="trace-node-props-grid mt-2">
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Phương pháp:</span>
                                                                <span className="trace-prop-value">{traceData.processing.processType}</span>
                                                            </div>
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Ngày thực hiện:</span>
                                                                <span className="trace-prop-value">{new Date(traceData.processing.startDate).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                            {traceData.processing.description && (
                                                                <div className="trace-prop-box col-span-full">
                                                                    <span className="trace-prop-label">Quy trình chi tiết:</span>
                                                                    <span className="trace-prop-value text-slate-600">{traceData.processing.description}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Kiểm định VietGAP */}
                                                {traceData.inspection ? (
                                                    <div className="trace-sub-step-card cert-highlight">
                                                        <div className="flex items-center justify-between flex-wrap gap-1">
                                                            <span className="trace-sub-step-tag green">2. Kiểm Định VietGAP</span>
                                                            <span className="trace-status-chip passed">ĐẠT CHUẨN AN TOÀN</span>
                                                        </div>
                                                        <div className="trace-node-props-grid mt-2">
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Số giấy chứng nhận:</span>
                                                                <span className="trace-prop-value font-mono font-bold text-slate-900">{traceData.inspection.documentNumber}</span>
                                                            </div>
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Đơn vị kiểm nghiệm:</span>
                                                                <span className="trace-prop-value">{traceData.inspection.unit || 'Trung tâm Giám định Chất lượng'}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowVietGapModal(true)}
                                                            className="trace-cert-view-btn mt-2.5"
                                                        >
                                                            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            <span>Xem chi tiết Giấy Chứng Nhận VietGAP</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="trace-sub-step-card">
                                                        <span className="trace-sub-step-tag">2. Kiểm Định Chất Lượng</span>
                                                        <p className="trace-empty-text mt-1">Đang chờ hoàn tất hồ sơ kiểm định VietGAP.</p>
                                                    </div>
                                                )}

                                                {/* Đóng gói */}
                                                {traceData.packaging ? (
                                                    <div className="trace-sub-step-card">
                                                        <span className="trace-sub-step-tag">3. Đóng Gói Thương Phẩm</span>
                                                        <div className="trace-node-props-grid mt-2">
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Quy cách đóng gói:</span>
                                                                <span className="trace-prop-value font-semibold">{traceData.packaging.specification}</span>
                                                            </div>
                                                            <div className="trace-prop-box">
                                                                <span className="trace-prop-label">Ngày đóng gói:</span>
                                                                <span className="trace-prop-value">{new Date(traceData.packaging.packDate).toLocaleDateString('vi-VN')}</span>
                                                            </div>
                                                            <div className="trace-prop-box col-span-full">
                                                                <span className="trace-prop-label">Tiêu chuẩn xuất xưởng:</span>
                                                                <span className="trace-prop-value font-bold text-emerald-700">{traceData.packaging.standard || 'TCVN / VietGAP'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="trace-sub-step-card">
                                                        <span className="trace-sub-step-tag">3. Đóng Gói</span>
                                                        <p className="trace-empty-text mt-1">Sản phẩm chưa đóng gói thành phẩm lẻ.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TimelineNode>

                                        {/* CHẶNG 5: VẬN CHUYỂN & PHÂN PHỐI SIÊU THỊ */}
                                        <TimelineNode
                                            stepNumber={5}
                                            title="Vận Chuyển & Phân Phối Siêu Thị"
                                            status={getStepStatus(6, traceData.targetInfo.currentStage)}
                                            icon={<Truck className="w-4 h-4 text-emerald-600" />}
                                            isLast={true}
                                        >
                                            {traceData.shipment ? (
                                                <div className="trace-node-content space-y-3">
                                                    <div className="trace-node-props-grid">
                                                        <div className="trace-prop-box">
                                                            <span className="trace-prop-label">Đơn vị vận chuyển:</span>
                                                            <span className="trace-prop-value font-bold">{traceData.shipment.carrier}</span>
                                                        </div>
                                                        <div className="trace-prop-box">
                                                            <span className="trace-prop-label">Mã vận đơn:</span>
                                                            <span className="trace-prop-value font-mono font-bold text-slate-800">{traceData.shipment.shippingCode}</span>
                                                        </div>
                                                    </div>

                                                    {/* Route Diagram */}
                                                    <div className="trace-route-card">
                                                        <div className="trace-route-point">
                                                            <span className="trace-route-dot origin" />
                                                            <div className="min-w-0 flex-1">
                                                                <span className="trace-route-sub">Điểm lấy hàng</span>
                                                                <strong className="trace-route-name truncate">{traceData.shipment.pickupLocation || 'Kho HTX Nông Nghiệp'}</strong>
                                                            </div>
                                                        </div>
                                                        <div className="trace-route-arrow-box">
                                                            <ArrowRight className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div className="trace-route-point">
                                                            <span className="trace-route-dot destination" />
                                                            <div className="min-w-0 flex-1">
                                                                <span className="trace-route-sub">Điểm đến</span>
                                                                <strong className="trace-route-name truncate">{traceData.shipment.destination || 'Trung tâm Phân phối'}</strong>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Retailer Info */}
                                                    <div className="trace-retailer-badge-box">
                                                        <div className="flex items-center gap-2">
                                                            <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            <span className="text-xs text-slate-500">Đại lý / Siêu thị tiếp nhận:</span>
                                                        </div>
                                                        <h5 className="font-extrabold text-slate-900 text-sm mt-1">{traceData.shipment.retailerName}</h5>
                                                        {traceData.shipment.readyForSaleDate && (
                                                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-1">
                                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                                <span>Sẵn sàng lên kệ: {new Date(traceData.shipment.readyForSaleDate).toLocaleString('vi-VN')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="trace-empty-text">Sản phẩm đang lưu kho chuẩn bị điều phối vận chuyển.</p>
                                            )}
                                        </TimelineNode>

                                    </div>
                                </div>
                            </div>

                            {/* ─── CỘT 2: BẢO CHỨNG SMART CONTRACT & BLOCKCHAIN ─── */}
                            <div className="trace-column-blockchain">
                                
                                {/* 1. Thẻ bảo chứng Smart Contract */}
                                <div className="trace-crypto-badge-card">
                                    <div className="trace-crypto-header">
                                        <div className="trace-crypto-icon-box">
                                            <Cpu className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">Bảo Chứng Smart Contract</h4>
                                            <span className="text-[11px] text-emerald-400 font-mono">FRUITCHAIN-CORE-V2</span>
                                        </div>
                                    </div>

                                    <div className="trace-crypto-body">
                                        <div className="trace-crypto-metric">
                                            <span className="trace-crypto-label">Xác thực:</span>
                                            <span className="trace-crypto-val-green">
                                                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                                                100% On-Chain Verified
                                            </span>
                                        </div>

                                        <div className="trace-crypto-metric">
                                            <span className="trace-crypto-label">Mạng phi tập trung:</span>
                                            <span className="text-slate-300 font-mono text-xs">IPFS Protocol</span>
                                        </div>

                                        <div className="trace-crypto-metric">
                                            <span className="trace-crypto-label">Tổng giao dịch:</span>
                                            <span className="text-white font-bold font-mono text-xs">{traceData.blockchainHistory?.length || 0} Block Events</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Nhân sự phụ trách */}
                                {traceData.workers && traceData.workers.length > 0 && (
                                    <div className="trace-card-section">
                                        <div className="trace-section-header">
                                            <div className="trace-section-title-wrap">
                                                <User className="w-4 h-4 text-emerald-600" />
                                                <h4 className="trace-section-title text-sm">Nhân Sự Phụ Trách ({traceData.workers.length})</h4>
                                            </div>
                                        </div>

                                        <div className="trace-workers-grid">
                                            {traceData.workers.map((worker, idx) => (
                                                <div key={idx} className="trace-worker-pill">
                                                    <div className="trace-worker-avatar-box">
                                                        <User className="w-3.5 h-3.5 text-emerald-600" />
                                                    </div>
                                                    <div className="trace-worker-details">
                                                        <span className="font-bold text-slate-800 text-xs truncate">{worker.fullName}</span>
                                                        {worker.isRepresentative && (
                                                            <span className="trace-rep-badge shrink-0">Đại diện</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Sổ cái giao dịch trực tiếp */}
                                <div className="trace-card-section">
                                    <div className="trace-section-header">
                                        <div className="trace-section-title-wrap">
                                            <Database className="w-4 h-4 text-emerald-600" />
                                            <h4 className="trace-section-title text-sm">Sổ Cái Giao Dịch ({traceData.blockchainHistory?.length || 0})</h4>
                                        </div>
                                        <span className="trace-section-badge green">Bất Biến</span>
                                    </div>

                                    {traceData.blockchainHistory && traceData.blockchainHistory.length > 0 ? (
                                        <div className="trace-tx-stream">
                                            {traceData.blockchainHistory.map((tx, idx) => (
                                                <div key={idx} className="trace-tx-card">
                                                    <div className="trace-tx-header-row">
                                                        <span className="trace-tx-stage">{tx.stage}</span>
                                                        <span className="trace-tx-status">
                                                            <Check className="w-3 h-3 inline mr-0.5" />
                                                            {tx.status}
                                                        </span>
                                                    </div>

                                                    <div className="trace-tx-fn-call">
                                                        <span>Hàm:</span>
                                                        <strong>{tx.functionName}()</strong>
                                                    </div>

                                                    {/* TxHash with Copy */}
                                                    <div className="trace-tx-hash-box">
                                                        <span className="text-slate-400 font-mono text-[11px]">Tx:</span>
                                                        <span className="trace-tx-hash-str font-mono truncate" title={tx.txHash}>
                                                            {formatHash(tx.txHash)}
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopyTx(tx.txHash)}
                                                            className="trace-copy-tx-btn"
                                                            title="Sao chép TxHash"
                                                        >
                                                            {copiedTx === tx.txHash ? (
                                                                <Check className="w-3 h-3 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-slate-400" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="trace-tx-footer-row">
                                                        <span className="trace-tx-block font-mono">Block #{tx.blockNumber || 'Auto'}</span>
                                                        <span className="trace-tx-time">{new Date(tx.timestamp).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="trace-empty-text">Dữ liệu on-chain đang được ghi nhận vào khối.</p>
                                    )}
                                </div>

                                {/* Thông báo an ninh */}
                                <div className="trace-security-notice-card">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <p className="text-slate-600 text-xs leading-relaxed">
                                        Mọi thông tin được xác thực bằng chữ ký số Smart Contract trên Blockchain. Không một bên nào có thể thay đổi dữ liệu đã ghi nhận.
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

                {/* ─────── EMPTY WELCOME STATE ─────── */}
                {!loading && !traceData && !error && (
                    <div className="trace-welcome-box">
                        <div className="trace-welcome-icon-wrap">
                            <QrCode className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h2 className="trace-welcome-title">Chào Mừng Đến Với FruitChain</h2>
                        <p className="trace-welcome-desc">
                            Vui lòng nhập mã lô hàng (Ví dụ: <strong className="text-emerald-700">SUB-001</strong>), mã QR Code hoặc nhấn nút <strong>"Quét QR"</strong> để tra cứu nguồn gốc thực phẩm.
                        </p>
                        <div className="trace-welcome-features">
                            <div className="trace-welcome-feat-item">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Kiểm định VietGAP tiêu chuẩn</span>
                            </div>
                            <div className="trace-welcome-feat-item">
                                <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Ảnh thực tế khi thu hoạch</span>
                            </div>
                            <div className="trace-welcome-feat-item">
                                <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Bảo chứng Smart Contract</span>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* ─────── FLOATING QUICK SCAN QR BUTTON (Mobile) ─────── */}
            <button
                onClick={() => setShowQrModal(true)}
                className="trace-fab-scan-btn"
                title="Quét mã QR nhanh"
            >
                <QrCode className="w-6 h-6 text-white" />
            </button>

            {/* ─────── IMAGE LIGHTBOX PREVIEW MODAL ─────── */}
            {previewImage && (
                <div className="trace-lightbox-backdrop" onClick={() => setPreviewImage(null)}>
                    <div className="trace-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="trace-lightbox-close-btn"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Ảnh chi tiết sản phẩm"
                            className="trace-lightbox-img"
                        />
                    </div>
                </div>
            )}

            {/* ─────── MODALS ─────── */}
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

/* ─────── Timeline Sub-Component ─────── */
interface TimelineNodeProps {
    stepNumber: number;
    title: string;
    status: 'completed' | 'active' | 'pending';
    icon: React.ReactNode;
    isLast?: boolean;
    children: React.ReactNode;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({
    stepNumber,
    title,
    status,
    icon,
    isLast = false,
    children
}) => {
    return (
        <div className={`trace-timeline-node ${status}`}>
            {!isLast && <div className="trace-node-connector" />}
            
            <div className={`trace-node-badge ${status}`}>
                {status === 'completed' ? (
                    <Check className="w-4 h-4 text-white" />
                ) : (
                    <span>{stepNumber}</span>
                )}
            </div>

            <div className={`trace-node-card ${status}`}>
                <div className="trace-node-header">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="trace-node-icon-box shrink-0">{icon}</span>
                        <h4 className="trace-node-title truncate">{title}</h4>
                    </div>
                    {status === 'completed' && <span className="trace-node-tag completed shrink-0">Hoàn thành</span>}
                    {status === 'active' && <span className="trace-node-tag active shrink-0">Đang thực hiện</span>}
                    {status === 'pending' && <span className="trace-node-tag pending shrink-0">Chưa tới</span>}
                </div>

                <div className="trace-node-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

/* ─────── MASTER MODERN CSS STYLING (PC PRESERVED + MOBILE RESPONSIVE) ─────── */
const traceModernStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

:root {
    --fc-primary: #059669;
    --fc-primary-hover: #047857;
    --fc-primary-light: #ecfdf5;
    --fc-emerald-500: #10b981;
    --fc-amber: #f59e0b;
    --fc-slate-900: #0f172a;
    --fc-slate-800: #1e293b;
    --fc-slate-700: #334155;
    --fc-slate-600: #475569;
    --fc-slate-500: #64748b;
    --fc-slate-200: #e2e8f0;
    --fc-slate-100: #f1f5f9;
    --fc-slate-50: #f8fafc;
    
    --fc-radius-sm: 10px;
    --fc-radius-md: 14px;
    --fc-radius-lg: 20px;
    --fc-radius-xl: 26px;
    
    --fc-shadow-card: 0 6px 20px -3px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
}

*, *::before, *::after {
    box-sizing: border-box;
}

.trace-app-root {
    min-height: 100vh;
    background: #f8fafc;
    background-image: 
        radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.06) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.04) 0px, transparent 50%);
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--fc-slate-800);
    padding-bottom: 90px;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    width: 100%;
}

/* ─────── TOP NAVBAR ─────── */
.trace-navbar {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    position: sticky;
    top: 0;
    z-index: 40;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.trace-nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.trace-brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
}

.trace-brand-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.trace-brand-img {
    width: 24px;
    height: 24px;
    object-fit: contain;
}

.trace-brand-text-wrap {
    display: flex;
    flex-direction: column;
}

.trace-brand-title {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -0.5px;
    line-height: 1.1;
}

.trace-brand-green { color: var(--fc-primary); }
.trace-brand-gold { color: var(--fc-amber); }

.trace-brand-sub {
    font-size: 10px;
    font-weight: 700;
    color: var(--fc-slate-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.trace-nav-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trace-blockchain-badge-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #0f172a;
    color: #ffffff;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
}

.trace-pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    animation: pulseGlow 1.8s infinite;
}

@keyframes pulseGlow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.3); }
}

.trace-nav-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--fc-slate-700);
    cursor: pointer;
    transition: all 0.2s ease;
}

.trace-nav-action-btn:hover {
    background: #f8fafc;
    border-color: var(--fc-slate-300);
}

/* ─────── BODY CONTAINER ─────── */
.trace-body-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    width: 100%;
}

.trace-result-wrapper {
    display: flex;
    flex-direction: column;
    gap: 22px;
    width: 100%;
}

/* ─────── HERO SEARCH CARD ─────── */
.trace-search-hero-card {
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: var(--fc-radius-xl);
    padding: 32px 24px;
    box-shadow: var(--fc-shadow-card);
    text-align: center;
    position: relative;
    overflow: hidden;
    width: 100%;
}

.trace-search-header-group {
    max-width: 720px;
    margin: 0 auto 20px;
}

.trace-tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ecfdf5;
    color: var(--fc-primary);
    border: 1px solid #a7f3d0;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 10px;
}

.trace-main-heading {
    font-size: 30px;
    font-weight: 900;
    color: var(--fc-slate-900);
    margin: 0 0 8px;
    letter-spacing: -0.5px;
}

.trace-sub-heading {
    font-size: 13.5px;
    color: var(--fc-slate-600);
    line-height: 1.6;
    margin: 0;
}

/* Search bar */
.trace-search-box-wrapper {
    max-width: 680px;
    margin: 0 auto;
    background: #ffffff;
    padding: 5px;
    border-radius: 18px;
    border: 2px solid #e2e8f0;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    width: 100%;
}

.trace-search-box-wrapper:focus-within {
    border-color: var(--fc-emerald-500);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
}

.trace-input-inner {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
}

.trace-native-input {
    width: 100%;
    border: none;
    outline: none;
    padding: 10px 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--fc-slate-900);
    background: transparent;
}

.trace-native-input::placeholder {
    color: #94a3b8;
    font-weight: 500;
}

.trace-clear-btn {
    background: none;
    border: none;
    padding: 6px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.trace-search-buttons-group {
    display: flex;
    gap: 6px;
}

.trace-scan-qr-btn {
    padding: 10px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    color: var(--fc-slate-700);
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.trace-scan-qr-btn:hover {
    background: #f1f5f9;
}

.trace-submit-btn {
    padding: 10px 22px;
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    border: none;
    border-radius: 12px;
    color: #ffffff;
    font-size: 13.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
    transition: all 0.2s ease;
    white-space: nowrap;
}

.trace-submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
}

.trace-inline-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

/* Sample tags bar */
.trace-sample-tags-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
    font-size: 12px;
}

.trace-sample-title {
    color: var(--fc-slate-500);
    font-weight: 600;
}

.trace-sample-list {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.trace-sample-chip {
    padding: 3px 10px;
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: var(--fc-slate-700);
    cursor: pointer;
    transition: all 0.2s ease;
}

.trace-sample-chip:hover {
    border-color: var(--fc-primary);
    color: var(--fc-primary);
    background: #ecfdf5;
}

/* ─────── PRODUCT MASTER HERO CARD ─────── */
.trace-product-hero-container {
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    border-radius: var(--fc-radius-xl);
    padding: 24px;
    box-shadow: var(--fc-shadow-card);
    width: 100%;
}

.trace-product-hero-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    align-items: flex-start;
    gap: 24px;
    width: 100%;
}

.trace-product-media-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.trace-product-image-card {
    position: relative;
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: var(--fc-radius-lg);
    overflow: hidden;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.trace-product-main-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
}

.trace-product-main-img:hover {
    transform: scale(1.03);
}

.trace-image-glass-tag {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    color: #ffffff;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.3px;
}

.trace-image-glass-tag.harvest-tag {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(180, 83, 9, 0.95));
    border: 1px solid rgba(251, 191, 36, 0.4);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.trace-image-zoom-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(4px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--fc-slate-800);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.trace-image-zoom-btn:hover {
    background: #ffffff;
    transform: scale(1.1);
}

/* Thumbnails Strip */
.trace-hero-thumb-strip {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: var(--fc-radius-md);
    padding: 10px;
}

.trace-thumb-strip-lbl {
    font-size: 11px;
    font-weight: 700;
    color: var(--fc-slate-600);
}

.trace-hero-thumbs-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
}

.trace-hero-thumb-btn {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid #e2e8f0;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    background: #ffffff;
    transition: all 0.2s ease;
}

.trace-hero-thumb-btn.active {
    border-color: var(--fc-primary);
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.25);
}

.trace-thumb-harvest-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 10px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 3px;
    padding: 1px;
}

.trace-photo-caption-card {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: var(--fc-radius-md);
    padding: 8px 12px;
}

.trace-vietgap-seal-card {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #6ee7b7;
    border-radius: var(--fc-radius-md);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
}

.trace-vietgap-seal-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
}

.trace-seal-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(5, 150, 105, 0.15);
    flex-shrink: 0;
}

.trace-seal-text {
    display: flex;
    flex-direction: column;
}

.trace-seal-lbl {
    font-size: 10px;
    font-weight: 700;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.trace-seal-val {
    font-size: 13.5px;
    font-weight: 900;
    color: #047857;
}

/* Info Column */
.trace-product-info-column {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.trace-product-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
}

.trace-batch-badge {
    padding: 4px 12px;
    background: #f0fdf4;
    color: var(--fc-primary);
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 800;
    text-transform: uppercase;
}

.trace-code-copy-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f8fafc;
    border: 1px solid var(--fc-slate-200);
    padding: 4px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.trace-code-copy-pill:hover {
    background: #f1f5f9;
    border-color: var(--fc-slate-300);
}

.trace-product-title {
    font-size: 26px;
    font-weight: 900;
    color: var(--fc-slate-900);
    margin: 0;
    letter-spacing: -0.5px;
    line-height: 1.25;
}

/* Attributes grid */
.trace-attributes-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.trace-attr-item {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    padding: 10px 12px;
    border-radius: var(--fc-radius-md);
    display: flex;
    align-items: center;
    gap: 10px;
}

.trace-attr-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.trace-attr-label {
    display: block;
    font-size: 10px;
    color: var(--fc-slate-500);
    font-weight: 600;
}

.trace-attr-val {
    display: block;
    font-size: 12.5px;
    color: var(--fc-slate-900);
    font-weight: 800;
}

/* Stepper progress */
.trace-stepper-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: var(--fc-radius-md);
    padding: 14px;
}

.trace-stepper-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.trace-stepper-track {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.trace-stepper-fill {
    height: 100%;
    background: linear-gradient(90deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.trace-stepper-markers {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    gap: 4px;
}

.trace-milestone-tag {
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 2px 7px;
    border-radius: 6px;
    white-space: nowrap;
}

.trace-milestone-tag.active {
    color: var(--fc-primary);
    border-color: #a7f3d0;
    background: #ecfdf5;
    font-weight: 800;
}

/* ─────── DETAILS 2-COLUMN GRID ─────── */
.trace-details-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 22px;
    width: 100%;
}

.trace-column-journey,
.trace-column-blockchain {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ─────── CARD SECTION ─────── */
.trace-card-section {
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    border-radius: var(--fc-radius-xl);
    padding: 20px;
    box-shadow: var(--fc-shadow-card);
    width: 100%;
}

.trace-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--fc-slate-100);
}

.trace-section-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trace-section-title {
    font-size: 15px;
    font-weight: 900;
    color: var(--fc-slate-900);
    margin: 0;
    text-transform: uppercase;
}

.trace-section-badge {
    padding: 3px 8px;
    background: #f1f5f9;
    color: var(--fc-slate-600);
    border-radius: 6px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
}

.trace-section-badge.green {
    background: #ecfdf5;
    color: #047857;
}

/* ─────── TIMELINE FLOW ─────── */
.trace-timeline-flow {
    position: relative;
    padding-left: 4px;
}

.trace-timeline-node {
    position: relative;
    padding-left: 40px;
    padding-bottom: 24px;
}

.trace-timeline-node:last-child {
    padding-bottom: 0;
}

.trace-node-connector {
    position: absolute;
    left: 14px;
    top: 32px;
    bottom: -6px;
    width: 2px;
    background: #e2e8f0;
    z-index: 1;
}

.trace-timeline-node.completed .trace-node-connector {
    background: #10b981;
}

.trace-node-badge {
    position: absolute;
    left: 0px;
    top: 2px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #cbd5e1;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.trace-timeline-node.completed .trace-node-badge {
    background: #059669;
    border-color: #059669;
    color: #ffffff;
}

.trace-timeline-node.active .trace-node-badge {
    background: #ffffff;
    border-color: #3b82f6;
    color: #2563eb;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.trace-node-card {
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    border-radius: var(--fc-radius-md);
    padding: 14px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.trace-node-card.completed {
    border-left: 4px solid var(--fc-emerald-500);
}

.trace-node-card.active {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.trace-node-card.pending {
    opacity: 0.7;
    background: #fafafa;
}

.trace-node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 8px;
}

.trace-node-icon-box {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #ecfdf5;
    display: flex;
    align-items: center;
    justify-content: center;
}

.trace-node-title {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--fc-slate-900);
    margin: 0;
}

.trace-node-tag {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
}

.trace-node-tag.completed {
    background: #ecfdf5;
    color: #065f46;
}

.trace-node-tag.active {
    background: #eff6ff;
    color: #1e40af;
}

.trace-node-tag.pending {
    background: #f1f5f9;
    color: #64748b;
}

.trace-node-headline {
    margin-bottom: 8px;
}

.trace-node-props-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.trace-prop-box {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    padding: 6px 10px;
}

.trace-prop-label {
    display: block;
    font-size: 10px;
    color: var(--fc-slate-500);
    font-weight: 600;
}

.trace-prop-value {
    display: block;
    font-size: 12px;
    color: var(--fc-slate-900);
    font-weight: 700;
    margin-top: 1px;
}

.trace-map-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 6px 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
}

.trace-map-link-btn:hover {
    background: #dbeafe;
}

/* Cultivation logs */
.trace-logs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.trace-log-item {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: var(--fc-radius-sm);
    padding: 8px 12px;
}

.trace-log-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
}

.trace-log-activity-badge {
    padding: 2px 8px;
    background: #ecfdf5;
    color: #065f46;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 800;
}

.trace-log-date, .trace-log-worker {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--fc-slate-500);
    font-weight: 600;
}

.trace-log-gallery {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.trace-log-thumb-wrap {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    cursor: pointer;
}

.trace-log-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.trace-thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.trace-log-thumb-wrap:hover .trace-thumb-overlay {
    opacity: 1;
}

.trace-expand-logs-btn {
    width: 100%;
    margin-top: 10px;
    padding: 8px;
    background: #f1f5f9;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--fc-slate-700);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.trace-expand-logs-btn:hover {
    background: #e2e8f0;
}

/* Harvest photos section in Step 3 */
.trace-harvest-photos-section {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: var(--fc-radius-md);
    padding: 12px;
    margin-top: 10px;
}

.trace-harvest-photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
}

.trace-harvest-photo-card {
    background: #ffffff;
    border: 1px solid #86efac;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease;
}

.trace-harvest-photo-card:hover {
    transform: scale(1.04);
}

.trace-harvest-photo-img {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    display: block;
}

.trace-harvest-photo-meta {
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

.trace-harvest-photo-worker {
    font-size: 10px;
    font-weight: 700;
    color: var(--fc-slate-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.trace-harvest-photo-date {
    font-size: 9px;
    color: var(--fc-slate-500);
}

.trace-harvest-no-photos {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    margin-top: 8px;
}

/* Sub-steps in Step 4 */
.trace-sub-step-card {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: var(--fc-radius-md);
    padding: 12px;
}

.trace-sub-step-card.cert-highlight {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
}

.trace-sub-step-tag {
    font-size: 11px;
    font-weight: 800;
    color: var(--fc-slate-700);
    text-transform: uppercase;
}

.trace-sub-step-tag.green {
    color: #047857;
}

.trace-status-chip {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 800;
}

.trace-status-chip.passed {
    background: #d1fae5;
    color: #065f46;
}

.trace-cert-view-btn {
    width: 100%;
    padding: 8px 12px;
    background: #ffffff;
    border: 1px solid #6ee7b7;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    color: #047857;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.trace-cert-view-btn:hover {
    background: #ecfdf5;
}

/* Logistics & route card */
.trace-route-card {
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    border-radius: var(--fc-radius-md);
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.trace-route-point {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.trace-route-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.trace-route-dot.origin { background: #3b82f6; }
.trace-route-dot.destination { background: #10b981; }

.trace-route-sub {
    display: block;
    font-size: 9.5px;
    color: var(--fc-slate-500);
    font-weight: 600;
}

.trace-route-name {
    display: block;
    font-size: 12px;
    color: var(--fc-slate-900);
}

.trace-retailer-badge-box {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: var(--fc-radius-md);
    padding: 10px 12px;
}

/* ─────── BLOCKCHAIN CRYPTO CARD ─────── */
.trace-crypto-badge-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: var(--fc-radius-xl);
    padding: 18px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
    width: 100%;
}

.trace-crypto-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.trace-crypto-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.trace-crypto-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
}

.trace-crypto-metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}

.trace-crypto-label {
    color: #94a3b8;
}

.trace-crypto-val-green {
    color: #34d399;
    font-weight: 800;
}

/* Workers Pill */
.trace-workers-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
}

.trace-worker-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 8px;
}

.trace-worker-avatar-box {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ecfdf5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.trace-worker-details {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.trace-rep-badge {
    padding: 2px 6px;
    background: #fef3c7;
    color: #b45309;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;
}

/* TX STREAM */
.trace-tx-stream {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 400px;
    overflow-y: auto;
}

.trace-tx-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 10px 12px;
    font-family: 'JetBrains Mono', monospace;
}

.trace-tx-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.trace-tx-stage {
    font-size: 11px;
    font-weight: 700;
    color: #cbd5e1;
}

.trace-tx-status {
    font-size: 9.5px;
    font-weight: 800;
    color: #34d399;
}

.trace-tx-fn-call {
    font-size: 10px;
    color: #94a3b8;
    margin-bottom: 5px;
}

.trace-tx-fn-call strong {
    color: #fbbf24;
    margin-left: 3px;
}

.trace-tx-hash-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.3);
    padding: 4px 8px;
    border-radius: 6px;
    margin-bottom: 4px;
}

.trace-tx-hash-str {
    color: #60a5fa;
    font-size: 10.5px;
}

.trace-copy-tx-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.trace-tx-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9.5px;
    color: #64748b;
}

.trace-security-notice-card {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: var(--fc-radius-md);
    padding: 14px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

/* ─────── EMPTY / WELCOME BOX ─────── */
.trace-welcome-box {
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    border-radius: var(--fc-radius-xl);
    padding: 40px 24px;
    text-align: center;
    box-shadow: var(--fc-shadow-card);
    max-width: 620px;
    margin: 0 auto;
    width: 100%;
}

.trace-welcome-icon-wrap {
    width: 68px;
    height: 68px;
    border-radius: 18px;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}

.trace-welcome-title {
    font-size: 20px;
    font-weight: 900;
    color: var(--fc-slate-900);
    margin: 0 0 8px;
}

.trace-welcome-desc {
    font-size: 13.5px;
    color: var(--fc-slate-600);
    line-height: 1.6;
    margin: 0 0 20px;
}

.trace-welcome-features {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    text-align: left;
    max-width: 420px;
    margin: 0 auto;
}

.trace-welcome-feat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--fc-slate-800);
}

/* Alerts & Loading */
.trace-alert-box {
    padding: 14px 16px;
    border-radius: var(--fc-radius-md);
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.trace-alert-box.error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #9f1239;
}

.trace-alert-content h4 {
    font-size: 13.5px;
    font-weight: 800;
    margin: 0 0 2px;
}

.trace-alert-content p {
    font-size: 12px;
    margin: 0;
}

.trace-loading-card {
    background: #ffffff;
    border: 1px solid var(--fc-slate-200);
    border-radius: var(--fc-radius-xl);
    padding: 48px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: var(--fc-shadow-card);
    width: 100%;
}

.trace-empty-text {
    font-size: 12px;
    color: var(--fc-slate-500);
    font-style: italic;
    margin: 0;
}

/* Floating Action Button */
.trace-fab-scan-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    border: none;
    box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 45;
    transition: all 0.3s ease;
}

.trace-fab-scan-btn:hover {
    transform: scale(1.08);
}

@media (min-width: 1024px) {
    .trace-fab-scan-btn {
        display: none !important;
    }
}

/* Lightbox Modal */
.trace-lightbox-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 100;
}

.trace-lightbox-content {
    position: relative;
    max-width: 95vw;
    max-height: 90vh;
    background: #000000;
    border-radius: var(--fc-radius-md);
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.trace-lightbox-img {
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    display: block;
}

.trace-lightbox-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

/* ─────── RESPONSIVE RULES FOR MOBILE ONLY (Chỉ áp dụng khi xem trên điện thoại, máy tính giữ nguyên 100%) ─────── */
@media (max-width: 768px) {
    html, body {
        overflow-x: hidden !important;
        max-width: 100vw !important;
        width: 100% !important;
    }

    .trace-app-root {
        overflow-x: hidden !important;
        width: 100% !important;
        max-width: 100% !important;
    }

    .trace-navbar {
        position: sticky;
        top: 0;
        width: 100% !important;
        max-width: 100% !important;
    }

    .trace-nav-container {
        padding: 10px 12px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-brand-link {
        min-width: 0 !important;
    }

    .trace-brand-title {
        font-size: 16px !important;
    }

    .trace-brand-sub {
        display: none !important;
    }

    .trace-blockchain-badge-pill {
        padding: 4px 8px !important;
        font-size: 9.5px !important;
    }

    .trace-body-container {
        padding: 12px 10px 80px !important;
        gap: 14px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-result-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        gap: 14px !important;
    }

    .trace-search-hero-card {
        padding: 16px 12px !important;
        border-radius: var(--fc-radius-lg) !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-main-heading {
        font-size: 19px !important;
    }

    .trace-sub-heading {
        font-size: 12px !important;
    }

    .trace-search-box-wrapper {
        flex-direction: column !important;
        padding: 4px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-input-inner {
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-native-input {
        width: 100% !important;
        min-width: 0 !important;
        font-size: 13px !important;
    }

    .trace-search-buttons-group {
        width: 100% !important;
        display: flex !important;
        gap: 6px !important;
    }

    .trace-scan-qr-btn,
    .trace-submit-btn {
        flex: 1 !important;
        padding: 9px 10px !important;
        font-size: 12px !important;
        justify-content: center !important;
    }

    .trace-product-hero-container {
        padding: 12px !important;
        border-radius: var(--fc-radius-lg) !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .trace-product-hero-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-product-media-column,
    .trace-product-info-column {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-product-image-card {
        aspect-ratio: 16/10 !important;
        width: 100% !important;
        max-width: 100% !important;
    }

    .trace-product-title {
        font-size: 19px !important;
        word-break: break-word !important;
    }

    .trace-product-title-row {
        width: 100% !important;
        min-width: 0 !important;
        gap: 6px !important;
    }

    .trace-code-copy-pill {
        max-width: 100% !important;
        min-width: 0 !important;
    }

    .trace-attributes-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 6px !important;
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-attr-item {
        padding: 6px 8px !important;
        min-width: 0 !important;
        gap: 6px !important;
    }

    .trace-attr-icon {
        width: 26px !important;
        height: 26px !important;
    }

    .trace-attr-label {
        font-size: 9px !important;
    }

    .trace-attr-val {
        font-size: 11px !important;
    }

    /* Thanh tiến trình Stepper không được đẩy vỡ khung */
    .trace-stepper-card {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        padding: 10px !important;
    }

    .trace-stepper-header {
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-stepper-markers {
        display: flex !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        justify-content: flex-start !important;
        gap: 5px !important;
        padding-bottom: 4px !important;
        -webkit-overflow-scrolling: touch !important;
    }

    .trace-milestone-tag {
        flex-shrink: 0 !important;
        font-size: 9.5px !important;
        padding: 2px 6px !important;
    }

    .trace-details-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
    }

    .trace-column-journey,
    .trace-column-blockchain {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        gap: 14px !important;
    }

    .trace-card-section {
        padding: 12px !important;
        border-radius: var(--fc-radius-lg) !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .trace-timeline-flow {
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-timeline-node {
        padding-left: 32px !important;
        padding-bottom: 18px !important;
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-node-badge {
        width: 24px !important;
        height: 24px !important;
        font-size: 10px !important;
    }

    .trace-node-connector {
        left: 11px !important;
    }

    .trace-node-card {
        padding: 10px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .trace-node-header {
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-node-title {
        font-size: 12.5px !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
    }

    .trace-node-props-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 5px !important;
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-prop-box {
        padding: 5px 7px !important;
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-prop-value {
        word-break: break-word !important;
        overflow-wrap: break-word !important;
    }

    .trace-harvest-photos-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 6px !important;
        width: 100% !important;
        min-width: 0 !important;
    }

    .trace-route-card {
        flex-direction: column !important;
        gap: 6px !important;
        width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-crypto-badge-card {
        padding: 12px !important;
        border-radius: var(--fc-radius-lg) !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-tx-card {
        padding: 8px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-tx-hash-box {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
    }

    .trace-tx-hash-str {
        word-break: break-all !important;
    }
}

@media (max-width: 400px) {
    .trace-attributes-grid {
        grid-template-columns: minmax(0, 1fr) !important;
    }
}

/* ─────── PRINT STYLES ─────── */
@media print {
    .trace-navbar,
    .trace-search-hero-card,
    .trace-fab-scan-btn,
    .trace-map-link-btn,
    .trace-cert-view-btn,
    .trace-expand-logs-btn,
    .trace-image-zoom-btn,
    .trace-hero-thumb-strip {
        display: none !important;
    }
    .trace-app-root {
        background: #ffffff !important;
        padding: 0 !important;
    }
    .trace-card-section,
    .trace-product-hero-container {
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
    }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;

export default TraceabilityPage;
