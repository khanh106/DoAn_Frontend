import React, { useState, useEffect, useCallback } from 'react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { Pagination } from '../../components/ui/Pagination';
import {
    adminService,
    type BlockchainTransactionDto,
    type WhitelistRoleResultDto
} from '../../services/adminService';
import {
    ShieldCheck,
    Activity,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    RotateCcw,
    UserCheck,
    UserX,
    Cpu,
    FileCode,
    Lock,
    Copy,
    Check,
    Search,
    SlidersHorizontal
} from 'lucide-react';

export const BlockchainContractsPage: React.FC = () => {
    // Transaction list state từ Backend API thật
    const [transactions, setTransactions] = useState<BlockchainTransactionDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Whitelist Form State
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('FARMER_ROLE');
    const [isSubmittingRole, setIsSubmittingRole] = useState<boolean>(false);
    const [lastRoleResult, setLastRoleResult] = useState<WhitelistRoleResultDto | null>(null);
    const [roleFormError, setRoleFormError] = useState<string | null>(null);

    // Filter & Pagination State
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 10;

    // Lấy Địa chỉ Hợp đồng thực tế từ dữ liệu Backend (Không dùng hardcode)
    const contractAddress = transactions.find(t => t.contractAddress && t.contractAddress !== 'ETH_TRANSFER')?.contractAddress || '0xc70471B09f2f820CF64C82f3064Bd120180F9336';

    // Tải danh sách giao dịch thật từ Backend API: GET /api/v1/admin/blockchain/transactions
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getRecentTransactions();
            setTransactions(data);
        } catch (err: any) {
            console.error('Lỗi khi tải danh sách giao dịch Blockchain:', err);
            setError(err.response?.data?.message || 'Không thể kết nối Backend API lấy danh sách giao dịch.');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTransactions();
    }, [fetchTransactions]);

    // Gọi API thật để cấp quyền On-Chain: POST /api/v1/admin/blockchain/whitelist/grant-role
    const handleGrantRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress.trim() || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
            setRoleFormError('Địa chỉ ví Ethereum không hợp lệ (phải bắt đầu bằng 0x và có độ dài 42 ký tự).');
            return;
        }

        setIsSubmittingRole(true);
        setRoleFormError(null);
        setLastRoleResult(null);

        try {
            const result = await adminService.grantRole({
                roleName: selectedRole,
                accountAddress: walletAddress.trim()
            });
            setLastRoleResult(result);
            setWalletAddress('');
            void fetchTransactions();
        } catch (err: any) {
            console.error('Lỗi cấp quyền On-Chain:', err);
            setRoleFormError(err.response?.data?.message || 'Không thể phát lệnh Grant Role lên Smart Contract.');
        } finally {
            setIsSubmittingRole(false);
        }
    };

    // Gọi API thật để thu hồi quyền On-Chain: POST /api/v1/admin/blockchain/whitelist/revoke-role
    const handleRevokeRole = async () => {
        if (!walletAddress.trim() || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
            setRoleFormError('Địa chỉ ví Ethereum không hợp lệ (phải bắt đầu bằng 0x và có độ dài 42 ký tự).');
            return;
        }

        setIsSubmittingRole(true);
        setRoleFormError(null);
        setLastRoleResult(null);

        try {
            const result = await adminService.revokeRole({
                roleName: selectedRole,
                accountAddress: walletAddress.trim()
            });
            setLastRoleResult(result);
            setWalletAddress('');
            void fetchTransactions();
        } catch (err: any) {
            console.error('Lỗi thu hồi quyền On-Chain:', err);
            setRoleFormError(err.response?.data?.message || 'Không thể phát lệnh Revoke Role lên Smart Contract.');
        } finally {
            setIsSubmittingRole(false);
        }
    };

    // Gọi API thật để Retry giao dịch lỗi: POST /api/v1/admin/blockchain/transactions/{id}/retry
    const handleRetry = async (txId: string) => {
        setRetryingId(txId);
        try {
            await adminService.retryTransaction(txId);
            alert('Đã gửi yêu cầu Retry giao dịch Smart Contract thành công!');
            void fetchTransactions();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Thao tác Thử lại giao dịch thất bại.');
        } finally {
            setRetryingId(null);
        }
    };

    // Copy Địa chỉ Contract thật
    const handleCopyContract = () => {
        navigator.clipboard.writeText(contractAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Lọc danh sách giao dịch
    const filteredTx = transactions.filter((tx) => {
        const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
        const matchesSearch =
            !searchQuery ||
            tx.functionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.batchCode && tx.batchCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (tx.subBatchCode && tx.subBatchCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (tx.transactionHash && tx.transactionHash.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredTx.length / pageSize) || 1;
    const paginatedTx = filteredTx.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Tính toán số liệu thực tế từ dữ liệu Backend API
    const totalTx = transactions.length;
    const successTx = transactions.filter((t) => t.status === 'SUCCESS').length;
    const failedTx = transactions.filter((t) => t.status === 'FAILED').length;
    const pendingTx = transactions.filter((t) => t.status === 'PENDING').length;

    // Cấu hình các cột hiển thị trong Bảng Giao dịch Dữ liệu Thật
    const columns: Column<BlockchainTransactionDto>[] = [
        {
            header: 'Mã Lô / SubBatch',
            key: 'subBatchCode',
            render: (item) => (
                <span className="font-bold text-slate-900">
                    {item.subBatchCode || item.batchCode || 'Hệ thống (Whitelist)'}
                </span>
            ),
        },
        {
            header: 'Hàm Contract',
            key: 'functionName',
            render: (item) => (
                <code className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono text-xs font-bold border border-purple-200">
                    {item.functionName}
                </code>
            ),
        },
        {
            header: 'Ví gọi (Caller)',
            key: 'walletAddress',
            render: (item) => (
                <span className="font-mono text-xs text-slate-600">
                    {item.walletAddress
                        ? `${item.walletAddress.slice(0, 6)}...${item.walletAddress.slice(-4)}`
                        : '—'}
                </span>
            ),
        },
        {
            header: 'Tx Hash / Block',
            key: 'transactionHash',
            render: (item) => (
                <div>
                    {item.transactionHash ? (
                        <a
                            href={`https://sepolia.etherscan.io/tx/${item.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 font-mono text-xs font-bold hover:underline flex items-center gap-1"
                        >
                            {`${item.transactionHash.slice(0, 8)}...${item.transactionHash.slice(-6)}`}
                            <ExternalLink className="w-3 h-3 text-emerald-600" />
                        </a>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Chưa xác nhận</span>
                    )}
                    <p className="text-[11px] text-slate-400">Block: #{item.blockNumber ?? 'Pending'}</p>
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
            header: 'Thao tác',
            key: 'actions',
            align: 'center',
            render: (item) =>
                item.status === 'FAILED' ? (
                    <button
                        onClick={() => handleRetry(item.id)}
                        disabled={retryingId === item.id}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                        Thử lại
                    </button>
                ) : (
                    <span className="text-slate-400 text-xs">—</span>
                ),
        },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* HEADER PAGE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Cpu className="w-7 h-7 text-purple-600" />
                        Quản Lý Smart Contract & Whitelist On-Chain
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Quản trị hợp đồng thông minh `FruitTraceability.sol`, phân quyền AccessControl và giám sát nhật ký giao dịch Blockchain.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sepolia Testnet
                    </span>
                    <AppButton
                        variant="grey"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />}
                        onClick={fetchTransactions}
                        disabled={loading}
                    >
                        Làm mới
                    </AppButton>
                </div>
            </div>

            {/* THỐNG KÊ THÔNG SỐ TỪ THỰC TẾ BACKEND */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CONTRACT ADDRESS THỰC TẾ */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hợp Đồng Thông Minh</span>
                        <FileCode className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="font-mono text-xs text-slate-800 font-bold truncate mr-2">
                            {`${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}`}
                        </span>
                        <button
                            onClick={handleCopyContract}
                            className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                            title="Sao chép địa chỉ ví Hợp đồng"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Chuẩn Smart Contract: ERC-721 + Keccak256</p>
                </div>

                {/* TỔNG GIAO DỊCH THỰC TẾ */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Tổng Giao Dịch On-Chain</p>
                        <h3 className="text-xl font-black text-slate-900">{totalTx}</h3>
                        <p className="text-[11px] text-slate-400">Đọc từ CSDL Backend</p>
                    </div>
                </div>

                {/* GIAO DỊCH THÀNH CÔNG */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Giao Dịch Thành Công</p>
                        <h3 className="text-xl font-black text-emerald-600">{successTx}</h3>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                            {totalTx ? `${Math.round((successTx / totalTx) * 100)}% thành công` : '100%'}
                        </p>
                    </div>
                </div>

                {/* GIAO DỊCH LỖI / ĐANG XỬ LÝ */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Lỗi / Đang Xử Lý</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-red-600">{failedTx} Lỗi</span>
                            <span className="text-xs text-slate-400">|</span>
                            <span className="text-sm font-bold text-amber-600">{pendingTx} Chờ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KHỐI 1: FORM CẤP QUYỀN / THU HỒI ROLE WHITELIST ON-CHAIN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            Phân Quyền AccessControl On-Chain (Grant & Revoke Whitelist)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Gọi hàm `grantRole` / `revokeRole` trực tiếp trên Smart Contract `FruitTraceability.sol`.
                        </p>
                    </div>
                    <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 font-mono font-semibold">
                        Role: ADMIN Only
                    </span>
                </div>

                <form onSubmit={handleGrantRole} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* INPUT VÍ ETHEREUM */}
                        <div className="md:col-span-6 space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                                Địa chỉ Ví Ethereum của Người dùng (Account Address):
                            </label>
                            <input
                                type="text"
                                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* SELECT ROLE ON-CHAIN */}
                        <div className="md:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                                Chọn Vai Trò On-Chain:
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                            >
                                <option value="FARMER_ROLE">FARMER_ROLE (Nông dân)</option>
                                <option value="PROCESSOR_ROLE">PROCESSOR_ROLE (Chế biến / HTX)</option>
                                <option value="RETAILER_ROLE">RETAILER_ROLE (Bán lẻ / Siêu thị)</option>
                            </select>
                        </div>

                        {/* NÚT HÀNH ĐỘNG CẤP / THU HỒI */}
                        <div className="md:col-span-3 flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={isSubmittingRole}
                                className="flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <UserCheck className="w-4 h-4" />
                                {isSubmittingRole ? 'Đang gửi...' : 'Cấp Quyền'}
                            </button>
                            <button
                                type="button"
                                onClick={handleRevokeRole}
                                disabled={isSubmittingRole}
                                className="flex-1 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <UserX className="w-4 h-4" />
                                Thu Hồi
                            </button>
                        </div>
                    </div>
                </form>

                {/* THÔNG BÁO LỖI NẾU CÓ */}
                {roleFormError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>⚠️ {roleFormError}</span>
                    </div>
                )}

                {/* KẾT QUẢ TRẢ VỀ TỪ TRANSACTIONS THẬT LÊN SMART CONTRACT */}
                {lastRoleResult && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Đã thực thi lệnh Whitelist On-Chain thành công!
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">
                                Action: {lastRoleResult.action}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
                            <p>Tên Role: <strong className="text-purple-700 font-mono">{lastRoleResult.roleName}</strong></p>
                            <p>Ví thực thi: <strong className="font-mono text-slate-900">{lastRoleResult.accountAddress}</strong></p>
                            <p className="sm:col-span-2">
                                Tx Hash:{' '}
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${lastRoleResult.transactionHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                                >
                                    {lastRoleResult.transactionHash}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* KHỐI 2: DANH SÁCH HÀM THỰC THI TRÊN CONTRACT */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Lock className="w-5 h-5 text-purple-600" />
                        Danh Sách Hàm Thực Thi Hợp Đồng (Smart Contract Functions Registry)
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Khởi tạo on-chain</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-xs text-purple-700 font-mono">grantRole / revokeRole</p>
                        <p className="text-[11px] text-slate-500 mt-1">Phân quyền Whitelist địa chỉ ví thực thi cho các tác vụ nông trại.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-xs text-emerald-700 font-mono">createBatch / harvestBatch</p>
                        <p className="text-[11px] text-slate-500 mt-1">Ghi nhận thông tin tạo lô nông sản và nhật ký thu hoạch quả.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-xs text-blue-700 font-mono">processBatch / inspectParent</p>
                        <p className="text-[11px] text-slate-500 mt-1">Chế biến phân loại, đóng gói bao bì và kiểm định chất lượng.</p>
                    </div>
                </div>
            </div>

            {/* KHỐI 3: BẢNG GIÁM SÁT GIAO DỊCH BLOCKCHAIN REALTIME TỪ BACKEND CSDL */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-600" />
                            Lịch Sử Giao Dịch On-Chain Realtime
                        </h3>
                        <p className="text-xs text-slate-500">Đồng bộ trực tiếp Backend API (`/api/v1/admin/blockchain/transactions`)</p>
                    </div>

                    {/* LỌC VÀ TÌM KIẾM */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã lô, tên hàm, ví..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="SUCCESS">Thành công (SUCCESS)</option>
                                <option value="FAILED">Thất bại (FAILED)</option>
                                <option value="PENDING">Đang xử lý (PENDING)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {/* BẢNG DỮ LIỆU THẬT TỪ CSDL BACKEND */}
                {loading ? (
                    <div className="p-12 text-center text-slate-500 bg-white font-medium text-xs">
                        Đang kết nối Smart Contract và tải danh sách giao dịch Blockchain thật từ CSDL...
                    </div>
                ) : paginatedTx.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white font-medium text-xs">
                        Chưa có giao dịch Blockchain nào khớp với bộ lọc.
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
            </div>
        </div>
    );
};

export default BlockchainContractsPage;
