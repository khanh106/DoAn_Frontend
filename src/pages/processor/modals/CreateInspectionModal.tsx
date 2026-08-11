import React, { useState } from 'react';
import { X, ShieldCheck, Upload } from 'lucide-react';
import { shippingAndQrService } from '../../../services/shippingAndQrService';

interface Props {
    batchId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateInspectionModal: React.FC<Props> = ({ batchId, onClose, onSuccess }) => {
    const [documentName, setDocumentName] = useState('Biên bản Kiểm định Chất lượng VSATTP');
    const [documentNumber, setDocumentNumber] = useState(`KD-${Date.now().toString().slice(-5)}`);
    const [inspectionUnit, setInspectionUnit] = useState('Trung tâm Kiểm định Chất lượng Nông sản Việt Nam');
    const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
    const [result, setResult] = useState<'PASSED' | 'FAILED'>('PASSED');
    const [note, setNote] = useState('Lô sản phẩm đạt chuẩn chất lượng xuất khẩu.');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert('⚠️ Vui lòng đính kèm tệp văn bản/chứng nhận kiểm định (PDF hoặc PNG/JPG).');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('DocumentName', documentName);
            formData.append('DocumentNumber', documentNumber);
            formData.append('InspectionUnit', inspectionUnit);
            formData.append('InspectionDate', inspectionDate);
            formData.append('Result', result);
            if (note) formData.append('Note', note);
            formData.append('CertificateFile', file);

            await shippingAndQrService.inspectParentBatch(batchId, formData);
            alert('✅ Đã lưu biên bản kiểm định thành công!');
            onSuccess();
        } catch (err: any) {
            alert(`❌ Lỗi kiểm định: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-600" />
                        Tạo Hồ Sơ Kiểm Định Chất Lượng
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Tên Tài Liệu / Biên Bản</label>
                        <input
                            type="text"
                            value={documentName}
                            onChange={(e) => setDocumentName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Số Hiệu Văn Bản</label>
                            <input
                                type="text"
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Ngày Kiểm Định</label>
                            <input
                                type="date"
                                value={inspectionDate}
                                onChange={(e) => setInspectionDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Đơn Vị Kiểm Định</label>
                        <input
                            type="text"
                            value={inspectionUnit}
                            onChange={(e) => setInspectionUnit(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Kết Quả Kiểm Định</label>
                        <select
                            value={result}
                            onChange={(e) => setResult(e.target.value as 'PASSED' | 'FAILED')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                        >
                            <option value="PASSED">✅ PASSED (ĐẠT CHUẨN)</option>
                            <option value="FAILED">❌ FAILED (KHÔNG ĐẠT)</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">File Chứng Nhận (PDF / Image)</label>
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full text-slate-500"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
                        >
                            {submitting ? 'Đang lưu...' : 'Lưu Biên Bản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
