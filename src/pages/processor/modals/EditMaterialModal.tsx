
import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
import type { MaterialItemDto } from '../../../services/processorService';

interface EditMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MaterialItemDto | null;
    onSubmit: (id: string, data: Partial<MaterialItemDto>) => Promise<void>;
}

export const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
    isOpen,
    onClose,
    item,
    onSubmit,
}) => {
    const [name, setName] = useState<string>('');
    const [unit, setUnit] = useState<string>('');
    const [price, setPrice] = useState<number | ''>('');
    const [dosagePerHa, setDosagePerHa] = useState<number | ''>('');
    const [concentration, setConcentration] = useState<number | ''>('');
    const [supplier, setSupplier] = useState<string>('');

    const [npkRatio, setNpkRatio] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (item) {
            setName(item.name || '');
            setUnit(item.unit || '');
            setPrice(item.price ?? '');
            setDosagePerHa(item.dosagePerHa ?? '');
            setConcentration(item.concentration ?? '');
            setSupplier(item.supplier || '');
            setNpkRatio(item.npkRatio || '');
            setNote(item.note || '');
        }
    }, [item]);



    if (!isOpen || !item) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(item.id, {
                name: name.trim(),
                unit: unit.trim(),
                price: price === '' ? 0 : Number(price),
                dosagePerHa: dosagePerHa === '' ? undefined : Number(dosagePerHa),
                concentration: concentration === '' ? undefined : Number(concentration),
                supplier: supplier.trim() || undefined,
                npkRatio: npkRatio.trim() || undefined,
                note: note.trim() || undefined,
            });

            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-800">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold">Cập Nhật Thông Tin: {item.code}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Mã sản phẩm / vật tư</label>
                            <input
                                type="text"
                                value={item.code}
                                disabled
                                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-bold cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị (*)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính (*)</label>
                            <input
                                type="text"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nhà cung cấp</label>
                        <input
                            type="text"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {item.itemType === 'FERTILIZER' && (
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Tỷ lệ NPK</label>
                            <input
                                type="text"
                                value={npkRatio}
                                onChange={(e) => setNpkRatio(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {(item.itemType === 'PESTICIDE' || item.itemType === 'FERTILIZER') && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Liều lượng / ha</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={dosagePerHa}
                                    onChange={(e) => setDosagePerHa(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Nồng độ / Hàm lượng (%)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={concentration}
                                    onChange={(e) => setConcentration(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>
                    )}

                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
                        >
                            {submitting ? 'Đang lưu...' : 'Cập Nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
