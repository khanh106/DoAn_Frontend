import React, { useState, useEffect, useCallback } from 'react';
import { resolveIpfsUrl } from '../../services/ipfsService';
import { translateStage } from '../../types';

import {
    Layers,
    Plus,
    Search,
    RefreshCw,
    Calendar,
    UserCheck,
    Package,
    ShieldCheck,
    CheckCircle2,
    Eye,
    Users,
    Leaf,
    ExternalLink
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
    type UserWorkerDto
} from '../../services/processorService';
import { web3Service } from '../../services/web3Service';
import { toast } from '../../utils/toast';
import { CONTRACT_CONFIG } from '../../config/constants';

export const BatchManagementPage: React.FC = () => {
    // State dữ liệu danh sách Lô
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStage, setFilterStage] = useState<string>('ALL');
    const [hideFailedBatches, setHideFailedBatches] = useState<boolean>(true);
    // State danh mục hỗ trợ tạo Lô
    const [fruitTypes, setFruitTypes] = useState<FruitTypeDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [farmAreas, setFarmAreas] = useState<FarmAreaDto[]>([]);
    const [workers, setWorkers] = useState<UserWorkerDto[]>([]);

    // State Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [selectedBatch, setSelectedBatch] = useState<BatchDto | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Form Data Tạo Lô
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
        batchCode: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        fruitTypeId: '',
        productId: '',
        farmAreaId: '',
        plantingDate: new Date().toISOString().split('T')[0],
        expectedQuantity: 1000,
        assignedWorkerIds: [],
        representativeWorkerId: '',
    });

    // 1. Tải dữ liệu từ Backend API
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [bRes, ftRes, pRes, faRes, wRes] = await Promise.allSettled([
                processorService.getBatches(),
                processorService.getFruitTypes(),
                processorService.getProducts(),
                processorService.getFarmAreas(),
                processorService.getWorkers(),
            ]);

            if (bRes.status === 'fulfilled') setBatches(bRes.value);
            if (ftRes.status === 'fulfilled') setFruitTypes(ftRes.value);
            if (pRes.status === 'fulfilled') setProducts(pRes.value);
            if (faRes.status === 'fulfilled') setFarmAreas(faRes.value);
            if (wRes.status === 'fulfilled') setWorkers(wRes.value);

        } catch (err: any) {
            console.error('Lỗi tải dữ liệu:', err);
            const msg = 'Không thể tải dữ liệu danh mục từ hệ thống Backend.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // 2. Xử lý Toggle chọn Nông dân trong Form Modal
    const handleWorkerToggle = (workerId: string) => {
        setFormData((prev) => {
            const isSelected = prev.assignedWorkerIds.includes(workerId);
            const newAssigned = isSelected
                ? prev.assignedWorkerIds.filter((id) => id !== workerId)
                : [...prev.assignedWorkerIds, workerId];

            // Nếu bỏ chọn người đang là đại diện -> reset người đại diện
            let newRep = prev.representativeWorkerId;
            if (isSelected && prev.representativeWorkerId === workerId) {
                newRep = newAssigned.length > 0 ? newAssigned[0] : '';
            } else if (!isSelected && newAssigned.length === 1) {
                newRep = workerId; // Chọn người đầu tiên làm đại diện mặc định
            }

            return {
                ...prev,
                assignedWorkerIds: newAssigned,
                representativeWorkerId: newRep,
            };
        });
    };

    // 3. Submit Tạo Lô Sản Xuất
    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        // Validation frontend
        if (!formData.batchCode.trim()) {
            const msg = 'Vui lòng nhập Mã Lô Sản Xuất.';
            setFormError(msg);
            toast.error(msg);
            return;
        }
        if (!formData.fruitTypeId) {
            const msg = 'Vui lòng chọn Loại Trái Cây.';
            setFormError(msg);
            toast.error(msg);
            return;
        }
        if (!formData.productId) {
            const msg = 'Vui lòng chọn Sản Phẩm Thương Mại.';
            setFormError(msg);
            toast.error(msg);
            return;
        }
        if (!formData.farmAreaId) {
            const msg = 'Vui lòng chọn Vùng Trồng.';
            setFormError(msg);
            toast.error(msg);
            return;
        }
        if (formData.expectedQuantity <= 0) {
            const msg = 'Sản lượng dự kiến phải lớn hơn 0.';
            setFormError(msg);
            toast.error(msg);
            return;
        }
        if (formData.assignedWorkerIds.length === 0) {
            const msg = 'Vui lòng chọn ít nhất 1 Nông dân / Nhân công quản lý lô.';
            setFormError(msg);
            toast.error(msg);
            return;
        }
        if (!formData.representativeWorkerId) {
            const msg = 'Vui lòng chỉ định 1 Người Đại Diện Lô.';
            setFormError(msg);
            toast.error(msg);
            return;
        }

        setSubmitting(true);
        try {
            const reqData: CreateBatchRequest = {
                batchCode: formData.batchCode.trim(),
                fruitTypeId: formData.fruitTypeId,
                productId: formData.productId,
                farmAreaId: formData.farmAreaId,
                plantingDate: new Date(formData.plantingDate).toISOString(),
                expectedQuantity: Number(formData.expectedQuantity),
                assignedWorkerIds: formData.assignedWorkerIds,
                representativeWorkerId: formData.representativeWorkerId,
            };

            const created = await processorService.createBatch(reqData);
            // Đóng Modal Form tạo lô
            setIsCreateModalOpen(false);

            // Cài đặt thông báo & Mở Modal thông báo thành công
            const successMsg = `Tạo lô sản xuất '${created.batchCode}' thành công! Thông tin đã được đẩy lên IPFS và ghi nhận giao dịch thành công trên Blockchain.`;
            setSuccessMessage(successMsg);
            toast.success(successMsg);
            setIsSuccessModalOpen(true);

            // Reset form
            setFormData({
                batchCode: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                fruitTypeId: '',
                productId: '',
                farmAreaId: '',
                plantingDate: new Date().toISOString().split('T')[0],
                expectedQuantity: 1000,
                assignedWorkerIds: [],
                representativeWorkerId: '',
            });

            // Tải lại danh sách từ DB để hiển thị lô hàng đã tạo thành công
            await fetchData();


        } catch (err: any) {
            console.error('Lỗi tạo lô:', err);
            const msg = err?.response?.data?.message || err?.message || 'Tạo lô sản xuất thất bại. Vui lòng kiểm tra lại.';
            setFormError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper map badge giai đoạn
    const getStageBadge = (stage: string) => {
        const translatedLabel = translateStage(stage);
        switch (stage) {
            case 'STAGE_PLANTING':
            case 'STAGE_ACCEPTED':
            case 'STAGE_CREATED':
                return <AppBadge status="ACTIVE" label={translatedLabel} />;
            case 'STAGE_HARVESTED':
                return <AppBadge status="WARNING" label={translatedLabel} />;
            case 'STAGE_RECEIVED':
                return <AppBadge status="PURPLE" label={translatedLabel} />;
            case 'STAGE_PROCESSED':
                return <AppBadge status="BLUE" label={translatedLabel} />;
            case 'STAGE_SORTED':
                return <AppBadge status="CYAN" label={translatedLabel} />;
            case 'INSPECTION_PASSED':
                return <AppBadge status="SUCCESS" label={translatedLabel} />;
            case 'INSPECTION_FAILED':
                return <AppBadge status="DANGER" label={translatedLabel} />;
            case 'PACKAGED':
            case 'STAGE_PACKAGED':
                return <AppBadge status="SUCCESS" label={translatedLabel} />;
            case 'STAGE_SHIPPING':
                return <AppBadge status="INFO" label={translatedLabel} />;
            case 'RECEIVED_AT_RETAILER':
                return <AppBadge status="INFO" label={translatedLabel} />;
            case 'READY_FOR_SALE':
                return <AppBadge status="SUCCESS" label={translatedLabel} />;
            default:
                return <AppBadge status="NEUTRAL" label={translatedLabel} />;
        }
    };


    // Filtered data
    const filteredBatches = batches.filter((b) => {
        const matchesSearch =
            b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.productName && b.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (b.farmAreaName && b.farmAreaName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStage = filterStage === 'ALL' || b.currentStage === filterStage;

        // Kiểm tra xem lô có bị lỗi / kiểm định thất bại hay không
        const isFailed = b.currentStage === 'INSPECTION_FAILED' || b.currentStage === 'FAILED';
        const passesFailedCheck = hideFailedBatches ? !isFailed : true;

        return matchesSearch && matchesStage && passesFailedCheck;
    });


    // Các cột cho AppTable
    const columns: Column<BatchDto>[] = [
        {
            header: 'Mã Lô Sản Xuất',
            key: 'batchCode',
            render: (item) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 font-mono text-sm">{item.batchCode}</span>
                    <span className="text-[11px] text-slate-400">ID: {item.id.substring(0, 8)}...</span>
                </div>
            ),
        },
        {
            header: 'Loại Cây & Sản Phẩm',
            key: 'productName',
            render: (item) => (
                <div>
                    <p className="font-semibold text-slate-800 text-xs md:text-sm">{item.productName || 'Chưa đặt'}</p>
                    <p className="text-xs text-emerald-600 font-medium">{item.fruitTypeName}</p>
                </div>
            ),
        },
        {
            header: 'Vùng Trồng',
            key: 'farmAreaName',
            render: (item) => (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    🌾 {item.farmAreaName || 'Vùng chưa tên'}
                </span>
            ),
        },
        {
            header: 'Ngày Trồng',
            key: 'plantingDate',
            render: (item) => (
                <span className="text-xs text-slate-600 font-medium">
                    📅 {new Date(item.plantingDate).toLocaleDateString('vi-VN')}
                </span>
            ),
        },
        {
            header: 'Sản Lượng (Dự kiến)',
            key: 'expectedQuantity',
            render: (item) => (
                <span className="font-bold text-slate-900 text-xs md:text-sm">
                    {item.expectedQuantity?.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">kg</span>
                </span>
            ),
        },
        {
            header: 'Người Đại Diện',
            key: 'representativeWorkerName',
            render: (item) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.representativeWorkerName || 'Chưa chỉ định'}</span>
                </div>
            ),
        },
        {
            header: 'Trạng Thái Quy Trình',
            key: 'currentStage',
            render: (item) => getStageBadge(item.currentStage),
        },
        {
            header: 'Thao Tác',
            key: 'id',
            render: (item) => (
                <button
                    onClick={() => {
                        setSelectedBatch(item);
                        setIsDetailModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Trang */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-emerald-600" />
                        <span>Quản Lý Lô Sản Xuất (Hợp Tác Xã)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Khởi tạo Lô sản xuất, phân công nông dân, ghi nhận dữ liệu On-Chain & IPFS Hash
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AppButton
                        variant="outline"
                        onClick={fetchData}
                        disabled={loading}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        className="text-xs font-semibold px-4 py-2.5 h-10 shadow-2xs"
                    >
                        Tải lại
                    </AppButton>

                    <AppButton
                        variant="green"
                        onClick={() => setIsCreateModalOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="text-xs font-semibold px-4 py-2.5 h-10 shadow-sm"
                    >
                        Tạo Lô Sản Xuất Mới
                    </AppButton>
                </div>



            </div>

            {/* Thống kê Tổng quan (Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Tổng Số Lô</p>
                        <h4 className="text-2xl font-bold text-slate-900 mt-1">{batches.length}</h4>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Đang Canh Tác</p>
                        <h4 className="text-2xl font-bold text-blue-600 mt-1">
                            {batches.filter((b) => b.currentStage === 'STAGE_ACCEPTED' || b.currentStage === 'STAGE_CREATED').length}
                        </h4>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Leaf className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Đã Thu Hoạch</p>
                        <h4 className="text-2xl font-bold text-amber-600 mt-1">
                            {batches.filter((b) => b.currentStage === 'STAGE_HARVESTED' || b.currentStage === 'STAGE_RECEIVED').length}
                        </h4>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Đã Đóng Gói</p>
                        <h4 className="text-2xl font-bold text-purple-600 mt-1">
                            {batches.filter((b) => b.currentStage === 'STAGE_PACKAGED').length}
                        </h4>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <Package className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Bảng Dữ Liệu Lô Sản Xuất */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                {/* Thanh Lọc & Tìm Kiếm */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã lô, tên sản phẩm, vùng trồng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Lọc Trạng Thái:</span>

                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">Tất cả giai đoạn</option>
                            <option value="STAGE_CREATED">Mới khởi tạo</option>
                            <option value="STAGE_ACCEPTED">Đang canh tác</option>
                            <option value="STAGE_HARVESTED">Đã thu hoạch</option>
                            <option value="STAGE_RECEIVED">HTX Tiếp nhận</option>
                            <option value="STAGE_PACKAGED">Đã đóng gói</option>
                            <option value="INSPECTION_FAILED">⚠️ Kiểm định thất bại (Lô lỗi)</option>
                        </select>

                        {/* Checkbox Ẩn lô bị lỗi */}
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200 transition-all select-none">
                            <input
                                type="checkbox"
                                checked={hideFailedBatches}
                                onChange={(e) => setHideFailedBatches(e.target.checked)}
                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>Ẩn lô bị lỗi</span>
                        </label>
                    </div>


                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Lọc Trạng Thái:</span>
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">Tất cả giai đoạn</option>
                            <option value="STAGE_CREATED">Mới khởi tạo</option>
                            <option value="STAGE_ACCEPTED">Đang canh tác</option>
                            <option value="STAGE_HARVESTED">Đã thu hoạch</option>
                            <option value="STAGE_RECEIVED">HTX Tiếp nhận</option>
                            <option value="STAGE_PACKAGED">Đã đóng gói</option>
                        </select>
                    </div>
                </div>

                {/* Main Table */}
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh sách Lô sản xuất...</div>
                ) : filteredBatches.length > 0 ? (
                    <AppTable columns={columns} data={filteredBatches} showSTT={true} />
                ) : (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                        {batches.length === 0
                            ? 'Chưa có Lô sản xuất nào. Nhấn "Tạo Lô Sản Xuất Mới" để tạo lô đầu tiên!'
                            : 'Không tìm thấy lô sản xuất phù hợp với bộ lọc.'}
                    </div>
                )}
            </div>

            {/* MODAL 1: TẠO LÔ SẢN XUẤT MỚI */}
            <AppModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tạo Lô Sản Xuất Mới (Ghi nhận On-Chain)"
            >
                <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
                    {/* Hàng 1: Mã Lô & Sản Lượng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AppInput
                            label="Mã Lô Sản Xuất (*)"
                            placeholder="VD: BATCH-2026-001"
                            value={formData.batchCode}
                            onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                            required
                        />

                        <AppInput
                            label="Sản Lượng Dự Kiến (Kg) (*)"
                            type="number"
                            placeholder="VD: 1000"
                            value={formData.expectedQuantity}
                            onChange={(e) => setFormData({ ...formData, expectedQuantity: Number(e.target.value) })}
                            required
                        />
                    </div>

                    {/* Hàng 2: Loại Cây & Sản Phẩm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AppSelect
                            label="Loại Nông Sản / Trái Cây (*)"
                            value={formData.fruitTypeId}
                            onChange={(e) => setFormData({ ...formData, fruitTypeId: e.target.value })}
                            options={[
                                { label: '-- Chọn loại trái cây --', value: '' },
                                ...fruitTypes.map((ft) => ({ label: `${ft.name} (${ft.code})`, value: ft.id })),
                            ]}
                            required
                        />

                        <AppSelect
                            label="Sản Phẩm Đóng Gói Đầu Ra (*)"
                            value={formData.productId}
                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                            options={[
                                { label: '-- Chọn sản phẩm thương mại --', value: '' },
                                ...products.map((p) => ({ label: `${p.name} - ${p.variety || 'Chuẩn'}`, value: p.id })),
                            ]}
                            required
                        />
                    </div>

                    {/* Hàng 3: Vùng Trồng & Ngày Trồng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AppSelect
                            label="Vùng Trồng (Farm Area) (*)"
                            value={formData.farmAreaId}
                            onChange={(e) => setFormData({ ...formData, farmAreaId: e.target.value })}
                            options={[
                                { label: '-- Chọn vùng trồng --', value: '' },
                                ...farmAreas.map((fa) => ({ label: `🌾 ${fa.name} (${fa.plantingCode || 'Không MSVT'})`, value: fa.id })),
                            ]}
                            required
                        />

                        <AppInput
                            label="Ngày Gieo Trồng (*)"
                            type="date"
                            value={formData.plantingDate}
                            onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                            required
                        />
                    </div>

                    {/* Hàng 4: Chọn Nông dân Phân công */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="block font-semibold text-slate-800">
                            Phân Công Nông Dân / Nhân Công Quản Lý Lô (*)
                        </label>

                        {workers.length > 0 ? (
                            <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                {workers.map((w) => {
                                    const checked = formData.assignedWorkerIds.includes(w.id);
                                    return (
                                        <div
                                            key={w.id}
                                            onClick={() => handleWorkerToggle(w.id)}
                                            className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all ${checked ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-semibold' : 'bg-white hover:bg-slate-100 text-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={checked} readOnly className="rounded text-emerald-600 focus:ring-emerald-500" />
                                                <span>{w.fullName}</span>
                                                <span className="text-[10px] text-slate-400">({w.email})</span>
                                            </div>
                                            {checked && <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded">Đã chọn</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">Chưa có danh sách Nông dân. Hãy tạo thêm tài khoản FARMER trong hệ thống.</p>
                        )}
                    </div>

                    {/* Hàng 5: Chọn Người Đại Diện */}
                    {formData.assignedWorkerIds.length > 0 && (
                        <div className="space-y-1">
                            <AppSelect
                                label="Chỉ Định Người Đại Diện Ký Xác Thực Lô (*)"
                                value={formData.representativeWorkerId}
                                onChange={(e) => setFormData({ ...formData, representativeWorkerId: e.target.value })}
                                options={[
                                    { label: '-- Chọn nông dân đại diện --', value: '' },
                                    ...workers
                                        .filter((w) => formData.assignedWorkerIds.includes(w.id))
                                        .map((w) => ({ label: `👤 ${w.fullName} (Đại diện)`, value: w.id })),
                                ]}
                                required
                            />
                        </div>
                    )}

                    {/* Nút hành động */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                        <AppButton variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                            Hủy bỏ
                        </AppButton>
                        <AppButton variant="green" type="submit" disabled={submitting} className="min-w-[120px]">
                            {submitting ? 'Đang tạo lô hàng mới' : 'Tạo Lô On-Chain'}
                        </AppButton>
                    </div>

                </form>
            </AppModal>

            {/* MODAL 2: XEM CHI TIẾT LÔ SẢN XUẤT */}
            {selectedBatch && (
                <AppModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={`Chi Tiết Lô Sản Xuất: ${selectedBatch.batchCode}`}
                >
                    <div className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Trạng thái hiện tại:</span>
                                {getStageBadge(selectedBatch.currentStage)}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Sản phẩm đầu ra:</span>
                                <span className="font-bold text-slate-900">{selectedBatch.productName} ({selectedBatch.fruitTypeName})</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Vùng trồng:</span>
                                <span className="font-semibold text-slate-800">🌾 {selectedBatch.farmAreaName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Sản lượng dự kiến:</span>
                                <span className="font-bold text-slate-900">{selectedBatch.expectedQuantity?.toLocaleString()} kg</span>
                            </div>
                        </div>

                        {/* On-Chain & IPFS Info */}
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                            <h5 className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Thông Tin Blockchain Smart Contract</span>
                            </h5>
                            <div className="font-mono text-[11px] space-y-1">
                                <p><span className="text-emerald-700">Metadata IPFS URI:</span>{' '}
                                    {selectedBatch.metadataURI ? (
                                        <a href={resolveIpfsUrl(selectedBatch.metadataURI)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedBatch.metadataURI}</a>
                                    ) : 'ipfs://...'}
                                </p>
                                <p><span className="text-emerald-700">Data Hash (Sha256):</span> {selectedBatch.dataHash || '0x...'}</p>
                                {selectedBatch.blockchainBatchId && (
                                    <p><span className="text-emerald-700">Blockchain Batch ID:</span> {selectedBatch.blockchainBatchId}</p>
                                )}
                            </div>
                        </div>

                        {/* Danh sách Công nhân */}
                        <div className="space-y-2">
                            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-slate-600" />
                                <span>Danh Sách Nông Dân Được Phân Công ({selectedBatch.workers?.length || 0})</span>
                            </h5>
                            {selectedBatch.workers && selectedBatch.workers.length > 0 ? (
                                <div className="space-y-1.5">
                                    {selectedBatch.workers.map((w) => (
                                        <div key={w.userId} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="font-semibold text-slate-800">{w.fullName}</span>
                                            </div>
                                            {w.isRepresentative && (
                                                <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-md">
                                                    Đại diện lô
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">Chưa có danh sách công nhân.</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-3">
                            <AppButton variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                                Đóng
                            </AppButton>
                        </div>

                    </div>
                </AppModal>
            )}

            {/* MODAL THÔNG BÁO TẠO LÔ THÀNH CÔNG */}
            <AppModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Tạo Lô Sản Xuất Thành Công"
            >
                <div className="text-center py-6 space-y-4">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 animate-bounce">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Giao dịch Blockchain thành công</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed whitespace-pre-line">
                        {successMessage}
                    </p>
                    <div className="pt-4 flex justify-center">
                        <AppButton variant="green" onClick={() => setIsSuccessModalOpen(false)} className="px-6 py-2">
                            Xác nhận
                        </AppButton>
                    </div>
                </div>
            </AppModal>
        </div>
    );
};
