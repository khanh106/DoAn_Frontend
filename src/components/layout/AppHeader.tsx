import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Shield, Leaf, UserCheck, AlertTriangle, RefreshCw, ExternalLink, CheckCircle2, User, Building2, Wheat, Truck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { adminService } from '../../services/adminService';
import { processorService } from '../../services/processorService';
import { useUIStore } from '../../stores/uiStore';
import { retailerService } from '../../services/retailerService';


import { farmerService } from '../../services/farmerService';

import { CooperativeInfoModal } from '../cooperative/CooperativeInfoModal';




interface AppHeaderProps {
    portalTitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    portalTitle = 'HỆ THỐNG QUẢN TRỊ NGUỒN GỐC BLOCKCHAIN',
}) => {
    const navigate = useNavigate();
    const submittingOperations = useUIStore((state) => state.submittingOperations);
    const isAnyOperationSubmitting = Object.values(submittingOperations).some(Boolean);

    const { user, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotiDropdown, setShowNotiDropdown] = useState(false);
    const [showCoopModal, setShowCoopModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notiRef = useRef<HTMLDivElement>(null);


    // Dynamic states cho Thông báo Admin
    const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
    const [systemErrorCount, setSystemErrorCount] = useState<number>(0);
    const [failedTxCount, setFailedTxCount] = useState<number>(0);
    const [loadingNoti, setLoadingNoti] = useState<boolean>(false);

    // Hàm gọi API lấy dữ liệu thông báo thực tế từ Backend
    const fetchAdminNotifications = useCallback(async () => {
        if (user?.role !== 'ADMIN') return;
        setLoadingNoti(true);
        try {
            // Lấy số tài khoản chờ duyệt & số giao dịch failed
            const stats = await adminService.getDashboardStats();
            if (stats?.userStats) {
                setPendingUsersCount(stats.userStats.pendingCount || 0);
            }
            if (stats?.blockchainStats) {
                setFailedTxCount(stats.blockchainStats.failedTransactions || 0);
            }

            // Lấy số lượng nhật ký lỗi hệ thống (severity = ERROR)
            const logRes = await adminService.getSystemLogs({ severity: 'ERROR', pageSize: 1 });
            if (logRes?.stats) {
                setSystemErrorCount(logRes.stats.errorCount || 0);
            }
        } catch (err) {
            console.error('Lỗi tải thông báo Admin Header:', err);
        } finally {
            setLoadingNoti(false);
        }
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchAdminNotifications();
        }
    }, [user?.role, fetchAdminNotifications]);

    // Xử lý đóng Dropdown khi click ra ngoài
    // States cho Thông báo của Hợp tác xã / Cơ sở chế biến
    const [coopNotifications, setCoopNotifications] = useState<any[]>([]);
    const [loadingCoopNoti, setLoadingCoopNoti] = useState<boolean>(false);

    // Hàm lấy danh sách các lô hàng nông dân đã xác nhận thu hoạch nhưng HTX chưa tiếp nhận
    const fetchCoopNotifications = useCallback(async () => {
        if (user?.role !== 'COOPERATIVE' && user?.role !== 'PROCESSOR') return;
        setLoadingCoopNoti(true);
        try {
            const data = await processorService.getBatches();
            // Lọc ra các lô hàng nông dân đã xác nhận thu hoạch (STAGE_HARVESTED)
            const harvested = data.filter(
                (b) =>
                    b.currentStage === 'STAGE_HARVESTED' ||
                    b.currentStage === 'HARVESTED' ||
                    b.currentStage === 'DA_THU_HOACH'
            );
            setCoopNotifications(harvested);
        } catch (err) {
            console.error('Lỗi tải thông báo hợp tác xã:', err);
        } finally {
            setLoadingCoopNoti(false);
        }
    }, [user?.role]);

    // Tự động tải thông báo khi đăng nhập và định kỳ mỗi 30 giây
    useEffect(() => {
        if (user?.role === 'COOPERATIVE' || user?.role === 'PROCESSOR') {
            fetchCoopNotifications();
            const interval = setInterval(fetchCoopNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.role, fetchCoopNotifications]);
    // === THÊM ĐOẠN CODE NÀY PHÍA SAU ĐOẠN ĐỊNH KỲ FETCH CỦA COOP (khoảng dòng 104) ===

    // States cho Thông báo của Nông dân (Lô hàng mới được phân công)
    const [farmerNotifications, setFarmerNotifications] = useState<any[]>([]);
    const [loadingFarmerNoti, setLoadingFarmerNoti] = useState<boolean>(false);

    // Hàm gọi API lấy danh sách lô phân công ở trạng thái PENDING
    const fetchFarmerNotifications = useCallback(async () => {
        if (user?.role !== 'FARMER') return;
        setLoadingFarmerNoti(true);
        try {
            const data = await farmerService.getAssignedBatches();
            // Lọc ra các lô hàng có trạng thái PENDING (chưa được tiếp nhận)
            const pending = data.filter(
                (b) => b.workerStatus === 'PENDING'
            );
            setFarmerNotifications(pending);
        } catch (err) {
            console.error('Lỗi tải thông báo nông dân:', err);
        } finally {
            setLoadingFarmerNoti(false);
        }
    }, [user?.role]);

    // Tự động tải thông báo khi nông dân đăng nhập và định kỳ mỗi 30 giây
    useEffect(() => {
        if (user?.role === 'FARMER') {
            fetchFarmerNotifications();
            const interval = setInterval(fetchFarmerNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.role, fetchFarmerNotifications]);
    // States cho Thông báo của Siêu thị (Vận đơn đang vận chuyển tới)
    const [retailerNotifications, setRetailerNotifications] = useState<any[]>([]);
    const [loadingRetailerNoti, setLoadingRetailerNoti] = useState<boolean>(false);

    // Hàm lấy danh sách vận đơn đang được vận chuyển tới siêu thị (chưa tiếp nhận - !receivedDate)
    const fetchRetailerNotifications = useCallback(async () => {
        if (user?.role !== 'RETAILER') return;
        setLoadingRetailerNoti(true);
        try {
            const data = await retailerService.getMyShipments();
            // Lọc ra các vận đơn đang trên đường giao (chưa tiếp nhận)
            const shipping = data.filter((s) => !s.receivedDate);
            setRetailerNotifications(shipping);
        } catch (err) {
            console.error('Lỗi tải thông báo siêu thị:', err);
        } finally {
            setLoadingRetailerNoti(false);
        }
    }, [user?.role]);

    // Tự động tải thông báo khi siêu thị đăng nhập và định kỳ mỗi 30 giây
    useEffect(() => {
        if (user?.role === 'RETAILER') {
            fetchRetailerNotifications();
            const interval = setInterval(fetchRetailerNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.role, fetchRetailerNotifications]);



    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
                setShowNotiDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const handleProfileClick = () => {
        setShowDropdown(false);
        if (user?.role === 'ADMIN') navigate('/admin/profile');
        else if (user?.role === 'FARMER') navigate('/farmer/profile');
        else if (user?.role === 'RETAILER') navigate('/retailer/profile');
        else navigate('/processor/profile');
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Quản Trị - System Admin';
            case 'FARMER':
                return 'Nông Dân / Nhà Vườn';
            case 'PROCESSOR':
            case 'COOPERATIVE':
                return 'HTX / Nhà Máy Chế Biến';
            case 'RETAILER':
                return 'Siêu Thị / Cửa Hàng';
            default:
                return 'Người Dùng System';
        }
    };

    const totalNotifications = pendingUsersCount + systemErrorCount + failedTxCount;

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            {/* LOGO & TIÊU ĐỀ HỆ THỐNG */}
            <div className="flex items-center gap-4">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate('/trace')}
                >
                    <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
                </div>

                <span className="text-slate-300 font-light text-2xl">|</span>

                <h1 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {portalTitle}
                </h1>
                {isAnyOperationSubmitting && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-extrabold animate-pulse ml-2 shrink-0">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Đang xử lý giao dịch...
                    </span>
                )}

            </div>


            <div className="flex items-center gap-4">
                {/* NÚT THÔNG TIN HTX / DOANH NGHIỆP (Chỉ hiển thị cho tài khoản COOPERATIVE và PROCESSOR) */}
                {(user?.role === 'COOPERATIVE' || user?.role === 'PROCESSOR') && (
                    <button
                        onClick={() => {
                            setShowCoopModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Xem thông tin Hợp tác xã / Doanh nghiệp"
                    >

                        <Building2 className="w-4 h-4 text-slate-700" />
                        <span className="hidden sm:inline">Thông tin HTX/Doanh nghiệp</span>
                    </button>
                )}
                {/* 1. THÔNG TIN TÀI KHOẢN & ĐĂNG XUẤT (Vị trí đầu) */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden border border-emerald-500/20">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" />
                            ) : (
                                user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>

                        <div className="text-left hidden sm:block">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900">{user?.fullName || 'Tài khoản'}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{getRoleLabel(user?.role)}</p>
                        </div>
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs">
                            <div className="px-4 py-2.5 border-b border-slate-100">
                                <p className="font-bold text-slate-900 truncate">{user?.fullName}</p>
                                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">
                                    {user?.role}
                                </span>
                            </div>

                            <div className="py-1">
                                <button
                                    onClick={handleProfileClick}
                                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <User className="w-4 h-4 text-emerald-600" />
                                    <span>Tài khoản</span>
                                </button>
                            </div>


                            <div className="border-t border-slate-100 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Đăng xuất tài khoản</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. 🔔 CHUÔNG THÔNG BÁO (Vị trí cũ: Nằm sau Profile / Bên phải ngoài cùng) */}
                {user?.role === 'ADMIN' ? (
                    <div className="relative" ref={notiRef}>
                        <button
                            onClick={() => {
                                setShowNotiDropdown(!showNotiDropdown);
                                if (!showNotiDropdown) fetchAdminNotifications();
                            }}
                            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Thông báo quản trị"
                        >
                            <Bell className="w-5 h-5" />
                            {totalNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
                                    {totalNotifications > 99 ? '99+' : totalNotifications}
                                </span>
                            )}
                        </button>

                        {/* DROPDOWN MENU HỘP THOẠI THÔNG BÁO */}
                        {showNotiDropdown && (
                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs">
                                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-slate-900 text-sm">Thông báo Admin</span>
                                        {totalNotifications > 0 && (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full text-[10px]">
                                                {totalNotifications} cần xử lý
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={fetchAdminNotifications}
                                        className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                                        title="Làm mới thông báo"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${loadingNoti ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                    {/* 1. Thông báo tài khoản mới cần duyệt */}
                                    <div className="p-3.5 hover:bg-amber-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                                                    <UserCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Yêu cầu duyệt tài khoản</p>
                                                    <p className="text-slate-500 text-[11px]">
                                                        {pendingUsersCount > 0
                                                            ? `Có ${pendingUsersCount} tài khoản mới đang chờ bạn phê duyệt.`
                                                            : 'Hiện không có tài khoản nào chờ duyệt.'}
                                                    </p>
                                                </div>
                                            </div>
                                            {pendingUsersCount > 0 && (
                                                <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded-full text-[10px] shrink-0">
                                                    {pendingUsersCount}
                                                </span>
                                            )}
                                        </div>
                                        {pendingUsersCount > 0 && (
                                            <button
                                                onClick={() => {
                                                    setShowNotiDropdown(false);
                                                    navigate('/admin/accounts');
                                                }}
                                                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                                            >
                                                <span>Xem & Duyệt Tài Khoản</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* 2. Thông báo lỗi nhật ký hệ thống */}
                                    <div className="p-3.5 hover:bg-rose-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Lỗi hệ thống phát sinh</p>
                                                    <p className="text-slate-500 text-[11px]">
                                                        {systemErrorCount > 0
                                                            ? `Có ${systemErrorCount} nhật ký lỗi (ERROR) cần được kiểm tra.`
                                                            : 'Hệ thống hoạt động bình thường, không ghi nhận lỗi mới.'}
                                                    </p>
                                                </div>
                                            </div>
                                            {systemErrorCount > 0 && (
                                                <span className="bg-rose-500 text-white font-black px-2 py-0.5 rounded-full text-[10px] shrink-0">
                                                    {systemErrorCount}
                                                </span>
                                            )}
                                        </div>
                                        {systemErrorCount > 0 && (
                                            <button
                                                onClick={() => {
                                                    setShowNotiDropdown(false);
                                                    navigate('/admin/system-logs');
                                                }}
                                                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                                            >
                                                <span>Kiểm Tra Nhật Ký Lỗi</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* 3. Giao dịch Blockchain bị thất bại (FAILED) */}
                                    {failedTxCount > 0 && (
                                        <div className="p-3.5 hover:bg-purple-50/50 transition-colors">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Giao dịch Blockchain lỗi</p>
                                                        <p className="text-slate-500 text-[11px]">
                                                            Có {failedTxCount} giao dịch Smart Contract thất bại (FAILED).
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="bg-purple-600 text-white font-black px-2 py-0.5 rounded-full text-[10px] shrink-0">
                                                    {failedTxCount}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowNotiDropdown(false);
                                                    navigate('/admin/blockchain-transactions');
                                                }}
                                                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                                            >
                                                <span>Xử Lý Giao Dịch Lỗi (Retry)</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Trường hợp hệ thống hoàn toàn bình thường */}
                                    {totalNotifications === 0 && (
                                        <div className="py-6 text-center text-slate-500">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                                            <p className="font-semibold text-slate-700">Tất cả đều ổn!</p>
                                            <p className="text-[11px] text-slate-400">Không có tài khoản chờ duyệt hoặc lỗi phát sinh.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : user?.role === 'COOPERATIVE' || user?.role === 'PROCESSOR' ? (
                    <div className="relative" ref={notiRef}>
                        <button
                            onClick={() => {
                                setShowNotiDropdown(!showNotiDropdown);
                                if (!showNotiDropdown) fetchCoopNotifications();
                            }}
                            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Thông báo tiếp nhận lô hàng"
                        >
                            <Bell className="w-5 h-5" />
                            {coopNotifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
                                    {coopNotifications.length > 99 ? '99+' : coopNotifications.length}
                                </span>
                            )}
                        </button>

                        {/* DROPDOWN MENU HỘP THOẠI THÔNG BÁO CHO HTX / PROCESSOR */}
                        {showNotiDropdown && (
                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs">
                                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-slate-900 text-sm">Yêu cầu tiếp nhận</span>
                                        {coopNotifications.length > 0 && (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full text-[10px]">
                                                {coopNotifications.length} lô mới
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={fetchCoopNotifications}
                                        className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                                        title="Làm mới thông báo"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${loadingCoopNoti ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                    {coopNotifications.length > 0 ? (
                                        coopNotifications.map((b) => (
                                            <div key={b.id} className="p-3.5 hover:bg-emerald-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                                                            <Building2 className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">Nông dân đã xác nhận thu hoạch</p>
                                                            <p className="text-slate-500 text-[11px] mt-0.5">
                                                                Mã lô: <span className="font-semibold text-slate-800">{b.batchCode}</span> - {b.productName || b.fruitTypeName}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                Vùng trồng: {b.farmAreaName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowNotiDropdown(false);
                                                        navigate(user?.role === 'COOPERATIVE' ? '/cooperative/processing' : '/processor/processing');
                                                    }}
                                                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                                                >
                                                    <span>Xác nhận tiếp nhận lô hàng</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-slate-500">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                                            <p className="font-semibold text-slate-700">Không có thông báo mới!</p>
                                            <p className="text-[11px] text-slate-400">Tất cả các lô hàng thu hoạch đã được tiếp nhận.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : user?.role === 'FARMER' ? (
                    <div className="relative" ref={notiRef}>
                        <button
                            onClick={() => {
                                setShowNotiDropdown(!showNotiDropdown);
                                if (!showNotiDropdown) fetchFarmerNotifications();
                            }}
                            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Thông báo phân công lô hàng"
                        >
                            <Bell className="w-5 h-5" />
                            {farmerNotifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
                                    {farmerNotifications.length > 99 ? '99+' : farmerNotifications.length}
                                </span>
                            )}
                        </button>

                        {/* DROPDOWN MENU HỘP THOẠI THÔNG BÁO CHO NÔNG DÂN */}
                        {showNotiDropdown && (
                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs">
                                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-slate-900 text-sm">Yêu cầu phân công</span>
                                        {farmerNotifications.length > 0 && (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full text-[10px]">
                                                {farmerNotifications.length} lô mới
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={fetchFarmerNotifications}
                                        className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                                        title="Làm mới thông báo"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${loadingFarmerNoti ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                    {farmerNotifications.length > 0 ? (
                                        farmerNotifications.map((b) => (
                                            <div key={b.batchId} className="p-3.5 hover:bg-emerald-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                                                            <Wheat className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">Bạn được phân công lô hàng mới</p>
                                                            <p className="text-slate-500 text-[11px] mt-0.5">
                                                                Mã lô: <span className="font-semibold text-slate-800">{b.batchCode}</span> - {b.productName || b.fruitTypeName}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                Vùng trồng: {b.farmAreaName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowNotiDropdown(false);
                                                        navigate('/farmer/batches');
                                                    }}
                                                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                                                >
                                                    <span>Xem chi tiết & Tiếp nhận lô</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-slate-500">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                                            <p className="font-semibold text-slate-700">Không có thông báo mới!</p>
                                            <p className="text-[11px] text-slate-400">Bạn không có lô hàng nào đang chờ tiếp nhận.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : user?.role === 'RETAILER' ? (
                    <div className="relative" ref={notiRef}>
                        <button
                            onClick={() => {
                                setShowNotiDropdown(!showNotiDropdown);
                                if (!showNotiDropdown) fetchRetailerNotifications();
                            }}
                            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Thông báo vận đơn"
                        >
                            <Bell className="w-5 h-5" />
                            {retailerNotifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
                                    {retailerNotifications.length > 99 ? '99+' : retailerNotifications.length}
                                </span>
                            )}
                        </button>

                        {/* DROPDOWN MENU HỘP THOẠI THÔNG BÁO CHO SIÊU THỊ */}
                        {showNotiDropdown && (
                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs">
                                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-slate-900 text-sm">Vận đơn đang tới</span>
                                        {retailerNotifications.length > 0 && (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full text-[10px]">
                                                {retailerNotifications.length} đang giao
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={fetchRetailerNotifications}
                                        className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
                                        title="Làm mới thông báo"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${loadingRetailerNoti ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                    {retailerNotifications.length > 0 ? (
                                        retailerNotifications.map((s) => (
                                            <div key={s.id} className="p-3.5 hover:bg-emerald-50/50 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                                                            <Truck className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">Đơn hàng đang vận chuyển tới</p>
                                                            <p className="text-slate-500 text-[11px] mt-0.5">
                                                                Mã vận đơn: <span className="font-semibold text-slate-800">{s.shippingCode}</span>
                                                            </p>
                                                            <p className="text-[11px] text-slate-500">
                                                                Mã lô: <span className="font-semibold text-slate-800">{s.batchCode || s.subBatchCode}</span>
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                Đơn vị vận chuyển: {s.carrierInfo}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowNotiDropdown(false);
                                                        navigate('/retailer/shipments');
                                                    }}
                                                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors text-[11px] cursor-pointer"
                                                >
                                                    <span>Xem chi tiết & Tiếp nhận</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-slate-500">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                                            <p className="font-semibold text-slate-700">Không có đơn hàng mới!</p>
                                            <p className="text-[11px] text-slate-400">Hiện tại không có đơn hàng nào đang vận chuyển tới siêu thị.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <Bell className="w-5 h-5" />
                    </button>
                )}



            </div>

            <CooperativeInfoModal
                isOpen={showCoopModal}
                onClose={() => setShowCoopModal(false)}
            />
        </header>
    );
};
