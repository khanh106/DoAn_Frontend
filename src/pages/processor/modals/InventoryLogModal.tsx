
import React from 'react';
import { X, History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { AppTable, type Column } from '../../../components/ui/AppTable';
import type { InventoryLogDto } from '../../../services/processorService';

interface InventoryLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: InventoryLogDto[];
}

export const InventoryLogModal: React.FC<InventoryLogModalProps> = ({
    isOpen,
    onClose,
    logs,
}) => {
    if (!isOpen) return null;

    const columns: Column<InventoryLogDto>[] = [
        {
            header: 'Giao Dịch',
            key: 'transactionType',
            render: (item) => {
                const isImport = item.transactionType === 'IMPORT' || item.transactionType === 'INBOUND';
                return (
                    <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${isImport ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                    >
                        {isImport ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isImport ? 'NHẬP KHO' : 'XUẤT KHO'}
                    </span>
                );
            },
        },
        { header: 'Tên Vật Tư / Sản Phẩm', key: 'materialName' },
        {
            header: 'Số Lượng',
            key: 'quantity',
            render: (item) => (
                <span className="font-extrabold text-slate-900">
                    {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                </span>
            ),
        },
        { header: 'Ghi Chú', key: 'note' },
        {
            header: 'Thời Gian Ghi DB',
            key: 'createdAt',
            render: (item) => (
                <span className="text-slate-500 text-xs">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </span>
            ),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-lg">
                        <History className="w-6 h-6 text-slate-600" />
                        <span>Lịch Sử Nhật Ký Kho (Backend Database)</span>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {logs.length > 0 ? (
                        <AppTable columns={columns} data={logs} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic">
                            Chưa có nhật ký giao dịch kho nào trong Database Backend.
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
                    >
                        Đóng Hộp Thoại
                    </button>
                </div>
            </div>
        </div>
    );
};
