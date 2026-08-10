
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Package,
    Activity,
    ShieldCheck,
    RefreshCw,
    ArrowRight,
    UserCheck,
    Clock,
    Lock,
    RotateCcw,
    ExternalLink,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Sliders,
    FileText
} from 'lucide-react';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { adminService, type DashboardStatsDto, type BlockchainTransactionDto } from '../../services/adminService';

export const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState<DashboardStatsDto | null>(null);
    const [recentTxs, setRecentTxs] = useState<BlockchainTransactionDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        // 1. Tải thống kê tổng quan
        try {
            const statsData = await adminService.getDashboardStats();
            setStats(statsData);
        } catch (err: any) {
            console.error('Lỗi khi tải Thống kê Admin:', err);
            setError(err.response?.data?.message || 'Không thể kết nối lấy dữ liệu thống kê từ Backend.');
        }
        // 2. Tải danh sách giao dịch gần đây
        try {
            const txData = await adminService.getRecentTransactions();
            setRecentTxs(txData.slice(0, 5));
        } catch (err: any) {
            console.error('Lỗi khi tải Giao dịch Blockchain:', err);
        } finally {
            setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
            setLoading(false);
        }
        try {
            const [statsData, txData] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getRecentTransactions()
            ]);

            setStats(statsData);
            setRecentTxs(txData.slice(0, 5)); // Lấy 5 giao dịch gần nhất
            setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
        } catch (err: any) {
            console.error('Lỗi khi tải dữ liệu Admin Dashboard:', err);
            setError(err.response?.data?.message || 'Không thể kết nối với máy chủ Backend API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchDashboardData();
    }, [fetchDashboardData]);

    const handleRetry = async (txId: string) => {
        setRetryingId(txId);
        try {
            await adminService.retryTransaction(txId);
            await fetchDashboardData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Thao tác Retry giao dịch thất bại!');
        } finally {
            setRetryingId(null);
        }
    };

    // Tính tỷ lệ thành công của Blockchain
    const successRate = stats?.blockchainStats?.totalTransactions
        ? Math.round((stats.blockchainStats.successfulTransactions / stats.blockchainStats.totalTransactions) * 100)
        : 100;

    return (
        <div className="space-y-6 pb-8">
            {/* HEADER PAGE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        Tổng Quan Hệ Thống Quản Trị
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Giám sát thời gian thực người dùng, lô nông sản và giao dịch Smart Contract Blockchain.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <Clock className="w-3.5 h-3.5" />
                            Cập nhật: {lastUpdated}
                        </span>
                    )}
                    <AppButton
                        variant="grey"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />}
                        onClick={fetchDashboardData}
                        disabled={loading}
                    >
                        Làm mới
                    </AppButton>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        <span>⚠️ {error}</span>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        className="text-xs text-rose-800 underline font-bold hover:text-rose-900 cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* KPI METRICS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: TỔNG TÀI KHOẢN */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Tài Khoản</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">
                                {loading ? '...' : stats?.userStats?.totalUsers || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            {stats?.userStats?.activeCount || 0} Hoạt động
                        </span>
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {stats?.userStats?.pendingCount || 0} Chờ duyệt
                        </span>
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            {stats?.userStats?.lockedCount || 0} Khóa
                        </span>
                    </div>
                </div>

                {/* CARD 2: TỔNG LÔ NÔNG SẢN */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lô Nông Sản</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">
                                {loading ? '...' : stats?.batchStats?.totalBatches || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>Đang canh tác: <strong className="text-slate-900">{stats?.batchStats?.inProductionCount || 0}</strong></span>
                        <span>Sẵn sàng bán: <strong className="text-emerald-700">{stats?.batchStats?.readyForSaleCount || 0}</strong></span>
                    </div>
                </div>

                {/* CARD 3: GIAO DỊCH ON-CHAIN */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giao Dịch On-Chain</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">
                                {loading ? '...' : stats?.blockchainStats?.totalTransactions || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {stats?.blockchainStats?.successfulTransactions || 0} Thành công
                        </span>
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {stats?.blockchainStats?.failedTransactions || 0} Lỗi
                        </span>
                    </div>
                </div>

                {/* CARD 4: ĐỘ TIN CẬY SMART CONTRACT */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ On-Chain</p>
                            <h3 className="text-3xl font-black text-emerald-600 mt-1">
                                {loading ? '...' : `${successRate}%`}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Mạng lưới Smart Contract</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Hoạt động tốt
                        </span>
                    </div>
                </div>
            </div>

            {/* CHI TIẾT PHÂN BỔ & TIẾN ĐỘ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KHỐI 1: PHÂN BỔ VAI TRÒ NGƯỜI DÙNG */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Phân Bổ Người Dùng Theo Vai Trò
                        </h3>
                        <button
                            onClick={() => navigate('/admin/accounts')}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                            Quản lý tài khoản
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Farmer */}
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-slate-700">Nông dân (Farmers)</span>
                                <span className="text-slate-900">{stats?.userStats?.farmersCount || 0} tài khoản</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: stats?.userStats?.totalUsers
                                            ? `${((stats.userStats.farmersCount / stats.userStats.totalUsers) * 100).toFixed(0)}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Processor */}
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-slate-700">Hợp tác xã & Chế biến (Processors)</span>
                                <span className="text-slate-900">{stats?.userStats?.processorsCount || 0} tài khoản</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: stats?.userStats?.totalUsers
                                            ? `${((stats.userStats.processorsCount / stats.userStats.totalUsers) * 100).toFixed(0)}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Retailer */}
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-slate-700">Siêu thị & Bán lẻ (Retailers)</span>
                                <span className="text-slate-900">{stats?.userStats?.retailersCount || 0} tài khoản</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: stats?.userStats?.totalUsers
                                            ? `${((stats.userStats.retailersCount / stats.userStats.totalUsers) * 100).toFixed(0)}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KHỐI 2: TIẾN ĐỘ CHUỖI CUNG ỨNG NÔNG SẢN */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Package className="w-5 h-5 text-emerald-600" />
                            Tiến Độ Lô Nông Sản Chuỗi Cung Ứng
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                            Tổng số: {stats?.batchStats?.totalBatches || 0} lô
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                            <p className="text-xs text-slate-500 font-medium">Đang canh tác</p>
                            <p className="text-xl font-black text-slate-900 mt-0.5">
                                {stats?.batchStats?.inProductionCount || 0}
                            </p>
                        </div>
                        <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium">Đã thu hoạch</p>
                            <p className="text-xl font-black text-amber-900 mt-0.5">
                                {stats?.batchStats?.harvestedCount || 0}
                            </p>
                        </div>
                        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                            <p className="text-xs text-blue-700 font-medium">Đã chế biến & Đóng gói</p>
                            <p className="text-xl font-black text-blue-900 mt-0.5">
                                {stats?.batchStats?.packagedCount || 0}
                            </p>
                        </div>
                        <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                            <p className="text-xs text-emerald-700 font-medium">Sẵn sàng thương mại</p>
                            <p className="text-xl font-black text-emerald-900 mt-0.5">
                                {stats?.batchStats?.readyForSaleCount || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUẢN LÝ NHANH (QUICK ACCESS CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    onClick={() => navigate('/admin/accounts')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-3">Quản lý Tài Khoản</h4>
                    <p className="text-xs text-slate-500 mt-1">Duyệt tài khoản mới, phân quyền ví Blockchain và khóa tài khoản.</p>
                </div>

                <div
                    onClick={() => navigate('/admin/roles')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-3">Phân Quyền Smart Contract</h4>
                    <p className="text-xs text-slate-500 mt-1">Cấp quyền (Grant Role) hoặc Thu hồi (Revoke Role) địa chỉ ví On-chain.</p>
                </div>

                <div
                    onClick={() => navigate('/admin/blockchain-transactions')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Activity className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-3">Giám Sát Blockchain</h4>
                    <p className="text-xs text-slate-500 mt-1">Theo dõi nhật ký giao dịch, kiểm tra Tx Hash và Thử lại lệnh lỗi.</p>
                </div>
            </div>

            {/* BẢNG GIAO DỊCH BLOCKCHAIN MỚI NHẤT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            Nhật Ký Giao Dịch On-Chain Mới Nhất
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Hiển thị các giao dịch ghi nhận gần đây trên Smart Contract</p>
                    </div>
                    <AppButton
                        variant="grey"
                        className="text-xs font-bold"
                        onClick={() => navigate('/admin/blockchain-transactions')}
                    >
                        Xem tất cả
                    </AppButton>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase">
                            <tr>
                                <th className="p-3.5">Mã Lô Nông Sản</th>
                                <th className="p-3.5">Hàm Thực Thi</th>
                                <th className="p-3.5">Transaction Hash</th>
                                <th className="p-3.5 text-center">Trạng Thái</th>
                                <th className="p-3.5 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Đang tải dữ liệu giao dịch từ Backend...
                                    </td>
                                </tr>
                            ) : recentTxs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Chưa có giao dịch Blockchain nào được ghi nhận.
                                    </td>
                                </tr>
                            ) : (
                                recentTxs.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5 font-bold text-slate-900">
                                            {tx.batchCode || tx.subBatchCode || '—'}
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-700 font-semibold">
                                            {tx.functionName}
                                        </td>
                                        <td className="p-3.5 font-mono">
                                            {tx.transactionHash ? (
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                                >
                                                    {`${tx.transactionHash.slice(0, 8)}...${tx.transactionHash.slice(-6)}`}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 italic">Chưa phát sinh Tx</span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <AppBadge status={tx.status} label={tx.status} />
                                        </td>
                                        <td className="p-3.5 text-right">
                                            {tx.status === 'FAILED' ? (
                                                <button
                                                    onClick={() => handleRetry(tx.id)}
                                                    disabled={retryingId === tx.id}
                                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <RotateCcw className={`w-3 h-3 ${retryingId === tx.id ? 'animate-spin' : ''}`} />
                                                    Thử lại
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
