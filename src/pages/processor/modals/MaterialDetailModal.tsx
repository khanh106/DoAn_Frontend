
import React from 'react';
import { X, Info, Tag, Box, DollarSign, Building2, FileText, Activity } from 'lucide-react';
import type { MaterialItemDto } from '../../../services/processorService';

interface MaterialDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MaterialItemDto | null;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
    isOpen,
    onClose,
    item,
}) => {
    if (!isOpen || !item) return null;

    const getItemTypeName = (type: string) => {
        switch (type) {
            case 'PRODUCT': return 'Sản phẩm';
            case 'PESTICIDE': return 'Nông dược';
            case 'FERTILIZER': return 'Phân bón';
            case 'MATERIAL': return 'Nguyên vật liệu';
            case 'EQUIPMENT': return 'Thiết bị';
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-800">
                        <Info className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-bold">Chi Tiết Thông Tin Kho</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                {getItemTypeName(item.itemType)}
                            </span>
                            <h4 className="text-lg font-extrabold text-slate-900 mt-2">{item.name}</h4>
                            <p className="text-xs font-mono font-bold text-slate-500">Mã: {item.code}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400 font-medium">Tồn kho hiện tại</span>
                            <div className="text-2xl font-black text-emerald-600">
                                {item.quantityInStock ?? 0} <span className="text-xs font-normal text-slate-500 uppercase">{item.unit}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <div className="text-slate-400 text-xs">Đơn giá</div>
                            <div className="font-bold text-slate-800">
                                {item.price ? `${item.price.toLocaleString('vi-VN')} VNĐ` : 'Chưa cập nhật'}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <div>
                            <div className="text-slate-400 text-xs">Nhà cung cấp</div>
                            <div className="font-bold text-slate-800 truncate max-w-[140px]">
                                {item.supplier || 'Không có'}
                            </div>
                        </div>
                    </div>

                    {item.npkRatio && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                            <Tag className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                                <div className="text-slate-400 text-xs">Tỷ lệ NPK</div>
                                <div className="font-bold text-slate-800">{item.npkRatio}</div>
                            </div>
                        </div>
                    )}

                    {item.dosagePerHa !== undefined && item.dosagePerHa !== null && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                            <Activity className="w-5 h-5 text-purple-500 shrink-0" />
                            <div>
                                <div className="text-slate-400 text-xs">Liều lượng / Ha</div>
                                <div className="font-bold text-slate-800">{item.dosagePerHa}</div>
                            </div>
                        </div>
                    )}

                    {item.concentration && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                            <Box className="w-5 h-5 text-cyan-500 shrink-0" />
                            <div>
                                <div className="text-slate-400 text-xs">Nồng độ / Hàm lượng</div>
                                <div className="font-bold text-slate-800">{item.concentration}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Ghi chú / Mô tả:</span>
                    </div>
                    <p className="text-xs text-slate-700 italic">
                        {item.note || 'Không có ghi chú nào.'}
                    </p>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
