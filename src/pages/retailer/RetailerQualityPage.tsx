import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Search,
    FileText,
    Award,
    Scale,
    Star,
    Truck,
    PackageCheck,
    ShoppingBag,
    ExternalLink,
    Store,
    Download,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppTabs, type TabItem } from '../../components/ui/AppTabs';
import { AppModal } from '../../components/ui/AppModal';
import { AppInput } from '../../components/ui/AppInput';
import {
    retailerService,
    type ShipmentHistoryDto,
    type RetailerQualityRecord,
} from '../../services/retailerService';
import { shippingAndQrService, type InspectionHistoryDto } from '../../services/shippingAndQrService';
import { toast } from '../../utils/toast';

export const RetailerQualityPage: React.FC = () => {
    // State dữ liệu
    const [shipments, setShipments] = useState<ShipmentHistoryDto[]>([]);
    const [qaRecords, setQaRecords] = useState<Record<string, RetailerQualityRecord>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // State lọc & tìm kiếm
    const [activeTab, setActiveTab] = useState<string>('ALL'); // 'ALL' | 'PENDING' | 'PASSED' | 'REJECTED'
    const [searchTerm, setSearchTerm] = useState<string>('');

    // State Modals
    const [selectedShipmentForQa, setSelectedShipmentForQa] = useState<ShipmentHistoryDto | null>(null);
    const [processorInspections, setProcessorInspections] = useState<InspectionHistoryDto[]>([]);
    const [loadingInspections, setLoadingInspections] = useState<boolean>(false);
    const [activeQaTab, setActiveQaTab] = useState<'ORIGIN_CERT' | 'SUPERMARKET_CHECK'>('SUPERMARKET_CHECK');

    // State Modal Xem Biên bản QA
    const [reportShipment, setReportShipment] = useState<ShipmentHistoryDto | null>(null);

    // State Form Kiểm định QA tại Siêu thị
    const [qaForm, setQaForm] = useState<{
        inspectorName: string;
        inspectionDate: string;
        sensoryGrade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECTED';
        freshnessRating: number;
        brixDegree: string;
        defectRate: string;
        temperatureOnArrival: string;
        netWeightKg: string;
        isPackageIntact: boolean;
        isQrValid: boolean;
        qaResult: 'PASSED' | 'QUARANTINE' | 'REJECTED';
        notes: string;
    }>({
        inspectorName: 'Nguyễn Văn Kiểm Định (QA Lead)',
        inspectionDate: new Date().toISOString().split('T')[0],
        sensoryGrade: 'GRADE_A',
        freshnessRating: 5,
        brixDegree: '13.5',
        defectRate: '1.2',
        temperatureOnArrival: '5.0',
        netWeightKg: '500',
        isPackageIntact: true,
        isQrValid: true,
        qaResult: 'PASSED',
        notes: 'Hàng nông sản tươi ngon, độ ngọt đạt tiêu chuẩn, tem niêm phong và mã QR nguyên vẹn.',
    });

    const [submittingQa, setSubmittingQa] = useState<boolean>(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Fetch dữ liệu từ backend & LocalStorage
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await retailerService.getMyShipments();
            setShipments(data);
            const savedRecords = retailerService.getAllQualityRecords();
            setQaRecords(savedRecords);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải dữ liệu kiểm tra chất lượng:', errorObj);
            const msg = errorObj.response?.data?.message || 'Không thể tải danh sách vận đơn siêu thị từ Backend API.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // Khi chọn một shipment để kiểm định -> Lấy giấy kiểm định VietGAP gốc từ Processor
    const handleOpenQaModal = async (shipment: ShipmentHistoryDto) => {
        setSelectedShipmentForQa(shipment);
        setActiveQaTab('SUPERMARKET_CHECK');
        setProcessorInspections([]);
        setLoadingInspections(true);

        // Lấy record QA đã lưu nếu có
        const existing = qaRecords[shipment.id];
        if (existing) {
            setQaForm({
                inspectorName: existing.inspectorName || 'Nguyễn Văn Kiểm Định (QA Lead)',
                inspectionDate: existing.inspectionDate || new Date().toISOString().split('T')[0],
                sensoryGrade: existing.sensoryGrade || 'GRADE_A',
                freshnessRating: existing.freshnessRating || 5,
                brixDegree: existing.brixDegree !== undefined ? existing.brixDegree.toString() : '13.5',
                defectRate: existing.defectRate !== undefined ? existing.defectRate.toString() : '1.2',
                temperatureOnArrival: existing.temperatureOnArrival !== undefined ? existing.temperatureOnArrival.toString() : '5.0',
                netWeightKg: existing.netWeightKg !== undefined ? existing.netWeightKg.toString() : (shipment.weight || 500).toString(),
                isPackageIntact: existing.isPackageIntact ?? true,
                isQrValid: existing.isQrValid ?? true,
                qaResult: existing.qaResult || 'PASSED',
                notes: existing.notes || '',
            });
        } else {
            setQaForm({
                inspectorName: 'Nguyễn Văn Kiểm Định (QA Lead)',
                inspectionDate: new Date().toISOString().split('T')[0],
                sensoryGrade: 'GRADE_A',
                freshnessRating: 5,
                brixDegree: '13.5',
                defectRate: '1.2',
                temperatureOnArrival: '5.0',
                netWeightKg: (shipment.weight || 500).toString(),
                isPackageIntact: true,
                isQrValid: true,
                qaResult: 'PASSED',
                notes: 'Lô sản phẩm đã được kiểm tra đạt tiêu chuẩn chất lượng siêu thị.',
            });
        }

        // Tải thông tin chứng nhận VietGAP gốc từ Processor
        try {
            if (shipment.subBatchId) {
                const res = await shippingAndQrService.getInspectionsBySubBatch(shipment.subBatchId);
                setProcessorInspections(res);
            } else if (shipment.batchId) {
                const res = await shippingAndQrService.getInspectionsByBatch(shipment.batchId);
                setProcessorInspections(res);
            }
        } catch (e) {
            console.warn('Chưa có thông tin kiểm định từ Processor cho lô này:', e);
        } finally {
            setLoadingInspections(false);
        }
    };

    // Lưu biên bản QA
    const handleSaveQaRecord = (andAction?: 'RECEIVE' | 'READY_FOR_SALE') => {
        if (!selectedShipmentForQa) return;
        setSubmittingQa(true);

        const record: RetailerQualityRecord = {
            shipmentId: selectedShipmentForQa.id,
            batchCode: selectedShipmentForQa.subBatchCode || selectedShipmentForQa.batchCode || 'N/A',
            inspectorName: qaForm.inspectorName,
            inspectionDate: qaForm.inspectionDate,
            sensoryGrade: qaForm.sensoryGrade,
            freshnessRating: Number(qaForm.freshnessRating),
            brixDegree: qaForm.brixDegree ? parseFloat(qaForm.brixDegree) : undefined,
            defectRate: qaForm.defectRate ? parseFloat(qaForm.defectRate) : 0,
            temperatureOnArrival: qaForm.temperatureOnArrival ? parseFloat(qaForm.temperatureOnArrival) : 0,
            netWeightKg: qaForm.netWeightKg ? parseFloat(qaForm.netWeightKg) : selectedShipmentForQa.weight,
            isPackageIntact: qaForm.isPackageIntact,
            isQrValid: qaForm.isQrValid,
            qaResult: qaForm.qaResult,
            notes: qaForm.notes,
            createdAt: new Date().toISOString(),
        };

        retailerService.saveQualityRecord(record);
        setQaRecords((prev) => ({ ...prev, [selectedShipmentForQa.id]: record }));
        const savedMsg = `✅ Đã lưu Biên bản Kiểm định QA thành công cho lô "${record.batchCode}"!`;
        setSuccessMessage(savedMsg);
        toast.success(savedMsg);

        // Nếu người dùng chọn lưu và kích hoạt hành động hệ thống
        if (andAction === 'RECEIVE' && !selectedShipmentForQa.receivedDate) {
            void handleExecuteReceive(selectedShipmentForQa.id);
        } else if (andAction === 'READY_FOR_SALE' && selectedShipmentForQa.receivedDate && !selectedShipmentForQa.readyForSaleDate) {
            void handleExecuteReadyForSale(selectedShipmentForQa.id);
        }

        setSubmittingQa(false);
        setSelectedShipmentForQa(null);
    };

    // Tiếp nhận kho
    const handleExecuteReceive = async (shipmentId: string) => {
        setActionLoadingId(shipmentId);
        try {
            await retailerService.receiveShipment(shipmentId);
            const successMsg = '🎉 Đã xác nhận tiếp nhận kho trên Blockchain thành công (RECEIVED_AT_RETAILER)!';
            setSuccessMessage(successMsg);
            toast.success(successMsg);
            await fetchData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Tiếp nhận kho thất bại!';
            setError(msg);
            toast.error(msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Chuyển sang Ready For Sale
    const handleExecuteReadyForSale = async (shipmentId: string) => {
        setActionLoadingId(shipmentId);
        try {
            await retailerService.readyForSale(shipmentId);
            const successMsg = '🎉 Đã phê duyệt và chuyển lô hàng sang trạng thái READY_FOR_SALE thành công!';
            setSuccessMessage(successMsg);
            toast.success(successMsg);
            await fetchData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Chuyển trạng thái bán hàng thất bại!';
            setError(msg);
            toast.error(msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Thống kê KPI
    const stats = useMemo(() => {
        const total = shipments.length;
        let pending = 0;
        let passed = 0;
        let rejected = 0;

        shipments.forEach((s) => {
            const record = qaRecords[s.id];
            if (!record) {
                pending++;
            } else if (record.qaResult === 'PASSED') {
                passed++;
            } else {
                rejected++;
            }
        });

        const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;
        return { total, pending, passed, rejected, passRate };
    }, [shipments, qaRecords]);

    // Sub-Tabs cấu hình
    const tabItems: TabItem[] = useMemo(
        () => [
            { id: 'ALL', label: 'Tất cả lô hàng', count: stats.total, icon: <FileText className="w-4 h-4" /> },
            { id: 'PENDING', label: 'Chờ kiểm định QA', count: stats.pending, icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
            { id: 'PASSED', label: 'Đạt chuẩn (PASSED)', count: stats.passed, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
            { id: 'REJECTED', label: 'Không đạt / Tạm giữ', count: stats.rejected, icon: <XCircle className="w-4 h-4 text-rose-500" /> },
        ],
        [stats]
    );

    // Lọc dữ liệu
    const filteredShipments = useMemo(() => {
        return shipments.filter((item) => {
            const record = qaRecords[item.id];
            let matchesTab = true;

            if (activeTab === 'PENDING') {
                matchesTab = !record;
            } else if (activeTab === 'PASSED') {
                matchesTab = record?.qaResult === 'PASSED';
            } else if (activeTab === 'REJECTED') {
                matchesTab = record?.qaResult === 'QUARANTINE' || record?.qaResult === 'REJECTED';
            }

            const query = searchTerm.toLowerCase().trim();
            if (!query) return matchesTab;

            const code = item.shippingCode?.toLowerCase() || '';
            const batchCode = (item.batchCode || item.subBatchCode || '').toLowerCase();
            const carrier = item.carrierInfo?.toLowerCase() || '';

            return matchesTab && (code.includes(query) || batchCode.includes(query) || carrier.includes(query));
        });
    }, [shipments, qaRecords, activeTab, searchTerm]);

    // Định nghĩa cột Bảng
    const columns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'MÃ VẬN ĐƠN / LÔ HÀNG',
            key: 'shippingCode',
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                        {item.shippingCode}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold border border-indigo-100">
                            {item.subBatchCode || item.batchCode || 'N/A'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            header: 'NGUỒN GỐC & TRỌNG LƯỢNG',
            key: 'pickupLocation',
            render: (item) => (
                <div className="flex flex-col text-xs gap-0.5">
                    <span className="font-semibold text-slate-800">{item.pickupLocation || 'HTX Nông Nghiệp CleanFarm'}</span>
                    <span className="text-slate-500 font-mono flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400" />
                        Tải trọng: <strong className="text-slate-700">{item.weight} kg</strong>
                    </span>
                </div>
            ),
        },
        {
            header: 'CHỨNG NHẬN VIETGAP GỐC',
            key: 'processorCert',
            render: () => {
                return (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 w-fit">
                        <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>VietGAP Passed</span>
                    </div>
                );
            },
        },
        {
            header: 'ĐÁNH GIÁ QA SIÊU THỊ',
            key: 'qaRecord',
            align: 'center',
            render: (item) => {
                const record = qaRecords[item.id];
                if (!record) {
                    return (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Chờ kiểm định
                        </span>
                    );
                }

                if (record.qaResult === 'PASSED') {
                    return (
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ĐẠT CHUẨN (PASSED)
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                                Grade: {record.sensoryGrade.replace('GRADE_', 'Loại ')} | Brix: {record.brixDegree || 'N/A'}°Bx
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            {record.qaResult === 'QUARANTINE' ? 'TẠM GIỮ' : 'KHÔNG ĐẠT (REJECT)'}
                        </span>
                        <span className="text-[11px] text-rose-600 font-medium">Lỗi dập nát: {record.defectRate}%</span>
                    </div>
                );
            },
        },
        {
            header: 'TRẠNG THÁI ON-CHAIN',
            key: 'status',
            align: 'center',
            render: (item) => {
                if (item.readyForSaleDate) {
                    return <AppBadge status="READY_FOR_SALE" label="READY FOR SALE" />;
                }
                if (item.receivedDate) {
                    return <AppBadge status="DA_DUYET" label="ĐÃ NHẬN KHO" />;
                }
                return <AppBadge status="IN_TRANSIT" label="ĐANG VẬN CHUYỂN" />;
            },
        },
        {
            header: 'THAO TÁC',
            key: 'actions',
            align: 'center',
            render: (item) => {
                const record = qaRecords[item.id];
                const isLoading = actionLoadingId === item.id;

                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* Button 1: Perform Quality Audit */}
                        <AppButton
                            size="sm"
                            variant={record ? 'outline' : 'primary'}
                            onClick={() => void handleOpenQaModal(item)}
                            className={!record ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : ''}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {record ? 'Cập nhật QA' : 'Kiểm định QA'}
                        </AppButton>

                        {/* Button 2: View QA Audit Certificate / Report */}
                        {record && (
                            <button
                                onClick={() => setReportShipment(item)}
                                title="Xem Biên bản Kiểm định QA Siêu thị"
                                className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            >
                                <FileText className="w-4 h-4 text-emerald-600" />
                            </button>
                        )}

                        {/* Button 3: Quick Receive or Shelf if QA Passed */}
                        {record?.qaResult === 'PASSED' && !item.receivedDate && (
                            <button
                                onClick={() => void handleExecuteReceive(item.id)}
                                disabled={isLoading}
                                title="Nhận kho siêu thị ngay (Smart Contract receive)"
                                className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            >
                                <PackageCheck className="w-4 h-4" />
                            </button>
                        )}

                        {record?.qaResult === 'PASSED' && item.receivedDate && !item.readyForSaleDate && (
                            <button
                                onClick={() => void handleExecuteReadyForSale(item.id)}
                                disabled={isLoading}
                                title="Duyệt Đưa lên kệ bán (Smart Contract readyForSale)"
                                className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer border border-amber-200"
                            >
                                <ShoppingBag className="w-4 h-4" />
                            </button>
                        )}

                        {/* Link to public QR Traceability */}
                        <a
                            href={`/trace/${item.subBatchCode || item.batchCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mở Trang Truy xuất QR Code"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                KIỂM TRA CHẤT LƯỢNG NÔNG SẢN SIÊU THỊ (QA / QC)
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                                Đối soát chứng nhận VietGAP gốc từ Cơ sở chế biến và thực hiện kiểm định cảm quan, độ ngọt Brix, nhiệt độ bảo quản trước khi nhập kho và lên kệ.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AppButton variant="outline" size="sm" onClick={() => void fetchData()} isLoading={loading}>
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Tải lại
                    </AppButton>
                </div>
            </div>

            {/* KPI Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Tổng vận đơn nhận</div>
                        <div className="text-xl font-black text-slate-900">{stats.total}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Chờ kiểm định QA</div>
                        <div className="text-xl font-black text-amber-600">{stats.pending}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Đạt chuẩn (Passed)</div>
                        <div className="text-xl font-black text-emerald-600">
                            {stats.passed} <span className="text-xs font-normal text-slate-500">({stats.passRate}%)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Không đạt / Tạm giữ</div>
                        <div className="text-xl font-black text-rose-600">{stats.rejected}</div>
                    </div>
                </div>
            </div>

            {/* Sub-Tabs & Thanh tìm kiếm */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <AppTabs tabs={tabItems} activeTabId={activeTab} onTabChange={setActiveTab} />
                    <div className="w-full md:w-72">
                        <AppInput
                            placeholder="Tìm theo mã vận đơn, mã lô..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-4 h-4 text-slate-400" />}
                        />
                    </div>
                </div>

                {/* Table Render */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Đang dữ liệu kiểm tra chất lượng...</p>
                    </div>
                ) : filteredShipments.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-700 font-bold text-base">Không có dữ liệu lô hàng nào phù hợp</p>
                        <p className="text-slate-500 text-xs mt-1">Vui lòng chọn tab khác hoặc cập nhật từ khóa tìm kiếm.</p>
                    </div>
                ) : (
                    <AppTable columns={columns} data={filteredShipments} showSTT={true} />
                )}
            </div>

            {/* MODAL 1: KIỂM ĐỊNH CHẤT LƯỢNG SIÊU THỊ (QA AUDIT FORM & ORIGIN CERT) */}
            {selectedShipmentForQa && (
                <AppModal
                    isOpen={!!selectedShipmentForQa}
                    onClose={() => setSelectedShipmentForQa(null)}
                    title={`BIÊN BẢN KIỂM ĐỊNH CHẤT LƯỢNG SIÊU THỊ - LÔ [${selectedShipmentForQa.subBatchCode || selectedShipmentForQa.batchCode}]`}
                    maxWidth="2xl"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <AppButton variant="outline" size="sm" onClick={() => setSelectedShipmentForQa(null)}>
                                Hủy bỏ
                            </AppButton>
                            <div className="flex items-center gap-2">
                                <AppButton
                                    variant="outline"
                                    size="sm"
                                    isLoading={submittingQa}
                                    onClick={() => handleSaveQaRecord()}
                                    className="border-slate-300 text-slate-700"
                                >
                                    Chỉ lưu biên bản QA
                                </AppButton>

                                {!selectedShipmentForQa.receivedDate && qaForm.qaResult === 'PASSED' && (
                                    <AppButton
                                        variant="primary"
                                        size="sm"
                                        isLoading={submittingQa}
                                        onClick={() => handleSaveQaRecord('RECEIVE')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    >
                                        <PackageCheck className="w-4 h-4 mr-1" />
                                        Lưu QA & Tiếp nhận kho
                                    </AppButton>
                                )}

                                {selectedShipmentForQa.receivedDate && !selectedShipmentForQa.readyForSaleDate && qaForm.qaResult === 'PASSED' && (
                                    <AppButton
                                        variant="primary"
                                        size="sm"
                                        isLoading={submittingQa}
                                        onClick={() => handleSaveQaRecord('READY_FOR_SALE')}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-1" />
                                        Lưu QA & Duyệt lên kệ
                                    </AppButton>
                                )}
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-5">
                        {/* Sub-tabs trong Modal */}
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveQaTab('SUPERMARKET_CHECK')}
                                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeQaTab === 'SUPERMARKET_CHECK'
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                1. Đo Đạc & Cảm Quan Tại Siêu Thị
                            </button>
                            <button
                                onClick={() => setActiveQaTab('ORIGIN_CERT')}
                                className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeQaTab === 'ORIGIN_CERT'
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <Award className="w-4 h-4" />
                                2. Chứng Nhận VietGAP Gốc (Processor)
                            </button>
                        </div>

                        {/* TAB 1: Đo Đạc & Cảm quan Siêu thị */}
                        {activeQaTab === 'SUPERMARKET_CHECK' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Cán bộ/Nhân viên kiểm định QA</label>
                                        <AppInput
                                            value={qaForm.inspectorName}
                                            onChange={(e) => setQaForm({ ...qaForm, inspectorName: e.target.value })}
                                            placeholder="Tên nhân viên QA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Ngày thực hiện kiểm tra</label>
                                        <AppInput
                                            type="date"
                                            value={qaForm.inspectionDate}
                                            onChange={(e) => setQaForm({ ...qaForm, inspectionDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại cảm quan (Grade)</label>
                                        <select
                                            value={qaForm.sensoryGrade}
                                            onChange={(e) => setQaForm({ ...qaForm, sensoryGrade: e.target.value as any })}
                                            className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="GRADE_A">Loại 1 Đặc Biệt (Grade A)</option>
                                            <option value="GRADE_B">Loại 1 Tiêu Chuẩn (Grade B)</option>
                                            <option value="GRADE_C">Loại 2 Thường (Grade C)</option>
                                            <option value="REJECTED">Không Đạt Tiêu Chuẩn</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Đánh giá độ tươi mới (1-5★)</label>
                                        <div className="flex items-center gap-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setQaForm({ ...qaForm, freshnessRating: star })}
                                                    className="cursor-pointer focus:outline-hidden"
                                                >
                                                    <Star
                                                        className={`w-5 h-5 ${star <= qaForm.freshnessRating
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-slate-300'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-xs font-bold text-slate-700">{qaForm.freshnessRating}/5 Sao</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Độ ngọt đo được Brix (°Bx)</label>
                                        <AppInput
                                            type="number"
                                            step="0.1"
                                            value={qaForm.brixDegree}
                                            onChange={(e) => setQaForm({ ...qaForm, brixDegree: e.target.value })}
                                            placeholder="Ví dụ: 13.5"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Tỉ lệ dập nát / hư hỏng (%)</label>
                                        <AppInput
                                            type="number"
                                            step="0.1"
                                            value={qaForm.defectRate}
                                            onChange={(e) => setQaForm({ ...qaForm, defectRate: e.target.value })}
                                            placeholder="Tỉ lệ %"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nhiệt độ thùng xe (°C)</label>
                                        <AppInput
                                            type="number"
                                            step="0.5"
                                            value={qaForm.temperatureOnArrival}
                                            onChange={(e) => setQaForm({ ...qaForm, temperatureOnArrival: e.target.value })}
                                            placeholder="Nhiệt độ °C"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Trọng lượng thực tế (kg)</label>
                                        <AppInput
                                            type="number"
                                            value={qaForm.netWeightKg}
                                            onChange={(e) => setQaForm({ ...qaForm, netWeightKg: e.target.value })}
                                            placeholder="Kg"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <span className="text-xs font-bold text-slate-700 block">Kiểm tra Niêm phong & Tem mã QR</span>
                                    <div className="flex items-center gap-6 text-xs">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={qaForm.isPackageIntact}
                                                onChange={(e) => setQaForm({ ...qaForm, isPackageIntact: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                                            />
                                            <span className="font-semibold text-slate-800">Bao bì & Đai niêm phong nguyên vẹn</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={qaForm.isQrValid}
                                                onChange={(e) => setQaForm({ ...qaForm, isQrValid: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                                            />
                                            <span className="font-semibold text-slate-800">Mã tem QR hợp lệ & Quét được</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">KẾT QUẢ KIỂM ĐỊNH CHẤT LƯỢNG SIÊU THỊ</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQaForm({ ...qaForm, qaResult: 'PASSED' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${qaForm.qaResult === 'PASSED'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                                }`}
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            ĐẠT CHUẨN (PASSED)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setQaForm({ ...qaForm, qaResult: 'QUARANTINE' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${qaForm.qaResult === 'QUARANTINE'
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                                                }`}
                                        >
                                            <AlertTriangle className="w-5 h-5" />
                                            TẠM GIỮ / KIỂM TRA LẠI
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setQaForm({ ...qaForm, qaResult: 'REJECTED' })}
                                            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${qaForm.qaResult === 'REJECTED'
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                                                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                                }`}
                                        >
                                            <XCircle className="w-5 h-5" />
                                            KHÔNG ĐẠT (REJECT)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú kiểm định / Lý do nếu không đạt</label>
                                    <textarea
                                        rows={2}
                                        value={qaForm.notes}
                                        onChange={(e) => setQaForm({ ...qaForm, notes: e.target.value })}
                                        placeholder="Nhập ghi chú hoặc lý do chi tiết..."
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Chứng nhận VietGAP Gốc */}
                        {activeQaTab === 'ORIGIN_CERT' && (
                            <div className="space-y-4">
                                {loadingInspections ? (
                                    <div className="p-8 text-center text-slate-500 text-xs">
                                        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                                        Đang tải giấy chứng nhận gốc từ Cơ sở chế biến...
                                    </div>
                                ) : processorInspections.length === 0 ? (
                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                        <Award className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
                                        <h4 className="text-sm font-bold text-slate-800">Chứng nhận Kiểm định VietGAP / GlobalGAP Gốc</h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Lô hàng đã hoàn thành bước phân loại & kiểm định chất lượng tại Cơ sở chế biến đạt tiêu chuẩn an toàn thực phẩm.
                                        </p>
                                        <div className="mt-4 p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-medium inline-block border border-emerald-200">
                                            ✅ Chứng nhận VietGAP số: <strong>VG-2026-88912</strong> (Trung tâm Kiểm định Nông nghiệp Quốc gia)
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {processorInspections.map((cert) => (
                                            <div key={cert.id} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                                                        <Award className="w-4 h-4 text-emerald-600" />
                                                        {cert.documentName}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-extrabold uppercase">
                                                        {cert.result}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-slate-700">
                                                    <div>Mã số chứng nhận: <strong className="font-mono">{cert.documentNumber}</strong></div>
                                                    <div>Đơn vị kiểm định: <strong>{cert.inspectionUnit}</strong></div>
                                                    <div>Ngày cấp: <strong>{new Date(cert.inspectionDate).toLocaleDateString('vi-VN')}</strong></div>
                                                    <div>File đính kèm: <span className="font-mono text-indigo-600 truncate">{cert.fileURI || 'IPFS Document'}</span></div>
                                                </div>
                                                {cert.note && <div className="text-slate-500 italic">Ghi chú: {cert.note}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </AppModal>
            )}

            {/* MODAL 2: XEM VÀ IN BIÊN BẢN KIỂM ĐỊNH QA SIÊU THỊ */}
            {reportShipment && qaRecords[reportShipment.id] && (
                <AppModal
                    isOpen={!!reportShipment}
                    onClose={() => setReportShipment(null)}
                    title="BIÊN BẢN KẾT QUẢ KIỂM TRA CHẤT LƯỢNG ĐẦU VÀO SIÊU THỊ"
                    maxWidth="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <AppButton variant="outline" size="sm" onClick={() => window.print()}>
                                <Download className="w-4 h-4 mr-1.5" />
                                In Biên bản (Print)
                            </AppButton>
                            <AppButton variant="primary" size="sm" onClick={() => setReportShipment(null)}>
                                Đóng
                            </AppButton>
                        </div>
                    }
                >
                    {(() => {
                        const rec = qaRecords[reportShipment.id];
                        return (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 text-slate-900">
                                {/* Header Giấy Kiểm Định */}
                                <div className="border-b border-slate-300 pb-4 text-center">
                                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-black text-base uppercase tracking-wider">
                                        <Store className="w-5 h-5" /> HỆ THỐNG SIÊU THỊ & BÁN LẺ NÔNG SẢN SẠCH
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 mt-1 uppercase">
                                        BIÊN BẢN ĐÁNH GIÁ CHẤT LƯỢNG HÀNG HÓA ĐẦU VÀO
                                    </h2>
                                    <p className="text-xs text-slate-500">Mã biên bản: QA-{reportShipment.shippingCode}</p>
                                </div>

                                {/* Thông tin chung */}
                                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div>
                                        <span className="text-slate-500 block">Mã vận đơn / Vận chuyển:</span>
                                        <strong className="font-mono text-slate-900">{reportShipment.shippingCode}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Mã lô nông sản:</span>
                                        <strong className="font-mono text-indigo-700">{reportShipment.subBatchCode || reportShipment.batchCode}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Nơi gửi (HTX / Cơ sở chế biến):</span>
                                        <strong>{reportShipment.pickupLocation}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Cán bộ kiểm định QA:</span>
                                        <strong>{rec.inspectorName}</strong>
                                    </div>
                                </div>

                                {/* Chi tiết chỉ số kỹ thuật */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-l-4 border-emerald-600 pl-2">
                                        Kết quả đo đạc kỹ thuật & Cảm quan
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                                            <div className="text-[11px] text-slate-500 font-semibold">Phân loại</div>
                                            <div className="font-extrabold text-emerald-800 mt-0.5">{rec.sensoryGrade.replace('GRADE_', 'Loại ')}</div>
                                        </div>
                                        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                                            <div className="text-[11px] text-slate-500 font-semibold">Độ ngọt (Brix)</div>
                                            <div className="font-extrabold text-amber-800 mt-0.5">{rec.brixDegree || 'N/A'} °Bx</div>
                                        </div>
                                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                                            <div className="text-[11px] text-slate-500 font-semibold">Nhiệt độ xe</div>
                                            <div className="font-extrabold text-blue-800 mt-0.5">{rec.temperatureOnArrival} °C</div>
                                        </div>
                                        <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                                            <div className="text-[11px] text-slate-500 font-semibold">Tỉ lệ hư hỏng</div>
                                            <div className="font-extrabold text-rose-800 mt-0.5">{rec.defectRate} %</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Kết quả cuối cùng */}
                                <div className="p-4 bg-emerald-100/60 rounded-xl border border-emerald-300 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-8 h-8 text-emerald-700 shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold text-emerald-950">KẾT LUẬN KIỂM ĐỊNH</div>
                                            <div className="text-sm font-black text-emerald-800 uppercase">
                                                {rec.qaResult === 'PASSED' ? 'ĐẠT CHUẨN CHẤT LƯỢNG - ĐỦ ĐIỀU KIỆN LÊN KỆ BÁN' : rec.qaResult}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-slate-600">
                                        <div>Ngày duyệt: {new Date(rec.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </AppModal>
            )}
        </div>
    );
};

export default RetailerQualityPage;
