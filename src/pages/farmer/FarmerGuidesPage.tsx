import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Search,
    RefreshCw,
    Activity,
    Layers,
    Building2,
    ShieldCheck,
    CheckCircle2,
    Clock,
    FileText,
    ChevronRight,
    AlertCircle,
    Info,
    Printer,
    Phone,
    Mail,
    ArrowRight,
    ListFilter,
    PackageCheck,
    Truck,
    Sprout
} from 'lucide-react';
import { AxiosError } from 'axios';
import {
    farmerService,
    type FarmerProductionProcess,
    type FarmerProcessStep
} from '../../services/farmerService';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';

// Cấu hình hiển thị theo các Giai đoạn (BatchStage) EF Core Enum
const STAGE_MAP: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ElementType }> = {
    STAGE_PLANTING: { label: '1. Xuống Giống / Canh Tác', bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', icon: Sprout },
    STAGE_CARE: { label: '2. Chăm Sóc & Phun Bón', bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500', icon: Activity },
    STAGE_HARVESTED: { label: '3. Thu Hoạch', bg: 'bg-purple-100 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500', icon: Clock },
    STAGE_RECEIVED: { label: '4. Tiếp Nhận Kho', bg: 'bg-blue-100 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500', icon: Layers },
    STAGE_PROCESSED: { label: '5. Sơ Chế & Khử Trùng', bg: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500', icon: RefreshCw },
    STAGE_SORTED: { label: '6. Phân Loại Nông Sản', bg: 'bg-sky-100 border-sky-200', text: 'text-sky-800', dot: 'bg-sky-500', icon: ListFilter },
    INSPECTION_PASSED: { label: '7. Kiểm Định Chất Lượng', bg: 'bg-teal-100 border-teal-200', text: 'text-teal-800', dot: 'bg-teal-500', icon: ShieldCheck },
    PACKAGED: { label: '8. Đóng Gói & Dán Tem', bg: 'bg-orange-100 border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500', icon: PackageCheck },
    STAGE_SHIPPING: { label: '9. Vận Chuyển', bg: 'bg-cyan-100 border-cyan-200', text: 'text-cyan-800', dot: 'bg-cyan-500', icon: Truck },
    READY_FOR_SALE: { label: '10. Hoàn Tất Lên Kệ', bg: 'bg-green-100 border-green-200', text: 'text-green-800', dot: 'bg-green-500', icon: CheckCircle2 }
};

export const FarmerGuidesPage: React.FC = () => {
    const navigate = useNavigate();

    // State lưu dữ liệu từ API Backend
    const [processes, setProcesses] = useState<FarmerProductionProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State lọc & chọn quy trình
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCoopId, setSelectedCoopId] = useState<string>('ALL');
    const [selectedStage, setSelectedStage] = useState<string>('ALL');
    const [selectedProcess, setSelectedProcess] = useState<FarmerProductionProcess | null>(null);

    // Modal xem bản in tóm tắt
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

    // Call API Backend lấy quy trình từ HTX đã liên kết
    const fetchGuides = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await farmerService.getProcessGuides();
            setProcesses(data || []);
            if (data && data.length > 0) {
                setSelectedProcess(data[0]);
            } else {
                setSelectedProcess(null);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải hướng dẫn quy trình:', errorObj);
            setError(errorObj.response?.data?.message || 'Không thể kết nối Backend API lấy hướng dẫn quy trình.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchGuides();
    }, [fetchGuides]);

    // Danh sách các Hợp tác xã duy nhất đã liên kết
    const linkedCooperatives = useMemo(() => {
        const coopMap = new Map<string, { id: string; name: string; phone?: string; email?: string }>();
        processes.forEach((p) => {
            if (p.processorId && !coopMap.has(p.processorId)) {
                coopMap.set(p.processorId, {
                    id: p.processorId,
                    name: p.processorName || 'Hợp tác xã',
                    phone: p.processorPhone,
                    email: p.processorEmail
                });
            }
        });
        return Array.from(coopMap.values());
    }, [processes]);

    // Thống kê nhanh KPI
    const stats = useMemo(() => {
        const totalProcesses = processes.length;
        const totalCoops = linkedCooperatives.length;
        const totalSteps = processes.reduce((acc, p) => acc + (p.steps?.length || 0), 0);
        return { totalProcesses, totalCoops, totalSteps };
    }, [processes, linkedCooperatives]);

    // Lọc danh sách quy trình theo từ khóa & HTX
    const filteredProcesses = useMemo(() => {
        return processes.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                p.processorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.steps.some((s) => s.stepName.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCoop = selectedCoopId === 'ALL' || p.processorId === selectedCoopId;

            const matchesStage =
                selectedStage === 'ALL' ||
                p.steps.some((s) => (s.stage || '').toUpperCase().includes(selectedStage.toUpperCase()));

            return matchesSearch && matchesCoop && matchesStage;
        });
    }, [processes, searchTerm, selectedCoopId, selectedStage]);

    // Xử lý in / lưu PDF hướng dẫn
    const handlePrintGuide = () => {
        window.print();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Trang Hướng Dẫn Quy Trình */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Chuẩn Tiêu Chuẩn HTX
                        </span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2 mt-2">
                        <BookOpen className="w-7 h-7 text-emerald-600" />
                        Hướng Dẫn Quy Trình Kỹ Thuật Canh Tác
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Chỉ hiển thị các mẫu quy trình và chuẩn kỹ thuật do **Hợp tác xã (HTX) đã liên kết** phát hành. Nông dân thực hiện đúng quy trình để đạt chất lượng VietGAP/GlobalGAP.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AppButton
                        variant="outline"
                        onClick={fetchGuides}
                        isLoading={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Làm mới
                    </AppButton>
                    <AppButton
                        onClick={() => navigate('/farmer/logs')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> + Ghi Nhật Ký
                    </AppButton>
                </div>
            </div>

            {/* Thống kê KPI & Danh sách HTX Đã Liên Kết */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hợp Tác Xã Liên Kết</p>
                        <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.totalCoops} HTX</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Đã xác nhận liên kết</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Building2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mẫu Quy Trình Khả Dụng</p>
                        <h3 className="text-2xl font-black text-blue-700 mt-1">{stats.totalProcesses} Quy trình</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Được ban hành chính thức</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Bước Kỹ Thuật</p>
                        <h3 className="text-2xl font-black text-purple-700 mt-1">{stats.totalSteps} Công đoạn</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Hướng dẫn chi tiết thực địa</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Thông báo danh sách HTX Đã Liên Kết */}
            {linkedCooperatives.length > 0 && (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600 rounded-xl">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Hợp tác xã đang cung cấp quy trình cho bạn:
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                {linkedCooperatives.map((c) => (
                                    <div key={c.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-xl text-xs font-bold border border-slate-700">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>{c.name}</span>
                                        {c.phone && (
                                            <span className="text-slate-400 font-normal text-[11px] flex items-center gap-1 border-l border-slate-700 pl-2">
                                                <Phone className="w-3 h-3" /> {c.phone}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Lỗi nếu có */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Khung Tìm Kiếm & Lọc */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên quy trình, công đoạn..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Lọc theo HTX */}
                    {linkedCooperatives.length > 1 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <span>HTX:</span>
                            <select
                                value={selectedCoopId}
                                onChange={(e) => setSelectedCoopId(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="ALL">Tất cả HTX liên kết</option>
                                {linkedCooperatives.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Lọc theo Giai đoạn */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <span>Giai đoạn:</span>
                        <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">Tất cả công đoạn</option>
                            <option value="PLANTING">1. Canh tác / Xuống giống</option>
                            <option value="CARE">2. Chăm sóc & Phun bón</option>
                            <option value="HARVESTED">3. Thu hoạch</option>
                            <option value="PROCESSED">4. Sơ chế / Chế biến</option>
                            <option value="INSPECTION_PASSED">5. Kiểm định chất lượng</option>
                            <option value="PACKAGED">6. Đóng gói & Dán tem</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Nội dung chính: Danh sách Quy trình (Cột Trái) & Detail Timeline (Cột Phải) */}
            {loading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Đang tải danh sách quy trình kỹ thuật từ HTX...</p>
                </div>
            ) : filteredProcesses.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                    <Info className="w-12 h-12 text-amber-500 mx-auto" />
                    <h3 className="text-slate-800 font-bold text-base">Chưa tìm thấy hướng dẫn quy trình phù hợp</h3>
                    <p className="text-slate-500 text-xs max-w-md mx-auto">
                        Tài khoản nông dân của bạn hiện chưa nhận được mẫu quy trình từ Hợp tác xã liên kết hoặc không có quy trình khớp với bộ lọc.
                    </p>
                    <div className="pt-2">
                        <AppButton onClick={() => navigate('/farmer/batches')} className="bg-emerald-600 text-white border-0 text-xs">
                            Xem Lô Phân Công & Liên Kết
                        </AppButton>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột trái: Danh sách Quy trình dạng Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Mẫu Quy Trình ({filteredProcesses.length})
                            </span>
                        </div>

                        {filteredProcesses.map((p) => {
                            const isSelected = selectedProcess?.id === p.id;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProcess(p)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${isSelected
                                        ? 'bg-emerald-50/70 border-emerald-600 shadow-md ring-1 ring-emerald-500'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:shadow-xs'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-600" />
                                    )}

                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1.5">
                                                <Building2 className="w-3 h-3" /> {p.processorName}
                                            </span>
                                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{p.name}</h4>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                        {p.description || 'Chưa có mô tả kỹ thuật.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                                            <strong className="text-slate-700">{p.steps?.length || 0}</strong> công đoạn
                                        </span>
                                        <span>Ngày đăng: {p.createdAt}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Cột phải: Chi tiết Quy trình đang được chọn */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                        {selectedProcess ? (
                            <>
                                {/* Header Quy trình được chọn */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                                <Building2 className="w-3.5 h-3.5" /> {selectedProcess.processorName}
                                            </span>
                                            <span className="text-xs text-slate-400">Ban hành: {selectedProcess.createdAt}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mt-2">{selectedProcess.name}</h3>
                                        <p className="text-xs font-medium text-slate-600 mt-1">
                                            {selectedProcess.description || 'Chưa có mô tả tổng quan về quy trình này.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsPreviewModalOpen(true)}
                                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                            title="Xem bản tóm tắt để in"
                                        >
                                            <Printer className="w-4 h-4 text-slate-600" /> Bản In Sổ Tay
                                        </button>
                                    </div>
                                </div>

                                {/* Thông tin liên hệ HTX */}
                                {(selectedProcess.processorPhone || selectedProcess.processorEmail) && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                                        <span className="font-bold text-slate-800">Hỗ trợ kỹ thuật HTX:</span>
                                        {selectedProcess.processorPhone && (
                                            <span className="flex items-center gap-1 text-slate-700">
                                                <Phone className="w-3.5 h-3.5 text-emerald-600" /> {selectedProcess.processorPhone}
                                            </span>
                                        )}
                                        {selectedProcess.processorEmail && (
                                            <span className="flex items-center gap-1 text-slate-700">
                                                <Mail className="w-3.5 h-3.5 text-blue-600" /> {selectedProcess.processorEmail}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Timeline Visualizer Công Đoạn Kỹ Thuật */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-emerald-600" /> Các Công Đoạn Kỹ Thuật Bắt Buộc ({selectedProcess.steps?.length || 0} Bước)
                                        </h4>
                                    </div>

                                    {selectedProcess.steps && selectedProcess.steps.length > 0 ? (
                                        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                                            {selectedProcess.steps.map((step, idx) => {
                                                const stageInfo = STAGE_MAP[step.stage] || {
                                                    label: step.stage,
                                                    bg: 'bg-slate-100 border-slate-200',
                                                    text: 'text-slate-800',
                                                    dot: 'bg-slate-500',
                                                    icon: Activity
                                                };
                                                const IconComp = stageInfo.icon;

                                                return (
                                                    <div key={step.id || idx} className="relative flex items-start gap-4 group">
                                                        {/* Step Circle Badge */}
                                                        <div className="absolute -left-[35px] top-1 w-7 h-7 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-xs font-black text-emerald-700 shadow-xs">
                                                            {step.orderIndex || idx + 1}
                                                        </div>

                                                        {/* Step Detail Card */}
                                                        <div className="flex-1 bg-slate-50 group-hover:bg-emerald-50/40 p-4.5 rounded-2xl border border-slate-200 transition-all space-y-2">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 ${stageInfo.bg} ${stageInfo.text}`}>
                                                                        <IconComp className="w-3.5 h-3.5" />
                                                                        {stageInfo.label}
                                                                    </span>
                                                                    <h5 className="font-black text-sm text-slate-900">{step.stepName}</h5>
                                                                </div>

                                                                <span className="text-[11px] font-bold text-slate-400">
                                                                    Thứ tự bước #{step.orderIndex}
                                                                </span>
                                                            </div>

                                                            {/* Step Detailed Description */}
                                                            {step.description ? (
                                                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                                                                    <strong className="text-slate-900 block mb-1 text-[11px] uppercase font-bold text-emerald-800">
                                                                        Yêu cầu kỹ thuật & Hướng dẫn:
                                                                    </strong>
                                                                    {step.description}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 italic">
                                                                    Thực hiện theo tiêu chuẩn quy định của ban quản lý HTX.
                                                                </p>
                                                            )}

                                                            {/* Action Button: Ghi nhật ký cho công đoạn này */}
                                                            <div className="pt-2 flex justify-end">
                                                                <button
                                                                    onClick={() => navigate('/farmer/logs')}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <span>Ghi nhật ký cho bước này</span>
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl">
                                            Quy trình này chưa được thiết lập chi tiết các bước công việc.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="py-24 text-center text-slate-400 text-xs italic space-y-2">
                                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                                <p>Vui lòng chọn một quy trình từ danh sách bên trái để xem chi tiết hướng dẫn.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Bản In Sổ Tay Hướng Dẫn Kỹ Thuật */}
            <AppModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title={selectedProcess ? `Sổ Tay Kỹ Thuật - ${selectedProcess.name}` : ''}
            >
                {selectedProcess && (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5 text-emerald-900">
                            <h4 className="font-black text-sm text-emerald-950">{selectedProcess.name}</h4>
                            <p>Đơn vị phát hành: <strong className="font-bold">{selectedProcess.processorName}</strong></p>
                            <p>Ngày cập nhật: <strong>{selectedProcess.createdAt}</strong></p>
                            {selectedProcess.description && <p className="italic text-emerald-800">{selectedProcess.description}</p>}
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            <h5 className="text-xs font-bold text-slate-700 uppercase">Danh Sách Công Đoạn Chuẩn:</h5>
                            {selectedProcess.steps.map((step) => (
                                <div key={step.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                    <div className="flex items-center justify-between font-bold text-slate-800">
                                        <span>Bước {step.orderIndex}: {step.stepName}</span>
                                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{step.stage}</span>
                                    </div>
                                    {step.description && (
                                        <p className="text-slate-600 pt-1 leading-relaxed">{step.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">
                            <button
                                onClick={handlePrintGuide}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" /> In Sổ Tay Kỹ Thuật
                            </button>
                            <AppButton variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
                                Đóng
                            </AppButton>
                        </div>
                    </div>
                )}
            </AppModal>
        </div>
    );
};

export default FarmerGuidesPage;
