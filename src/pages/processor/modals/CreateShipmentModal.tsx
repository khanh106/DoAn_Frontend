import React, { useState, useEffect } from 'react';
import {
    X,
    Truck,
    RefreshCw,
    AlertCircle,
    Building2,
    QrCode,
    ShieldAlert,
} from 'lucide-react';
import { shippingAndQrService, type ShipmentInputDto, type QRCodeInfoDto } from '../../../services/shippingAndQrService';
import { processorService, type BatchDto, type SearchRetailerResultDto } from '../../../services/processorService';
import { AxiosError } from 'axios';

interface Props {
    batchId: string;
    batches?: BatchDto[];
    onClose: () => void;
    onSuccess: () => void;
    /** Khi lô đang chọn chưa có QR, có thể bấm để chuyển sang bước sinh mã QR trước. */
    onOpenQrModal?: (batchId?: string) => void;
}

const generateShippingCode = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000).toString();
    return `SHIP-${dateStr}-${randStr}`;
};

export const CreateShipmentModal: React.FC<Props> = ({
    batchId,
    batches = [],
    onClose,
    onSuccess,
    onOpenQrModal,
}) => {
    // Lọc danh sách Lô sản xuất đã ở trạng thái PACKAGED (Đã đóng gói - BR-18)
    const packagedBatches = batches.filter((b) => b.currentStage === 'PACKAGED');

    const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
        if (batchId && packagedBatches.some((b) => b.id === batchId)) {
            return batchId;
        }
        return packagedBatches.length > 0 ? packagedBatches[0].id : '';
    });

    // Cập nhật selectedBatchId khi packagedBatches thay đổi
    useEffect(() => {
        if (packagedBatches.length > 0 && (!selectedBatchId || !packagedBatches.some((b) => b.id === selectedBatchId))) {
            setSelectedBatchId(packagedBatches[0].id);
        }
    }, [batches, selectedBatchId]);

    const [retailers, setRetailers] = useState<SearchRetailerResultDto[]>([]);
    const [loadingRetailers, setLoadingRetailers] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [createdShipmentCode, setCreatedShipmentCode] = useState<string>('');

    // === Kiểm tra mã QR của lô đang chọn (theo BR mới: phải tạo QR trước khi tạo đơn vận) ===
    const [hasQrCode, setHasQrCode] = useState<boolean>(false);
    const [checkingQr, setCheckingQr] = useState<boolean>(false);
    const [qrCodesForBatch, setQrCodesForBatch] = useState<
        { targetType: string; targetCode: string }[]
    >([]);

    const checkQrForBatch = async (targetBatchId: string) => {
        if (!targetBatchId) {
            setHasQrCode(false);
            setQrCodesForBatch([]);
            return;
        }
        setCheckingQr(true);
        try {
            // Lấy toàn bộ QR gắn với lô này (gồm cả BATCH/SUBBATCH/BOX/COMMERCIAL).
            const [batchQrs, subBatchQrs, boxQrs, commercialQrs] = await Promise.all([
                shippingAndQrService.getQRCodesByTarget('BATCH', targetBatchId).catch(() => [] as QRCodeInfoDto[]),
                shippingAndQrService.getQRCodesByTarget('SUBBATCH', targetBatchId).catch(() => [] as QRCodeInfoDto[]),
                shippingAndQrService.getQRCodesByTarget('BOX', targetBatchId).catch(() => [] as QRCodeInfoDto[]),
                shippingAndQrService.getQRCodesByTarget('COMMERCIAL', targetBatchId).catch(() => [] as QRCodeInfoDto[]),
            ]);

            const allQrs = [...batchQrs, ...subBatchQrs, ...boxQrs, ...commercialQrs];
            const activeOnes = allQrs.filter(
                (q) => (q.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
            );
            setQrCodesForBatch(
                activeOnes.map((q) => ({ targetType: q.targetType, targetCode: q.targetCode || '' }))
            );
            setHasQrCode(activeOnes.length > 0);
        } catch (err) {
            console.error('Lỗi kiểm tra QR của lô:', err);
            setHasQrCode(false);
            setQrCodesForBatch([]);
        } finally {
            setCheckingQr(false);
        }
    };

    // Kiểm tra QR mỗi khi đổi lô đang chọn
    useEffect(() => {
        void checkQrForBatch(selectedBatchId);
    }, [selectedBatchId]);

    const [form, setForm] = useState<ShipmentInputDto>({
        shippingCode: generateShippingCode(),
        carrierInfo: 'Công ty Vận tải Giao hàng Nhanh / ViettelPost',
        pickupLocation: 'Kho Chế Biến Nông Sản Trung Tâm',
        destination: 'Siêu thị Coopmart / WinMart',
        retailerId: '',
        shippingDate: new Date().toISOString().split('T')[0],
        expectedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        weight: 500,
    });

    // Tải danh sách các Siêu thị / Điểm bán
    useEffect(() => {
        const loadRetailers = async () => {
            setLoadingRetailers(true);
            try {
                const data = await processorService.searchRetailers();
                // Ưu tiên các Siêu thị / Điểm bán đã liên kết với Hợp Tác Xã (isLinked === true), nếu chưa liên kết thì hiển thị tất cả
                const linkedOnly = data.filter((r) => r.isLinked);
                const availableRetailers = linkedOnly.length > 0 ? linkedOnly : data;
                setRetailers(availableRetailers);

                if (availableRetailers.length > 0) {
                    setForm((prev) => ({
                        ...prev,
                        retailerId: availableRetailers[0].retailerId,
                        destination: availableRetailers[0].fullName || prev.destination,
                    }));
                } else {
                    setForm((prev) => ({
                        ...prev,
                        retailerId: '',
                        destination: '',
                    }));
                }
            } catch (err) {
                console.error('Lỗi tải danh sách Siêu thị/Retailer:', err);
            } finally {
                setLoadingRetailers(false);
            }
        };
        void loadRetailers();
    }, []);

    const selectedBatch = packagedBatches.find((b) => b.id === selectedBatchId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!selectedBatchId) {
            setErrorMessage('Vui lòng chọn Lô sản xuất đã đóng gói (PACKAGED) cần xuất kho vận chuyển.');
            return;
        }

        // === Ràng buộc nghiệp vụ mới: HTX phải tạo mã QR cho lô TRƯỚC khi tạo đơn vận ===
        if (!hasQrCode) {
            setErrorMessage(
                'Lô sản xuất này chưa có mã QR truy xuất. Vui lòng bấm "Tạo QR ngay" bên dưới để sinh mã QR trước khi tạo đơn vận.'
            );
            return;
        }

        if (!form.retailerId || form.retailerId === '00000000-0000-0000-0000-000000000000') {
            setErrorMessage('Vui lòng chọn Siêu thị / Điểm bán nhận hàng hợp lệ.');
            return;
        }

        setSubmitting(true);
        try {
            await shippingAndQrService.shipParentBatch(selectedBatchId, form);
            setCreatedShipmentCode(form.shippingCode);
            setIsSuccess(true);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || errorObj.message || 'Không thể tạo vận đơn.';
            setErrorMessage(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl flex flex-col max-h-[90vh] my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <Truck className="w-5 h-5 text-indigo-600" />
                        Tạo Vận Đơn Vận Chuyển
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>⚠️ {errorMessage}</span>
                    </div>
                )}

                {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
                        {/* Phần cuộn nội dung các trường nhập liệu tránh tràn form */}
                        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 py-1">
                            {/* Chọn Lô sản xuất đã hoàn thành đóng gói */}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Lô sản xuất xuất kho (Đã đóng gói - PACKAGED) <span className="text-red-500">*</span>
                                </label>
                                {packagedBatches.length > 0 ? (
                                    <select
                                        value={selectedBatchId}
                                        onChange={(e) => setSelectedBatchId(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                                        required
                                    >
                                        <option value="">-- Chọn Lô sản xuất đã đóng gói --</option>
                                        {packagedBatches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.batchCode} - {b.productName} (Đóng gói: {new Date(b.updatedAt || b.createdAt).toLocaleDateString('vi-VN')})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium space-y-1">
                                        <div className="font-bold flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                            Chưa có Lô sản xuất nào sẵn sàng xuất kho
                                        </div>
                                        <p>Tất cả lô sản xuất hiện tại chưa được chuyển sang trạng thái <strong>Đã đóng gói (PACKAGED)</strong>. Quy tắc hệ thống yêu cầu lô hàng phải đóng gói hoàn tất mới tạo được đơn vận xuất kho.</p>
                                    </div>
                                )}
                                {selectedBatch && (
                                    <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                                        <span>Sản phẩm: <strong className="text-slate-800">{selectedBatch.productName}</strong> ({selectedBatch.batchCode})</span>
                                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            ✓ ĐÃ ĐÓNG GÓI
                                        </span>
                                    </div>
                                )}

                                {/* === Banner kiểm tra mã QR của lô đang chọn === */}
                                {selectedBatch && (
                                    <div className="mt-2">
                                        {checkingQr ? (
                                            <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-[11px] font-medium flex items-center gap-2">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>Đang kiểm tra mã QR của lô...</span>
                                            </div>
                                        ) : hasQrCode ? (
                                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-medium flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-1.5">
                                                    <QrCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>
                                                        Lô đã có mã QR ({qrCodesForBatch.length} mã). Bạn có thể tạo đơn vận.
                                                    </span>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-medium space-y-2">
                                                <div className="flex items-start gap-1.5">
                                                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <div className="font-bold text-rose-900">
                                                            Lô sản xuất này chưa có mã QR truy xuất
                                                        </div>
                                                        <p className="text-rose-700 mt-0.5">
                                                            Theo quy trình, Hợp tác xã phải <strong>sinh mã QR cho lô</strong> trước khi tạo đơn vận chuyển. Vui lòng bấm nút bên dưới.
                                                        </p>
                                                    </div>
                                                </div>
                                                {onOpenQrModal && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenQrModal(selectedBatchId)}
                                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                                    >
                                                        <QrCode className="w-3.5 h-3.5" />
                                                        Tạo QR ngay cho lô này
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mã Vận Đơn */}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Mã Vận Đơn (Shipping Code)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.shippingCode}
                                        onChange={(e) => setForm({ ...form, shippingCode: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, shippingCode: generateShippingCode() })}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Tạo mã vận đơn ngẫu nhiên mới"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                                        <span>Sinh mã</span>
                                    </button>
                                </div>
                            </div>

                            {/* Chọn Siêu thị / Điểm bán */}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Siêu thị / Điểm bán tiếp nhận <span className="text-red-500">*</span>
                                </label>
                                {loadingRetailers ? (
                                    <div className="text-slate-400 py-1 italic">Đang tải danh sách điểm bán...</div>
                                ) : retailers.length === 0 ? (
                                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                                        ⚠️ Chưa có Siêu thị / Retailer nào được xác thực trên hệ thống. Vui lòng thêm điểm bán trong phần Cài đặt Hợp tác xã trước.
                                    </div>
                                ) : (
                                    <select
                                        value={form.retailerId}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const matched = retailers.find((r) => r.retailerId === selectedId);
                                            setForm({
                                                ...form,
                                                retailerId: selectedId,
                                                destination: matched ? matched.fullName : form.destination,
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                        required
                                    >
                                        <option value="">-- Chọn Siêu thị / Điểm bán --</option>
                                        {retailers.map((r) => (
                                            <option key={r.retailerId} value={r.retailerId}>
                                                {r.fullName} {r.phone ? `(SĐT: ${r.phone})` : r.email ? `(${r.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Đơn vị vận chuyển */}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Đơn vị / Nhà vận chuyển</label>
                                <input
                                    type="text"
                                    value={form.carrierInfo}
                                    onChange={(e) => setForm({ ...form, carrierInfo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                                    required
                                />
                            </div>

                            {/* Địa điểm xuất & Giao đến */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Địa điểm xuất hàng</label>
                                    <input
                                        type="text"
                                        value={form.pickupLocation}
                                        onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Địa điểm giao đến</label>
                                    <input
                                        type="text"
                                        value={form.destination}
                                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Trọng lượng & Ngày xuất hàng */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Trọng lượng (kg)</label>
                                    <input
                                        type="number"
                                        value={form.weight}
                                        onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Ngày xuất hàng</label>
                                    <input
                                        type="date"
                                        value={form.shippingDate}
                                        onChange={(e) => setForm({ ...form, shippingDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cố định phần nút hành động ở chân modal */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    packagedBatches.length === 0 ||
                                    checkingQr ||
                                    !hasQrCode
                                }
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <span>Xác nhận xuất hàng</span>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 flex-1">
                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
                            <Truck className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-slate-900 text-lg">
                                Tạo Vận Đơn Thành Công!
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Đơn vận xuất kho đã được ghi nhận trên hệ thống và ghi hash Blockchain.</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-sm space-y-2 text-xs text-left">
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-slate-500">Mã đơn vận:</span>
                                <strong className="font-mono text-indigo-700 font-bold">{createdShipmentCode}</strong>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-slate-500">Nhà vận chuyển:</span>
                                <strong className="text-slate-800 font-semibold">{form.carrierInfo}</strong>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-slate-500">Nơi giao đến:</span>
                                <strong className="text-slate-800 font-semibold">{form.destination}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Trọng lượng:</span>
                                <strong className="text-slate-800 font-bold">{form.weight} kg</strong>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onSuccess();
                            }}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer w-full max-w-xs"
                        >
                            Đóng &amp; Hoàn tất
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
