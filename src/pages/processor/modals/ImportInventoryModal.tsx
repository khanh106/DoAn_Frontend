
import React, { useState } from 'react';
import { X, ArrowDownRight, PackageCheck } from 'lucide-react';
import type { MaterialItemDto } from '../../../services/processorService';

interface ImportInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: MaterialItemDto[];
    onSubmit: (materialItemId: string, quantity: number, note: string) => Promise<void>;
}

export const ImportInventoryModal: React.FC<ImportInventoryModalProps> = ({
    isOpen,
    onClose,
    items,
    onSubmit,
}) => {
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [note, setNote] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || quantity <= 0) {
            alert('Vui lòng chọn vật tư / sản phẩm từ Backend và nhập số lượng hợp lệ!');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(selectedItemId, quantity, note);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-lg">
                        <PackageCheck className="w-6 h-6 text-emerald-600" />
                        <span>Nhập Kho Vật Tư / Sản Phẩm (Backend API)</span>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Chọn Vật tư / Sản phẩm nhập kho <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="">-- Chọn vật tư từ Backend Database --</option>
                            {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                    [{item.code}] {item.name} ({item.unit}) - Tồn hiện tại: {item.quantityInStock || 0}
                                </option>
                            ))}
                        </select>
                        {items.length === 0 && (
                            <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                                ⚠️ Chưa có vật tư nào trong Database Backend. Vui lòng tạo vật tư mới trước.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Số lượng nhập <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity || ''}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                placeholder="Nhập số lượng..."
                                required
                                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Giao dịch Backend
                            </label>
                            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                <ArrowDownRight className="w-4 h-4" />
                                <span>IMPORT (Ghi Log DB)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Ghi chú nhập kho / Chứng từ
                        </label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ghi chú nhập kho lưu vào Database..."
                            className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading || items.length === 0}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Đang gửi Backend...' : 'Xác Nhận Nhập Kho'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
