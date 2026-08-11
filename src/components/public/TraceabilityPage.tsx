// File: src/pages/public/TraceabilityPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
    ShieldCheck,
    Search,
    CheckCircle2,
    QrCode,
    MapPin,
    Calendar,
    User,
    Truck,
    Award,
    Database,
    ExternalLink,
    ChevronRight,
    AlertTriangle,
    PackageCheck
} from 'lucide-react';
import {
    traceabilityService,
    type PublicTraceResponseDto
} from '../../services/traceabilityService';
import { VietGapModal } from '../../components/public/VietGapModal';
import { QrScannerModal } from '../../components/public/QrScannerModal';
import { ProductHeroCard } from '../../components/public/ProductHeroCard';

export const TraceabilityPage: React.FC = () => {
    const { qrCode: urlParamCode } = useParams<{ qrCode?: string }>();

    // Lấy mã từ URL hoặc mã mặc định ban đầu
    const [searchCode, setSearchCode] = useState<string>(urlParamCode || 'SUB-001');
    const [traceData, setTraceData] = useState<PublicTraceResponseDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showVietGapModal, setShowVietGapModal] = useState<boolean>(false);
    const [showQrModal, setShowQrModal] = useState<boolean>(false);

    // Gọi API Backend thật
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
        void handleTrace(searchCode);
    }, [handleTrace, searchCode]);

    return (
        <div className="min-h-screen bg-[#F4F5FA] font-sans antialiased text-slate-800 pb-16">

            {/* 10.1. HEADER CÔNG KHAI */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

                    {/* Logo OM FARM + Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md text-white font-extrabold text-lg">
                            OM
                        </div>
                        <div>
                            <span className="text-xs text-emerald-700 font-extrabold uppercase tracking-wider block">OM FARM</span>
                            <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                                TRUY XUẤT NGUỒN GỐC SẢN PHẨM
                            </h1>
                        </div>
                    </div>

                    {/* Huy hiệu Cố định "ĐÃ XÁC THỰC BLOCKCHAIN" */}
                    <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wide shadow-md">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span className="hidden sm:inline">ĐÃ XÁC THỰC BLOCKCHAIN</span>
                        <span className="sm:hidden">VERIFIED</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

                {/* KHU VỰC TÌM KIẾM MÃ QR / BATCH CODE */}
                <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-2">
                    <input
                        type="text"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && void handleTrace(searchCode)}
                        placeholder="Nhập mã SubBatch / Batch / QR Code..."
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    />
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span className="hidden md:inline">Quét QR</span>
                    </button>
                    <button
                        onClick={() => handleTrace(searchCode)}
                        disabled={loading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                    >
                        <Search className="w-4 h-4" />
                        <span>Tra cứu</span>
                    </button>
                </div>

                {/* THÔNG BÁO LỖI THẬT TỪ BACKEND */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ĐANG TẢI DỮ LIỆU */}
                {loading ? (
                    <div className="bg-white p-12 text-center text-slate-500 rounded-3xl border border-slate-200 font-medium">
                        Đang tải dữ liệu thực tế từ Smart Contract Blockchain & Database...
                    </div>
                ) : traceData ? (
                    <>
                        {/* 10.2. HERO CARD SẢN PHẨM */}
                        <ProductHeroCard
                            targetInfo={traceData.targetInfo}
                            packaging={traceData.packaging}
                            parentBatch={traceData.parentBatch}
                        />

                        {/* 10.3. DÒNG THỜI GIAN 6 BƯỚC STEPPER DỌC */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
                            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-2">
                                <ChevronRight className="w-5 h-5 text-emerald-600" />
                                HÀNH TRÌNH CHUỖI CUNG ỨNG (6 BƯỚC REAL-TIME)
                            </h3>

                            <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500 space-y-8 ml-2">

                                {/* 1. VÙNG TRỒNG (REAL DATA) */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        1
                                    </span>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <h4 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-600" /> Vùng Trồng
                                        </h4>
                                        {traceData.farmArea ? (
                                            <div className="mt-1 space-y-0.5 text-xs">
                                                <p className="font-bold text-slate-800">{traceData.farmArea.name}</p>
                                                <p className="text-slate-600">
                                                    Mã vùng: <strong className="text-slate-900">{traceData.farmArea.plantingCode || 'N/A'}</strong> | GPS: <strong className="text-slate-900">{traceData.farmArea.gps}</strong>
                                                </p>
                                                <p className="text-[11px] text-slate-500">Tỉnh/Thành: {traceData.farmArea.province}</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic mt-1">Chưa cập nhật thông tin vùng trồng.</p>
                                        )}
                                    </div>
                                </div>

                                {/* 2. NHẬT KÝ CANH TÁC (REAL DATA) */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        2
                                    </span>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-600" /> Nhật Ký Canh Tác ({traceData.cultivationLogs.length} hoạt động)
                                        </h4>
                                        {traceData.cultivationLogs.length > 0 ? (
                                            traceData.cultivationLogs.map((log, index) => (
                                                <div key={index} className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                                                    <p className="font-bold text-slate-800">{log.activity}</p>
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                                                        <span><User className="w-3 h-3 inline mr-0.5 text-slate-400" />{log.worker}</span>
                                                        <span>• {new Date(log.date).toLocaleDateString('vi-VN')}</span>
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Chưa ghi nhận nhật ký canh tác.</p>
                                        )}
                                    </div>
                                </div>

                                {/* 3. THU HOẠCH (REAL DATA) */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        3
                                    </span>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <h4 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Thu Hoạch
                                        </h4>
                                        {traceData.harvest ? (
                                            <div className="mt-1 text-xs text-slate-700 space-y-0.5">
                                                <p>
                                                    Ngày thu hoạch: <strong>{new Date(traceData.harvest.harvestDate).toLocaleDateString('vi-VN')}</strong> | Sản lượng: <strong>{traceData.harvest.quantity} {traceData.harvest.unit}</strong>
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    Đại diện xác nhận: <strong className="text-slate-800">{traceData.harvest.representativeWorker}</strong>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic mt-1">Chưa cập nhật thông tin thu hoạch.</p>
                                        )}
                                    </div>
                                </div>

                                {/* 4. KIỂM ĐỊNH & ĐÓNG GÓI (REAL DATA - ACTIVE STEP) */}
                                <div className="relative">
                                    <span className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm ring-4 ring-emerald-100 shadow-lg">
                                        4
                                    </span>
                                    <div className="bg-emerald-50/80 p-5 rounded-2xl border-2 border-emerald-600/40 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <h4 className="font-black text-emerald-900 text-base uppercase flex items-center gap-2">
                                                <Award className="w-5 h-5 text-emerald-600" /> Kiểm Định & Đóng Gói VietGAP
                                            </h4>
                                            <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider">
                                                Đang Active
                                            </span>
                                        </div>

                                        {traceData.inspection ? (
                                            <div className="text-xs text-emerald-950 space-y-1">
                                                <p>Giấy chứng nhận: <strong>{traceData.inspection.documentName}</strong> ({traceData.inspection.documentNumber})</p>
                                                <p>Đơn vị: <strong>{traceData.inspection.unit}</strong></p>
                                                <p>Kết quả: <strong className="text-emerald-700 uppercase">{traceData.inspection.result}</strong></p>

                                                <button
                                                    onClick={() => setShowVietGapModal(true)}
                                                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                                                >
                                                    <span>Xem chi tiết Giấy chứng nhận VietGAP</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-emerald-800 italic">Chưa ghi nhận dữ liệu kiểm định chất lượng.</p>
                                        )}
                                    </div>
                                </div>

                                {/* 5. VẬN CHUYỂN (REAL DATA) */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        5
                                    </span>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <h4 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-emerald-600" /> Vận Chuyển
                                        </h4>
                                        {traceData.shipment ? (
                                            <div className="mt-1 text-xs text-slate-700 space-y-0.5">
                                                <p>Đơn vị vận chuyển: <strong>{traceData.shipment.carrier}</strong> (Mã: {traceData.shipment.shippingCode})</p>
                                                <p>Đơn vị bán lẻ: <strong>{traceData.shipment.retailerName}</strong></p>
                                                <p className="text-[11px] text-slate-500">
                                                    Điểm đi: {traceData.shipment.pickupLocation} ➔ Đến: {traceData.shipment.destination}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic mt-1">Chưa cập nhật thông tin vận chuyển.</p>
                                        )}
                                    </div>
                                </div>

                                {/* 6. BLOCKCHAIN ON-CHAIN HISTORY (REAL DATA) */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        6
                                    </span>
                                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-md">
                                        <h4 className="font-extrabold text-emerald-400 text-sm uppercase flex items-center gap-2">
                                            <Database className="w-4 h-4 text-emerald-400" /> Lịch sử Giao dịch On-chain ({traceData.blockchainHistory.length} giao dịch)
                                        </h4>
                                        {traceData.blockchainHistory.length > 0 ? (
                                            traceData.blockchainHistory.map((tx, idx) => (
                                                <div key={idx} className="bg-slate-800/90 p-3 rounded-xl text-xs space-y-1 font-mono border border-slate-700">
                                                    <div className="flex justify-between text-slate-300 font-bold">
                                                        <span>{tx.stage} ({tx.functionName})</span>
                                                        <span className="text-emerald-400 text-[10px]">{tx.status}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        TxHash: <span className="text-blue-400">{tx.txHash}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        Block #{tx.blockNumber || 'N/A'} • {new Date(tx.timestamp).toLocaleString('vi-VN')} • Wallet: {tx.actorWallet}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic font-mono">Chưa có giao dịch ghi nhận trên Smart Contract.</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </>
                ) : null}
            </main>

            {/* MODAL CHI TIẾT KIỂM ĐỊNH VIETGAP */}
            {traceData?.inspection && (
                <VietGapModal
                    isOpen={showVietGapModal}
                    onClose={() => setShowVietGapModal(false)}
                    inspection={traceData.inspection}
                />
            )}

            {/* MODAL SCANNER QR */}
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
