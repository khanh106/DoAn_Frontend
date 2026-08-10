import React, { useState, useEffect, useCallback } from 'react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppTabs, type TabItem } from '../../components/ui/AppTabs';
import { AppModal } from '../../components/ui/AppModal';
import { AppSelect } from '../../components/ui/AppSelect';
import { Pagination } from '../../components/ui/Pagination';
import {
    FileText,
    Search,
    RefreshCw,
    Download,
    Shield,
    Database,
    UserCheck,
    Eye,
    Copy,
    Check,
    Clock,
    Layers,
    AlertCircle
} from 'lucide-react';
import { adminService, type SystemLogDto, type SystemLogStatsDto } from '../../services/adminService';

export const SystemLogsPage: React.FC = () => {
    // State lưu trữ dữ liệu thực từ Backend API
    const [logs, setLogs] = useState<SystemLogDto[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [stats, setStats] = useState<SystemLogStatsDto>({
        totalLogs: 0,
        infoCount: 0,
        warningCount: 0,
        errorCount: 0,
        successCount: 0
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State Bộ lọc & Phân trang
    const [search, setSearch] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
    const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
    const [selectedLog, setSelectedLog] = useState<SystemLogDto | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 10;

    // TẢI DỮ LIỆU THẬT TỪ BACKEND API
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminService.getSystemLogs({
                category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
                severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
                search: search.trim() || undefined,
                page: currentPage,
                pageSize: pageSize
            });

            setLogs(response.logs || []);
            setTotalCount(response.totalCount || 0);
            if (response.stats) {
                setStats(response.stats);
            }
        } catch (err: any) {
            console.error("Lỗi khi tải nhật ký hệ thống từ Backend API:", err);
            setError(err.response?.data?.message || err.message || "Không thể kết nối đến Backend API để lấy nhật ký hệ thống.");
            setLogs([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, selectedSeverity, search, currentPage]);

    // Gọi API khi component render hoặc khi đổi filter/trang
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Tự động làm mới dữ liệu sau 5s nếu bật Live Refresh
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchLogs();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    // Reset về trang 1 khi đổi bộ lọc
    const handleCategoryChange = (catId: string) => {
        setSelectedCategory(catId);
        setCurrentPage(1);
    };

    const handleSeverityChange = (sevValue: string) => {
        setSelectedSeverity(sevValue);
        setCurrentPage(1);
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    // Sao chép JSON payload
    const handleCopyPayload = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Xuất dữ liệu thật ra file CSV
    const handleExportCSV = () => {
        if (logs.length === 0) return;
        const headers = ['ID', 'Thời Gian', 'Danh Mục', 'Hành Động', 'Mức Độ', 'Người Thực Hiện', 'Mô Tả', 'Trace ID'];
        const rows = logs.map(l => [
            l.id,
            new Date(l.timestamp).toLocaleString('vi-VN'),
            l.category,
            l.action,
            l.severity,
            l.actorEmail || l.actorName || 'N/A',
            `"${(l.description || '').replace(/"/g, '""')}"`,
            l.traceId || ''
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `system_logs_real_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getSeverityBadge = (severity: string) => {
        switch ((severity || '').toUpperCase()) {
            case 'SUCCESS':
                return <AppBadge status="DA_DUYET" label="Thành công" />;
            case 'ERROR':
            case 'FAILED':
                return <AppBadge status="DA_HUY" label="Lỗi hệ thống" />;
            case 'WARNING':
                return <AppBadge status="DANG_XU_LY" label="Cảnh báo" />;
            default:
                return <AppBadge status="CAN_BO_SUNG" label="Thông tin" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch ((category || '').toUpperCase()) {
            case 'BLOCKCHAIN': return <Shield className="w-4 h-4 text-purple-600" />;
            case 'AUTH_USER': return <UserCheck className="w-4 h-4 text-emerald-600" />;
            case 'INVENTORY': return <Database className="w-4 h-4 text-amber-600" />;
            case 'CULTIVATION': return <Layers className="w-4 h-4 text-blue-600" />;
            default: return <FileText className="w-4 h-4 text-slate-600" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch ((category || '').toUpperCase()) {
            case 'BLOCKCHAIN': return 'Blockchain';
            case 'AUTH_USER': return 'Xác thực';
            case 'INVENTORY': return 'Kho vật tư';
            case 'CULTIVATION': return 'Canh tác';
            default: return category;
        }
    };

    const categoryTabs: TabItem[] = [
        { id: 'ALL', label: 'Tất cả danh mục', count: stats.totalLogs },
        { id: 'BLOCKCHAIN', label: 'Blockchain', icon: <Shield className="w-4 h-4 text-purple-600" /> },
        { id: 'AUTH_USER', label: 'Xác thực & User', icon: <UserCheck className="w-4 h-4 text-emerald-600" /> },
        { id: 'INVENTORY', label: 'Kho vật tư', icon: <Database className="w-4 h-4 text-amber-600" /> },
        { id: 'CULTIVATION', label: 'Canh tác', icon: <Layers className="w-4 h-4 text-blue-600" /> },
    ];

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // Cấu hình các cột của bảng AppTable
    const columns: Column<SystemLogDto>[] = [
        {
            header: 'THỜI GIAN',
            key: 'timestamp',
            width: '160px',
            render: (item) => (
                <span className="font-mono text-xs text-slate-600 font-semibold">
                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                </span>
            )
        },
        {
            header: 'DANH MỤC',
            key: 'category',
            width: '140px',
            render: (item) => (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    {getCategoryIcon(item.category)}
                    <span>{getCategoryLabel(item.category)}</span>
                </div>
            )
        },
        {
            header: 'HÀNH ĐỘNG',
            key: 'action',
            width: '160px',
            render: (item) => (
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
                    {item.action}
                </span>
            )
        },
        {
            header: 'MỨC ĐỘ',
            key: 'severity',
            width: '130px',
            align: 'center',
            render: (item) => getSeverityBadge(item.severity)
        },
        {
            header: 'TÁC NHÂN',
            key: 'actorName',
            width: '180px',
            render: (item) => (
                <div>
                    <p className="font-bold text-slate-900 text-xs">{item.actorName || 'System'}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">{item.actorEmail || 'N/A'}</p>
                </div>
            )
        },
        {
            header: 'NỘI DUNG CHI TIẾT',
            key: 'description',
            render: (item) => (
                <p className="max-w-xs md:max-w-md truncate text-xs text-slate-700" title={item.description}>
                    {item.description}
                </p>
            )
        },
        {
            header: 'THAO TÁC',
            key: 'actions',
            align: 'right',
            width: '90px',
            render: (item) => (
                <button
                    onClick={() => setSelectedLog(item)}
                    className="p-2 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                    title="Xem chi tiết Payload"
                >
                    <Eye className="w-4 h-4" />
                </button>
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800">
            {/* TIÊU ĐỀ HỆ THỐNG */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        Nhật Ký & Giám Sát Hệ Thống
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Theo dõi toàn bộ lịch sử thao tác, sự kiện bảo mật, giao dịch Blockchain và thay đổi dữ liệu trong hệ thống.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AppButton
                        variant={autoRefresh ? 'green' : 'outline'}
                        size="sm"
                        leftIcon={<Clock className="w-4 h-4" />}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? 'Live Auto-Refresh (ON)' : 'Tự động làm mới (OFF)'}
                    </AppButton>
                    <AppButton
                        variant="green"
                        size="sm"
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={handleExportCSV}
                        disabled={logs.length === 0}
                    >
                        Xuất File CSV
                    </AppButton>
                </div>
            </div>

            {/* CARD THỐNG KÊ KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng Sự Kiện Nhật Ký</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalLogs}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Sự Kiện Thành Công</p>
                    <p className="text-2xl font-black text-emerald-700 mt-2">{stats.successCount}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Cảnh Báo Hệ Thống</p>
                    <p className="text-2xl font-black text-amber-700 mt-2">{stats.warningCount}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Lỗi Cần Xử Lý</p>
                    <p className="text-2xl font-black text-rose-700 mt-2">{stats.errorCount}</p>
                </div>
            </div>

            {/* TAB DANH MỤC & THANH BỘ LỌC */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <AppTabs
                    tabs={categoryTabs}
                    activeTabId={selectedCategory}
                    onTabChange={handleCategoryChange}
                />

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm từ khóa, email, Trace ID, hành động..."
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium transition-colors"
                            />
                        </div>

                        <div className="w-44">
                            <AppSelect
                                value={selectedSeverity}
                                onChange={(e) => handleSeverityChange(e.target.value)}
                                options={[
                                    { value: 'ALL', label: 'Tất cả mức độ' },
                                    { value: 'SUCCESS', label: 'Thành công (SUCCESS)' },
                                    { value: 'INFO', label: 'Thông tin (INFO)' },
                                    { value: 'WARNING', label: 'Cảnh báo (WARNING)' },
                                    { value: 'ERROR', label: 'Lỗi (ERROR)' },
                                ]}
                            />
                        </div>
                    </div>

                    <AppButton
                        variant="outline"
                        size="sm"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />}
                        onClick={fetchLogs}
                    >
                        Làm mới
                    </AppButton>
                </div>
            </div>

            {/* THÔNG BÁO LỖI NẾU KẾT NỐI BACKEND THẤT BẠI */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* BẢNG DỮ LIỆU APPTABLE */}
            {loading ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-700" />
                    Đang kết nối Backend API và lấy dữ liệu nhật ký hệ thống...
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 font-medium">
                    Không tìm thấy nhật ký phù hợp từ dữ liệu hệ thống Backend.
                </div>
            ) : (
                <div className="space-y-4">
                    <AppTable columns={columns} data={logs} showSTT={true} />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            )}

            {/* MODAL CHI TIẾT APP-MODAL */}
            <AppModal
                isOpen={Boolean(selectedLog)}
                onClose={() => setSelectedLog(null)}
                title="Chi Tiết Bản Ghi Nhật Ký (Real Data)"
                maxWidth="lg"
                footer={
                    <AppButton variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                        Đóng
                    </AppButton>
                }
            >
                {selectedLog && (
                    <div className="space-y-4 text-xs text-slate-700">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Trace ID / Hash</p>
                                <p className="font-mono text-emerald-700 font-bold break-all mt-1">{selectedLog.traceId || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Địa chỉ IP</p>
                                <p className="font-mono text-slate-800 font-bold mt-1">{selectedLog.ipAddress || '127.0.0.1'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Mô tả sự kiện</p>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 font-medium">
                                {selectedLog.description}
                            </div>
                        </div>

                        {selectedLog.metadataJson && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Metadata JSON Payload</p>
                                    <button
                                        onClick={() => handleCopyPayload(selectedLog.metadataJson || '')}
                                        className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Đã sao chép' : 'Sao chép JSON'}
                                    </button>
                                </div>
                                <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                                    {(() => {
                                        try {
                                            return JSON.stringify(JSON.parse(selectedLog.metadataJson || '{}'), null, 2);
                                        } catch {
                                            return selectedLog.metadataJson;
                                        }
                                    })()}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </AppModal>
        </div>
    );
};

export default SystemLogsPage;
