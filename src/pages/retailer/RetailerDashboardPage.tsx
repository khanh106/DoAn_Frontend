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
    Layers,
    Copy,
    Info,
    Store,
    Scale,
    Sparkles,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppTabs, type TabItem } from '../../components/ui/AppTabs';
import { AppModal } from '../../components/ui/AppModal';
import { retailerService, type ShipmentHistoryDto } from '../../services/retailerService';
import { useNavigate } from 'react-router-dom';
import { getPublicTraceUrl } from '../../utils/traceUrl';
import { toast } from '../../utils/toast';

export const RetailerDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [shipments, setShipments] = useState<ShipmentHistoryDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Filters & Search
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Modals
    const [selectedShipmentForQr, setSelectedShipmentForQr] = useState<ShipmentHistoryDto | null>(null);
    const [selectedShipmentForHash, setSelectedShipmentForHash] = useState<ShipmentHistoryDto | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    const fetchShipments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await retailerService.getMyShipments();
            setShipments(data);
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi tải danh sách vận đơn Retailer:', errorObj);
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

    // Handle Receive Action
    const handleReceiveShipment = async (shipment: ShipmentHistoryDto) => {
        if (!window.confirm(`Xác nhận tiếp nhận vận đơn "${shipment.shippingCode}" vào kho Siêu thị?`)) {
            return;
        }

        setActionLoadingId(shipment.id);
        setError(null);
        setSuccessMessage(null);
        try {
            await retailerService.receiveShipment(shipment.id);
            const successMsg = `✅ Đã tiếp nhận vận đơn ${shipment.shippingCode} thành công! Thông tin được xác thực trên Blockchain.`;
            setSuccessMessage(successMsg);
            toast.success(successMsg);
            await fetchShipments();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            const msg = errorObj.response?.data?.message || 'Tiếp nhận vận đơn thất bại! Vui lòng thử lại.';
            setError(msg);
            toast.error(msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Ready For Sale Action
    const handleReadyForSale = async (shipment: ShipmentHistoryDto) => {
        if (!window.confirm(`Đưa lô sản phẩm "${shipment.batchCode || shipment.subBatchCode}" lên kệ bán hàng tại Siêu thị?`)) {
            return;
        }

        setActionLoadingId(shipment.id);
        setError(null);
        setSuccessMessage(null);
        try {
            await retailerService.readyForSale(shipment.id);
            const successMsg = `🎉 Sản phẩm từ vận đơn ${shipment.shippingCode} đã sẵn sàng bán! Người tiêu dùng có thể quét QR để truy xuất.`;
            setSuccessMessage(successMsg);
            toast.success(successMsg);
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

    // Derived Statistics
    const stats = useMemo(() => {
        const total = shipments.length;
        const inTransit = shipments.filter((s) => !s.receivedDate).length;
        const received = shipments.filter((s) => s.receivedDate && !s.readyForSaleDate).length;
        const readyForSale = shipments.filter((s) => !!s.readyForSaleDate).length;
        const totalWeight = shipments.reduce((acc, s) => acc + (s.weight || 0), 0);

        return { total, inTransit, received, readyForSale, totalWeight };
    }, [shipments]);

    // Filtering logic
    const filteredShipments = useMemo(() => {
        return shipments.filter((item) => {
            // Filter by Status Tab
            let matchesTab = true;
            if (activeTab === 'IN_TRANSIT') {
                matchesTab = !item.receivedDate;
            } else if (activeTab === 'RECEIVED') {
                matchesTab = !!item.receivedDate && !item.readyForSaleDate;
            } else if (activeTab === 'READY_FOR_SALE') {
                matchesTab = !!item.readyForSaleDate;
            }

            // Filter by Search Query
            const query = searchTerm.toLowerCase().trim();
            let matchesSearch = true;
            if (query) {
                const code = item.shippingCode?.toLowerCase() || '';
                const batchCode = (item.batchCode || item.subBatchCode || '').toLowerCase();
                const carrier = item.carrierInfo?.toLowerCase() || '';
                const destination = item.destination?.toLowerCase() || '';
                const pickup = item.pickupLocation?.toLowerCase() || '';

                matchesSearch =
                    code.includes(query) ||
                    batchCode.includes(query) ||
                    carrier.includes(query) ||
                    destination.includes(query) ||
                    pickup.includes(query);
            }

            return matchesTab && matchesSearch;
        });
    }, [shipments, activeTab, searchTerm]);

    // Status tabs setup
    const tabs: TabItem[] = [
        { id: 'ALL', label: 'Tất cả lô hàng', count: stats.total, icon: <Layers className="w-4 h-4" /> },
        { id: 'IN_TRANSIT', label: 'Chờ tiếp nhận', count: stats.inTransit, icon: <Truck className="w-4 h-4 text-amber-500" /> },
        { id: 'RECEIVED', label: 'Đã nhập kho', count: stats.received, icon: <PackageCheck className="w-4 h-4 text-blue-500" /> },
        { id: 'READY_FOR_SALE', label: 'Đang bán lẻ', count: stats.readyForSale, icon: <ShoppingBag className="w-4 h-4 text-emerald-500" /> },
    ];

    // Helper stage renderer
    const renderStageBadge = (item: ShipmentHistoryDto) => {
        if (item.readyForSaleDate) {
            return <AppBadge status="READY_FOR_SALE" label="READY FOR SALE" />;
        }
        if (item.receivedDate) {
            return <AppBadge status="DA_DUYET" label="ĐÃ NHẬP KHO" />;
        }
        return <AppBadge status="IN_TRANSIT" label="ĐANG VẬN CHUYỂN" />;
    };

    // Table Columns Configuration
    const columns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'Mã Vận Đơn',
            key: 'shippingCode',
            render: (item) => (
                <div>
                    <span className="font-extrabold text-slate-900 text-sm block">{item.shippingCode}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-0.5">
                        {item.assetType === 'SUB' ? 'Lô nhỏ (SubBatch)' : 'Lô chính (Parent)'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Mã Lô Sản Phẩm',
            key: 'batchCode',
            render: (item) => (
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">{item.batchCode || item.subBatchCode || 'N/A'}</span>
                </div>
            ),
        },
        {
            header: 'Lộ Trình Vận Chuyển',
            key: 'route',
            render: (item) => (
                <div className="text-xs space-y-1 max-w-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                        <span className="font-semibold text-slate-400">Từ:</span> {item.pickupLocation}
                    </div>
                    <div className="flex items-center gap-1 text-slate-900 font-medium">
                        <span className="font-semibold text-slate-400">Đến:</span> {item.destination}
                    </div>
                </div>
            ),
        },
        {
            header: 'Vận Chuyển & Khối Lượng',
            key: 'carrierInfo',
            render: (item) => (
                <div className="text-xs">
                    <p className="font-semibold text-slate-800">{item.carrierInfo || 'Nhà xe liên kết'}</p>
                    <p className="text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Scale className="w-3 h-3 text-slate-400" />
                        <span>{item.weight ? `${item.weight.toLocaleString('vi-VN')} kg` : 'N/A'}</span>
                    </p>
                </div>
            ),
        },
        {
            header: 'Trạng Thái Kho',
            key: 'status',
            align: 'center',
            render: (item) => (
                <div className="flex flex-col items-center gap-1">
                    {renderStageBadge(item)}
                    <span className="text-[10px] text-slate-400 font-medium">
                        {item.readyForSaleDate
                            ? `Lên kệ: ${new Date(item.readyForSaleDate).toLocaleDateString('vi-VN')}`
                            : item.receivedDate
                                ? `Đã nhận: ${new Date(item.receivedDate).toLocaleDateString('vi-VN')}`
                                : `Gửi ngày: ${new Date(item.shippingDate).toLocaleDateString('vi-VN')}`}
                    </span>
                </div>
            ),
        },
        {
            header: 'Hành Động Siêu Thị',
            key: 'actions',
            align: 'center',
            render: (item) => {
                const isActionLoading = actionLoadingId === item.id;
                const isReceived = !!item.receivedDate;
                const isReadyForSale = !!item.readyForSaleDate;

                return (
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. Nút Tiếp nhận */}
                        {!isReceived && (
                            <button
                                onClick={() => handleReceiveShipment(item)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Xác nhận tiếp nhận hàng vào kho siêu thị"
                            >
                                {isActionLoading ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                                ) : (
                                    <Truck className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span className="leading-none">Tiếp nhận kho</span>
                            </button>
                        )}

                        {/* 2. Nút Ready For Sale */}
                        {isReceived && !isReadyForSale && (
                            <button
                                onClick={() => handleReadyForSale(item)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Đưa sản phẩm lên kệ sẵn sàng bán lẻ"
                            >
                                {isActionLoading ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                                ) : (
                                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span className="leading-none">Đưa lên kệ</span>
                            </button>
                        )}

                        {/* 3. Xem tem / QR truy xuất */}
                        <button
                            onClick={() => setSelectedShipmentForQr(item)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                            title="Xem trước Mã QR tem truy xuất sản phẩm"
                        >
                            <QrCode className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="leading-none">Mã QR</span>
                        </button>

                        {/* 4. Xem Blockchain Hash */}
                        <button
                            onClick={() => setSelectedShipmentForHash(item)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200"
                            title="Xem bằng chứng Blockchain Hash & Smart Contract"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="leading-none">Hash</span>
                        </button>
                    </div>
                );
            },
        },
    ];

    const getBatchCode = (shipment: ShipmentHistoryDto) =>
        shipment.batchCode || shipment.subBatchCode || shipment.shippingCode;

    return (
        <div className="space-y-6 pb-12">
            {/* TOP BANNER */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5" />
                                Siêu thị & Kênh Bán Lẻ
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-400/30 text-emerald-100 text-[11px] rounded-full font-bold">
                                Blockchain Verified
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                            Tổng Quan Quản Lý Hàng Kho & Đỉnh Kệ Bán Lẻ
                        </h1>
                        <p className="text-emerald-100 text-xs md:text-sm max-w-2xl mt-1 leading-relaxed">
                            Quản lý quy trình tiếp nhận vận đơn từ cơ sở chế biến, kích hoạt đưa nông sản lên kệ và minh bạch tem truy xuất nguồn gốc bằng mã QR Blockchain.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <AppButton
                            variant="grey"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm cursor-pointer"
                            leftIcon={<RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />}
                            onClick={fetchShipments}
                        >
                            Làm mới
                        </AppButton>
                    </div>
                </div>
            </div>

            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* 1. Total Shipments */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tổng Lô Vận Đơn</span>
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Toàn bộ đơn điều chuyển</p>
                </div>

                {/* 2. In Transit */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Đang Vận Chuyển</span>
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <Truck className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600">{stats.inTransit}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Chưa tiếp nhận vào kho</p>
                </div>

                {/* 3. Received */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Đã Nhập Kho</span>
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <PackageCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-blue-600">{stats.received}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Đã lưu kho siêu thị</p>
                </div>

                {/* 4. Ready for Sale */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-400 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Đang Bán Lệ Kệ</span>
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">{stats.readyForSale}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Sẵn sàng mở quét QR</p>
                </div>

                {/* 5. Total Weight */}
                <div className="col-span-2 md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tổng Sản Lượng</span>
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <Scale className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-indigo-600">{stats.totalWeight.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-500">kg</span></p>
                    <p className="text-[11px] text-slate-400 font-medium">Khối lượng tổng nhập kho</p>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* TOOLBAR: SEARCH & TABS */}
                <div className="p-5 border-b border-slate-200 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Tabs */}
                        <AppTabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />

                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã vận đơn, mã lô, nhà xe..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* TABLE OR LOADING STATE */}
                {loading ? (
                    <div className="p-16 text-center text-slate-500 space-y-3">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                        <p className="font-semibold text-sm">Đang tải danh sách vận đơn Siêu thị từ Backend Blockchain...</p>
                    </div>
                ) : filteredShipments.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Store className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-700 text-base">Không tìm thấy vận đơn phù hợp</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Hiện không có vận đơn nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.
                        </p>
                    </div>
                ) : (
                    <AppTable columns={columns} data={filteredShipments} />
                )}
            </div>

            {/* RECENT SYSTEM LOGS / TIMELINE FOOTER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            Quy Trình Chuẩn Tiếp Nhận & Kênh Bán Lẻ
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400">Tiêu chuẩn BR-18</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">1</span>
                                <span className="font-bold text-xs text-slate-800">1. Tiếp Nhận Kho</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Tiếp nhận lô hàng đang ở trạng thái <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">STAGE_SHIPPING</code>. Ghi nhận thời gian và biên bản nhập kho.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
                                <span className="font-bold text-xs text-slate-800">2. Xác Thực Smart Contract</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Hệ thống tự động kích hoạt giao dịch Smart Contract <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">receiveParent/receiveSub</code> trên Blockchain.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">3</span>
                                <span className="font-bold text-xs text-slate-800">3. Đưa Lên Kệ Bán</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Kích hoạt <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">READY_FOR_SALE</code>. Người tiêu dùng quét mã QR tại siêu thị để xem đầy đủ nguồn gốc.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-md space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-xs font-extrabold uppercase tracking-wider">Mã QR Minh Bạch</span>
                        </div>
                        <h4 className="font-bold text-base">Quét Tem Truy Xuất Nông Sản</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Mỗi mã QR dán trên bao bì hoặc kệ hàng Siêu thị đại diện cho một chứng thư số xác minh toàn bộ dòng đời từ Nông dân -&gt; HTX -&gt; Siêu thị.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-700/80">
                        <button
                            onClick={() => {
                                const dummyQr = shipments[0] ? getBatchCode(shipments[0]) : 'DEMO-BATCH-001';
                                navigate(`/trace/${dummyQr}`);
                            }}
                            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            <span className="leading-none">Thử nghiệm Cổng Truy Xuất Công Khai</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL 1: MÃ QR TEM SẢN PHẨM */}
            {selectedShipmentForQr && (
                <AppModal
                    isOpen={!!selectedShipmentForQr}
                    onClose={() => setSelectedShipmentForQr(null)}
                    title={`Mã QR Tem Sản Phẩm - ${getBatchCode(selectedShipmentForQr)}`}
                    maxWidth="md"
                    footer={
                        <AppButton variant="grey" onClick={() => setSelectedShipmentForQr(null)}>
                            Đóng
                        </AppButton>
                    }
                >
                    <div className="text-center space-y-5 py-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                    getPublicTraceUrl(getBatchCode(selectedShipmentForQr))
                                )}`}
                                alt="QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-black text-slate-900 text-base">
                                {getBatchCode(selectedShipmentForQr)}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                                Mã vận đơn: <span className="font-bold text-slate-700">{selectedShipmentForQr.shippingCode}</span>
                            </p>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-left space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Liên kết quét tem trực tiếp:</span>
                            </div>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200 text-[11px] font-mono break-all gap-2">
                                <span className="truncate">{getPublicTraceUrl(getBatchCode(selectedShipmentForQr))}</span>
                                <button
                                    onClick={() => handleCopyHash(getPublicTraceUrl(getBatchCode(selectedShipmentForQr)))}
                                    className="p-1 text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer shrink-0 inline-flex items-center justify-center"
                                >
                                    <Copy className="w-3.5 h-3.5 shrink-0" />
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <a
                                href={`/trace/${getBatchCode(selectedShipmentForQr)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 shrink-0" />
                                <span className="leading-none">Mở trang giao diện Người Tiêu Dùng</span>
                            </a>
                        </div>
                    </div>
                </AppModal>
            )}

            {/* MODAL 2: CHI TIẾT BLOCKCHAIN HASH */}
            {selectedShipmentForHash && (
                <AppModal
                    isOpen={!!selectedShipmentForHash}
                    onClose={() => setSelectedShipmentForHash(null)}
                    title={`Nhật Ký Bằng Chứng Blockchain - ${selectedShipmentForHash.shippingCode}`}
                    maxWidth="lg"
                    footer={
                        <AppButton variant="grey" onClick={() => setSelectedShipmentForHash(null)}>
                            Đóng
                        </AppButton>
                    }
                >
                    <div className="space-y-4 py-1 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 font-medium">Mã lô sản phẩm:</span>
                                <span className="font-bold text-slate-800 ml-2">{getBatchCode(selectedShipmentForHash)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-medium">Loại tài sản:</span>
                                <span className="font-bold text-indigo-600 ml-2">{selectedShipmentForHash.assetType}</span>
                            </div>
                        </div>

                        {/* Ship Transaction Hash */}
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-slate-700 font-bold">
                                <span>1. Giao dịch Vận chuyển (Ship Transaction)</span>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(selectedShipmentForHash.shippingDate).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            {selectedShipmentForHash.shipTransactionHash ? (
                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600">
                                    <span className="truncate max-w-md">{selectedShipmentForHash.shipTransactionHash}</span>
                                    <button
                                        onClick={() => handleCopyHash(selectedShipmentForHash.shipTransactionHash!)}
                                        className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic text-[11px]">Chưa ghi nhận Hash</p>
                            )}
                        </div>

                        {/* Receive Transaction Hash */}
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-slate-700 font-bold">
                                <span>2. Giao dịch Tiếp nhận Siêu thị (Receive Transaction)</span>
                                <span className="text-[10px] text-slate-400">
                                    {selectedShipmentForHash.receivedDate
                                        ? new Date(selectedShipmentForHash.receivedDate).toLocaleString('vi-VN')
                                        : 'Chưa thực hiện'}
                                </span>
                            </div>
                            {selectedShipmentForHash.receiveTransactionHash ? (
                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600">
                                    <span className="truncate max-w-md">{selectedShipmentForHash.receiveTransactionHash}</span>
                                    <button
                                        onClick={() => handleCopyHash(selectedShipmentForHash.receiveTransactionHash!)}
                                        className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic text-[11px]">Lô hàng chưa thực hiện tiếp nhận kho</p>
                            )}
                        </div>

                        {/* Ready For Sale Transaction Hash */}
                        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-slate-700 font-bold">
                                <span>3. Giao dịch Đưa lên Kệ Bán (Ready For Sale Transaction)</span>
                                <span className="text-[10px] text-slate-400">
                                    {selectedShipmentForHash.readyForSaleDate
                                        ? new Date(selectedShipmentForHash.readyForSaleDate).toLocaleString('vi-VN')
                                        : 'Chưa thực hiện'}
                                </span>
                            </div>
                            {selectedShipmentForHash.readyTransactionHash ? (
                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600">
                                    <span className="truncate max-w-md">{selectedShipmentForHash.readyTransactionHash}</span>
                                    <button
                                        onClick={() => handleCopyHash(selectedShipmentForHash.readyTransactionHash!)}
                                        className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic text-[11px]">Sản phẩm chưa được đưa lên kệ bán</p>
                            )}
                        </div>

                        {copiedHash && (
                            <p className="text-center text-xs font-bold text-emerald-600 pt-1">
                                ✨ Đã sao chép Hash vào Clipboard!
                            </p>
                        )}
                    </div>
                </AppModal>
            )}
        </div>
    );
};
