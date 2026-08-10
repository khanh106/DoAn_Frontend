import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, X, CheckCircle, ExternalLink, Calendar, MapPin, User, Package } from 'lucide-react';
import { apiClient } from '../../services/api';

// Interface khớp 100% với PublicTraceResponseDto của Backend API
export interface PublicTraceResponse {
    targetInfo?: {
        id: string;
        type: string;
        code: string;
        productName: string;
        fruitType: string;
        currentStage: string;
        qrCodeUrl?: string;
    };
    farmArea?: {
        name: string;
        province: string;
        gps: string;
        plantingCode?: string;
    };
    cultivationLogs?: Array<{
        date: string;
        activity: string;
        worker: string;
        images?: string[];
    }>;
    inspection?: {
        documentName: string;
        documentNumber: string;
        unit: string;
        inspectionDate: string;
        result: string;
        certificateFileUrl: string;
        note?: string;
    };
    blockchainHistory?: Array<{
        stage: string;
        functionName: string;
        txHash: string;
        blockNumber?: number;
        timestamp: string;
        actorWallet: string;
        status: string;
    }>;
}

export const TraceabilityPage: React.FC = () => {
    const [searchCode, setSearchCode] = useState<string>('LO-CAM-01');
    const [traceData, setTraceData] = useState<PublicTraceResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showCertModal, setShowCertModal] = useState<boolean>(false);

    // Gọi API Public Traceability: GET /api/v1/public/trace/{code}
    const handleTrace = async (code: string) => {
        if (!code.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<PublicTraceResponse>(`/v1/public/trace/${encodeURIComponent(code.trim())}`);
            setTraceData(response.data);
        } catch (err: any) {
            console.error('Lỗi truy xuất nguồn gốc:', err);
            setError(err?.response?.data?.message || `Không tìm thấy thông tin sản phẩm/lô với mã '${code}'.`);
            setTraceData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleTrace(searchCode);
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F5FA] p-6 relative font-sans">
            {/* Header Truy Xuất */}
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none">
                        <path d="M50 10 C25 10 10 30 10 55 C10 80 30 95 55 95 C80 95 95 75 95 50 C95 25 75 10 50 10 Z" fill="#16a34a" />
                        <path d="M50 25 C65 25 80 35 80 50 C80 65 65 80 50 80 Z" fill="#f97316" />
                        <circle cx="35" cy="40" r="4" fill="#ffffff" />
                        <path d="M45 15 Q60 5 75 15 Q60 25 45 15 Z" fill="#15803d" />
                    </svg>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                        Fruit<span className="text-[#f97316]">Chain</span>
                    </span>
                </div>

                <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-wide uppercase text-center">
                    TRUY XUẤT NGUỒN GỐC SẢN PHẨM (BLOCKCHAIN)
                </h1>

                <div className="flex items-center gap-2 bg-[#15803d] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                    <span>XÁC THỰC CÔNG KHAI</span>
                </div>
            </div>

            {/* Thanh Tìm Kiếm Mã Lô / QR Code */}
            <div className="max-w-5xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex gap-3">
                <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Nhập mã lô hoặc mã QR Code truy xuất..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-green-600 transition-all"
                />
                <button
                    onClick={() => handleTrace(searchCode)}
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#15803d] hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                    <Search className="w-4 h-4" />
                    <span>Truy xuất</span>
                </button>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Loading & Result Container */}
            {loading ? (
                <div className="max-w-5xl mx-auto p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 font-medium shadow-xs">
                    Đang truy ngược dữ liệu từ Smart Contract Blockchain & Database...
                </div>
            ) : traceData ? (
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Thông tin chính của Sản Phẩm / Lô */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">
                                {traceData.targetInfo?.currentStage || 'Đã kiểm định'}
                            </span>
                            <h2 className="text-2xl font-extrabold text-slate-900">
                                {traceData.targetInfo?.productName || 'Sản phẩm FruitChain'}
                            </h2>
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 pt-1">
                                <span className="flex items-center gap-1">
                                    <Package className="w-4 h-4 text-slate-400" /> Mã: <strong className="text-slate-900">{traceData.targetInfo?.code}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-slate-400" /> Vùng trồng: <strong className="text-slate-900">{traceData.farmArea?.name || 'Chưa cập nhật'}</strong>
                                </span>
                                {traceData.farmArea?.province && (
                                    <span className="text-slate-500">({traceData.farmArea.province})</span>
                                )}
                            </div>
                        </div>

                        {/* Giấy kiểm định rút gọn */}
                        {traceData.inspection && (
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col justify-between self-start md:min-w-[260px]">
                                <div>
                                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase mb-1">
                                        <ShieldCheck className="w-4 h-4" /> {traceData.inspection.documentName || 'Kiểm Định VietGAP'}
                                    </div>
                                    <p className="text-xs text-emerald-900 font-semibold">
                                        Mã: {traceData.inspection.documentNumber}
                                    </p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">
                                        Kết quả: <strong className="uppercase">{traceData.inspection.result}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCertModal(true)}
                                    className="mt-3 w-full py-1.5 bg-[#15803d] hover:bg-green-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                    Xem chứng nhận
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Khung Chi tiết: Lịch sử Canh tác & Blockchain On-chain */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cột 1: Nhật Ký Canh Tác */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                            <h3 className="font-extrabold text-slate-900 uppercase text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Calendar className="w-4 h-4 text-green-600" /> Nhật Ký Canh Tác Thực Tế
                            </h3>
                            {traceData.cultivationLogs && traceData.cultivationLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {traceData.cultivationLogs.map((log, idx) => (
                                        <div key={idx} className="flex items-start gap-3 text-xs">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{log.activity}</h4>
                                                <p className="text-slate-500 font-medium mt-0.5">
                                                    <User className="w-3 h-3 inline mr-1" /> {log.worker} • {new Date(log.date).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Chưa ghi nhận nhật ký canh tác.</p>
                            )}
                        </div>

                        {/* Cột 2: Lịch sử Giao dịch Blockchain (On-chain) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                            <h3 className="font-extrabold text-slate-900 uppercase text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                                <ShieldCheck className="w-4 h-4 text-orange-500" /> Lịch Sử Giao Dịch Blockchain
                            </h3>
                            {traceData.blockchainHistory && traceData.blockchainHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {traceData.blockchainHistory.map((tx, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-800">{tx.stage}</span>
                                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                                                    {tx.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-mono text-slate-500 truncate" title={tx.txHash}>
                                                Tx: <span className="text-blue-600">{tx.txHash}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(tx.timestamp).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Chưa có giao dịch On-chain.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Modal Chứng Nhận Kiểm Định */}
            {showCertModal && traceData?.inspection && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 border border-slate-100">
                        <button
                            onClick={() => setShowCertModal(false)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-base font-extrabold text-slate-900 tracking-wide border-b border-slate-100 pb-2">
                            GIẤY CHỨNG NHẬN KIỂM ĐỊNH
                        </h3>

                        <div className="space-y-2 text-xs text-slate-700">
                            <p>Tên chứng nhận: <strong>{traceData.inspection.documentName}</strong></p>
                            <p>Mã số chứng nhận: <strong>{traceData.inspection.documentNumber}</strong></p>
                            <p>Đơn vị kiểm định: <strong>{traceData.inspection.unit}</strong></p>
                            <p>Ngày kiểm định: <strong>{new Date(traceData.inspection.inspectionDate).toLocaleDateString('vi-VN')}</strong></p>
                            <p>Kết quả: <strong className="text-green-700 uppercase">{traceData.inspection.result}</strong></p>
                            {traceData.inspection.note && <p>Ghi chú: <em>{traceData.inspection.note}</em></p>}
                        </div>

                        {traceData.inspection.certificateFileUrl && (
                            <a
                                href={traceData.inspection.certificateFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline pt-2"
                            >
                                <ExternalLink className="w-4 h-4" /> Xem file PDF / Ảnh chứng nhận gốc
                            </a>
                        )}

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setShowCertModal(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
