import React, { useState, useEffect, useCallback } from 'react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';
import { AppSelect } from '../../components/ui/AppSelect';
import { Pagination } from '../../components/ui/Pagination';
import {
    Activity,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Clock,
    RotateCcw,
    Eye,
    Search,
    Copy,
    Check,
    Filter,
    XCircle,
    Layers
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { toast } from '../../utils/toast';

// Interface dữ liệu trả về từ Backend API
export interface BlockchainTxResponse {
    id: string;
    batchId?: string;
    batchCode?: string;
    subBatchId?: string;
    subBatchCode?: string;
    walletAddress: string;
    transactionHash: string;
    contractAddress: string;
    functionName: string;
    blockNumber?: number;
    timestamp: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
    errorMessage?: string;
}

export interface DashboardStatsResponse {
    userStats?: {
        totalUsers: number;
        farmersCount: number;
        processorsCount: number;
        retailersCount: number;
        activeCount: number;
        pendingCount: number;
        lockedCount: number;
    };
    blockchainStats?: {
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
    };
}

export const TransactionMonitoringPage: React.FC = () => {
    // State lưu trữ dữ liệu
    const [transactions, setTransactions] = useState<BlockchainTxResponse[]>([]);
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State cho Bộ lọc & Tìm kiếm
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [functionFilter, setFunctionFilter] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    // State Phân trang & Modal chi tiết
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [selectedTx, setSelectedTx] = useState<BlockchainTxResponse | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState<string | null>(null);

    // Tải dữ liệu mới nhất từ Backend khi vào trang hoặc chọn bộ lọc
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Tải danh sách giao dịch có query filter
            const params: Record<string, string> = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (functionFilter.trim()) params.functionName = functionFilter.trim();

            const txRes = await apiClient.get<BlockchainTxResponse[]>('/v1/admin/blockchain/transactions', { params });
            setTransactions(txRes.data);

            // 2. Tải chỉ số thống kê từ Dashboard Stats
            const statsRes = await apiClient.get<DashboardStatsResponse>('/v1/admin/dashboard/stats');
            setStats(statsRes.data);
        } catch (err: any) {
            console.error('Lỗi khi kết nối Backend API:', err);
            const msg = err.response?.data?.message || 'Không thể tải danh sách giao dịch từ Backend API.';
            setError(msg);
            toast.error(msg);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, functionFilter]);

    // Tự động tải dữ liệu thực tế khi Admin vừa click truy cập vào trang "Giám sát giao dịch"
    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // Thao tác Copy chuỗi (TxHash / Wallet Address)
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
    };

    // Thao tác Retry giao dịch bị lỗi (BR-42)
    const handleRetry = async (txId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn phát lệnh Thử lại (Retry) cho giao dịch này lên Smart Contract?')) {
            return;
        }
        setRetryingId(txId);
        try {
            const res = await apiClient.post(`/v1/admin/blockchain/transactions/${txId}/retry`);
            const data = res.data;
            toast.success(`✅ Phát lệnh Retry thành công!\n• TxHash mới: ${data.newTransactionHash || 'N/A'}\n• Block mới: #${data.newBlockNumber ?? 'N/A'}`);
            if (isDetailModalOpen) setIsDetailModalOpen(false);
            fetchData();
        } catch (err: any) {
            console.error('Lỗi khi Retry giao dịch:', err);
            toast.error(`❌ Retry thất bại: ${err.response?.data?.message || 'Không thể gửi lại giao dịch lên Blockchain.'}`);
        } finally {
            setRetryingId(null);
        }
    };

    // Lọc theo từ khóa tìm kiếm (Mã lô, Wallet, TxHash) ở Client
    const filteredTransactions = transactions.filter((tx) => {
        if (!searchKeyword.trim()) return true;
        const kw = searchKeyword.toLowerCase();
        const batchCode = (tx.subBatchCode || tx.batchCode || '').toLowerCase();
        const wallet = (tx.walletAddress || '').toLowerCase();
        const txHash = (tx.transactionHash || '').toLowerCase();
        const func = (tx.functionName || '').toLowerCase();
        return batchCode.includes(kw) || wallet.includes(kw) || txHash.includes(kw) || func.includes(kw);
    });

    // Thống kê tổng quan
    const totalTx = stats?.blockchainStats?.totalTransactions ?? transactions.length;
    const successTx = stats?.blockchainStats?.successfulTransactions ?? transactions.filter((t) => t.status === 'SUCCESS').length;
    const failedTx = stats?.blockchainStats?.failedTransactions ?? transactions.filter((t) => t.status === 'FAILED').length;
    const pendingTx = transactions.filter((t) => t.status === 'PENDING').length;

    // Phân trang
    const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
    const paginatedTx = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Cấu hình bảng hiển thị AppTable
    const columns: Column<BlockchainTxResponse>[] = [
        {
            header: 'Mã Lô / SubBatch',
            key: 'subBatchCode',
            render: (item) => (
                <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-900">
                        {item.subBatchCode || item.batchCode || 'N/A'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Tên Hàm Contract',
            key: 'functionName',
            render: (item) => (
                <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono text-xs font-bold border border-purple-200">
                    {item.functionName}
                </code>
            ),
        },
        {
            header: 'Địa chỉ Ví gọi',
            key: 'walletAddress',
            render: (item) => (
                <span className="font-mono text-xs text-slate-600">
                    {item.walletAddress ? `${item.walletAddress.slice(0, 6)}...${item.walletAddress.slice(-4)}` : 'N/A'}
                </span>
            ),
        },
        {
            header: 'TxHash / Block',
            key: 'transactionHash',
            render: (item) => (
                <div>
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-emerald-700 font-semibold">
                            {item.transactionHash && item.transactionHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
                                ? `${item.transactionHash.slice(0, 8)}...${item.transactionHash.slice(-6)}`
                                : 'Đang xử lý (Pending)'}
                        </span>
                        {item.transactionHash && (
                            <button
                                onClick={() => handleCopy(item.transactionHash, item.id)}
                                title="Sao chép TxHash"
                                className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                            >
                                {copiedText === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400">Block: #{item.blockNumber ?? 'Unconfirmed'}</p>
                </div>
            ),
        },
        {
            header: 'Thời gian',
            key: 'timestamp',
            render: (item) => new Date(item.timestamp).toLocaleString('vi-VN'),
        },
        {
            header: 'Trạng thái',
            key: 'status',
            render: (item) => {
                const statusMap: Record<string, { label: string; status: string }> = {
                    SUCCESS: { label: 'Thành công', status: 'DA_DUYET' },
                    FAILED: { label: 'Thất bại', status: 'DA_HUY' },
                    PENDING: { label: 'Đang xử lý', status: 'DANG_XU_LY' },
                };
                const config = statusMap[item.status] || { label: item.status, status: 'DEFAULT' };
                return <AppBadge status={config.status} label={config.label} />;
            },
        },
        {
            header: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedTx(item);
                            setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Xem chi tiết"
                    >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>

                    {item.status === 'FAILED' && (
                        <button
                            onClick={() => handleRetry(item.id)}
                            disabled={retryingId === item.id}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                            {retryingId === item.id ? 'Đang thử lại...' : 'Thử lại'}
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Trang */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-purple-600" />
                        Giám sát Giao dịch On-chain (Smart Contract)
                    </h2>
                    <p className="text-xs text-slate-500">
                        Đồng bộ trực tiếp dữ liệu giao dịch từ Backend API (`/api/v1/admin/blockchain/transactions`)
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AppButton
                        variant="grey"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        onClick={fetchData}
                    >
                        Làm mới
                    </AppButton>
                </div>
            </div>

            {/* Thẻ Thống kê Tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Tổng Giao dịch</p>
                        <h3 className="text-lg font-bold text-slate-900">{totalTx}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Thành công</p>
                        <h3 className="text-lg font-bold text-emerald-600">{successTx}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Thất bại (Cần xử lý)</p>
                        <h3 className="text-lg font-bold text-red-600">{failedTx}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Đang chờ xử lý</p>
                        <h3 className="text-lg font-bold text-amber-600">{pendingTx}</h3>
                    </div>
                </div>
            </div>

            {/* Thanh Tìm kiếm & Lọc (Filter & Search) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                    <Filter className="w-4 h-4 text-purple-600" /> Bộ lọc & Tìm kiếm giao dịch
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search Keyword */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã lô, TxHash, ví gửi..."
                            value={searchKeyword}
                            onChange={(e) => {
                                setSearchKeyword(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Filter Status */}
                    <AppSelect
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        options={[
                            { label: 'Tất cả trạng thái', value: 'ALL' },
                            { label: 'SUCCESS (Thành công)', value: 'SUCCESS' },
                            { label: 'FAILED (Thất bại)', value: 'FAILED' },
                            { label: 'PENDING (Đang xử lý)', value: 'PENDING' },
                        ]}
                    />

                    {/* Filter Function Name */}
                    <AppSelect
                        value={functionFilter}
                        onChange={(e) => {
                            setFunctionFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        options={[
                            { label: 'Tất cả các hàm Smart Contract', value: '' },
                            { label: 'registerFarmer', value: 'registerFarmer' },
                            { label: 'registerProcessor', value: 'registerProcessor' },
                            { label: 'createParentBatch', value: 'createParentBatch' },
                            { label: 'updateCultivationLog', value: 'updateCultivationLog' },
                            { label: 'recordHarvest', value: 'recordHarvest' },
                            { label: 'shipParentBatch', value: 'shipParentBatch' },
                            { label: 'receiveParentBatch', value: 'receiveParentBatch' },
                            { label: 'processSubBatch', value: 'processSubBatch' },
                        ]}
                    />
                </div>
            </div>

            {/* Thông báo Lỗi kết nối API */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span>⚠️ {error}</span>
                    </div>
                    <button onClick={fetchData} className="underline font-bold text-red-800 cursor-pointer">
                        Thử lại
                    </button>
                </div>
            )}

            {/* Bảng danh sách Giao dịch */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    Đang truy vấn Backend API và giải mã dữ liệu giao dịch Blockchain...
                </div>
            ) : paginatedTx.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-medium text-xs space-y-2">
                    <AlertTriangle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">Không tìm thấy giao dịch nào phù hợp.</p>
                    <p className="text-slate-400 text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AppTable columns={columns} data={paginatedTx} showSTT={true} />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Modal Chi tiết Giao dịch */}
            {selectedTx && (
                <AppModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Chi Tiết Giao Dịch Smart Contract"
                    maxWidth="lg"
                    footer={
                        <div className="flex items-center justify-between w-full">
                            <div>
                                {selectedTx.status === 'FAILED' && (
                                    <button
                                        onClick={() => handleRetry(selectedTx.id)}
                                        disabled={retryingId === selectedTx.id}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                        <RotateCcw className={`w-4 h-4 ${retryingId === selectedTx.id ? 'animate-spin' : ''}`} />
                                        Thử lại giao dịch này (Retry)
                                    </button>
                                )}
                            </div>
                            <AppButton variant="grey" onClick={() => setIsDetailModalOpen(false)}>
                                Đóng
                            </AppButton>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 font-semibold uppercase text-[10px]">Mã định danh Giao dịch (ID)</p>
                                <p className="font-mono text-slate-800 font-bold">{selectedTx.id}</p>
                            </div>
                            <div>
                                {selectedTx.status === 'SUCCESS' && <AppBadge status="DA_DUYET" label="SUCCESS" />}
                                {selectedTx.status === 'FAILED' && <AppBadge status="DA_HUY" label="FAILED" />}
                                {selectedTx.status === 'PENDING' && <AppBadge status="DANG_XU_LY" label="PENDING" />}
                            </div>
                        </div>

                        {selectedTx.status === 'FAILED' && selectedTx.errorMessage && (
                            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span>Lỗi thực thi Smart Contract (Execution Reverted):</span>
                                </div>
                                <p className="font-mono text-[11px] bg-white p-2 rounded-lg border border-red-200 break-all text-red-600">
                                    {selectedTx.errorMessage}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <p className="text-slate-400 font-semibold text-[11px]">Tên hàm Smart Contract</p>
                                <code className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono font-bold border border-purple-200 block w-fit">
                                    {selectedTx.functionName}
                                </code>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <p className="text-slate-400 font-semibold text-[11px]">Số Block (Block Number)</p>
                                <p className="font-bold text-slate-800 font-mono">
                                    #{selectedTx.blockNumber ?? 'Chưa xác nhận (Unconfirmed)'}
                                </p>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <p className="text-slate-400 font-semibold text-[11px]">Lô nông sản / SubBatch liên quan</p>
                                <p className="font-bold text-emerald-700 font-mono">
                                    {selectedTx.subBatchCode || selectedTx.batchCode || 'Không có mã lô'}
                                </p>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <p className="text-slate-400 font-semibold text-[11px]">Thời gian ghi nhận</p>
                                <p className="font-bold text-slate-800">
                                    {new Date(selectedTx.timestamp).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-semibold">Mã Giao dịch (Transaction Hash)</span>
                                    <button
                                        onClick={() => handleCopy(selectedTx.transactionHash, 'txHashModal')}
                                        className="text-purple-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                    >
                                        {copiedText === 'txHashModal' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedText === 'txHashModal' ? 'Đã chép' : 'Sao chép'}
                                    </button>
                                </div>
                                <p className="font-mono text-xs text-slate-900 break-all bg-white p-2 rounded-lg border border-slate-200 font-semibold">
                                    {selectedTx.transactionHash || 'N/A'}
                                </p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-semibold">Địa chỉ Ví thực thi (Wallet Address)</span>
                                    <button
                                        onClick={() => handleCopy(selectedTx.walletAddress, 'walletModal')}
                                        className="text-purple-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                    >
                                        {copiedText === 'walletModal' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedText === 'walletModal' ? 'Đã chép' : 'Sao chép'}
                                    </button>
                                </div>
                                <p className="font-mono text-xs text-slate-900 break-all bg-white p-2 rounded-lg border border-slate-200 font-semibold">
                                    {selectedTx.walletAddress || 'N/A'}
                                </p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-semibold">Địa chỉ Hợp đồng (Contract Address)</span>
                                    <button
                                        onClick={() => handleCopy(selectedTx.contractAddress, 'contractModal')}
                                        className="text-purple-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                    >
                                        {copiedText === 'contractModal' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedText === 'contractModal' ? 'Đã chép' : 'Sao chép'}
                                    </button>
                                </div>
                                <p className="font-mono text-xs text-slate-900 break-all bg-white p-2 rounded-lg border border-slate-200 font-semibold">
                                    {selectedTx.contractAddress || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </AppModal>
            )}
        </div>
    );
};

export default TransactionMonitoringPage;
