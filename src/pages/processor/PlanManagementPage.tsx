import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Plus,
    Search,
    RefreshCw,
    CheckCircle2,
    Eye,
    Users,
    Leaf,
    MapPin,
    Package,
    Activity,
    Layers,
    Clock
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { AppModal } from '../../components/ui/AppModal';
import {
    processorService,
    type BatchDto,
    type CreateBatchRequest,
    type FruitTypeDto,
    type ProductDto,
    type FarmAreaDto,
    type UserWorkerDto,
    type ProductionProcessDto
} from '../../services/processorService';
import { toast } from '../../utils/toast';

export const PlanManagementPage: React.FC = () => {
    // Dữ liệu danh sách Kế hoạch / Lô sản xuất
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Bộ lọc & Tìm kiếm
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStage, setFilterStage] = useState<string>('ALL');

    // Danh mục chọn cho Modal Tạo Kế Hoạch
    const [fruitTypes, setFruitTypes] = useState<FruitTypeDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [farmAreas, setFarmAreas] = useState<FarmAreaDto[]>([]);
    const [workers, setWorkers] = useState<UserWorkerDto[]>([]);
    const [processes, setProcesses] = useState<ProductionProcessDto[]>([]);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedBatch, setSelectedBatch] = useState<BatchDto | null>(null);

    // State Form Tạo Kế Hoạch
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    const [selectedProcessId, setSelectedProcessId] = useState<string>('');
    const [formData, setFormData] = useState<{
        batchCode: string;
        fruitTypeId: string;
        productId: string;
        farmAreaId: string;
        plantingDate: string;
        expectedQuantity: number;
        assignedWorkerIds: string[];
        representativeWorkerId: string;
    }>({
        batchCode: `PLAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        fruitTypeId: '',
        productId: '',
        farmAreaId: '',
        plantingDate: new Date().toISOString().split('T')[0],
        expectedQuantity: 5000,
        assignedWorkerIds: [],
        representativeWorkerId: '',
    });

    // Fetch dữ liệu từ backend
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [bRes, ftRes, pRes, faRes, wRes, procRes] = await Promise.allSettled([
                processorService.getBatches(),
                processorService.getFruitTypes(),
                processorService.getProducts(),
                processorService.getFarmAreas(),
                processorService.getWorkers(),
                processorService.getProcesses(),
            ]);

            if (bRes.status === 'fulfilled') setBatches(bRes.value);
            if (ftRes.status === 'fulfilled') setFruitTypes(ftRes.value);
            if (pRes.status === 'fulfilled') setProducts(pRes.value);
            if (faRes.status === 'fulfilled') setFarmAreas(faRes.value);
            if (wRes.status === 'fulfilled') setWorkers(wRes.value);
            if (procRes.status === 'fulfilled') setProcesses(procRes.value);
        } catch (err: any) {
            console.error('Lỗi tải kế hoạch:', err);
            const msg = 'Không thể tải dữ liệu kế hoạch sản xuất từ hệ thống.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Xử lý tạo Kế hoạch mới
    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        if (!formData.batchCode.trim()) {
            setFormError('Vui lòng nhập mã kế hoạch sản xuất.');
            toast.error('Vui lòng nhập mã kế hoạch sản xuất.');
            return;
        }
        if (!formData.fruitTypeId) {
            setFormError('Vui lòng chọn loại trái cây/nông sản.');
            toast.error('Vui lòng chọn loại trái cây/nông sản.');
            return;
        }
        if (!formData.productId) {
            setFormError('Vui lòng chọn sản phẩm đầu ra.');
            toast.error('Vui lòng chọn sản phẩm đầu ra.');
            return;
        }
        if (!formData.farmAreaId) {
            setFormError('Vui lòng chọn vùng trồng áp dụng.');
            toast.error('Vui lòng chọn vùng trồng áp dụng.');
            return;
        }
        if (formData.expectedQuantity <= 0) {
            setFormError('Sản lượng dự kiến phải lớn hơn 0.');
            toast.error('Sản lượng dự kiến phải lớn hơn 0.');
            return;
        }
        if (!formData.representativeWorkerId) {
            setFormError('Vui lòng chọn người đại diện phụ trách kế hoạch.');
            toast.error('Vui lòng chọn người đại diện phụ trách kế hoạch.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateBatchRequest = {
                ...formData,
                assignedWorkerIds: Array.from(new Set([...formData.assignedWorkerIds, formData.representativeWorkerId]))
            };
            await processorService.createBatch(payload);
            setFormSuccess('Tạo kế hoạch sản xuất thành công!');
            toast.success('Tạo kế hoạch sản xuất thành công!');

            fetchData();
            setTimeout(() => {
                setIsCreateModalOpen(false);
                setFormSuccess(null);
                setFormData({
                    batchCode: `PLAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    fruitTypeId: '',
                    productId: '',
                    farmAreaId: '',
                    plantingDate: new Date().toISOString().split('T')[0],
                    expectedQuantity: 5000,
                    assignedWorkerIds: [],
                    representativeWorkerId: '',
                });
                setSelectedProcessId('');
            }, 800);
        } catch (err: any) {
            console.error('Lỗi tạo kế hoạch:', err);
            const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo kế hoạch sản xuất.';
            setFormError(errMsg);
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Lọc danh sách kế hoạch
    const filteredBatches = batches.filter((b) => {
        const batchCode = b.batchCode || '';
        const fruitTypeName = b.fruitTypeName || '';
        const productName = b.productName || '';
        const farmAreaName = b.farmAreaName || '';

        const matchesSearch =
            batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fruitTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            farmAreaName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStage = filterStage === 'ALL' || b.currentStage === filterStage;
        return matchesSearch && matchesStage;
    });

    // Thống kê tổng quan
    const totalPlans = batches.length;
    const inPlantingPlans = batches.filter(b => b.currentStage === 'STAGE_PLANTING' || b.currentStage === 'PLANTING').length;
    const harvestedPlans = batches.filter(b => b.currentStage === 'STAGE_HARVESTED' || b.currentStage === 'HARVESTED').length;
    const totalExpectedOutput = batches.reduce((sum, b) => sum + (b.expectedQuantity || 0), 0);

    // Cấu hình bảng hiển thị Kế hoạch
    const columns: Column<BatchDto>[] = [
        {
            header: 'MÃ KẾ HOẠCH / LÔ',
            key: 'batchCode',
            render: (item) => (
                <div>
                    <span className="font-bold text-slate-800 font-mono">{item.batchCode}</span>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.plantingDate ? new Date(item.plantingDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                </div>
            )
        },
        {
            header: 'NÔNG SẢN & SẢN PHẨM',
            key: 'fruitTypeName',
            render: (item) => (
                <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                        {item.fruitTypeName || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.productName || 'N/A'}</div>
                </div>
            )
        },
        {
            header: 'VÙNG TRỒNG',
            key: 'farmAreaName',
            render: (item) => (
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    {item.farmAreaName || 'Chưa gán'}
                </div>
            )
        },
        {
            header: 'DỰ KIẾN SẢN LƯỢNG',
            key: 'expectedQuantity',
            render: (item) => (
                <div className="font-bold text-slate-800">
                    {(item.expectedQuantity || 0).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
            )
        },
        {
            header: 'NGƯỜI PHỤ TRÁCH',
            key: 'representativeWorkerName',
            render: (item) => (
                <div className="flex items-center gap-1.5 text-slate-700">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>{item.representativeWorkerName || 'Chưa chỉ định'}</span>
                </div>
            )
        },
        {
            header: 'TRẠNG THÁI KHỞI TẠO',
            key: 'currentStage',
            render: (item) => {
                const stageMap: Record<string, { label: string; status: string }> = {
                    STAGE_PLANTING: { label: 'Đang Canh Tác', status: 'CAN_BO_SUNG' },
                    PLANTING: { label: 'Đang Canh Tác', status: 'CAN_BO_SUNG' },
                    STAGE_HARVESTED: { label: 'Đã Thu Hoạch', status: 'DANG_XU_LY' },
                    HARVESTED: { label: 'Đã Thu Hoạch', status: 'DANG_XU_LY' },
                    STAGE_PROCESSED: { label: 'Đã Chế Biến', status: 'DA_DUYET' },
                    PACKAGED: { label: 'Đã Đóng Gói', status: 'DA_DUYET' },
                    READY_FOR_SALE: { label: 'Sẵn Sàng Bán', status: 'READY_FOR_SALE' },
                };
                const info = stageMap[item.currentStage] || { label: item.currentStage, status: 'DEFAULT' };
                return <AppBadge status={info.status} label={info.label} />;
            }
        },
        {
            header: 'THAO TÁC',
            key: 'id',
            render: (item) => (
                <AppButton
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                    onClick={() => {
                        setSelectedBatch(item);
                        setIsDetailModalOpen(true);
                    }}
                >
                    <Eye className="w-4 h-4 mr-1" />
                    Chi tiết
                </AppButton>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* HEADBAR TRANG */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-emerald-600" />
                        Lập Kế Hoạch & Quản Lý Sản Xuất
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Khởi tạo kế hoạch mùa vụ, phân công nhân công & theo dõi tiến độ lô nông sản Hợp tác xã
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AppButton variant="outline" onClick={fetchData} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </AppButton>
                    <AppButton
                        variant="green"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo kế hoạch mới
                    </AppButton>
                </div>
            </div>

            {/* CARD THỐNG KÊ TỔNG QUAN KẾ HOẠCH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng kế hoạch</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPlans}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang canh tác</p>
                        <h3 className="text-2xl font-bold text-blue-600 mt-1">{inPlantingPlans}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã thu hoạch</p>
                        <h3 className="text-2xl font-bold text-amber-600 mt-1">{harvestedPlans}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sản lượng dự kiến</p>
                        <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                            {totalExpectedOutput.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">kg</span>
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Package className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* BỘ LỌC VÀ TÌM KIẾM */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <AppInput
                        placeholder="Tìm theo mã kế hoạch, nông sản, vùng trồng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="w-full md:w-64">
                    <AppSelect
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        options={[
                            { label: 'Tất cả trạng thái', value: 'ALL' },
                            { label: 'Đang Canh Tác', value: 'STAGE_PLANTING' },
                            { label: 'Đã Thu Hoạch', value: 'STAGE_HARVESTED' },
                            { label: 'Đã Chế Biến', value: 'STAGE_PROCESSED' },
                            { label: 'Đã Đóng Gói', value: 'PACKAGED' },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-1">
                {loading ? (
                    <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        <span>Đang tải dữ liệu kế hoạch sản xuất...</span>
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-slate-700">Chưa có kế hoạch sản xuất nào</p>
                        <p className="text-xs text-slate-400">Hãy nhấn 'Tạo kế hoạch mới' để khởi tạo kế hoạch đầu tiên!</p>
                    </div>
                ) : (
                    <AppTable columns={columns} data={filteredBatches} showSTT={true} />
                )}
            </div>

            {/* MODAL TẠO KẾ HOẠCH SẢN XUẤT MỚI */}
            <AppModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Lập Kế Hoạch Sản Xuất Mới"
                maxWidth="xl"
            >
                <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Mã Kế Hoạch / Lô <span className="text-rose-500">*</span>
                            </label>
                            <AppInput
                                value={formData.batchCode}
                                onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                                placeholder="VD: PLAN-2026-001"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Loại Nông Sản / Trái Cây <span className="text-rose-500">*</span>
                            </label>
                            <AppSelect
                                value={formData.fruitTypeId}
                                onChange={(e) => setFormData({ ...formData, fruitTypeId: e.target.value })}
                                options={[
                                    { label: '-- Chọn loại nông sản --', value: '' },
                                    ...fruitTypes.map((ft) => ({ label: `${ft.name} (${ft.code})`, value: ft.id })),
                                ]}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Sản Phẩm Đầu Ra <span className="text-rose-500">*</span>
                            </label>
                            <AppSelect
                                value={formData.productId}
                                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                options={[
                                    { label: '-- Chọn sản phẩm --', value: '' },
                                    ...products.map((p) => ({ label: `${p.name} - ${p.variety || 'Chuẩn'}`, value: p.id })),
                                ]}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Vùng Trồng / Nông Hộ Áp Dụng <span className="text-rose-500">*</span>
                            </label>
                            <AppSelect
                                value={formData.farmAreaId}
                                onChange={(e) => setFormData({ ...formData, farmAreaId: e.target.value })}
                                options={[
                                    { label: '-- Chọn vùng trồng --', value: '' },
                                    ...farmAreas.map((fa) => ({ label: `${fa.name} (${fa.area} ha)`, value: fa.id })),
                                ]}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Ngày Bắt Đầu / Gieo Trồng <span className="text-rose-500">*</span>
                            </label>
                            <AppInput
                                type="date"
                                value={formData.plantingDate}
                                onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Dự Kiến Sản Lượng (kg) <span className="text-rose-500">*</span>
                            </label>
                            <AppInput
                                type="number"
                                min={1}
                                value={formData.expectedQuantity}
                                onChange={(e) => setFormData({ ...formData, expectedQuantity: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Quy Trình Sản Xuất Áp Dụng (Mẫu)
                        </label>
                        <AppSelect
                            value={selectedProcessId}
                            onChange={(e) => setSelectedProcessId(e.target.value)}
                            options={[
                                { label: '-- Mặc định theo tiêu chuẩn Hợp tác xã --', value: '' },
                                ...processes.map((pr) => ({ label: `${pr.name} (${pr.steps.length} công đoạn)`, value: pr.id })),
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nông Dân / Nhân Công Đại Diện Phụ Trách <span className="text-rose-500">*</span>
                        </label>
                        <AppSelect
                            value={formData.representativeWorkerId}
                            onChange={(e) => setFormData({ ...formData, representativeWorkerId: e.target.value })}
                            options={[
                                { label: '-- Chọn người phụ trách chính --', value: '' },
                                ...workers.map((w) => ({ label: `${w.fullName} (${w.phoneNumber || 'N/A'})`, value: w.id })),
                            ]}
                            required
                        />
                    </div>

                    {/* Danh sách phân công nhân công tham gia */}
                    {workers.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Phân Công Nông Dân / Nhân Công Tham Gia Kế Hoạch ({formData.assignedWorkerIds.length} đã chọn)
                            </label>
                            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50">
                                {workers.map((w) => {
                                    const isChecked = formData.assignedWorkerIds.includes(w.id);
                                    return (
                                        <label
                                            key={w.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${isChecked ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'bg-white hover:bg-slate-100'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, assignedWorkerIds: [...formData.assignedWorkerIds, w.id] });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            assignedWorkerIds: formData.assignedWorkerIds.filter((id) => id !== w.id),
                                                        });
                                                    }
                                                }}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>{w.fullName}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <AppButton type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Hủy bỏ
                        </AppButton>
                        <AppButton
                            type="submit"
                            variant="green"
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
                        >
                            {submitting ? 'Đang tạo kế hoạch...' : 'Kích hoạt kế hoạch'}
                        </AppButton>
                    </div>
                </form>
            </AppModal>

            {/* MODAL CHI TIẾT TIẾN ĐỘ KẾ HOẠCH */}
            <AppModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Chi Tiết Kế Hoạch Sản Xuất: ${selectedBatch?.batchCode || ''}`}
                maxWidth="xl"
            >
                {selectedBatch && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Mã Kế Hoạch</span>
                                <p className="font-mono font-bold text-slate-800 text-sm">{selectedBatch.batchCode}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Loại Nông Sản</span>
                                <p className="font-semibold text-emerald-700 text-sm">{selectedBatch.fruitTypeName}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Sản Phẩm Đầu Ra</span>
                                <p className="font-semibold text-slate-800 text-sm">{selectedBatch.productName}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Vùng Trồng</span>
                                <p className="font-medium text-slate-700 text-sm">{selectedBatch.farmAreaName}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Ngày Bắt Đầu</span>
                                <p className="font-medium text-slate-700 text-sm">
                                    {new Date(selectedBatch.plantingDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Sản Lượng Dự Kiến</span>
                                <p className="font-bold text-slate-800 text-sm">
                                    {selectedBatch.expectedQuantity.toLocaleString('vi-VN')} kg
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                Tiến Độ Các Giai Đoạn Canh Tác & Chế Biến
                            </h4>
                            <div className="relative border-l-2 border-emerald-200 pl-4 space-y-4 ml-2">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-600 rounded-full ring-4 ring-emerald-100" />
                                    <h5 className="font-bold text-sm text-slate-800">1. Gieo Trồng / Khởi Công</h5>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Bắt đầu từ ngày {new Date(selectedBatch.plantingDate).toLocaleDateString('vi-VN')} tại vùng trồng {selectedBatch.farmAreaName}
                                    </p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-100" />
                                    <h5 className="font-bold text-sm text-slate-800">2. Chăm Sóc & Nhật Ký Canh Tác</h5>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Nông dân phụ trách: <span className="font-semibold text-slate-700">{selectedBatch.representativeWorkerName || 'N/A'}</span>
                                    </p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-amber-500 rounded-full ring-4 ring-amber-100" />
                                    <h5 className="font-bold text-sm text-slate-800">3. Thu Hoạch & Kiểm Định Chất Lượng</h5>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Dự kiến sản lượng thu hoạch: {selectedBatch.expectedQuantity.toLocaleString('vi-VN')} kg
                                    </p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-purple-500 rounded-full ring-4 ring-purple-100" />
                                    <h5 className="font-bold text-sm text-slate-800">4. Đóng Gói & Mã Truy Xuất QR</h5>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Tự động ghi nhận mã Hash Blockchain và phát hành QR Code cho sản phẩm
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedBatch.workers && selectedBatch.workers.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Danh Sách Nông Dân / Nhân Công Tham Gia ({selectedBatch.workers.length})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedBatch.workers.map((w) => (
                                        <div
                                            key={w.userId}
                                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                                        >
                                            <div className="font-medium text-slate-800">{w.fullName}</div>
                                            {w.isRepresentative && (
                                                <AppBadge status="CAN_BO_SUNG" label="Đại diện" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <AppButton variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                                Đóng
                            </AppButton>
                        </div>
                    </div>
                )}
            </AppModal>
        </div>
    );
};
