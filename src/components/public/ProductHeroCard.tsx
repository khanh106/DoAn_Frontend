// File: src/components/public/ProductHeroCard.tsx
import React from 'react';
import { Tag, Package, Calendar } from 'lucide-react';
import { TargetInfoDto, PackagingDto, ParentBatchDto } from '../../services/traceabilityService';

interface ProductHeroCardProps {
    targetInfo: TargetInfoDto;
    packaging?: PackagingDto;
    parentBatch?: ParentBatchDto;
}

export const ProductHeroCard: React.FC<ProductHeroCardProps> = ({ targetInfo, packaging, parentBatch }) => {
    const displayImage = packaging?.imageUrl || targetInfo.qrCodeUrl || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80';

    return (
        <div className="bg-slate-200/70 rounded-3xl p-5 border border-slate-300/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">

            {/* Ảnh sản phẩm thật / Đóng gói */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-white flex items-center justify-center">
                <img
                    src={displayImage}
                    alt={targetInfo.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80';
                    }}
                />
            </div>

            {/* Thông tin thật của Lô sản xuất */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                        {targetInfo.currentStage || 'Đã ghi nhận'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                        {targetInfo.productName || 'Sản phẩm Nông nghiệp'}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                        Loại trái cây: <strong className="text-slate-900">{targetInfo.fruitType}</strong>
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <div className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-full">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mã: {targetInfo.code}</span>
                    </div>

                    {parentBatch && (
                        <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 text-xs font-mono font-bold px-3 py-1 rounded-full">
                            <Package className="w-3.5 h-3.5 text-slate-500" />
                            <span>Lô gốc: {parentBatch.batchCode}</span>
                        </div>
                    )}
                </div>

                {packaging?.packDate && (
                    <p className="text-[11px] text-slate-500 font-medium pt-1 flex items-center justify-center sm:justify-start gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Ngày đóng gói: <strong className="text-slate-800">{new Date(packaging.packDate).toLocaleDateString('vi-VN')}</strong>
                    </p>
                )}
            </div>
        </div>
    );
};
