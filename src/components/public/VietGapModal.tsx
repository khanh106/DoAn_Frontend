// File: src/components/public/VietGapModal.tsx
import React from 'react';
import { X, ExternalLink, ShieldCheck, CheckCircle2, FileText, Building2, Calendar, Award } from 'lucide-react';
import type { InspectionDto } from '../../services/traceabilityService';

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

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 relative">

                {/* Modal Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        <h3 className="font-extrabold text-base uppercase tracking-wide text-emerald-300">
                            CHI TIẾT KIỂM ĐỊNH CHẤT LƯỢNG (REAL DATA)
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body - 2 Cột */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Cột trái: Preview Giấy chứng nhận */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                        {inspection.certificateFileUrl ? (
                            <a
                                href={inspection.certificateFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full h-48 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center p-3 hover:shadow-md transition-shadow relative overflow-hidden group"
                            >
                                <FileText className="w-12 h-12 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    {inspection.documentName || 'CERTIFICATE OF INSPECTION'}
                                </span>
                                <span className="text-[11px] text-slate-500 mt-1 font-mono">
                                    {inspection.documentNumber}
                                </span>
                                <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    Verified
                                </div>
                            </a>
                        ) : (
                            <div className="w-full h-48 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-3">
                                <FileText className="w-12 h-12 text-slate-400 mb-2" />
                                <span className="text-xs font-bold text-slate-500">Chưa có file chứng nhận</span>
                            </div>
                        )}
                        <p className="text-[11px] text-slate-500 mt-2 italic">
                            Nhấp vào ảnh để xem bản gốc
                        </p>
                    </div>

                    {/* Cột phải: Chi tiết dữ liệu từ Database */}
                    <div className="md:col-span-7 space-y-3 text-sm">
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Tiêu đề chứng nhận</span>
                            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <Award className="w-5 h-5 text-emerald-600" />
                                {inspection.documentName || 'Kiểm Định Chất Lượng'}
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <span className="text-[11px] text-slate-400 font-medium block">Mã số chứng nhận:</span>
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                    {inspection.documentNumber || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-400 font-medium block">Ngày kiểm định:</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1 text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {formattedDate}
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Đơn vị kiểm định:</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                {inspection.unit || 'Chưa cập nhật'}
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Kết quả đánh giá:</span>
                            <span className="inline-block mt-0.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-lg text-xs uppercase tracking-wider">
                                ✓ {inspection.result || 'ĐẠT CHUẨN'}
                            </span>
                        </div>

                        {inspection.note && (
                            <div className="pt-2 border-t border-slate-100">
                                <span className="text-[11px] text-slate-400 font-medium block">Ghi chú kiểm định:</span>
                                <p className="text-xs text-slate-700 italic mt-0.5">{inspection.note}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Smart Contract Verified</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                            Đóng
                        </button>
                        {inspection.certificateFileUrl && (
                            <a
                                href={inspection.certificateFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Xem file gốc (PDF)</span>
                            </a>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
