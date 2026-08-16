import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import {
    RefreshCw,
    Truck,
    ShoppingBag,
    PackageCheck,
    QrCode,
    Search,
    ExternalLink,
    ShieldCheck,
    CheckCircle2,
    Clock,
    Copy,
    Info,
    Store,
    Scale,
    Sparkles,
    MapPin,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppTabs, type TabItem } from '../../components/ui/AppTabs';
import { AppModal } from '../../components/ui/AppModal';
import { AppInput } from '../../components/ui/AppInput';
import { retailerService, type ShipmentHistoryDto } from '../../services/retailerService';
import { toast } from '../../utils/toast';

export const ReceiveShipmentPage: React.FC = () => {
    const [shipments, setShipments] = useState<ShipmentHistoryDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Filter & Search state
    const [activeTab, setActiveTab] = useState<string>('SHIPPING'); // 'SHIPPING' | 'RECEIVED' | 'READY_FOR_SALE' | 'ALL'
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Modal state
    const [receivingShipment, setReceivingShipment] = useState<ShipmentHistoryDto | null>(null);
    const [readyingShipment, setReadyingShipment] = useState<ShipmentHistoryDto | null>(null);
    const [detailShipment, setDetailShipment] = useState<ShipmentHistoryDto | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    // Fetch data from API
    const fetchShipments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await retailerService.getMyShipments();
            setShipments(data);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi tải danh sách vận đơn Siêu thị:', errorObj);
            const msg = errorObj.response?.data?.message || 'Không thể kết nối Backend API để tải vận đơn Siêu thị.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchShipments();
    }, [fetchShipments]);

    // Handle Confirm Receive Action
    const handleConfirmReceive = async () => {
        if (!receivingShipment) return;
        setActionLoadingId(receivingShipment.id);
        setError(null);
        setSuccessMessage(null);
        try {
            await retailerService.receiveShipment(receivingShipment.id);
            const successMsg = `✅ Đã tiếp nhận vận đơn "${receivingShipment.shippingCode}" thành công! Trạng thái chuyển sang RECEIVED_AT_RETAILER trên Blockchain.`;
            setSuccessMessage(successMsg);
            toast.success(successMsg);
            setReceivingShipment(null);
            await fetchShipments();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Tiếp nhận vận đơn thất bại! Vui lòng kiểm tra lại.';
            setError(msg);
            toast.error(msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Confirm Ready For Sale Action
    const handleConfirmReadyForSale = async () => {
        if (!readyingShipment) return;
        setActionLoadingId(readyingShipment.id);
        setError(null);
        setSuccessMessage(null);
        try {
            await retailerService.readyForSale(readyingShipment.id);
            const successMsg = `🎉 Đã chuyển lô sản phẩm "${readyingShipment.batchCode || readyingShipment.subBatchCode}" sang trạng thái READY_FOR_SALE! Người tiêu dùng có thể quét QR để truy xuất đầy đủ.`;
            setSuccessMessage(successMsg);
            toast.success(successMsg);
            setReadyingShipment(null);
            await fetchShipments();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Chuyển trạng thái sẵn sàng bán thất bại!';
            setError(msg);
            toast.error(msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Copy to clipboard helper
    const handleCopyHash = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(text);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    // Statistics computation
    const stats = useMemo(() => {
        const total = shipments.length;
        const shipping = shipments.filter((s) => !s.receivedDate).length;
        const received = shipments.filter((s) => s.receivedDate && !s.readyForSaleDate).length;
        const readyForSale = shipments.filter((s) => !!s.readyForSaleDate).length;
        const totalWeight = shipments.reduce((acc, s) => acc + (s.weight || 0), 0);
        return { total, shipping, received, readyForSale, totalWeight };
    }, [shipments]);

    // Sub-Tabs configuration
    const tabItems: TabItem[] = useMemo(
        () => [
            { id: 'SHIPPING', label: 'Lô đang vận chuyển', count: stats.shipping, icon: <Truck className="w-4 h-4" /> },
            { id: 'RECEIVED', label: 'Đã nhận kho (Chờ đưa lên kệ)', count: stats.received, icon: <PackageCheck className="w-4 h-4" /> },
            { id: 'READY_FOR_SALE', label: 'Sẵn sàng bán (READY_FOR_SALE)', count: stats.readyForSale, icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'ALL', label: 'Lịch sử tất cả lô hàng', count: stats.total, icon: <Clock className="w-4 h-4" /> },
        ],
        [stats]
    );

    // Filter shipments logic
    const filteredShipments = useMemo(() => {
        return shipments.filter((item) => {
            let matchesTab = true;
            if (activeTab === 'SHIPPING') {
                matchesTab = !item.receivedDate;
            } else if (activeTab === 'RECEIVED') {
                matchesTab = !!item.receivedDate && !item.readyForSaleDate;
            } else if (activeTab === 'READY_FOR_SALE') {
                matchesTab = !!item.readyForSaleDate;
            }

            const query = searchTerm.toLowerCase().trim();
            if (!query) return matchesTab;

            const code = item.shippingCode?.toLowerCase() || '';
            const batchCode = (item.batchCode || item.subBatchCode || '').toLowerCase();
            const carrier = item.carrierInfo?.toLowerCase() || '';
            const destination = item.destination?.toLowerCase() || '';
            const pickup = item.pickupLocation?.toLowerCase() || '';

            const matchesSearch =
                code.includes(query) ||
                batchCode.includes(query) ||
                carrier.includes(query) ||
                destination.includes(query) ||
                pickup.includes(query);

            return matchesTab && matchesSearch;
        });
    }, [shipments, activeTab, searchTerm]);

    // Table columns definition
    const columns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'MÃ VẬN ĐƠN / LÔ HÀNG',
            key: 'shippingCode',
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        {item.shippingCode}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                            {item.assetType === 'SUB' ? 'Kiện phụ: ' : 'Lô chính: '}
                            {item.subBatchCode || item.batchCode || 'N/A'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            header: 'NGUỒN GỐC & NƠI GIAO',
            key: 'pickupLocation',
            render: (item) => (
                <div className="flex flex-col text-xs gap-1">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Từ: {item.pickupLocation || 'HTX Cung Cấp'}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-blue-600" />
                        Đến: {item.destination || item.retailerName || 'Kho Siêu Thị'}
                    </span>
                </div>
            ),
        },
        {
            header: 'ĐƠN VỊ VẬN CHUYỂN & TẢI TRỌNG',
            key: 'carrierInfo',
            render: (item) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-slate-800">{item.carrierInfo || 'Xe tải lạnh HTX'}</span>
                    <span className="text-slate-500 font-mono font-semibold flex items-center gap-1 mt-0.5">
                        <Scale className="w-3 h-3 text-slate-400" />
                        {item.weight ? `${item.weight} kg` : 'N/A'}
                    </span>
                </div>
            ),
        },
        {
            header: 'NGÀY GỬI / NHẬN',
            key: 'shippingDate',
            render: (item) => (
                <div className="flex flex-col text-xs space-y-0.5">
                    <span className="text-slate-600">
                        Gửi: {item.shippingDate ? new Date(item.shippingDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                    {item.receivedDate ? (
                        <span className="text-emerald-600 font-semibold">
                            Nhận: {new Date(item.receivedDate).toLocaleDateString('vi-VN')}
                        </span>
                    ) : (
                        <span className="text-amber-600 italic">Đang di chuyển</span>
                    )}
                </div>
            ),
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
                const isLoading = actionLoadingId === item.id;
                return (
                    <div className="flex items-center justify-center gap-2">
                        {/* Status 1: STAGE_SHIPPING -> Ready to RECEIVE */}
                        {!item.receivedDate && (
                            <AppButton
                                size="sm"
                                variant="green"
                                isLoading={isLoading}
                                onClick={() => setReceivingShipment(item)}
                                leftIcon={<PackageCheck className="w-4 h-4 shrink-0" />}
                            >
                                Tiếp nhận
                            </AppButton>
                        )}

                        {/* Status 2: RECEIVED_AT_RETAILER -> Ready to READY_FOR_SALE */}
                        {item.receivedDate && !item.readyForSaleDate && (
                            <AppButton
                                size="sm"
                                variant="orange"
                                isLoading={isLoading}
                                onClick={() => setReadyingShipment(item)}
                                leftIcon={<ShoppingBag className="w-4 h-4 shrink-0" />}
                            >
                                Lên kệ bán
                            </AppButton>
                        )}

                        {/* Status 3: Details & Blockchain */}
                        <button
                            onClick={() => setDetailShipment(item)}
                            title="Xem chi tiết & Proof Blockchain"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200"
                        >
                            <Info className="w-4 h-4 shrink-0" />
                        </button>
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
                    <div className="flex items-center gap-2">
                        <Store className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                            TIẾP NHẬN LÔ HÀNG VÀ CỔNG BÁN LẺ SIÊU THỊ
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        Quản lý các vận đơn được vận chuyển từ Hợp tác xã, tiếp nhận kho và phát hành nông sản thương mại lên kệ siêu thị.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <AppButton
                        variant="outline"
                        size="sm"
                        onClick={() => void fetchShipments()}
                        isLoading={loading}
                        leftIcon={<RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />}
                    >
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
                        <div className="text-xs text-slate-500 font-semibold">Tổng vận đơn</div>
                        <div className="text-xl font-black text-slate-900">{stats.total}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Đang vận chuyển</div>
                        <div className="text-xl font-black text-amber-600">{stats.shipping}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <PackageCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Đã tiếp nhận kho</div>
                        <div className="text-xl font-black text-blue-600">{stats.received}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-semibold">Sẵn sàng bán (Shelved)</div>
                        <div className="text-xl font-black text-emerald-600">{stats.readyForSale}</div>
                    </div>
                </div>
            </div>

            {/* Sub-Tabs and Search Filter */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <AppTabs tabs={tabItems} activeTabId={activeTab} onTabChange={setActiveTab} />
                    <div className="w-full md:w-72">
                        <AppInput
                            placeholder="Tìm theo mã vận đơn, nhà xe..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-4 h-4 text-slate-400" />}
                        />
                    </div>
                </div>

                {/* Table Data */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Đang tải danh sách vận đơn tiếp nhận...</p>
                    </div>
                ) : filteredShipments.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-700 font-bold text-base">Không có vận đơn nào khớp với bộ lọc</p>
                        <p className="text-slate-500 text-xs mt-1">Vui lòng thử lại với từ khóa hoặc tab khác.</p>
                    </div>
                ) : (
                    <AppTable columns={columns} data={filteredShipments} showSTT={true} />
                )}
            </div>

            {/* MODAL 1: Confirm Receive Shipment */}
            {receivingShipment && (
                <AppModal
                    isOpen={!!receivingShipment}
                    onClose={() => setReceivingShipment(null)}
                    title="XÁC NHẬN TIẾP NHẬN LÔ HÀNG VẬN CHUYỂN"
                    maxWidth="md"
                    footer={
                        <>
                            <AppButton variant="outline" size="sm" onClick={() => setReceivingShipment(null)}>
                                Hủy bỏ
                            </AppButton>
                            <AppButton
                                variant="green"
                                size="sm"
                                isLoading={actionLoadingId === receivingShipment.id}
                                onClick={() => void handleConfirmReceive()}
                                leftIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                            >
                                Xác nhận Tiếp nhận
                            </AppButton>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-emerald-900 leading-relaxed">
                                Hành động này sẽ gọi Smart Contract <code className="font-mono bg-emerald-100 px-1 rounded">receiveParent</code> / <code className="font-mono bg-emerald-100 px-1 rounded">receiveSub</code> trên Blockchain và cập nhật trạng thái lô sang <span className="font-bold">RECEIVED_AT_RETAILER</span>.
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-semibold">Mã vận đơn:</span>
                                <span className="font-mono font-bold text-slate-900">{receivingShipment.shippingCode}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-semibold">Mã lô / Kiện:</span>
                                <span className="font-mono font-bold text-indigo-700">
                                    {receivingShipment.subBatchCode || receivingShipment.batchCode}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-semibold">HTX Gửi hàng:</span>
                                <span className="font-semibold text-slate-800">{receivingShipment.pickupLocation}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-semibold">Đơn vị vận chuyển:</span>
                                <span className="font-medium text-slate-800">{receivingShipment.carrierInfo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Trọng lượng hàng:</span>
                                <span className="font-bold text-slate-900">{receivingShipment.weight} kg</span>
                            </div>
                        </div>
                    </div>
                </AppModal>
            )}

            {/* MODAL 2: Confirm Ready For Sale */}
            {readyingShipment && (
                <AppModal
                    isOpen={!!readyingShipment}
                    onClose={() => setReadyingShipment(null)}
                    title="ĐƯA SẢN PHẨM LÊN KỆ BÁN HÀNG (READY FOR SALE)"
                    maxWidth="md"
                    footer={
                        <>
                            <AppButton variant="outline" size="sm" onClick={() => setReadyingShipment(null)}>
                                Hủy bỏ
                            </AppButton>
                            <AppButton
                                variant="orange"
                                size="sm"
                                isLoading={actionLoadingId === readyingShipment.id}
                                onClick={() => void handleConfirmReadyForSale()}
                                leftIcon={<Sparkles className="w-4 h-4 shrink-0" />}
                            >
                                Xác nhận Đưa lên kệ
                            </AppButton>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                            <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-900 leading-relaxed">
                                Khi chuyển trạng thái lô hàng sang <span className="font-bold">READY_FOR_SALE</span>, Smart Contract sẽ xác nhận sản phẩm đã bày bán thương mại. Người tiêu dùng quét QR code sản phẩm sẽ truy xuất được toàn bộ chuỗi minh bạch từ Trang trại đến Siêu thị.
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-semibold">Mã lô / Kiện:</span>
                                <span className="font-mono font-bold text-indigo-700">
                                    {readyingShipment.subBatchCode || readyingShipment.batchCode}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-semibold">Mã vận đơn:</span>
                                <span className="font-mono font-semibold text-slate-800">{readyingShipment.shippingCode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-semibold">Siêu thị phân phối:</span>
                                <span className="font-bold text-emerald-700">{readyingShipment.destination || readyingShipment.retailerName}</span>
                            </div>
                        </div>
                    </div>
                </AppModal>
            )}

            {/* MODAL 3: Shipment Details & Blockchain Audit */}
            {detailShipment && (
                <AppModal
                    isOpen={!!detailShipment}
                    onClose={() => setDetailShipment(null)}
                    title="CHI TIẾT VẬN ĐƠN & BẰNG CHỨNG BLOCKCHAIN"
                    maxWidth="lg"
                    footer={
                        <AppButton variant="outline" size="sm" onClick={() => setDetailShipment(null)}>
                            Đóng
                        </AppButton>
                    }
                >
                    <div className="space-y-6">
                        {/* Timeline */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-600" /> Tiến trình vận chuyển & Tiếp nhận
                            </h4>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 bg-white rounded-xl border border-indigo-100">
                                    <div className="text-slate-500 font-semibold">1. Ngày gửi hàng</div>
                                    <div className="font-bold text-slate-800 mt-0.5">
                                        {detailShipment.shippingDate ? new Date(detailShipment.shippingDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </div>
                                </div>
                                <div className="p-2 bg-white rounded-xl border border-indigo-100">
                                    <div className="text-slate-500 font-semibold">2. Ngày nhận kho</div>
                                    <div className="font-bold text-emerald-700 mt-0.5">
                                        {detailShipment.receivedDate ? new Date(detailShipment.receivedDate).toLocaleDateString('vi-VN') : 'Chưa nhận'}
                                    </div>
                                </div>
                                <div className="p-2 bg-white rounded-xl border border-indigo-100">
                                    <div className="text-slate-500 font-semibold">3. Ngày lên kệ</div>
                                    <div className="font-bold text-amber-700 mt-0.5">
                                        {detailShipment.readyForSaleDate ? new Date(detailShipment.readyForSaleDate).toLocaleDateString('vi-VN') : 'Chưa lên kệ'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Blockchain Proof Transactions */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bằng chứng On-Chain (Smart Contract Transactions)
                            </h4>

                            <div className="space-y-2">
                                {/* Ship Tx Hash */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        <span className="font-semibold">TxHash Vận chuyển (shipParent / shipSub):</span>
                                        {detailShipment.shipTransactionHash && (
                                            <button
                                                onClick={() => handleCopyHash(detailShipment.shipTransactionHash!)}
                                                className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3 shrink-0" />
                                                <span>{copiedHash === detailShipment.shipTransactionHash ? 'Đã sao chép!' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px] truncate">
                                        {detailShipment.shipTransactionHash || 'Chưa có TxHash ghi nhận'}
                                    </div>
                                </div>

                                {/* Receive Tx Hash */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        <span className="font-semibold">TxHash Tiếp nhận (receiveParent / receiveSub):</span>
                                        {detailShipment.receiveTransactionHash && (
                                            <button
                                                onClick={() => handleCopyHash(detailShipment.receiveTransactionHash!)}
                                                className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3 shrink-0" />
                                                <span>{copiedHash === detailShipment.receiveTransactionHash ? 'Đã sao chép!' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px] truncate">
                                        {detailShipment.receiveTransactionHash || 'Chưa thực hiện giao dịch tiếp nhận'}
                                    </div>
                                </div>

                                {/* Ready Tx Hash */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        <span className="font-semibold">TxHash Đưa lên kệ (readyParent / readySub):</span>
                                        {detailShipment.readyTransactionHash && (
                                            <button
                                                onClick={() => handleCopyHash(detailShipment.readyTransactionHash!)}
                                                className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3 shrink-0" />
                                                <span>{copiedHash === detailShipment.readyTransactionHash ? 'Đã sao chép!' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px] truncate">
                                        {detailShipment.readyTransactionHash || 'Chưa thực hiện giao dịch đưa lên kệ'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Public QR Traceability Link */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <QrCode className="w-6 h-6 text-emerald-400 shrink-0" />
                                <div>
                                    <div className="text-xs font-bold text-slate-200">Truy xuất Nguồn gốc Công khai</div>
                                    <div className="text-[11px] text-slate-400">
                                        Quét QR Code hoặc mở liên kết công khai để kiểm tra trải nghiệm của Người tiêu dùng.
                                    </div>
                                </div>
                            </div>
                            <a
                                href={`/trace/${detailShipment.batchCode || detailShipment.subBatchCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <span>Tra cứu</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                        </div>
                    </div>
                </AppModal>
            )}
        </div>
    );
};

export default ReceiveShipmentPage;
