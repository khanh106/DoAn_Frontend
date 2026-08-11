import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Plus,
    Search,
    RefreshCw,
    Layers,
    CheckCircle2,
    Clock,
    ShieldCheck,
    PackageCheck,
    Truck,
    ChevronRight,
    AlertCircle,
    ListFilter,
    FileText
} from 'lucide-react';
import { AxiosError } from 'axios';
import {
    processorService,
    type ProductionProcessDto,
    type ProcessStepDto
} from '../../services/processorService';

// Bảng cấu hình giao diện cho các giai đoạn (BatchStage) chuẩn từ Backend
const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    STAGE_PLANTING: { label: '1. Canh tác', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: Activity },
    STAGE_HARVESTED: { label: '2. Thu hoạch', bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
    STAGE_RECEIVED: { label: '3. Tiếp nhận', bg: 'bg-blue-100', text: 'text-blue-800', icon: Layers },
    STAGE_PROCESSED: { label: '4. Sơ chế', bg: 'bg-purple-100', text: 'text-purple-800', icon: RefreshCw },
    STAGE_SORTED: { label: '5. Phân loại', bg: 'bg-indigo-100', text: 'text-indigo-800', icon: ListFilter },
    INSPECTION_PASSED: { label: '6. Kiểm định', bg: 'bg-teal-100', text: 'text-teal-800', icon: ShieldCheck },
    PACKAGED: { label: '7. Đóng gói', bg: 'bg-orange-100', text: 'text-orange-800', icon: PackageCheck },
    STAGE_SHIPPING: { label: '8. Vận chuyển', bg: 'bg-sky-100', text: 'text-sky-800', icon: Truck },
    RECEIVED_AT_RETAILER: { label: '9. Đại lý nhận', bg: 'bg-indigo-100', text: 'text-indigo-800', icon: CheckCircle2 },
    READY_FOR_SALE: { label: '10. Lên kệ', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 }
};

