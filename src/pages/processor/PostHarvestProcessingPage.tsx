import React, { useState, useEffect } from 'react';
import { translateStage } from '../../types';
import { useUIStore } from '../../stores/uiStore';


import {
    PackageCheck,
    Wrench,
    GitFork,
    FileCheck2,
    Box,
    Plus,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppSelect } from '../../components/ui/AppSelect';
import { processorService, postHarvestService, type BatchDto } from '../../services/processorService';
import { toast } from '../../utils/toast';

export const PostHarvestProcessingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'RECEIVE' | 'PROCESS' | 'SORT' | 'INSPECT' | 'PACKAGE'>('RECEIVE');
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const submittingOperations = useUIStore((state) => state.submittingOperations);
    const setSubmittingOperation = useUIStore((state) => state.setSubmittingOperation);

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Selected Batch
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');

    // 1. Form state cho Receive Batch
    const [receiveForm, setReceiveForm] = useState({
        receivedDate: new Date().toISOString().split('T')[0],
        quantity: 1000,
        unit: 'kg',
        deliveryPerson: '',
        conditionNote: 'Nông sản tươi, đúng tiêu chuẩn thu hoạch',
    });

    // 2. Form state cho Process Batch
    const [processForm, setProcessForm] = useState({
        processType: 'Rửa sạch & Làm khô',
        description: 'Rửa qua hệ thống sục khí ozone và sấy khô bề mặt',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [processImages, setProcessImages] = useState<File[]>([]);

    // 3. Form state cho Classify & Split
    const [sortMode, setSortMode] = useState<'CLASSIFY_ONLY' | 'SPLIT'>('CLASSIFY_ONLY');
    const [classifyNote, setClassifyNote] = useState<string>('Phân loại chất lượng theo tiêu chuẩn VietGAP');
    const [gradeDetails, setGradeDetails] = useState([{ grade: 'Loại 1 (Loại A)', quantity: 700, note: 'Trái to, đẹp' }, { grade: 'Loại 2 (Loại B)', quantity: 300, note: 'Trái trung bình' }]);
    const [subBatches, setSubBatches] = useState([{ subBatchCode: 'SUB-001', classification: 'Loại A - Xuất khẩu', quantity: 600 }, { subBatchCode: 'SUB-002', classification: 'Loại B - Nội địa', quantity: 400 }]);

    // 4. Form state cho Inspect (Parent / Sub)
    const [inspectTarget, setInspectTarget] = useState<'PARENT' | 'SUB'>('PARENT');
    const [subBatchIdInput, setSubBatchIdInput] = useState<string>('');
    const [inspectForm, setInspectForm] = useState({
        documentName: 'Giấy chứng nhận Kiểm định An toàn Thực phẩm VietGAP',
        documentNumber: `CERT-${Math.floor(1000 + Math.random() * 9000)}-VG`,
        inspectionUnit: 'Trung tâm Kiểm định Chất lượng Nông sản',
        inspectionDate: new Date().toISOString().split('T')[0],
        result: 'PASSED',
        note: 'Đạt đầy đủ các chỉ tiêu dư lượng thuốc bảo vệ thực vật',
    });
    const [certFile, setCertFile] = useState<File | null>(null);

    // 5. Form state cho Package (Parent / Sub)
    const [packageTarget, setPackageTarget] = useState<'PARENT' | 'SUB'>('PARENT');
    const [packageForm, setPackageForm] = useState({
        packDate: new Date().toISOString().split('T')[0],
        weight: 1.0,
        specification: 'Hộp carton 1kg có màng hút chân không',
        usageGuide: 'Rửa nhẹ bằng nước sạch trước khi sử dụng trực tiếp',
        storageGuide: 'Bảo quản ở nhiệt độ mát từ 5 - 8 độ C',
        color: 'Màu tự nhiên chín đều',
        smell: 'Thơm đặc trưng',
        standard: 'VietGAP / OCOP 4 sao',
        note: 'Đóng gói chuẩn thương mại xuất khẩu',
    });
    const [packageImages, setPackageImages] = useState<File[]>([]);

    // Fetch batches
    const loadBatches = async () => {
        setLoading(true);
        try {
            const data = await processorService.getBatches();
            setBatches(data);
            if (data.length > 0 && !selectedBatchId) {
                setSelectedBatchId(data[0].id);
            }
        } catch (err: any) {
            const msg = 'Không thể tải danh sách Lô sản xuất.';
            setMessage({ type: 'error', text: msg });
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBatches();
    }, []);
    // Tự động chọn lô hàng phù hợp khi chuyển Tab hoặc khi danh sách thay đổi
    useEffect(() => {
        const filtered = batches.filter((b) => {
            if (activeTab === 'RECEIVE') {
                return (
                    b.currentStage === 'STAGE_HARVESTED' ||
                    b.currentStage === 'HARVESTED' ||
                    b.currentStage === 'DA_THU_HOACH'
                );
            }
            return true;
        });

        if (filtered.length > 0) {
            // Nếu lô hiện tại không nằm trong danh sách đã lọc, chuyển sang chọn lô đầu tiên của danh sách mới
            if (!filtered.some((b) => b.id === selectedBatchId)) {
                setSelectedBatchId(filtered[0].id);
            }
        } else {
            setSelectedBatchId('');
        }
    }, [activeTab, batches, selectedBatchId]);

    // Lọc danh sách lô hàng theo Tab
    const filteredBatches = batches.filter((b) => {
        if (activeTab === 'RECEIVE') {
            return (
                b.currentStage === 'STAGE_HARVESTED' ||
                b.currentStage === 'HARVESTED' ||
                b.currentStage === 'DA_THU_HOACH'
            );
        }
        return true;
    });


    // Handlers
    const handleReceive = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) {
            const msg = 'Vui lòng chọn Lô sản xuất.';
            setMessage({ type: 'error', text: msg });
            toast.error(msg);
            return;
        }
        setSubmittingOperation('receive', true); // Kích hoạt trạng thái tải toàn cục
        setMessage(null);
        try {
            await postHarvestService.receiveBatch(selectedBatchId, receiveForm);
            const msg = 'Xác nhận tiếp nhận lô sản xuất thành công! (receiveBatch)';
            setMessage({ type: 'success', text: msg });
            toast.success(msg);
            loadBatches();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'L�i khi gọi receiveBatch.';
            setMessage({ type: 'error', text: errMsg });
            toast.error(errMsg);
        } finally {
            setSubmittingOperation('receive', false); // Tắt trạng thái tải toàn cục
        }
    };

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) {
            const msg = 'Vui lòng chọn Lô sản xuất.';
            setMessage({ type: 'error', text: msg });
            toast.error(msg);
            return;
        }
        setSubmittingOperation('process', true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('ProcessType', processForm.processType);
            formData.append('Description', processForm.description);
            formData.append('StartDate', processForm.startDate);
            if (processForm.endDate) formData.append('EndDate', processForm.endDate);
            processImages.forEach((img) => formData.append('Images', img));

            await postHarvestService.processBatch(selectedBatchId, formData);
            const msg = 'Ghi nhận sơ chế lô thành công! (processBatch)';
            setMessage({ type: 'success', text: msg });
            toast.success(msg);
            loadBatches();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Lỗi khi gọi processBatch.';
            setMessage({ type: 'error', text: errMsg });
            toast.error(errMsg);
        } finally {
            setSubmittingOperation('process', false);
        }
    };

    const handleSort = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) {
            const msg = 'Vui lòng chọn Lô sản xuất.';
            setMessage({ type: 'error', text: msg });
            toast.error(msg);
            return;
        }
        setSubmittingOperation('sort', true);
        setMessage(null);
        try {
            if (sortMode === 'CLASSIFY_ONLY') {
                await postHarvestService.classifyOnlyBatch(selectedBatchId, {
                    classificationNote: classifyNote,
                    gradeDetails: gradeDetails,
                });
                const msg = 'Phân loại không tách lô thành công! (classifyOnlyBatch)';
                setMessage({ type: 'success', text: msg });
                toast.success(msg);
            } else {
                await postHarvestService.splitBatch(selectedBatchId, {
                    subBatches: subBatches,
                });
                const msg = 'Phân loại & tách lô con thành công! (splitBatch)';
                setMessage({ type: 'success', text: msg });
                toast.success(msg);
            }
            loadBatches();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Lỗi khi phân loại/tách lô.';
            setMessage({ type: 'error', text: errMsg });
            toast.error(errMsg);
        } finally {
            setSubmittingOperation('sort', false);
        }
    };

    const handleInspect = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingOperation('inspect', true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('DocumentName', inspectForm.documentName);
            formData.append('DocumentNumber', inspectForm.documentNumber);
            formData.append('InspectionUnit', inspectForm.inspectionUnit);
            formData.append('InspectionDate', inspectForm.inspectionDate);
            formData.append('Result', inspectForm.result);
            if (inspectForm.note) formData.append('Note', inspectForm.note);
            if (certFile) formData.append('CertificateFile', certFile);

            if (inspectTarget === 'PARENT') {
                if (!selectedBatchId) throw new Error('Vui lòng chọn Lô gốc (Parent Batch).');
                await postHarvestService.inspectParent(selectedBatchId, formData);
                const msg = 'Kiểm định Lô gốc thành công! (inspectParent)';
                setMessage({ type: 'success', text: msg });
                toast.success(msg);
            } else {
                if (!subBatchIdInput) throw new Error('Vui lòng nhập SubBatchId (Mã định danh Lô con).');
                await postHarvestService.inspectSub(subBatchIdInput, formData);
                const msg = 'Kiểm định Lô con thành công! (inspectSub)';
                setMessage({ type: 'success', text: msg });
                toast.success(msg);
            }
            loadBatches();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Lỗi khi kiểm định.';
            setMessage({ type: 'error', text: errMsg });
            toast.error(errMsg);
        } finally {
            setSubmittingOperation('inspect', false);
        }
    };

    const handlePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingOperation('package', true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('Input', JSON.stringify(packageForm));
            packageImages.forEach((img) => formData.append('Images', img));

            if (packageTarget === 'PARENT') {
                if (!selectedBatchId) throw new Error('Vui lòng chọn Lô gốc (Parent Batch).');
                await postHarvestService.packageParent(selectedBatchId, formData);
                const msg = 'Đóng gói thương mại Lô gốc thành công! (packageParent)';
                setMessage({ type: 'success', text: msg });
                toast.success(msg);
            } else {
                if (!subBatchIdInput) throw new Error('Vui lòng nhập SubBatchId.');
                await postHarvestService.packageSub(subBatchIdInput, formData);
                const msg = 'Đóng gói thương mại Lô con thành công! (packageSub)';
                setMessage({ type: 'success', text: msg });
                toast.success(msg);
            }
            loadBatches();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Lỗi khi đóng gói.';
            setMessage({ type: 'error', text: errMsg });
            toast.error(errMsg);
        } finally {
            setSubmittingOperation('package', false);
        }
    };


    // Danh sách các Tab Chức Năng Con (Phong cách Quản Lý Kho)
    const tabNavigation = [
        { id: 'RECEIVE', label: 'Tiếp nhận' },
        { id: 'PROCESS', label: 'Sơ chế' },
        { id: 'SORT', label: 'Phân loại & Tách lô' },
        { id: 'INSPECT', label: 'Kiểm định VietGAP' },
        { id: 'PACKAGE', label: 'Đóng gói thương mại' },
    ];

    return (
        <div className="space-y-5">
            {/* Header & Nút Làm Mới */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Chế Biến & Đóng Gói Nông Sản Sau Thu Hoạch</h2>
                    <p className="text-xs text-slate-500">Quản lý tiếp nhận, sơ chế, phân loại tách lô, kiểm định VietGAP và đóng gói sản phẩm</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={loadBatches}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                        title="Tải lại dữ liệu Lô sản xuất"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Chọn Lô Mục Tiêu */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Chọn Lô Sản Xuất Mục Tiêu:</label>
                <AppSelect
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    options={filteredBatches.map((b) => ({
                        value: b.id,
                        label: `${b.batchCode} - ${b.productName || b.fruitTypeName} (Trạng thái: ${translateStage(b.currentStage)})`,
                    }))}
                    className="w-full md:w-2/3"
                />
            </div>


            {/* SUB-TABS DẠNG QUẢN LÝ KHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-3">
                <div className="flex items-center gap-2">
                    {tabNavigation.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
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
            </div>

            {/* NỘI DUNG TỪNG TAB FUNCTION */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                {/* TAB 1: RECEIVE BATCH */}
                {activeTab === 'RECEIVE' && (
                    <form onSubmit={handleReceive} className="space-y-5 max-w-2xl">
                        <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <PackageCheck className="w-5 h-5 text-emerald-600" />
                            <span>Xác nhận Tiếp nhận Lô Nông sản (receiveBatch)</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <AppInput label="Ngày tiếp nhận" type="date" value={receiveForm.receivedDate} onChange={(e) => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })} required />
                            <AppInput label="Số lượng thực nhận" type="number" value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: Number(e.target.value) })} required />
                            <AppInput label="Đơn vị tính" value={receiveForm.unit} onChange={(e) => setReceiveForm({ ...receiveForm, unit: e.target.value })} required />
                            <AppInput label="Người giao hàng / Nông dân" value={receiveForm.deliveryPerson} onChange={(e) => setReceiveForm({ ...receiveForm, deliveryPerson: e.target.value })} required />
                        </div>
                        <AppInput label="Tình trạng / Ghi chú nhận hàng" value={receiveForm.conditionNote} onChange={(e) => setReceiveForm({ ...receiveForm, conditionNote: e.target.value })} required />

                        <div className="pt-2">
                            <AppButton
                                type="submit"
                                isLoading={submittingOperations['receive']}
                                variant="green"
                                leftIcon={<PackageCheck className="w-4 h-4" />}
                                className="px-6 py-2.5 text-xs md:text-sm font-bold shadow-md shadow-green-700/20 hover:shadow-lg transition-all"
                            >
                                Xác Nhận Tiếp Nhận Lô (receiveBatch)
                            </AppButton>

                        </div>
                    </form>
                )}

                {/* TAB 2: PROCESS BATCH */}
                {activeTab === 'PROCESS' && (
                    <form onSubmit={handleProcess} className="space-y-5 max-w-2xl">
                        <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-emerald-600" />
                            <span>Ghi nhận Công đoạn Sơ chế (processBatch)</span>
                        </h2>
                        <AppInput label="Loại công đoạn sơ chế" value={processForm.processType} onChange={(e) => setProcessForm({ ...processForm, processType: e.target.value })} required />
                        <AppInput label="Mô tả quy trình sơ chế" value={processForm.description} onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <AppInput label="Ngày bắt đầu" type="date" value={processForm.startDate} onChange={(e) => setProcessForm({ ...processForm, startDate: e.target.value })} required />
                            <AppInput label="Ngày hoàn thành" type="date" value={processForm.endDate} onChange={(e) => setProcessForm({ ...processForm, endDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Hình ảnh sơ chế thực tế</label>
                            <input type="file" multiple accept="image/*" onChange={(e) => setProcessImages(Array.from(e.target.files || []))} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                        </div>

                        <div className="pt-2">
                            <AppButton
                                type="submit"
                                isLoading={submittingOperations['process']}
                                variant="green"
                                leftIcon={<Wrench className="w-4 h-4" />}
                                className="px-6 py-2.5 text-xs md:text-sm font-bold shadow-md shadow-green-700/20 hover:shadow-lg transition-all"
                            >
                                Hoàn Thành Sơ Chế Lô (processBatch)
                            </AppButton>

                        </div>
                    </form>
                )}

                {/* TAB 3: SORT / SPLIT BATCH */}
                {activeTab === 'SORT' && (
                    <form onSubmit={handleSort} className="space-y-6 max-w-3xl">
                        <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <GitFork className="w-5 h-5 text-emerald-600" />
                            <span>Phân Loại & Tách Lô Con SubBatch</span>
                        </h2>

                        <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                                <input type="radio" name="sortMode" checked={sortMode === 'CLASSIFY_ONLY'} onChange={() => setSortMode('CLASSIFY_ONLY')} />
                                Phân loại KHÔNG tách lô (classifyOnlyBatch)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                                <input type="radio" name="sortMode" checked={sortMode === 'SPLIT'} onChange={() => setSortMode('SPLIT')} />
                                Phân loại CÓ tách lô con (splitBatch)
                            </label>
                        </div>

                        {sortMode === 'CLASSIFY_ONLY' ? (
                            <div className="space-y-4">
                                <AppInput label="Ghi chú phân loại" value={classifyNote} onChange={(e) => setClassifyNote(e.target.value)} required />
                                <h3 className="font-bold text-xs text-slate-700">Chi tiết phân hạng:</h3>
                                {gradeDetails.map((g, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-3">
                                        <AppInput label="Hạng sản phẩm" value={g.grade} onChange={(e) => {
                                            const list = [...gradeDetails];
                                            list[idx].grade = e.target.value;
                                            setGradeDetails(list);
                                        }} />
                                        <AppInput label="Sản lượng (kg)" type="number" value={g.quantity} onChange={(e) => {
                                            const list = [...gradeDetails];
                                            list[idx].quantity = Number(e.target.value);
                                            setGradeDetails(list);
                                        }} />
                                        <AppInput label="Ghi chú" value={g.note || ''} onChange={(e) => {
                                            const list = [...gradeDetails];
                                            list[idx].note = e.target.value;
                                            setGradeDetails(list);
                                        }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-xs text-slate-700">Danh sách Lô con (SubBatches):</h3>
                                    <button
                                        type="button"
                                        onClick={() => setSubBatches([...subBatches, { subBatchCode: `SUB-00${subBatches.length + 1}`, classification: 'Loại A', quantity: 100 }])}
                                        className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Thêm Lô Con
                                    </button>
                                </div>
                                {subBatches.map((s, idx) => (
                                    <div key={idx} className="flex gap-3 items-end border p-3 rounded-xl bg-slate-50">
                                        <AppInput label="Mã SubBatch" value={s.subBatchCode} onChange={(e) => {
                                            const list = [...subBatches];
                                            list[idx].subBatchCode = e.target.value;
                                            setSubBatches(list);
                                        }} />
                                        <AppInput label="Phân loại" value={s.classification} onChange={(e) => {
                                            const list = [...subBatches];
                                            list[idx].classification = e.target.value;
                                            setSubBatches(list);
                                        }} />
                                        <AppInput label="Số lượng (kg)" type="number" value={s.quantity} onChange={(e) => {
                                            const list = [...subBatches];
                                            list[idx].quantity = Number(e.target.value);
                                            setSubBatches(list);
                                        }} />
                                        <button type="button" onClick={() => setSubBatches(subBatches.filter((_, i) => i !== idx))} className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2">
                            <AppButton
                                type="submit"
                                isLoading={submittingOperations['sort']}
                                variant="green"
                                leftIcon={<GitFork className="w-4 h-4" />}
                                className="px-6 py-2.5 text-xs md:text-sm font-bold shadow-md shadow-green-700/20 hover:shadow-lg transition-all"
                            >
                                {sortMode === 'CLASSIFY_ONLY' ? 'Xác Nhận Phân Loại (classifyOnlyBatch)' : 'Xác Nhận Tách Lô (splitBatch)'}
                            </AppButton>
                        </div>

                    </form>
                )}

                {/* TAB 4: INSPECTION */}
                {activeTab === 'INSPECT' && (
                    <form onSubmit={handleInspect} className="space-y-5 max-w-2xl">
                        <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <FileCheck2 className="w-5 h-5 text-emerald-600" />
                            <span>Kiểm Định Chất Lượng VietGAP (inspectParent / inspectSub)</span>
                        </h2>
                        <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                                <input type="radio" name="inspectTarget" checked={inspectTarget === 'PARENT'} onChange={() => setInspectTarget('PARENT')} />
                                Kiểm định Lô Gốc (inspectParent)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                                <input type="radio" name="inspectTarget" checked={inspectTarget === 'SUB'} onChange={() => setInspectTarget('SUB')} />
                                Kiểm định Lô Con SubBatch (inspectSub)
                            </label>
                        </div>

                        {inspectTarget === 'SUB' && (
                            <AppInput label="Mã GUID SubBatchId" placeholder="Nhập mã SubBatchId" value={subBatchIdInput} onChange={(e) => setSubBatchIdInput(e.target.value)} required />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <AppInput label="Tên văn bản / Giấy chứng nhận" value={inspectForm.documentName} onChange={(e) => setInspectForm({ ...inspectForm, documentName: e.target.value })} required />
                            <AppInput label="Số hiệu chứng nhận" value={inspectForm.documentNumber} onChange={(e) => setInspectForm({ ...inspectForm, documentNumber: e.target.value })} required />
                            <AppInput label="Đơn vị kiểm định" value={inspectForm.inspectionUnit} onChange={(e) => setInspectForm({ ...inspectForm, inspectionUnit: e.target.value })} required />
                            <AppInput label="Ngày kiểm định" type="date" value={inspectForm.inspectionDate} onChange={(e) => setInspectForm({ ...inspectForm, inspectionDate: e.target.value })} required />
                        </div>

                        <AppSelect
                            label="Kết quả kiểm định"
                            value={inspectForm.result}
                            onChange={(e) => setInspectForm({ ...inspectForm, result: e.target.value })}
                            options={[
                                { value: 'PASSED', label: 'PASSED - ĐẠT TIÊU CHUẨN AN TOÀN' },
                                { value: 'FAILED', label: 'FAILED - KHÔNG ĐẠT (KHÓA QUY TRÌNH)' },
                            ]}
                        />
                        <AppInput label="Ghi chú kiểm định" value={inspectForm.note} onChange={(e) => setInspectForm({ ...inspectForm, note: e.target.value })} />

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">File PDF / Ảnh Giấy chứng nhận</label>
                            <input type="file" accept="application/pdf,image/*" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                        </div>

                        <div className="pt-2">
                            <AppButton
                                type="submit"
                                isLoading={submittingOperations['inspect']}
                                variant={inspectForm.result === 'PASSED' ? 'green' : 'red'}
                                leftIcon={<FileCheck2 className="w-4 h-4" />}
                                className={`px-6 py-2.5 text-xs md:text-sm font-bold shadow-md transition-all ${inspectForm.result === 'PASSED' ? 'shadow-green-700/20' : 'shadow-rose-700/20'
                                    }`}
                            >
                                Xác Nhận Kiểm Định ({inspectTarget === 'PARENT' ? 'inspectParent' : 'inspectSub'})
                            </AppButton>

                        </div>
                    </form>
                )}

                {/* TAB 5: PACKAGING */}
                {activeTab === 'PACKAGE' && (
                    <form onSubmit={handlePackage} className="space-y-5 max-w-2xl">
                        <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Box className="w-5 h-5 text-emerald-600" />
                            <span>Đóng Gói Thương Mại (packageParent / packageSub)</span>
                        </h2>
                        <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                                <input type="radio" name="packageTarget" checked={packageTarget === 'PARENT'} onChange={() => setPackageTarget('PARENT')} />
                                Đóng gói Lô Gốc (packageParent)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                                <input type="radio" name="packageTarget" checked={packageTarget === 'SUB'} onChange={() => setPackageTarget('SUB')} />
                                Đóng gói Lô Con SubBatch (packageSub)
                            </label>
                        </div>

                        {packageTarget === 'SUB' && (
                            <AppInput label="Mã GUID SubBatchId" placeholder="Nhập mã SubBatchId" value={subBatchIdInput} onChange={(e) => setSubBatchIdInput(e.target.value)} required />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <AppInput label="Ngày đóng gói" type="date" value={packageForm.packDate} onChange={(e) => setPackageForm({ ...packageForm, packDate: e.target.value })} required />
                            <AppInput label="Trọng lượng (kg)" type="number" step="0.1" value={packageForm.weight} onChange={(e) => setPackageForm({ ...packageForm, weight: Number(e.target.value) })} required />
                            <AppInput label="Quy cách đóng gói" value={packageForm.specification} onChange={(e) => setPackageForm({ ...packageForm, specification: e.target.value })} required />
                            <AppInput label="Tiêu chuẩn áp dụng" value={packageForm.standard} onChange={(e) => setPackageForm({ ...packageForm, standard: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <AppInput label="Màu sắc cảm quan" value={packageForm.color} onChange={(e) => setPackageForm({ ...packageForm, color: e.target.value })} required />
                            <AppInput label="Mùi vị cảm quan" value={packageForm.smell} onChange={(e) => setPackageForm({ ...packageForm, smell: e.target.value })} required />
                        </div>

                        <AppInput label="Hướng dẫn sử dụng" value={packageForm.usageGuide} onChange={(e) => setPackageForm({ ...packageForm, usageGuide: e.target.value })} required />
                        <AppInput label="Hướng dẫn bảo quản" value={packageForm.storageGuide} onChange={(e) => setPackageForm({ ...packageForm, storageGuide: e.target.value })} required />

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Hình ảnh bao bì / sản phẩm hoàn thiện</label>
                            <input type="file" multiple accept="image/*" onChange={(e) => setPackageImages(Array.from(e.target.files || []))} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                        </div>

                        <div className="pt-2">
                            <AppButton
                                type="submit"
                                isLoading={submittingOperations['package']}
                                variant="green"
                                leftIcon={<Box className="w-4 h-4" />}
                                className="px-6 py-2.5 text-xs md:text-sm font-bold shadow-md shadow-green-700/20 hover:shadow-lg transition-all"
                            >
                                Hoàn Thành Đóng Gói ({packageTarget === 'PARENT' ? 'packageParent' : 'packageSub'})
                            </AppButton>

                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
