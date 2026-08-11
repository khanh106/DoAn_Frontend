
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowUpRight, History, Search, RefreshCw, AlertCircle, Eye, Edit, Trash2, PackagePlus } from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { processorService, type MaterialItemDto, type InventoryLogDto } from '../../services/processorService';
import { ImportInventoryModal } from './modals/ImportInventoryModal';
import { ExportInventoryModal } from './modals/ExportInventoryModal';
import { InventoryLogModal } from './modals/InventoryLogModal';
import { CreateMaterialModal } from './modals/CreateMaterialModal';
import { EditMaterialModal } from './modals/EditMaterialModal';
import { MaterialDetailModal } from './modals/MaterialDetailModal';
import { AxiosError } from 'axios';

export type InventoryTab = 'PRODUCT' | 'PESTICIDE' | 'FERTILIZER' | 'MATERIAL' | 'EQUIPMENT';

export const InventoryPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<InventoryTab>('PRODUCT');
    const [items, setItems] = useState<MaterialItemDto[]>([]);
    const [logs, setLogs] = useState<InventoryLogDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Modals
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [showExportModal, setShowExportModal] = useState<boolean>(false);
    const [showLogModal, setShowLogModal] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<MaterialItemDto | null>(null);

    // Tải dữ liệu kho thực tế từ Backend API
    const loadInventoryData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const [materialsRes, stockRes, logsRes] = await Promise.allSettled([
                processorService.getMaterials(),
                processorService.getStock(),
                processorService.getLogs(),
            ]);

            let fetchedMaterials: MaterialItemDto[] = [];
            if (materialsRes.status === 'fulfilled') {
                fetchedMaterials = materialsRes.value;
            }

            if (stockRes.status === 'fulfilled' && stockRes.value.length > 0) {
                const stockMap = new Map<string, number>(stockRes.value.map((s) => [s.materialItemId, s.quantityInStock]));
                fetchedMaterials = fetchedMaterials.map((item) => ({
                    ...item,
                    quantityInStock: stockMap.get(item.id) ?? item.quantityInStock ?? 0,
                }));
            }

            setItems(fetchedMaterials);

            if (logsRes.status === 'fulfilled') {
                setLogs(logsRes.value);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải kho từ Backend API:', errorObj);
            setErrorMessage(errorObj.response?.data?.message || 'Không thể kết nối với Backend API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadInventoryData();
    }, [loadInventoryData]);

    // Lọc theo Tab & Từ khóa tìm kiếm
    const filteredItems = items.filter((item) => {
        const matchesTab = item.itemType === activeTab;
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Thêm mới vật tư/sản phẩm vào kho
    const handleCreateMaterial = async (data: Partial<MaterialItemDto>) => {
        try {
            await processorService.createMaterial(data);
            alert('✅ Đã thêm mới danh mục kho thành công!');
            await loadInventoryData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(`❌ Lỗi tạo mới: ${errorObj.response?.data?.message || 'Không thể tạo mới.'}`);
        }
    };

    // Sửa vật tư/sản phẩm
    const handleEditMaterial = async (id: string, data: Partial<MaterialItemDto>) => {
        try {
            await processorService.updateMaterial(id, data);
            alert('✅ Đã cập nhật thông tin kho thành công!');
            await loadInventoryData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(`❌ Lỗi cập nhật: ${errorObj.response?.data?.message || 'Không thể cập nhật.'}`);
        }
    };

    // Xóa vật tư/sản phẩm khỏi kho
    const handleDeleteMaterial = async (item: MaterialItemDto) => {
        if (window.confirm(`⚠️ Bạn có chắc chắn muốn XÓA "${item.name}" (Mã: ${item.code}) khỏi kho?`)) {
            try {
                await processorService.deleteMaterial(item.id);
                alert('✅ Đã xóa thành công khỏi Database!');
                await loadInventoryData();
            } catch (err) {
                const errorObj = err as AxiosError<{ message?: string }>;
                alert(`❌ Lỗi xóa: ${errorObj.response?.data?.message || 'Không thể xóa.'}`);
            }
        }
    };

    // Gọi API Nhập Kho Backend
    const handleImport = async (materialItemId: string, quantity: number, note: string) => {
        try {
            await processorService.createTransaction({
                materialItemId,
                transactionType: 'IMPORT',
                quantity,
                note,
            });
            alert(`✅ Đã nhập kho thành công +${quantity} đơn vị!`);
            await loadInventoryData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(`❌ Lỗi nhập kho: ${errorObj.response?.data?.message || 'Không thể ghi nhận giao dịch.'}`);
        }
    };

    // Gọi API Xuất Kho Backend
    const handleExport = async (materialItemId: string, quantity: number, note: string) => {
        try {
            await processorService.createTransaction({
                materialItemId,
                transactionType: 'EXPORT',
                quantity,
                note,
            });
            alert(`✅ Đã xuất kho thành công ${quantity} đơn vị!`);
            await loadInventoryData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(`❌ Lỗi xuất kho: ${errorObj.response?.data?.message || 'Không thể xuất kho.'}`);
        }
    };

    // Cột bảng dữ liệu
    const columns: Column<MaterialItemDto>[] = [
        {
            header: activeTab === 'PRODUCT' ? 'Tên sản phẩm' : 'Tên vật tư',
            key: 'name',
            render: (item) => <span className="font-bold text-slate-900">{item.name}</span>,
        },
        {
            header: activeTab === 'PRODUCT' ? 'Mã sản phẩm' : 'Mã vật tư',
            key: 'code',
            render: (item) => <span className="font-mono text-slate-600 font-semibold">{item.code}</span>,
        },
        {
            header: 'Tồn kho',
            key: 'quantityInStock',
            render: (item) => (
                <span className="font-extrabold text-emerald-700 text-sm">
                    {item.quantityInStock ?? 0}
                </span>
            ),
        },
        {
            header: 'ĐVT',
            key: 'unit',
            render: (item) => <span className="uppercase text-slate-500 font-semibold">{item.unit}</span>,
        },
        {
            header: 'Đơn giá (VNĐ)',
            key: 'price',
            render: (item) => (
                <span className="font-medium text-slate-700">
                    {item.price ? item.price.toLocaleString('vi-VN') : '-'}
                </span>
            ),
        },
        {
            header: 'Thao tác',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-1.5">
                    <button
                        onClick={() => {
                            setSelectedItem(item);
                            setShowDetailModal(true);
                        }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedItem(item);
                            setShowEditModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                    >
                        <Edit className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handleDeleteMaterial(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa vật tư"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    const tabLabels: { key: InventoryTab; label: string }[] = [
        { key: 'PRODUCT', label: 'Sản phẩm' },
        { key: 'PESTICIDE', label: 'Nông dược' },
        { key: 'FERTILIZER', label: 'Phân bón' },
        { key: 'MATERIAL', label: 'Nguyên vật liệu' },
        { key: 'EQUIPMENT', label: 'Thiết bị' },
    ];

    return (
        <div className="space-y-5">
            {/* Header & Nút Thao Tác */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Quản Lý Kho Hợp Tác Xã</h2>
                    <p className="text-xs text-slate-500">Quản lý đầy đủ danh mục kho, giao dịch nhập xuất và lịch sử tồn kho</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <PackagePlus className="w-4 h-4" />
                        <span>Thêm Vật Tư</span>
                    </button>

                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2.5 bg-[#16a34a] hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nhập Kho</span>
                    </button>

                    <button
                        onClick={() => setShowExportModal(true)}
                        className="px-4 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Xuất Kho</span>
                    </button>

                    <button
                        onClick={() => setShowLogModal(true)}
                        className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <History className="w-4 h-4" />
                        <span>Lịch sử</span>
                    </button>

                    <button
                        onClick={loadInventoryData}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
                        title="Tải lại dữ liệu Backend"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>⚠️ {errorMessage}</span>
                </div>
            )}

            {/* Sub-Tabs Danh mục Kho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-3">
                <div className="flex items-center gap-2">
                    {tabLabels.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 font-bold text-xs md:text-sm rounded-xl transition-all cursor-pointer ${isActive
                                    ? 'bg-[#15803d] text-white shadow-md shadow-green-700/20'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm mã / tên..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>
            </div>

            {/* Bảng dữ liệu Kho */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Danh sách {tabLabels.find((t) => t.key === activeTab)?.label} ({filteredItems.length})
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Đang tải dữ liệu kho từ Backend API...</div>
                ) : filteredItems.length > 0 ? (
                    <AppTable columns={columns} data={filteredItems} showSTT={true} />
                ) : (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                        Chưa có dữ liệu nào trong danh mục này. Bấm nút "Thêm Vật Tư" để tạo mới.
                    </div>
                )}
            </div>

            {/* Modal Thêm Mới */}
            <CreateMaterialModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateMaterial}
            />

            {/* Modal Sửa Thông Tin */}
            <EditMaterialModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
                onSubmit={handleEditMaterial}
            />

            {/* Modal Xem Chi Tiết */}
            <MaterialDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
            />

            {/* Modal Nhập Kho */}
            <ImportInventoryModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                items={items}
                onSubmit={handleImport}
            />

            {/* Modal Xuất Kho */}
            <ExportInventoryModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                items={items}
                onSubmit={handleExport}
            />

            {/* Modal Lịch Sử */}
            <InventoryLogModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                logs={logs}
            />
        </div>
    );
};
