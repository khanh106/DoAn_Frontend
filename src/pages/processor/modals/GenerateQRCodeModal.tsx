import React, { useState } from 'react';
import { X, QrCode, Download } from 'lucide-react';
import {
    shippingAndQrService,
    type QRTargetType,
    type GenerateQRCodeResponseDto
} from '../../../services/shippingAndQrService';

interface Props {
    batchId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const GenerateQRCodeModal: React.FC<Props> = ({ batchId, onClose, onSuccess }) => {
    const [targetType, setTargetType] = useState<QRTargetType>('COMMERCIAL');
    const [submitting, setSubmitting] = useState(false);
    const [qrResult, setQrResult] = useState<GenerateQRCodeResponseDto | null>(null);

    const handleGenerate = async () => {
        setSubmitting(true);
        try {
            const res = await shippingAndQrService.generateQRCode({
                targetType,
                targetId: batchId,
            });
            setQrResult(res);
        } catch (err: any) {
            alert(`❌ Lỗi sinh mã QR: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        Sinh Mã QR Truy Xuất Nguồn Gốc
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!qrResult ? (
                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Loại QR phát hành:</label>
                            <select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value as QRTargetType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                            >
                                <option value="COMMERCIAL">COMMERCIAL (Mã thương mại sản phẩm)</option>
                                <option value="BOX">BOX (Mã đóng thùng)</option>
                                <option value="SUBBATCH">SUBBATCH (Mã lô con)</option>
                                <option value="BATCH">BATCH (Mã toàn bộ lô gốc)</option>
                            </select>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                            💡 <b>Lưu ý (BR-14):</b> QR Thương mại (COMMERCIAL) chỉ phát hành khi lô đã hoàn tất kiểm định và đóng gói (PACKAGED).
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">
                                Hủy
                            </button>
                            <button
                                onClick={() => void handleGenerate()}
                                disabled={submitting}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                            >
                                {submitting ? 'Đang tạo QR...' : 'Tạo mã QR ngay'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                            <img
                                src={`data:${qrResult.imageContentType};base64,${qrResult.imageBase64}`}
                                alt="QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>
                        <div className="text-xs space-y-1">
                            <div className="font-bold text-slate-900">Mã Lô: {qrResult.targetCode}</div>
                            <div className="font-mono text-slate-500 text-[11px] truncate">{qrResult.qrValue}</div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <a
                                href={`data:${qrResult.imageContentType};base64,${qrResult.imageBase64}`}
                                download={`QR-${qrResult.targetCode}.png`}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5"
                            >
                                <Download className="w-4 h-4" />
                                Tải mã QR về máy
                            </a>
                            <button
                                onClick={() => {
                                    onSuccess();
                                }}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
