import React, { useState } from 'react';
import {
    X,
    QrCode,
    Download,
    Copy,
    ExternalLink,
    Check,
    CheckCircle2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { type QRCodeInfoDto } from '../../../services/shippingAndQrService';
import { type BatchDto } from '../../../services/processorService';
import { toast } from '../../../utils/toast';

interface Props {
    qr: QRCodeInfoDto;
    batch?: BatchDto;
    onClose: () => void;
}

export const QRCodeDetailModal: React.FC<Props> = ({ qr, batch, onClose }) => {
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = () => {
        void navigator.clipboard.writeText(qr.qrValue);
        setCopied(true);
        toast.success('📋 Đã sao chép liên kết mã QR vào bộ nhớ tạm!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const canvas = document.getElementById('qr-detail-canvas') as HTMLCanvasElement | null;
        if (!canvas) {
            toast.error('Không tìm thấy hình ảnh mã QR.');
            return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const targetCode = batch?.batchCode || qr.targetId.substring(0, 8);
        downloadLink.href = dataUrl;
        downloadLink.download = `QR-${qr.targetType}-${targetCode}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('📥 Đã tải ảnh mã QR PNG về máy!');
    };

    const getTargetTypeBadge = (type: string) => {
        switch (type.toUpperCase()) {
            case 'COMMERCIAL':
                return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-200">COMMERCIAL (Tem thương mại)</span>;
            case 'BOX':
                return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs border border-amber-200">BOX (Đóng thùng)</span>;
            case 'SUBBATCH':
                return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs border border-blue-200">SUBBATCH (Lô con)</span>;
            case 'BATCH':
            default:
                return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-lg text-xs border border-purple-200">BATCH (Toàn bộ lô gốc)</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] my-auto border border-slate-100">
                {/* Header cố định */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                                Chi Tiết Mã QR Truy Xuất Nguồn Gốc
                            </h3>
                            <p className="text-[11px] text-slate-500">Mã QR truy xuất nguồn gốc nông sản</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Nội dung cuộn linh hoạt với bố cục 2 cột gọn gàng */}
                <div className="flex-1 overflow-y-auto py-3 pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        {/* Cột trái: QR Canvas & Các nút tải/sao chép */}
                        <div className="sm:col-span-5 flex flex-col items-center justify-center p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 text-center">
                            <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200 inline-block">
                                <QRCodeCanvas
                                    id="qr-detail-canvas"
                                    value={qr.qrValue}
                                    size={150}
                                    level="H"
                                    marginSize={2}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {getTargetTypeBadge(qr.targetType)}
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 font-semibold rounded-lg text-[11px] border border-green-200 inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    {qr.status || 'ACTIVE'}
                                </span>
                            </div>

                            {/* Các nút bấm thao tác */}
                            <div className="flex flex-col w-full gap-1.5 pt-1">
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Tải ảnh PNG</span>
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="w-full py-1.5 px-3 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? 'Đã sao chép' : 'Sao chép liên kết'}</span>
                                </button>
                                <a
                                    href={qr.qrValue}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Mở trang quét QR</span>
                                </a>
                            </div>
                        </div>

                        {/* Cột phải: Bảng thông tin chi tiết */}
                        <div className="sm:col-span-7 space-y-3">
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Mã lô sản xuất:</span>
                                    <span className="font-bold text-slate-900 font-mono">
                                        {batch ? batch.batchCode : qr.targetId}
                                    </span>
                                </div>

                                {batch && (
                                    <>
                                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                                            <span className="text-slate-500 font-medium">Tên nông sản:</span>
                                            <span className="font-semibold text-slate-800">
                                                {batch.productName} ({batch.fruitTypeName})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                                            <span className="text-slate-500 font-medium">Vùng trồng:</span>
                                            <span className="font-semibold text-slate-800">
                                                {batch.farmAreaName || 'Chưa đặt'}
                                            </span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                                    <span className="text-slate-500 font-medium">Ngày phát hành:</span>
                                    <span className="font-medium text-slate-700">
                                        {new Date(qr.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-500 font-medium block mb-1">URL quét mã truy xuất:</span>
                                    <div className="p-2 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 break-all select-all max-h-20 overflow-y-auto">
                                        {qr.qrValue}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer cố định */}
                <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
