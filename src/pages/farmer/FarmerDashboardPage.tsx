import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { farmerService, type AssignedBatch, type ProcessorWorkerLinkDto } from '../../services/farmerService';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import {
    LayoutDashboard,
    Layers,
    Clock,
    Crown,
    Wheat,
    ArrowRight,
    FileText,
    RefreshCw,
    ShieldCheck,
    Plus,
    Activity,
    UserCheck,
    CheckCircle2,
    Bell,
    Building2,
    Check,
    X,
} from 'lucide-react';

export const FarmerDashboardPage: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    const [batches, setBatches] = useState<AssignedBatch[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [invitations, setInvitations] = useState<ProcessorWorkerLinkDto[]>([]);
    const [respondingId, setRespondingId] = useState<string | null>(null);

    // 1. Tải danh sách lời mời liên kết từ Hợp tác xã
    const fetchInvitations = useCallback(async () => {
        try {
            const data = await farmerService.getInvitations();
            setInvitations(data);
        } catch (err) {
            console.error('Lỗi tải danh sách lời mời:', err);
        }
    }, []);

    // 2. Tải danh sách lô phân công cho Nông dân
    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const data = await farmerService.getAssignedBatches();
            setBatches(data);
        } catch (err) {
            console.error('Lỗi tải danh sách lô phân công:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchInvitations();
        void fetchBatches();
    }, [fetchInvitations, fetchBatches]);

    // 3. Hàm xử lý khi bấm Chấp nhận hoặc Từ chối lời mời liên kết
    const handleRespondInvitation = async (invitationId: string, action: 'ACCEPT' | 'REJECT') => {
        setRespondingId(invitationId);
        try {
            await farmerService.respondInvitation(invitationId, action);
            // Tải lại danh sách lời mời và lô phân công sau khi chấp nhận thành công
            await fetchInvitations();
            await fetchBatches();
        } catch (err) {
            console.error('Lỗi phản hồi lời mời:', err);
            alert('Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại!');
        } finally {
            setRespondingId(null);
        }
    };

    // 4. Thống kê nhanh KPI
    const stats = useMemo(() => {
        const total = batches.length;
        const pending = batches.filter((b) => b.workerStatus !== 'ACCEPTED').length;
        const representative = batches.filter((b) => b.isRepresentative).length;
        const harvested = batches.filter((b) => b.currentStage !== 'STAGE_PLANTING' && b.currentStage !== 'PLANTING').length;
        return { total, pending, representative, harvested };
    }, [batches]);

    // Lọc danh sách các lời mời đang ở trạng thái PENDING
    const pendingInvitations = useMemo(() => {
        return invitations.filter((i) => i.status === 'PENDING');
    }, [invitations]);

    // Lọc danh sách các Hợp tác xã đã liên kết thành công (ACCEPTED)
    const acceptedInvitations = useMemo(() => {
        return invitations.filter((i) => i.status === 'ACCEPTED');
    }, [invitations]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Banner Chào Mừng & Thông Tin Tổng Quan */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-700/60 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-emerald-500/30 mb-3">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Trang Tổng Quan Portal Nông Dân
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                            Xin chào, {user?.fullName || 'Nông dân'}!
                        </h1>
                        <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-2xl font-medium">
                            Chào mừng bạn trở lại hệ thống TRACE. Theo dõi tổng quan tiến độ canh tác, các lô nông sản được phân công và nhật ký sản xuất của bạn.
                        </p>
                        {user?.walletAddress && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-200">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Địa chỉ ví Custodial: <strong className="font-mono text-white">{user.walletAddress}</strong></span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <AppButton
                            variant="outline"
                            onClick={() => {
                                void fetchInvitations();
                                void fetchBatches();
                            }}
                            isLoading={loading}
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                        >
                            Đồng bộ
                        </AppButton>
                        <AppButton
                            onClick={() => navigate('/farmer/batches')}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold border-0 shadow-lg"
                        >
                            Xem Lô Phân Công
                        </AppButton>
                    </div>
                </div>
            </div>

            {/* Thẻ Lời Mời Liên Kết Đang Chờ Phản Hồi (Hiển thị nổi bật nếu có lời mời PENDING) */}
            {pendingInvitations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                        <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
                        <span>Bạn có {pendingInvitations.length} lời mời liên kết sản xuất từ Hợp tác xã!</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingInvitations.map((inv) => (
                            <div key={inv.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{inv.processorName}</h4>
                                        <p className="text-xs text-slate-500">
                                            Gửi ngày: {new Date(inv.invitedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <AppButton
                                        size="sm"
                                        variant="outline"
                                        leftIcon={<X className="w-4 h-4" />}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                        isLoading={respondingId === inv.id}
                                        onClick={() => handleRespondInvitation(inv.id, 'REJECT')}
                                    >
                                        Từ chối
                                    </AppButton>
                                    <AppButton
                                        size="sm"
                                        leftIcon={<Check className="w-4 h-4" />}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                        isLoading={respondingId === inv.id}
                                        onClick={() => handleRespondInvitation(inv.id, 'ACCEPT')}
                                    >
                                        Chấp nhận
                                    </AppButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Thẻ Hợp Tác Xã Đã Liên Kết Thành Công */}
            {acceptedInvitations.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>Hợp Tác Xã Đã Liên Kết ({acceptedInvitations.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {acceptedInvitations.map((coop) => (
                            <div key={coop.id} className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-600 text-white rounded-lg shrink-0">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-900 text-xs truncate">{coop.processorName}</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Ngày chấp nhận: {coop.respondedAt ? new Date(coop.respondedAt).toLocaleDateString('vi-VN') : 'Đã xác nhận'}
                                    </p>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-300">
                                    Đã liên kết
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Thống kê KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Lô Canh Tác</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Lô được HTX phân công</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lô Chờ Nhận</p>
                        <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Cần xác nhận nhận lô</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lô Đại Diện</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.representative}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Quyền ký thu hoạch Smart Contract</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Thu Hoạch</p>
                        <h3 className="text-2xl font-black text-purple-600 mt-1">{stats.harvested}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Lô đã thu hoạch hoàn tất</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Wheat className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Danh sách xem nhanh các lô mới nhất */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-600" /> Các Lô Canh Tác Gần Đây
                    </h2>
                    <button
                        onClick={() => navigate('/farmer/batches')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                        Xem tất cả lô phân công <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-medium">Đang tải dữ liệu...</div>
                ) : batches.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                        Hiện chưa có lô canh tác nào được phân công.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batches.slice(0, 3).map((b) => (
                            <div key={b.batchId} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors space-y-3 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900 text-sm">{b.batchCode}</span>
                                    {b.isRepresentative && (
                                        <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                                            <Crown className="w-3 h-3 text-amber-600" /> Đại diện
                                        </span>
                                    )}
                                </div>

                                <div className="text-xs space-y-1 text-slate-600">
                                    <p>Sản phẩm: <strong className="text-slate-800">{b.productName}</strong></p>
                                    <p>Loại trái: <strong>{b.fruitTypeName}</strong></p>
                                    <p>Vùng trồng: <strong>{b.farmAreaName}</strong></p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                                    <AppBadge
                                        status={b.workerStatus === 'ACCEPTED' ? 'DA_DUYET' : 'DANG_XU_LY'}
                                        label={b.workerStatus === 'ACCEPTED' ? 'Đã tiếp nhận' : 'Chờ xác nhận'}
                                    />
                                    <button
                                        onClick={() => navigate('/farmer/batches')}
                                        className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                                    >
                                        Chi tiết <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
