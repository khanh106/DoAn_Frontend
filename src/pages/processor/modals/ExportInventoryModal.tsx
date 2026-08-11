
import React, { useState } from 'react';
import { X, ArrowUpRight, Truck } from 'lucide-react';
import type { MaterialItemDto } from '../../../services/processorService';

interface ExportInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: MaterialItemDto[];
    onSubmit: (materialItemId: string, quantity: number, note: string) => Promise<void>;
}

export const ExportInventoryModal: React.FC<ExportInventoryModalProps> = ({
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

    const selectedItem = items.find((i) => i.id === selectedItemId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || quantity <= 0) {
            alert('Vui lòng chọn vật tư từ Backend và nhập số lượng xuất hợp lệ!');
            return;
        }

        if (selectedItem && quantity > (selectedItem.quantityInStock || 0)) {
            alert(`Số lượng xuất (${quantity}) vượt quá tồn kho thực tế (${selectedItem.quantityInStock || 0})!`);
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
                    <div className="flex items-center gap-2 text-amber-700 font-extrabold text-lg">
                        <Truck className="w-6 h-6 text-amber-600" />
                        <span>Xuất Kho Phục Vụ Sản Xuất (Backend API)</span>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Vật tư / Sản phẩm cần xuất <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            <option value="">-- Chọn vật tư cần xuất kho --</option>
                            {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                    [{item.code}] {item.name} ({item.unit}) - Tồn kho: {item.quantityInStock || 0}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Số lượng xuất <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity || ''}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                placeholder="Nhập số lượng..."
                                required
                                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Giao dịch Backend
                            </label>
                            <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                <ArrowUpRight className="w-4 h-4" />
                                <span>EXPORT (Ghi Log DB)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Mã lô sản xuất / Lý do xuất kho
                        </label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nhập mã lô sản xuất hoặc lý do xuất..."
                            className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
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
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Đang gửi Backend...' : 'Xác Nhận Xuất Kho'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExportInventoryModal;
