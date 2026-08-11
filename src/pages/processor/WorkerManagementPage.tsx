import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, UserPlus, RefreshCw, AlertCircle, CheckCircle, Clock, Eye, Wallet, Phone, Mail } from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';
import { processorService, type SearchWorkerResultDto } from '../../services/processorService';

export const WorkerManagementPage: React.FC = () => {
    const [workers, setWorkers] = useState<SearchWorkerResultDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [keyword, setKeyword] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'linked' | 'search'>('linked');

    // State cho Modal xem chi tiết
    const [selectedWorker, setSelectedWorker] = useState<SearchWorkerResultDto | null>(null);
    const [invitingId, setInvitingId] = useState<string | null>(null);

    const fetchWorkers = useCallback(async (searchQuery?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await processorService.searchWorkers(searchQuery);
            setWorkers(data || []);
        } catch (err) {
            console.error('Lỗi tải danh sách công nhân:', err);
            setError('Không thể kết nối đến Backend API.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchWorkers();
    }, [fetchWorkers]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchWorkers(keyword);
    };

    const handleSendInvitation = async (workerId: string) => {
        setInvitingId(workerId);
        try {
            await processorService.sendWorkerInvitation(workerId);
            alert('Đã gửi lời mời liên kết tới công nhân thành công!');
            fetchWorkers(keyword);
        } catch (err) {
            console.error('Lỗi gửi lời mời:', err);
            alert('Gửi lời mời liên kết thất bại.');
        } finally {
            setInvitingId(null);
        }
    };

    // Lọc công nhân theo tab
    const linkedWorkers = workers.filter(w => w.linkStatus === 'ACCEPTED');

    const columns: Column<SearchWorkerResultDto>[] = [
        { header: 'Họ và Tên Công Nhân', key: 'fullName' },
        { header: 'Email Liên Hệ', key: 'email' },
        { header: 'Số Điện Thoại', key: 'phone' },
        {
            header: 'Địa Chỉ Ví Custodial',
            key: 'walletAddress',
            render: (item) => (
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {item.walletAddress ? `${item.walletAddress.substring(0, 8)}...${item.walletAddress.substring(item.walletAddress.length - 6)}` : 'Chưa cấp ví'}
                </span>
            ),
        },
        {
            header: 'Trạng Thái Liên Kết',
            key: 'linkStatus',
            render: (item) => {
                switch (item.linkStatus) {
                    case 'ACCEPTED':
                        return <AppBadge status="APPROVED" label="Đã liên kết" />;
                    case 'PENDING':
                        return <AppBadge status="PENDING" label="Đã gửi lời mời" />;
                    case 'REJECTED':
                        return <AppBadge status="REJECTED" label="Từ chối" />;
                    default:
                        return <span className="text-xs text-slate-400 font-medium">Chưa liên kết</span>;
                }
            },
        },
        {
            header: 'Thao Tác',
            key: 'workerId',
            render: (item) => (
                <div className="flex items-center gap-2">
                    {item.linkStatus === 'NONE' || item.linkStatus === 'REJECTED' ? (
                        <AppButton
                            variant="outline"
                            size="sm"
                            isLoading={invitingId === item.workerId}
                            onClick={() => handleSendInvitation(item.workerId)}
                        >
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            Gửi lời mời
                        </AppButton>
                    ) : (
                        <button
                            onClick={() => setSelectedWorker(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Xem thông tin
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Quản Lý Nhân Công & Liên Kết HTX</h2>
                    <p className="text-xs text-slate-500">Tìm kiếm công nhân, gửi lời mời liên kết và xem thông tin công nhân nông trại.</p>
                </div>
                <button
                    onClick={() => fetchWorkers(keyword)}
                    disabled={loading}
                    className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-4">
                <button
                    onClick={() => setActiveTab('linked')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${activeTab === 'linked'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Công Nhân Đã Liên Kết ({linkedWorkers.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${activeTab === 'search'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Tìm Kiếm & Gửi Lời Mời ({workers.length})</span>
                </button>
            </div>

            {/* Tab Content 1: Công nhân đã liên kết */}
            {activeTab === 'linked' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span>Danh Sách Công Nhân Đã Xác Nhận Liên Kết</span>
                    </h3>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh sách...</div>
                    ) : linkedWorkers.length > 0 ? (
                        <AppTable columns={columns} data={linkedWorkers} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">
                            Chưa có công nhân nào liên kết thành công với Hợp tác xã. Hãy qua tab "Tìm Kiếm" để gửi lời mời!
                        </div>
                    )}
                </div>
            )}

            {/* Tab Content 2: Tìm kiếm & Gửi lời mời */}
            {activeTab === 'search' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Nhập Họ tên, Email hoặc Số điện thoại công nhân..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <AppButton type="submit" isLoading={loading}>
                            Tìm kiếm
                        </AppButton>
                    </form>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tìm kiếm công nhân...</div>
                    ) : (
                        <AppTable columns={columns} data={workers} showSTT={true} />
                    )}
                </div>
            )}

            {/* Modal Chi tiết Thông tin Công nhân */}
            <AppModal
                isOpen={!!selectedWorker}
                onClose={() => setSelectedWorker(null)}
                title="Thông Tin Chi Tiết Công Nhân"
            >
                {selectedWorker && (
                    <div className="space-y-4 text-xs text-slate-700">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                                {selectedWorker.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{selectedWorker.fullName}</h4>
                                <span className="text-emerald-700 text-xs font-medium">Nông dân / Nhân công HTX</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-500">Email:</span>
                                <span>{selectedWorker.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-500">Số Điện Thoại:</span>
                                <span>{selectedWorker.phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Wallet className="w-4 h-4 text-slate-400 mt-0.5" />
                                <span className="font-semibold text-slate-500">Địa chỉ ví On-Chain:</span>
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 break-all">
                                    {selectedWorker.walletAddress || 'Chưa được cấp ví Custodial'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedWorker(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </AppModal>
        </div>
    );
};