export const ProcessManagementPage: React.FC = () => {
    // State lưu trữ dữ liệu thực từ Backend API
    const [processes, setProcesses] = useState<ProductionProcessDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedProcess, setSelectedProcess] = useState<ProductionProcessDto | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // State Modal Tạo Mới Quy Trình
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [newProcessName, setNewProcessName] = useState<string>('');
    const [newProcessDesc, setNewProcessDesc] = useState<string>('');
    const [newSteps, setNewSteps] = useState<ProcessStepDto[]>([
        { stage: 'STAGE_PLANTING', stepName: 'Xuống giống & Canh tác', orderIndex: 1, description: '' },
        { stage: 'STAGE_PROCESSED', stepName: 'Sơ chế & Khử trùng', orderIndex: 2, description: '' },
        { stage: 'PACKAGED', stepName: 'Đóng gói & Dán tem QR', orderIndex: 3, description: '' }
    ]);

    // Gọi API Backend lấy danh sách Quy trình thực tế
    const loadProcessesData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await processorService.getProcesses();
            setProcesses(data);
            if (data.length > 0) {
                setSelectedProcess(data[0]);
            } else {
                setSelectedProcess(null);
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải quy trình từ Backend API:', errorObj);
            setErrorMessage(errorObj.response?.data?.message || 'Không thể kết nối Backend API lấy danh sách quy trình.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProcessesData();
    }, [loadProcessesData]);

    // Thêm một bước công việc mới vào Modal
    const handleAddStep = () => {
        setNewSteps((prev) => [
            ...prev,
            {
                stage: 'INSPECTION_PASSED',
                stepName: '',
                orderIndex: prev.length + 1,
                description: ''
            }
        ]);
    };

    // Xóa một bước công việc khỏi Modal
    const handleRemoveStep = (index: number) => {
        setNewSteps((prev) =>
            prev.filter((_, i) => i !== index).map((s, idx) => ({ ...s, orderIndex: idx + 1 }))
        );
    };

    // Gửi dữ liệu tạo mới lên Backend API
    const handleSaveProcess = async () => {
        if (!newProcessName.trim()) {
            alert('⚠️ Vui lòng nhập tên quy trình!');
            return;
        }

        const validSteps = newSteps.filter((s) => s.stepName.trim() !== '');
        if (validSteps.length === 0) {
            alert('⚠️ Quy trình phải có ít nhất 1 bước công việc!');
            return;
        }

        setSubmitting(true);
        try {
            await processorService.createProcess({
                name: newProcessName.trim(),
                description: newProcessDesc.trim(),
                steps: validSteps
            });

            alert('✅ Đã tạo mới Quy trình sản xuất thành công trên Backend!');
            setShowCreateModal(false);
            setNewProcessName('');
            setNewProcessDesc('');
            await loadProcessesData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            alert(`❌ Lỗi tạo quy trình: ${errorObj.response?.data?.message || 'Không thể tạo quy trình.'}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Lọc quy trình theo từ khóa tìm kiếm
    const filteredProcesses = processes.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Trang */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-green-700" />
                        Quản Lý Quy Trình Sản Xuất & Sơ Chế
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Dữ liệu quy trình thực tế được lưu trữ trực tiếp trên Backend Database
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Mẫu Quy Trình</span>
                    </button>

                    <button
                        onClick={loadProcessesData}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
                        title="Tải lại từ Backend API"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Thông báo lỗi nếu gọi API thất bại */}
            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>⚠️ {errorMessage}</span>
                </div>
            )}

            {/* Khung nội dung chính */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Danh sách Quy trình từ API */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Danh sách Quy trình ({filteredProcesses.length})
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm quy trình..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        />
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-xs">Đang tải dữ liệu từ Backend API...</div>
                    ) : filteredProcesses.length > 0 ? (
                        <div className="space-y-2">
                            {filteredProcesses.map((p) => {
                                const isSelected = selectedProcess?.id === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedProcess(p)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                                            ? 'border-green-600 bg-green-50/50 shadow-xs'
                                            : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-xs md:text-sm text-slate-900">{p.name}</h4>
                                            <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-green-700' : 'text-slate-400'}`} />
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">{p.description || 'Không có mô tả'}</p>
                                        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                                            <span>{p.steps?.length || 0} công đoạn</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-xs space-y-2">
                            <FileText className="w-8 h-8 mx-auto text-slate-300" />
                            <p>Chưa có quy trình nào trong Cơ sở dữ liệu.</p>
                            <p className="text-[11px] text-slate-500">Bấm nút "Thêm Mẫu Quy Trình" ở trên để khởi tạo.</p>
                        </div>
                    )}
                </div>

                {/* Cột phải: Xem chi tiết Timeline Quy trình đang chọn */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                    {selectedProcess ? (
                        <>
                            <div className="border-b border-slate-100 pb-4">
                                <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                                    Quy trình đang chọn
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedProcess.name}</h3>
                                <p className="text-xs text-slate-500">{selectedProcess.description || 'Chưa có mô tả chi tiết'}</p>
                            </div>

                            {/* Dynamic Timeline Visualizer */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Các bước thực hiện ({selectedProcess.steps?.length || 0} Bước)
                                </h4>

                                {selectedProcess.steps && selectedProcess.steps.length > 0 ? (
                                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                                        {selectedProcess.steps.map((step, idx) => {
                                            const cfg = STAGE_CONFIG[step.stage] || {
                                                label: step.stage,
                                                bg: 'bg-slate-100',
                                                text: 'text-slate-800',
                                                icon: Activity
                                            };
                                            const IconComp = cfg.icon;

                                            return (
                                                <div key={idx} className="relative flex items-start gap-4 group">
                                                    <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-green-600 flex items-center justify-center text-[10px] font-bold text-green-700 shadow-xs">
                                                        {step.orderIndex || idx + 1}
                                                    </div>

                                                    <div className="flex-1 bg-slate-50 group-hover:bg-green-50/30 p-4 rounded-xl border border-slate-200 transition-all">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${cfg.bg} ${cfg.text} flex items-center gap-1`}>
                                                                    <IconComp className="w-3 h-3" />
                                                                    {cfg.label}
                                                                </span>
                                                                <h5 className="font-bold text-xs md:text-sm text-slate-900">{step.stepName}</h5>
                                                            </div>
                                                            <span className="text-[11px] font-semibold text-slate-400">Thứ tự #{step.orderIndex}</span>
                                                        </div>
                                                        {step.description && (
                                                            <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-lg border border-slate-100">
                                                                {step.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-400 italic text-xs">
                                        Quy trình này chưa cấu hình các bước công việc.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center text-slate-400 text-xs italic">
                            Chưa chọn quy trình nào hoặc danh sách đang trống.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL THÊM MỚI QUY TRÌNH (Tải trực tiếp lên Backend) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-base text-slate-900">Thêm Mẫu Quy Trình Sản Xuất Mới</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên quy trình (*)</label>
                                <input
                                    type="text"
                                    value={newProcessName}
                                    onChange={(e) => setNewProcessName(e.target.value)}
                                    placeholder="Nhập tên quy trình..."
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                                <textarea
                                    value={newProcessDesc}
                                    onChange={(e) => setNewProcessDesc(e.target.value)}
                                    placeholder="Mô tả các yêu cầu kỹ thuật, điều kiện áp dụng..."
                                    rows={2}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            {/* Danh sách các bước công việc */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Các bước công việc ({newSteps.length})
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddStep}
                                        className="text-xs font-bold text-green-700 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Thêm công đoạn
                                    </button>
                                </div>

                                {newSteps.map((step, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-500">Bước #{idx + 1}</span>
                                            {newSteps.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveStep(idx)}
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={step.stepName}
                                                onChange={(e) => {
                                                    const updated = [...newSteps];
                                                    updated[idx].stepName = e.target.value;
                                                    setNewSteps(updated);
                                                }}
                                                placeholder="Tên công đoạn..."
                                                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                                            />
                                            <select
                                                value={step.stage}
                                                onChange={(e) => {
                                                    const updated = [...newSteps];
                                                    updated[idx].stage = e.target.value;
                                                    setNewSteps(updated);
                                                }}
                                                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
                                            >
                                                <option value="STAGE_PLANTING">1. Canh tác / Xuống giống</option>
                                                <option value="STAGE_HARVESTED">2. Thu hoạch</option>
                                                <option value="STAGE_RECEIVED">3. Tiếp nhận kho</option>
                                                <option value="STAGE_PROCESSED">4. Sơ chế / Chế biến</option>
                                                <option value="STAGE_SORTED">5. Phân loại / Tách lô</option>
                                                <option value="INSPECTION_PASSED">6. Kiểm định chất lượng</option>
                                                <option value="PACKAGED">7. Đóng gói & Dán QR</option>
                                                <option value="STAGE_SHIPPING">8. Vận chuyển</option>
                                                <option value="RECEIVED_AT_RETAILER">9. Đại lý nhận</option>
                                                <option value="READY_FOR_SALE">10. Lên kệ bán lẻ</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            value={step.description || ''}
                                            onChange={(e) => {
                                                const updated = [...newSteps];
                                                updated[idx].description = e.target.value;
                                                setNewSteps(updated);
                                            }}
                                            placeholder="Ghi chú chi tiết yêu cầu kỹ thuật..."
                                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                disabled={submitting}
                                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveProcess}
                                disabled={submitting}
                                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>Lưu Quy Trình (Backend)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
