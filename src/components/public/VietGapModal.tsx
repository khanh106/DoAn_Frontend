// File: src/components/public/VietGapModal.tsx
import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { InspectionDto } from '../../services/traceabilityService';
import { resolveIpfsUrl } from '../../services/ipfsService';

interface VietGapModalProps {
    isOpen: boolean;
    onClose: () => void;
    inspection: InspectionDto;
}

export const VietGapModal: React.FC<VietGapModalProps> = ({ isOpen, onClose, inspection }) => {
    if (!isOpen) return null;

    const formattedDate = inspection.inspectionDate
        ? new Date(inspection.inspectionDate).toLocaleDateString('vi-VN')
        : 'N/A';

    // Trích xuất mã hash IPFS thực tế từ Certificate File URL (FileURI)
    const getIpfsHash = (url: string) => {
        if (!url) return 'N/A';
        if (url.startsWith('ipfs://')) {
            return url.replace('ipfs://', '');
        }
        if (url.includes('/api/v1/ipfs/')) {
            const parts = url.split('/api/v1/ipfs/');
            return parts[parts.length - 1];
        }
        return url;
    };

    const rawHash = getIpfsHash(inspection.certificateFileUrl);
    const formattedHash = rawHash !== 'N/A' && rawHash.length > 12
        ? `${rawHash.slice(0, 8)}...${rawHash.slice(-8)}`
        : rawHash;

    const resolvedCertUrl = inspection.certificateFileUrl
        ? resolveIpfsUrl(inspection.certificateFileUrl)
        : '';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 relative">

                {/* Modal Header */}
                <div className="bg-white text-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-800">
                        CHI TIẾT KIỂM ĐỊNH CHẤT LƯỢNG
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body - 2 Cột */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Cột trái: Preview Giấy chứng nhận */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-3 relative">
                        <img 
                            src={resolvedCertUrl || "/vietgap_certificate.png"} 
                            alt="Giấy chứng nhận VietGAP" 
                            className="w-full object-contain rounded-lg border border-slate-200 shadow-sm"
                            onError={(e) => {
                                // Fallback nếu ảnh lỗi (ví dụ file là PDF không render được bằng thẻ img)
                                e.currentTarget.src = "/vietgap_certificate.png";
                            }}
                        />
                    </div>

                    {/* Cột phải: Chi tiết dữ liệu từ Database */}
                    <div className="md:col-span-7 space-y-4 text-sm text-slate-700">
                        <h4 className="text-lg font-extrabold text-slate-800">
                            Kiểm Định Chất Lượng VietGAP
                        </h4>

                        <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400 font-medium text-xs">Mã giấy chứng nhận:</span>
                                <span className="font-mono font-bold text-slate-800 text-sm">
                                    {inspection.documentNumber || 'N/A'}
                                </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400 font-medium text-xs">Đơn vị kiểm định:</span>
                                <span className="font-bold text-slate-800 text-sm sm:text-right">
                                    {inspection.unit || 'N/A'}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400 font-medium text-xs">Ngày kiểm định:</span>
                                <span className="font-semibold text-slate-800 text-sm">
                                    {formattedDate}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400 font-medium text-xs">Kết quả:</span>
                                <span className="font-extrabold text-emerald-600 text-sm uppercase">
                                    {inspection.result.toLowerCase() === 'đạt' || inspection.result.toLowerCase() === 'passed' ? 'ĐẠT TIÊU CHUẨN AN TOÀN' : inspection.result}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400 font-medium text-xs">IPFS Metadata Hash:</span>
                                <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded" title={rawHash}>
                                    {formattedHash}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs pt-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Smart Contract Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    {resolvedCertUrl && (
                        <a
                            href={resolvedCertUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all text-decoration-none"
                        >
                            <span>Xem giấy chứng nhận (PDF)</span>
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl cursor-pointer transition-colors"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
};
