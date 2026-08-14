
import React, { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
import type { MaterialItemDto } from '../../../services/processorService';
import { toast } from '../../../utils/toast';

interface CreateMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<MaterialItemDto>) => Promise<void>;
}

export const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [itemType, setItemType] = useState<string>('PESTICIDE');
    const [code, setCode] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [unit, setUnit] = useState<string>('kg');
    const [price, setPrice] = useState<number | ''>('');
    const [dosagePerHa, setDosagePerHa] = useState<number | ''>('');
    const [concentration, setConcentration] = useState<number | ''>('');
    const [supplier, setSupplier] = useState<string>('');
    const [npkRatio, setNpkRatio] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
            toast.warning('Vui lòng nhập đầy đủ Mã và Tên!');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                itemType,
                code: code.trim().toUpperCase(),
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
                        <PackagePlus className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-bold">Thêm Mới Vật Tư / Sản Phẩm Vào Kho</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Loại danh mục (*)</label>
                            <select
                                value={itemType}
                                onChange={(e) => setItemType(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
                            >
                                <option value="PESTICIDE">Nông dược</option>
                                <option value="FERTILIZER">Phân bón</option>
                                <option value="MATERIAL">Nguyên vật liệu</option>
                                <option value="EQUIPMENT">Thiết bị</option>
                            </select>

                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính (*)</label>
                            <input
                                type="text"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="kg, chai, bao, cái..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Mã định danh (*)</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="VD: SP-001, VT-NPK"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 uppercase font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị (*)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Tên sản phẩm/vật tư..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="0"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Nhà cung cấp</label>
                            <input
                                type="text"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                placeholder="Tên đơn vị cung cấp..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {itemType === 'FERTILIZER' && (
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Tỷ lệ NPK (Nếu có)</label>
                            <input
                                type="text"
                                value={npkRatio}
                                onChange={(e) => setNpkRatio(e.target.value)}
                                placeholder="VD: 16-16-8"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    )}

                    {(itemType === 'PESTICIDE' || itemType === 'FERTILIZER') && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Liều lượng / ha</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={dosagePerHa}
                                    onChange={(e) => setDosagePerHa(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Liều lượng khuyến cáo"
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Nồng độ / Hàm lượng (%)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={concentration}
                                    onChange={(e) => setConcentration(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="VD: 12.5, 20..."
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
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
                            placeholder="Mô tả bổ sung..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
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
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
                        >
                            {submitting ? 'Đang lưu...' : 'Tạo Mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
