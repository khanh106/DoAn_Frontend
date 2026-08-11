import React, { useState } from 'react';
import { X, Truck } from 'lucide-react';
import { shippingAndQrService, type ShipmentInputDto } from '../../../services/shippingAndQrService';

interface Props {
    batchId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateShipmentModal: React.FC<Props> = ({ batchId, onClose, onSuccess }) => {
    const [form, setForm] = useState<ShipmentInputDto>({
        shippingCode: `SHIP-${Date.now().toString().slice(-6)}`,
        carrierInfo: 'Công ty Vận tải Giao hàng Nhanh / ViettelPost',
        pickupLocation: 'Kho Chế Biến Nông Sản Trung Tâm',
        destination: 'Siêu thị Coopmart / WinMart Hà Nội',
        retailerId: '00000000-0000-0000-0000-000000000000', // Đổi Guid điểm bán tùy thực tế
        shippingDate: new Date().toISOString().split('T')[0],
        expectedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        weight: 500,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await shippingAndQrService.shipParentBatch(batchId, form);
            alert('✅ Tạo vận đơn xuất kho vận chuyển thành công!');
            onSuccess();
        } catch (err: any) {
            alert(`❌ Lỗi tạo vận đơn: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <Truck className="w-5 h-5 text-indigo-600" />
                        Tạo Vận Đơn Vận Chuyển
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Mã Vận Đơn</label>
                        <input
                            type="text"
                            value={form.shippingCode}
                            onChange={(e) => setForm({ ...form, shippingCode: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                            required
                        />
                    </div>
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Đơn vị / Nhà vận chuyển</label>
                        <input
                            type="text"
                            value={form.carrierInfo}
                            onChange={(e) => setForm({ ...form, carrierInfo: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Địa điểm xuất hàng</label>
                            <input
                                type="text"
                                value={form.pickupLocation}
                                onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Địa điểm giao đến</label>
                            <input
                                type="text"
                                value={form.destination}
                                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Trọng lượng (kg)</label>
                            <input
                                type="number"
                                value={form.weight}
                                onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Ngày xuất hàng</label>
                            <input
                                type="date"
                                value={form.shippingDate}
                                onChange={(e) => setForm({ ...form, shippingDate: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-xs hover:bg-indigo-700"
                        >
                            {submitting ? 'Đang tạo...' : 'Xác nhận xuất hàng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
