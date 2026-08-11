import React, { useState, useEffect, useCallback } from 'react';
import {
    Truck,
    Store,
    ShieldCheck,
    QrCode,
    Plus,
    Search,
    RefreshCw,
    AlertCircle,
    Download,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Copy,
    Building2,
    Calendar,
    MapPin,
    FileText,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import {
    shippingAndQrService,
    type ShipmentHistoryDto,
    type InspectionHistoryDto,
    type QRCodeInfoDto,
} from '../../services/shippingAndQrService';
import { processorService, type BatchDto } from '../../services/processorService';
import { CreateShipmentModal } from './modals/CreateShipmentModal';
import { CreateInspectionModal } from './modals/CreateInspectionModal';
import { GenerateQRCodeModal } from './modals/GenerateQRCodeModal';
import { AxiosError } from 'axios';

export type QRCodeShippingTab = 'SHIPMENT' | 'RETAILER' | 'INSPECTION' | 'QRCODE';

export const QRCodeAndShippingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<QRCodeShippingTab>('SHIPMENT');
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Dữ liệu danh sách
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [shipments, setShipments] = useState<ShipmentHistoryDto[]>([]);
    const [retailerShipments, setRetailerShipments] = useState<ShipmentHistoryDto[]>([]);
    const [inspections, setInspections] = useState<InspectionHistoryDto[]>([]);
    const [qrCodes, setQrCodes] = useState<QRCodeInfoDto[]>([]);

    // Modals Control
    const [showShipmentModal, setShowShipmentModal] = useState<boolean>(false);
    const [showInspectionModal, setShowInspectionModal] = useState<boolean>(false);
    const [showQrModal, setShowQrModal] = useState<boolean>(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');

    // Tải danh sách lô sản xuất
    const loadBatches = useCallback(async () => {
        try {
            const data = await processorService.getBatches();
            setBatches(data);
            if (data.length > 0 && !selectedBatchId) {
                setSelectedBatchId(data[0].id);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách lô sản xuất:', err);
        }
    }, [selectedBatchId]);

    // Tải dữ liệu tương ứng với Tab hiện tại (Đã xử lý 403 Forbidden cho Điểm bán)
    const loadTabData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            await loadBatches();

            if (activeTab === 'SHIPMENT') {
                if (selectedBatchId) {
                    const data = await shippingAndQrService.getShipmentsByBatch(selectedBatchId);
                    setShipments(data);
                } else {
                    setShipments([]);
                }
            } else if (activeTab === 'RETAILER') {
                try {
                    // Thử gọi API riêng của tài khoản Retailer
                    const data = await shippingAndQrService.getMyRetailerShipments();
                    setRetailerShipments(data);
                } catch (retailerErr) {
                    const errorObj = retailerErr as AxiosError<{ message?: string }>;
                    // Nếu trả về 403 (do tài khoản đang đăng nhập là Processor/HTX), lấy danh sách vận đơn theo Lô sản xuất đang chọn
                    if (errorObj.response?.status === 403 || errorObj.response?.status === 401) {
                        if (selectedBatchId) {
                            const batchShipments = await shippingAndQrService.getShipmentsByBatch(selectedBatchId);
                            setRetailerShipments(batchShipments);
                        } else {
                            setRetailerShipments([]);
                        }
                    } else {
                        throw retailerErr;
                    }
                }
            } else if (activeTab === 'INSPECTION') {
                if (selectedBatchId) {
                    const data = await shippingAndQrService.getInspectionsByBatch(selectedBatchId);
                    setInspections(data);
                } else {
                    setInspections([]);
                }
            } else if (activeTab === 'QRCODE') {
                if (selectedBatchId) {
                    const data = await shippingAndQrService.getQRCodesByTarget('BATCH', selectedBatchId);
                    setQrCodes(data);
                } else {
                    setQrCodes([]);
                }
            }
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            console.error('Lỗi khi tải dữ liệu tab:', errorObj);
            setErrorMessage(errorObj.response?.data?.message || 'Không thể kết nối với Backend API.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedBatchId, loadBatches]);

    useEffect(() => {
        void loadTabData();
    }, [loadTabData]);

    // Xác nhận nhận hàng từ Cửa hàng / Điểm Bán
    const handleReceiveShipment = async (shipmentId: string) => {
        if (!window.confirm('Xác nhận tiếp nhận lô hàng này tại cửa hàng?')) return;
        try {
            await shippingAndQrService.receiveShipment(shipmentId);
            alert('✅ Đã xác nhận tiếp nhận vận đơn thành công!');
            await loadTabData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            if (errorObj.response?.status === 403 || errorObj.response?.status === 401) {
                alert('ℹ️ Chức năng tiếp nhận thuộc quyền của tài khoản Cửa hàng / Siêu thị (Retailer).');
            } else {
                alert(`❌ Lỗi: ${errorObj.response?.data?.message || 'Không thể tiếp nhận lô hàng.'}`);
            }
        }
    };

    // Đưa sản phẩm lên kệ bán
    const handleReadyForSale = async (shipmentId: string) => {
        if (!window.confirm('Xác nhận đưa sản phẩm lên kệ trưng bày bán lẻ?')) return;
        try {
            await shippingAndQrService.markReadyForSale(shipmentId);
            alert('✅ Đã chuyển trạng thái sản phẩm lên kệ bán thành công!');
            await loadTabData();
        } catch (err) {
            const errorObj = err as AxiosError<{ message?: string }>;
            if (errorObj.response?.status === 403 || errorObj.response?.status === 401) {
                alert('ℹ️ Chức năng chuyển kệ hàng thuộc quyền của tài khoản Cửa hàng / Siêu thị (Retailer).');
            } else {
                alert(`❌ Lỗi: ${errorObj.response?.data?.message || 'Không thể đưa lên kệ.'}`);
            }
        }
    };

    // 🚚 Cột Bảng Vận Chuyển
    const shipmentColumns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'Mã vận đơn / Nhà vận chuyển',
            key: 'shippingCode',
            render: (item) => (
                <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        {item.shippingCode}
                    </div>
                    <div className="text-xs text-slate-500">{item.carrierInfo}</div>
                </div>
            ),
        },
        {
            header: 'Mã lô hàng',
            key: 'batchCode',
            render: (item) => (
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-100">
                    {item.batchCode || item.subBatchCode || 'N/A'}
                </span>
            ),
        },
        {
            header: 'Điểm đi ➔ Điểm bán',
            key: 'pickupLocation',
            render: (item) => (
                <div className="text-xs space-y-0.5">
                    <div className="text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Từ: {item.pickupLocation}
                    </div>
                    <div className="text-slate-900 font-semibold flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-emerald-600" /> Đến: {item.retailerName} ({item.destination})
                    </div>
                </div>
            ),
        },
        {
            header: 'Trọng lượng / Ngày xuất',
            key: 'weight',
            render: (item) => (
                <div className="text-xs">
                    <div className="font-bold text-slate-800">{item.weight} kg</div>
                    <div className="text-slate-500">{new Date(item.shippingDate).toLocaleDateString('vi-VN')}</div>
                </div>
            ),
        },
        {
            header: 'Blockchain TxHash',
            key: 'shipTransactionHash',
            render: (item) => (
                item.shipTransactionHash ? (
                    <a
                        href={`https://sepolia.etherscan.io/tx/${item.shipTransactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 font-mono hover:underline"
                    >
                        {item.shipTransactionHash.substring(0, 8)}...
                        <ExternalLink className="w-3 h-3" />
                    </a>
                ) : <span className="text-slate-400 text-xs">Chưa ghi nhận</span>
            ),
        },
    ];

    // 🏪 Cột Bảng Điểm Bán
    const retailerColumns: Column<ShipmentHistoryDto>[] = [
        {
            header: 'Cửa hàng / Siêu thị',
            key: 'retailerName',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <div>
                        <div className="font-bold text-slate-900">{item.retailerName}</div>
                        <div className="text-xs text-slate-500">{item.destination}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Mã Lô & Vận Đơn',
            key: 'shippingCode',
            render: (item) => (
                <div>
                    <div className="font-bold text-indigo-600">{item.shippingCode}</div>
                    <div className="text-xs text-slate-600">Lô: {item.batchCode || item.subBatchCode}</div>
                </div>
            ),
        },
        {
            header: 'Ngày nhận / Lên kệ',
            key: 'receivedDate',
            render: (item) => (
                <div className="text-xs space-y-0.5">
                    <div>Nhận: {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('vi-VN') : 'Chưa nhận'}</div>
                    <div>Bán: {item.readyForSaleDate ? new Date(item.readyForSaleDate).toLocaleDateString('vi-VN') : 'Chưa lên kệ'}</div>
                </div>
            ),
        },
        {
            header: 'Thao tác',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    {!item.receivedDate && (
                        <button
                            onClick={() => void handleReceiveShipment(item.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                        >
                            Tiếp nhận lô hàng
                        </button>
                    )}
                    {item.receivedDate && !item.readyForSaleDate && (
                        <button
                            onClick={() => void handleReadyForSale(item.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                        >
                            Đưa lên kệ bán
                        </button>
                    )}
                    {item.readyForSaleDate && (
                        <span className="px-2.5 py-1 bg-green-100 text-green-800 font-bold rounded-full text-xs">
                            Đã lên kệ
                        </span>
                    )}
                </div>
            ),
        },
    ];

    // 🛡️ Cột Bảng Kiểm Định
    const inspectionColumns: Column<InspectionHistoryDto>[] = [
        {
            header: 'Tên chứng nhận / Số hiệu',
            key: 'documentName',
            render: (item) => (
                <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-600" />
                        {item.documentName}
                    </div>
                    <div className="text-xs text-slate-500">Số hiệu: {item.documentNumber}</div>
                </div>
            ),
        },
        {
            header: 'Đơn vị kiểm định',
            key: 'inspectionUnit',
            render: (item) => (
                <span className="font-semibold text-slate-800 text-xs">
                    {item.inspectionUnit}
                </span>
            ),
        },
        {
            header: 'Ngày kiểm định',
            key: 'inspectionDate',
            render: (item) => (
                <div className="text-xs text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(item.inspectionDate).toLocaleDateString('vi-VN')}
                </div>
            ),
        },
        {
            header: 'Kết quả kiểm định',
            key: 'result',
            align: 'center',
            render: (item) => (
                item.result?.toUpperCase() === 'PASSED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ĐẠT CHUẨN (PASSED)
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-full text-xs">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        KHÔNG ĐẠT (FAILED)
                    </span>
                )
            ),
        },
        {
            header: 'Hồ sơ chứng nhận',
            key: 'fileURI',
            align: 'center',
            render: (item) => (
                item.fileURI ? (
                    <a
                        href={item.fileURI}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs inline-flex items-center gap-1 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Xem chứng chỉ
                    </a>
                ) : <span className="text-slate-400 text-xs">Không có file</span>
            ),
        },
    ];

    // 🔲 Cột Bảng Mã QR
    const qrColumns: Column<QRCodeInfoDto>[] = [
        {
            header: 'Đối tượng QR',
            key: 'targetType',
            render: (item) => (
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-lg text-xs">
                    {item.targetType}
                </span>
            ),
        },
        {
            header: 'Giá trị QR / URL truy xuất',
            key: 'qrValue',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-700 truncate max-w-xs">{item.qrValue}</span>
                    <button
                        onClick={() => {
                            void navigator.clipboard.writeText(item.qrValue);
                            alert('📋 Đã sao chép liên kết mã QR!');
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded-md cursor-pointer"
                        title="Sao chép"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </div>
            ),
        },
        {
            header: 'Trạng thái',
            key: 'status',
            align: 'center',
            render: (item) => (
                <span className="px-2.5 py-1 bg-green-50 text-green-700 font-medium rounded-full text-xs border border-green-200">
                    {item.status || 'ACTIVE'}
                </span>
            ),
        },
        {
            header: 'Ngày tạo',
            key: 'createdAt',
            render: (item) => (
                <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                </span>
            ),
        },
    ];

    const tabLabels: { key: QRCodeShippingTab; label: string }[] = [
        { key: 'SHIPMENT', label: 'Vận chuyển' },
        { key: 'RETAILER', label: 'Điểm bán' },
        { key: 'INSPECTION', label: 'Kiểm định' },
        { key: 'QRCODE', label: 'Tạo mã QR' },
    ];

    return (
        <div className="space-y-5">
            {/* Header & Nút Thao Tác (Giống hệt Quản lý Kho) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Quản Lý Vận Chuyển, Điểm Bán & Mã QR</h2>
                    <p className="text-xs text-slate-500">Quản lý nhà vận chuyển, siêu thị điểm bán, đơn vị kiểm định và phát hành mã QR sản phẩm</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowShipmentModal(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <Truck className="w-4 h-4" />
                        <span>Tạo Vận Đơn</span>
                    </button>

                    <button
                        onClick={() => setShowInspectionModal(true)}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Hồ Sơ Kiểm Định</span>
                    </button>

                    <button
                        onClick={() => setShowQrModal(true)}
                        className="px-4 py-2.5 bg-[#16a34a] hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <QrCode className="w-4 h-4" />
                        <span>Sinh Mã QR</span>
                    </button>

                    <button
                        onClick={loadTabData}
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

            {/* Sub-Tabs Danh mục (Giống hệt Quản lý Kho) */}
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

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {(activeTab === 'SHIPMENT' || activeTab === 'INSPECTION' || activeTab === 'QRCODE' || activeTab === 'RETAILER') && (
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-hidden font-semibold text-slate-800"
                        >
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.batchCode} - {b.productName}
                                </option>
                            ))}
                        </select>
                    )}

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm mã / từ khóa..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Khung Bảng Dữ Liệu (Giống hệt Quản lý Kho) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Danh sách {tabLabels.find((t) => t.key === activeTab)?.label}
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Đang tải dữ liệu từ Backend API...</div>
                ) : (
                    <>
                        {activeTab === 'SHIPMENT' && (
                            <AppTable columns={shipmentColumns} data={shipments} showSTT={true} />
                        )}
                        {activeTab === 'RETAILER' && (
                            <AppTable columns={retailerColumns} data={retailerShipments} showSTT={true} />
                        )}
                        {activeTab === 'INSPECTION' && (
                            <AppTable columns={inspectionColumns} data={inspections} showSTT={true} />
                        )}
                        {activeTab === 'QRCODE' && (
                            <AppTable columns={qrColumns} data={qrCodes} showSTT={true} />
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showShipmentModal && (
                <CreateShipmentModal
                    batchId={selectedBatchId}
                    onClose={() => setShowShipmentModal(false)}
                    onSuccess={() => {
                        setShowShipmentModal(false);
                        void loadTabData();
                    }}
                />
            )}

            {showInspectionModal && (
                <CreateInspectionModal
                    batchId={selectedBatchId}
                    onClose={() => setShowInspectionModal(false)}
                    onSuccess={() => {
                        setShowInspectionModal(false);
                        void loadTabData();
                    }}
                />
            )}

            {showQrModal && (
                <GenerateQRCodeModal
                    batchId={selectedBatchId}
                    onClose={() => setShowQrModal(false)}
                    onSuccess={() => {
                        setShowQrModal(false);
                        void loadTabData();
                    }}
                />
            )}
        </div>
    );
};
