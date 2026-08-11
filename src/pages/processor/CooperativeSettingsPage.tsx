import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Package,
    Droplets,
    Sprout,
    Boxes,
    Building2,
    RefreshCw,
    Plus,
    Trash2,
    Search,
    AlertCircle,
    CheckCircle2,
    X,
    Filter,
    Trees,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import {
    processorService,
    type FruitTypeDto,
    type ProductDto,
    type MaterialItemDto,
    type SearchWorkerResultDto,
    type DistributorDto,
} from '../../services/processorService';

type TabType = 'workers' | 'fruitTypes' | 'products' | 'pesticides' | 'fertilizers' | 'materials' | 'distributors';

export const CooperativeSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('workers');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Data States từ Backend API thực tế
    const [workers, setWorkers] = useState<SearchWorkerResultDto[]>([]);
    const [searchWorkerKeyword, setSearchWorkerKeyword] = useState<string>('');

    const [fruitTypes, setFruitTypes] = useState<FruitTypeDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);

    const [materials, setMaterials] = useState<MaterialItemDto[]>([]);
    const [distributors, setDistributors] = useState<DistributorDto[]>([]);

    // Modal States - Giống cây mới
    const [showFruitTypeModal, setShowFruitTypeModal] = useState<boolean>(false);
    const [fruitTypeFormData, setFruitTypeFormData] = useState<{ code: string; name: string; description: string }>({
        code: '',
        name: '',
        description: '',
    });

    // Modal States - Sản phẩm đóng gói mới
    const [showProductModal, setShowProductModal] = useState<boolean>(false);
    const [productFormData, setProductFormData] = useState<{
        name: string;
        shortName: string;
        fruitTypeId: string;
        groupName: string;
        variety: string;
        description: string;
    }>({
        name: '',
        shortName: '',
        fruitTypeId: '',
        groupName: 'Trái cây tươi đóng gói',
        variety: '',
        description: '',
    });

    // Modal States - Vật tư
    const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
    const [materialModalType, setMaterialModalType] = useState<'PESTICIDE' | 'FERTILIZER' | 'MATERIAL'>('PESTICIDE');
    const [materialFormData, setMaterialFormData] = useState<Partial<MaterialItemDto>>({
        code: '',
        name: '',
        unit: 'kg',
        price: 0,
        dosagePerHa: 0,
        concentration: '',
        supplier: '',
        npkRatio: '',
        quantityInStock: 0,
        note: '',
    });

    // Modal States - Nhà phân phối
    const [showDistributorModal, setShowDistributorModal] = useState<boolean>(false);
    const [distributorFormData, setDistributorFormData] = useState<Partial<DistributorDto>>({
        code: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        taxCode: '',
    });

    // Tải dữ liệu thực tế từ 100% Backend APIs
    const loadAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [workerRes, ftRes, pRes, matRes, distRes] = await Promise.allSettled([
                processorService.searchWorkers(searchWorkerKeyword),
                processorService.getFruitTypes(),
                processorService.getProducts(),
                processorService.getMaterials(),
                processorService.getDistributors(),
            ]);

            if (workerRes.status === 'fulfilled') setWorkers(workerRes.value);
            if (ftRes.status === 'fulfilled') setFruitTypes(ftRes.value);
            if (pRes.status === 'fulfilled') setProducts(pRes.value);
            if (matRes.status === 'fulfilled') setMaterials(matRes.value);
            if (distRes.status === 'fulfilled') setDistributors(distRes.value);
        } catch (err) {
            console.error('Lỗi lấy dữ liệu từ Backend:', err);
            setError('Không thể kết nối đến Backend API để lấy danh mục.');
        } finally {
            setLoading(false);
        }
    }, [searchWorkerKeyword]);

    useEffect(() => {
        void loadAllData();
    }, [loadAllData]);

    const handleSearchWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await processorService.searchWorkers(searchWorkerKeyword);
            setWorkers(data);
        } catch (err) {
            console.error(err);
            setError('Không tìm thấy thông tin nhân công.');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteWorker = async (workerId: string) => {
        try {
            await processorService.sendWorkerInvitation(workerId);
            setSuccessMsg('Đã gửi lời mời liên kết tới nhân công thành công!');
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Gửi lời mời liên kết thất bại.');
        }
    };

    // Thêm mới Giống Cây
    const handleSaveFruitType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fruitTypeFormData.name || !fruitTypeFormData.code) {
            setError('Vui lòng nhập đầy đủ Mã viết tắt và Tên giống cây!');
            return;
        }
        try {
            await processorService.createFruitType({
                name: fruitTypeFormData.name.trim(),
                code: fruitTypeFormData.code.trim().toUpperCase(),
                description: fruitTypeFormData.description?.trim(),
            });
            setSuccessMsg('Thêm giống cây trồng mới vào Database thành công!');
            setShowFruitTypeModal(false);
            setFruitTypeFormData({ code: '', name: '', description: '' });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Thêm mới giống cây vào Backend thất bại. Mã giống cây có thể đã tồn tại.');
        }
    };

    // Thêm mới Sản phẩm thương mại / Đóng gói
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productFormData.name) {
            setError('Vui lòng nhập Tên sản phẩm!');
            return;
        }
        try {
            await processorService.createProduct({
                name: productFormData.name.trim(),
                shortName: productFormData.shortName?.trim(),
                fruitTypeId: productFormData.fruitTypeId || undefined,
                groupName: productFormData.groupName?.trim(),
                variety: productFormData.variety?.trim(),
                description: productFormData.description?.trim(),
            });
            setSuccessMsg('Thêm mới Sản phẩm thương mại vào Database thành công!');
            setShowProductModal(false);
            setProductFormData({
                name: '',
                shortName: '',
                fruitTypeId: '',
                groupName: 'Trái cây tươi đóng gói',
                variety: '',
                description: '',
            });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Không thể tạo sản phẩm mới trên Backend.');
        }
    };

    const handleSaveMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFormData.name || !materialFormData.code) {
            setError('Vui lòng điền đầy đủ Mã và Tên vật tư!');
            return;
        }
        try {
            await processorService.createMaterial({
                ...materialFormData,
                itemType: materialModalType,
            });
            setSuccessMsg(`Thêm mới thành công vào Database Backend!`);
            setShowMaterialModal(false);
            setMaterialFormData({ code: '', name: '', unit: 'kg', price: 0, dosagePerHa: 0, concentration: '', supplier: '', npkRatio: '', quantityInStock: 0, note: '' });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Không thể tạo vật tư mới trong Backend.');
        }
    };

    const handleDeleteMaterial = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mục này khỏi Cơ sở dữ liệu?')) return;
        try {
            await processorService.deleteMaterial(id);
            setSuccessMsg('Đã xóa dữ liệu thành công khỏi Backend.');
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Xóa thất bại từ Backend.');
        }
    };

    const handleSaveDistributor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!distributorFormData.name || !distributorFormData.code) {
            setError('Vui lòng nhập đầy đủ Mã và Tên nhà phân phối!');
            return;
        }
        try {
            await processorService.createDistributor(distributorFormData);
            setSuccessMsg('Lưu thông tin Nhà phân phối mới vào Database thành công!');
            setShowDistributorModal(false);
            setDistributorFormData({ code: '', name: '', phone: '', email: '', address: '', taxCode: '' });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Lưu Nhà phân phối vào Backend thất bại.');
        }
    };

    const handleDeleteDistributor = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Nhà phân phối này khỏi Database Backend?')) return;
        try {
            await processorService.deleteDistributor(id);
            setSuccessMsg('Đã xóa Nhà phân phối thành công.');
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Xóa Nhà phân phối thất bại.');
        }
    };

    // Phân loại vật tư theo từng sub-tab
    const pesticides = materials.filter((m) => m.itemType === 'PESTICIDE');
    const fertilizers = materials.filter((m) => m.itemType === 'FERTILIZER');
    const rawMaterials = materials.filter((m) => m.itemType === 'MATERIAL' || m.itemType === 'EQUIPMENT');

    // Cột bảng Nhân công
    const workerColumns: Column<SearchWorkerResultDto>[] = [
        { header: 'Họ và Tên', key: 'fullName' },
        { header: 'Email', key: 'email' },
        { header: 'Số Điện Thoại', key: 'phone' },
        {
            header: 'Ví Blockchain',
            key: 'walletAddress',
            render: (w) => (
                <span className="font-mono text-xs text-slate-500 truncate max-w-[120px] block">
                    {w.walletAddress ? `${w.walletAddress.slice(0, 6)}...${w.walletAddress.slice(-4)}` : 'Chưa cập nhật'}
                </span>
            ),
        },
        {
            header: 'Trạng Thái Liên Kết',
            key: 'linkStatus',
            render: (w) => {
                const statusMap: Record<string, { label: string; style: string }> = {
                    ACCEPTED: { label: 'Đã liên kết', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    PENDING: { label: 'Đang chờ xác nhận', style: 'bg-amber-100 text-amber-800 border-amber-300' },
                    REJECTED: { label: 'Từ chối', style: 'bg-red-100 text-red-800 border-red-300' },
                    NONE: { label: 'Chưa liên kết', style: 'bg-slate-100 text-slate-700 border-slate-300' },
                };
                const st = statusMap[w.linkStatus] || statusMap.NONE;
                return <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${st.style}`}>{st.label}</span>;
            },
        },
        {
            header: 'Thao Tác',
            key: 'actions',
            align: 'center',
            render: (w) => (
                w.linkStatus === 'NONE' ? (
                    <button
                        onClick={() => handleInviteWorker(w.workerId)}
                        className="px-3 py-1.5 bg-[#15803d] hover:bg-green-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Mời liên kết</span>
                    </button>
                ) : (
                    <span className="text-xs text-slate-400 font-medium">--</span>
                )
            ),
        },
    ];

    // Cột bảng Trái cây / Giống cây
    const fruitColumns: Column<FruitTypeDto>[] = [
        { header: 'Mã Viết Tắt (Prefix)', key: 'code' },
        { header: 'Tên Giống Cây Trồng', key: 'name' },
        { header: 'Mô Tả Ghi Chú', key: 'description' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    // Cột bảng Sản phẩm
    const productColumns: Column<ProductDto>[] = [
        { header: 'Tên Sản Phẩm', key: 'name' },
        { header: 'Mã / Tên Tắt', key: 'shortName' },
        { header: 'Chủng Loại / Giống', key: 'variety' },
        { header: 'Nhóm Sản Phẩm', key: 'groupName' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    // Cột bảng Nông dược
    const pesticideColumns: Column<MaterialItemDto>[] = [
        { header: 'Mã Nông Dược', key: 'code' },
        { header: 'Tên Nông Dược', key: 'name' },
        { header: 'Nồng Độ / Hàm Lượng', key: 'concentration', render: (m) => m.concentration || '-' },
        { header: 'Liều Lượng / Ha', key: 'dosagePerHa', render: (m) => (m.dosagePerHa ? `${m.dosagePerHa} ${m.unit}/ha` : '-') },
        { header: 'Đơn Vị', key: 'unit' },
        { header: 'Đơn Giá (VNĐ)', key: 'price', render: (m) => (m.price ? m.price.toLocaleString('vi-VN') : '0') },
        { header: 'Nhà Cung Cấp', key: 'supplier', render: (m) => m.supplier || '-' },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (m) => (
                <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Cột bảng Phân bón
    const fertilizerColumns: Column<MaterialItemDto>[] = [
        { header: 'Mã Phân Bón', key: 'code' },
        { header: 'Tên Phân Bón', key: 'name' },
        { header: 'Tỷ Lệ NPK', key: 'npkRatio', render: (m) => m.npkRatio || '-' },
        { header: 'Liều Lượng Bón / Ha', key: 'dosagePerHa', render: (m) => (m.dosagePerHa ? `${m.dosagePerHa} ${m.unit}/ha` : '-') },
        { header: 'Đơn Vị Tính', key: 'unit' },
        { header: 'Giá Thành (VNĐ)', key: 'price', render: (m) => (m.price ? m.price.toLocaleString('vi-VN') : '0') },
        { header: 'Nhà Cung Cấp', key: 'supplier', render: (m) => m.supplier || '-' },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (m) => (
                <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Cột bảng Nguyên vật liệu
    const materialColumns: Column<MaterialItemDto>[] = [
        { header: 'Mã Nguyên Liệu', key: 'code' },
        { header: 'Tên Vật Tư / Nguyên Liệu', key: 'name' },
        { header: 'Đơn Vị', key: 'unit' },
        { header: 'Đơn Giá (VNĐ)', key: 'price', render: (m) => (m.price ? m.price.toLocaleString('vi-VN') : '0') },
        { header: 'Tồn Kho Bán Đầu', key: 'quantityInStock', render: (m) => `${m.quantityInStock || 0} ${m.unit}` },
        { header: 'Ghi Chú', key: 'note', render: (m) => m.note || '-' },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (m) => (
                <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Cột bảng Nhà phân phối
    const distributorColumns: Column<DistributorDto>[] = [
        { header: 'Mã NPP', key: 'code' },
        { header: 'Tên Nhà Phân Phối / Đối Tác', key: 'name' },
        { header: 'Số Điện Thoại', key: 'phone' },
        { header: 'Email Liên Hệ', key: 'email', render: (d) => d.email || '-' },
        { header: 'Địa Chỉ Trụ Sở', key: 'address' },
        { header: 'Mã Số Thuế', key: 'taxCode', render: (d) => d.taxCode || '-' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (d) => (
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                    {d.status === 'ACTIVE' ? 'Đang hợp tác' : 'Ngưng hợp tác'}
                </span>
            ),
        },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (d) => (
                <button
                    onClick={() => handleDeleteDistributor(d.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa nhà phân phối"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    const tabNavigation = [
        { id: 'workers', label: 'Nhân Công', icon: Users, count: workers.length },
        { id: 'fruitTypes', label: 'Giống Cây', icon: Trees, count: fruitTypes.length },
        { id: 'products', label: 'Sản Phẩm', icon: Package, count: products.length },
        { id: 'pesticides', label: 'Nông Dược', icon: Droplets, count: pesticides.length },
        { id: 'fertilizers', label: 'Phân Bón', icon: Sprout, count: fertilizers.length },
        { id: 'materials', label: 'Nguyên Vật Liệu', icon: Boxes, count: rawMaterials.length },
        { id: 'distributors', label: 'Nhà Phân Phối', icon: Building2, count: distributors.length },
    ];

    return (
        <div className="space-y-6">
            {/* Header Trang */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span>Thiết Lập Danh Mục Hợp Tác Xã</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        Quản lý lưu trữ trực tiếp Database Backend cho Nhân công, Giống cây, Sản phẩm, Nông dược, Phân bón, Nguyên vật liệu và Nhà phân phối.
                    </p>
                </div>
                <button
                    onClick={loadAllData}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer w-fit"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới dữ liệu</span>
                </button>
            </div>

            {/* Thông báo Lỗi & Thành công */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>⚠️ {error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>✅ {successMsg}</span>
                </div>
            )}

            {/* Thanh Tab Chuyển Đổi Các Trang Con */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-2 overflow-x-auto">
                {tabNavigation.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                                    ? 'bg-[#15803d] text-white shadow-md shadow-green-700/20'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: NHÂN CÔNG */}
            {activeTab === 'workers' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                                <span>Danh Sách Nhân Công & Nông Dân Liên Kết ({workers.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm từ Database backend để mời liên kết vào Hợp tác xã.</p>
                        </div>

                        <form onSubmit={handleSearchWorker} className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, SĐT, email..."
                                    value={searchWorkerKeyword}
                                    onChange={(e) => setSearchWorkerKeyword(e.target.value)}
                                    className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-3.5 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Tìm kiếm</span>
                            </button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải thông tin nhân công...</div>
                    ) : workers.length > 0 ? (
                        <AppTable columns={workerColumns} data={workers} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Không tìm thấy nhân công nào trong hệ thống.</div>
                    )}
                </div>
            )}

            {/* TAB 2: GIỐNG CÂY TRỒNG */}
            {activeTab === 'fruitTypes' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Trees className="w-5 h-5 text-emerald-600" />
                                <span>Danh Mục Giống Cây Trồng / Loại Trái Cây ({fruitTypes.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý các giống cây trồng/loại hoa quả được canh tác tại Hợp tác xã (lưu tại bảng FruitTypes).</p>
                        </div>
                        <button
                            onClick={() => {
                                setFruitTypeFormData({ code: '', name: '', description: '' });
                                setShowFruitTypeModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Giống Cây Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh mục giống cây...</div>
                    ) : fruitTypes.length > 0 ? (
                        <AppTable columns={fruitColumns} data={fruitTypes} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có giống cây nào trong Database. Hãy bấm nút "Thêm Giống Cây Mới".</div>
                    )}
                </div>
            )}

            {/* TAB 3: SẢN PHẨM ĐÓNG GÓI / THƯƠNG MẠI */}
            {activeTab === 'products' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                <span>Danh Mục Sản Phẩm Đóng Gói / Thương Mại ({products.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý các sản phẩm chế biến/đóng gói hoàn thiện đưa ra thị trường (bảng Products).</p>
                        </div>
                        <button
                            onClick={() => {
                                setProductFormData({
                                    name: '',
                                    shortName: '',
                                    fruitTypeId: fruitTypes[0]?.id || '',
                                    groupName: 'Trái cây tươi đóng gói',
                                    variety: 'Hạng A',
                                    description: '',
                                });
                                setShowProductModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Sản Phẩm Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-8 text-center text-slate-500 text-sm">Đang tải danh sách sản phẩm...</div>
                    ) : products.length > 0 ? (
                        <AppTable columns={productColumns} data={products} showSTT={true} />
                    ) : (
                        <div className="py-8 text-center text-slate-400 italic text-sm">Chưa có sản phẩm thương mại nào trong Database. Bấm "Thêm Sản Phẩm Mới" để tạo.</div>
                    )}
                </div>
            )}

            {/* TAB 4: NÔNG DƯỢC */}
            {activeTab === 'pesticides' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-purple-600" />
                                <span>Danh Mục Nông Dược & Thuốc Bảo Vệ Thực Vật ({pesticides.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Dữ liệu được lưu trữ trực tiếp vào bảng MaterialItems trên Server Backend.</p>
                        </div>
                        <button
                            onClick={() => {
                                setMaterialModalType('PESTICIDE');
                                setMaterialFormData({ code: `ND-${Date.now().toString().slice(-4)}`, name: '', unit: 'Lít', price: 0, dosagePerHa: 0, concentration: '', supplier: '', note: '' });
                                setShowMaterialModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Nông Dược Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh mục nông dược...</div>
                    ) : pesticides.length > 0 ? (
                        <AppTable columns={pesticideColumns} data={pesticides} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có thông tin nông dược trong Database. Hãy bấm "Thêm Nông Dược Mới".</div>
                    )}
                </div>
            )}

            {/* TAB 5: PHÂN BÓN */}
            {activeTab === 'fertilizers' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-emerald-600" />
                                <span>Danh Mục Phân Bón ({fertilizers.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý định mức, tỷ lệ NPK được đồng bộ Backend.</p>
                        </div>
                        <button
                            onClick={() => {
                                setMaterialModalType('FERTILIZER');
                                setMaterialFormData({ code: `PB-${Date.now().toString().slice(-4)}`, name: '', unit: 'kg', price: 0, dosagePerHa: 0, npkRatio: '16-16-8', supplier: '', note: '' });
                                setShowMaterialModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Phân Bón Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh mục phân bón...</div>
                    ) : fertilizers.length > 0 ? (
                        <AppTable columns={fertilizerColumns} data={fertilizers} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có dữ liệu phân bón trong Database.</div>
                    )}
                </div>
            )}

            {/* TAB 6: NGUYÊN VẬT LIỆU */}
            {activeTab === 'materials' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-amber-600" />
                                <span>Danh Mục Nguyên Vật Liệu & Dụng Cụ ({rawMaterials.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Bao bì, túi bọc hoa quả, thùng carton, tem nhãn QR lưu trữ trên Backend Server.</p>
                        </div>
                        <button
                            onClick={() => {
                                setMaterialModalType('MATERIAL');
                                setMaterialFormData({ code: `NVL-${Date.now().toString().slice(-4)}`, name: '', unit: 'Cái', price: 0, quantityInStock: 0, supplier: '', note: '' });
                                setShowMaterialModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Nguyên Vật Liệu</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải nguyên vật liệu...</div>
                    ) : rawMaterials.length > 0 ? (
                        <AppTable columns={materialColumns} data={rawMaterials} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có nguyên vật liệu nào trong Database.</div>
                    )}
                </div>
            )}

            {/* TAB 7: NHÀ PHÂN PHỐI */}
            {activeTab === 'distributors' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <span>Danh Sách Đối Tác Nhà Phân Phối ({distributors.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Lưu trữ trực tiếp bảng distributors trong Cơ sở dữ liệu Backend SQL Server.</p>
                        </div>
                        <button
                            onClick={() => setShowDistributorModal(true)}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Nhà Phân Phối Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh sách nhà phân phối từ Database Backend...</div>
                    ) : distributors.length > 0 ? (
                        <AppTable columns={distributorColumns} data={distributors} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có nhà phân phối nào trong Database. Bấm "Thêm Nhà Phân Phối Mới" để bắt đầu.</div>
                    )}
                </div>
            )}

            {/* MODAL THÊM GIỐNG CÂY MỚI */}
            {showFruitTypeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Trees className="w-5 h-5 text-emerald-600" />
                                <span>🌳 Thêm Giống Cây Trồng Mới</span>
                            </h3>
                            <button onClick={() => setShowFruitTypeModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveFruitType} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Giống Cây / Tiền Tố (Viết hoa) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: CAM, BUOI, SAURIENG, XOAI..."
                                    value={fruitTypeFormData.code}
                                    onChange={(e) => setFruitTypeFormData({ ...fruitTypeFormData, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">Mã này sẽ dùng làm tiền tố cho Mã lô sản xuất (VD: CAM-2026-001)</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Giống Cây / Loại Trái Cây *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Cam Sành Tam Bình, Sầu Riêng Ri6, Bưởi Da Xanh..."
                                    value={fruitTypeFormData.name}
                                    onChange={(e) => setFruitTypeFormData({ ...fruitTypeFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả / Đặc Tính Giống Cây</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ghi chú về nguồn gốc, quy chuẩn VietGAP, thời gian sinh trưởng..."
                                    value={fruitTypeFormData.description}
                                    onChange={(e) => setFruitTypeFormData({ ...fruitTypeFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowFruitTypeModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Giống Cây Mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM SẢN PHẨM ĐÓNG GÓI / THƯƠNG MẠI */}
            {showProductModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                <span>📦 Thêm Sản Phẩm Đóng Gói / Thương Mại Mới</span>
                            </h3>
                            <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Giống Cây Nguyên Liệu Trồng</label>
                                <select
                                    value={productFormData.fruitTypeId}
                                    onChange={(e) => setProductFormData({ ...productFormData, fruitTypeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                >
                                    <option value="">-- Không chọn / Tất cả --</option>
                                    {fruitTypes.map((ft) => (
                                        <option key={ft.id} value={ft.id}>
                                            {ft.name} ({ft.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Sản Phẩm Đóng Gói Thương Mại *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Cam Sành Tam Bình Hộp 5kg, Nước ép cam 330ml..."
                                    value={productFormData.name}
                                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã / Tên Viết Tắt</label>
                                    <input
                                        type="text"
                                        placeholder="CAM-BOX-5KG..."
                                        value={productFormData.shortName}
                                        onChange={(e) => setProductFormData({ ...productFormData, shortName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm Sản Phẩm</label>
                                    <input
                                        type="text"
                                        placeholder="Trái cây tươi đóng gói, Nước ép..."
                                        value={productFormData.groupName}
                                        onChange={(e) => setProductFormData({ ...productFormData, groupName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Chủng Loại / Giống / Hạng Chất Lượng</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Hạng A, Loại 1 VietGAP, Xuất khẩu..."
                                    value={productFormData.variety}
                                    onChange={(e) => setProductFormData({ ...productFormData, variety: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả Quy Cách Đóng Gói & Bảo Quản</label>
                                <textarea
                                    rows={3}
                                    placeholder="Đóng thùng carton 5kg, bảo quản nhiệt độ 10-12 độ C, dán tem QR truy xuất Nguồn gốc..."
                                    value={productFormData.description}
                                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowProductModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Sản Phẩm Mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM NÔNG DƯỢC / PHÂN BÓN / NVL */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                {materialModalType === 'PESTICIDE'
                                    ? '🧪 Thêm Nông Dược / Thuốc BVTV Mới'
                                    : materialModalType === 'FERTILIZER'
                                        ? '🌾 Thêm Phân Bón Mới'
                                        : '📦 Thêm Nguyên Vật Liệu / Bao Bì Mới'}
                            </h3>
                            <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMaterial} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Vật Tư *</label>
                                    <input
                                        type="text"
                                        required
                                        value={materialFormData.code || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Vị Tính *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="kg, Lít, Chai, Bao..."
                                        value={materialFormData.unit || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Vật Tư / Tên Sản Phẩm *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Phân NPK 16-16-8, Thuốc trừ sâu Anvil..."
                                    value={materialFormData.name || ''}
                                    onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            {materialModalType === 'PESTICIDE' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nồng Độ / Hàm Lượng Active</label>
                                        <input
                                            type="text"
                                            placeholder="5SC, 250EC..."
                                            value={materialFormData.concentration || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, concentration: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Liều Lượng Khuyên Dùng / Ha</label>
                                        <input
                                            type="number"
                                            placeholder="Số lượng"
                                            value={materialFormData.dosagePerHa || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, dosagePerHa: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {materialModalType === 'FERTILIZER' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Tỷ Lệ NPK</label>
                                        <input
                                            type="text"
                                            placeholder="16-16-8, 20-20-15..."
                                            value={materialFormData.npkRatio || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, npkRatio: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Liều Lượng Bón / Ha</label>
                                        <input
                                            type="number"
                                            placeholder="Số lượng"
                                            value={materialFormData.dosagePerHa || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, dosagePerHa: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Giá Ước Tính (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={materialFormData.price || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, price: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhà Cung Cấp</label>
                                    <input
                                        type="text"
                                        placeholder="Công ty SX..."
                                        value={materialFormData.supplier || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, supplier: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowMaterialModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Vào Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM NHÀ PHÂN PHỐI (LƯU DB BACKEND) */}
            {showDistributorModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">🏢 Thêm Nhà Phân Phối Mới Vào Database</h3>
                            <button onClick={() => setShowDistributorModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDistributor} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Nhà Phân Phối *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="NPP-001..."
                                        value={distributorFormData.code || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại *</label>
                                    <input
                                        type="text"
                                        required
                                        value={distributorFormData.phone || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Nhà Phân Phối / Doanh Nghiệp Thu Mua *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Công ty ABC, Chuỗi siêu thị XYZ..."
                                    value={distributorFormData.name || ''}
                                    onChange={(e) => setDistributorFormData({ ...distributorFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
                                    <input
                                        type="email"
                                        placeholder="contact@company.com"
                                        value={distributorFormData.email || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế</label>
                                    <input
                                        type="text"
                                        placeholder="0312345678"
                                        value={distributorFormData.taxCode || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, taxCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Trụ Sở *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh..."
                                    value={distributorFormData.address || ''}
                                    onChange={(e) => setDistributorFormData({ ...distributorFormData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowDistributorModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Vào Database Backend
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
