import React, { useState, useEffect } from 'react';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';
import { AppBadge } from '../../../components/ui/AppBadge';
import {
    User,
    Mail,
    Phone,
    Shield,
    Wallet,
    Building,
    Calendar,
    Copy,
    Check,
    Lock,
    UserCog,
    CheckCircle,
    Globe,
    MapPin,
    Award,
    FileText,
    ExternalLink,
    RefreshCw,
    Trash2
} from 'lucide-react';
import { apiClient } from '../../../services/api';

export interface UserAccountResponse {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    walletAddress?: string;
    status: string;
    createdAt?: string;
}

export interface CooperativeCertificateFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: string;
}

export interface CooperativeProfileData {
    unitName?: string;
    entityType?: string;
    representativeName?: string;
    mainProducts?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    businessRegistrationNo?: string;
    businessSymbol?: string;
    certificates?: string;
    plantingAreaCode?: string;
    totalRevenue?: string;
    mainMarket?: string;
    totalEmployees?: string;
    establishedYear?: string;
    certificateFiles?: CooperativeCertificateFile[];
}

export interface UserDetailData {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    walletAddress?: string;
    hasCustodialKey: boolean;
    status: string;
    createdAt: string;
    updatedAt?: string;
    cooperativeProfile?: CooperativeProfileData | null;
}

interface UserDetailModalProps {
    isOpen: boolean;
    user: UserAccountResponse | null;
    onClose: () => void;
    onOpenActionModal?: (action: 'APPROVE' | 'LOCK' | 'WHITELIST' | 'ROLE' | 'DELETE') => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
    isOpen,
    user,
    onClose,
    onOpenActionModal,
}) => {
    const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
    const [copiedId, setCopiedId] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'BLOCKCHAIN' | 'COOPERATIVE'>('GENERAL');

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchUserDetail(user.id);
        } else {
            setUserDetail(null);
            setError(null);
            setActiveTab('GENERAL');
        }
    }, [isOpen, user?.id]);

    const fetchUserDetail = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get<UserDetailData>(`/v1/users/${id}`);
            setUserDetail(res.data);
        } catch (err: any) {
            console.error('Lỗi lấy chi tiết người dùng:', err);
            setError(err.response?.data?.message || 'Không thể lấy thông tin chi tiết người dùng.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const dataToDisplay = userDetail || {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletAddress: user.walletAddress,
        hasCustodialKey: false,
        status: user.status,
        createdAt: user.createdAt || '',
        updatedAt: undefined,
        cooperativeProfile: null,
    };

    const handleCopy = (text: string, type: 'id' | 'wallet') => {
        navigator.clipboard.writeText(text);
        if (type === 'wallet') {
            setCopiedWallet(true);
            setTimeout(() => setCopiedWallet(false), 2000);
        } else {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const statusMap: Record<string, { label: string; status: string }> = {
        APPROVED: { label: 'Đã duyệt', status: 'DA_DUYET' },
        PENDING: { label: 'Chờ duyệt', status: 'PENDING' },
        LOCKED: { label: 'Bị khóa', status: 'DA_HUY' },
    };
    const statusConfig = statusMap[dataToDisplay.status] || { label: dataToDisplay.status, status: 'DEFAULT' };

    const coop = dataToDisplay.cooperativeProfile;

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title="THÔNG TIN CHI TIẾT TÀI KHOẢN"
            maxWidth="2xl"
            footer={
                <div className="flex flex-wrap items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {onOpenActionModal && (
                            <>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenActionModal('APPROVE');
                                    }}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" /> Duyệt / Từ chối
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenActionModal('ROLE');
                                    }}
                                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <UserCog className="w-3.5 h-3.5" /> Đổi vai trò
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenActionModal('WHITELIST');
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <Shield className="w-3.5 h-3.5" /> Whitelist
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenActionModal('LOCK');
                                    }}
                                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <Lock className="w-3.5 h-3.5" /> Khóa / Mở khóa
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenActionModal('DELETE');
                                    }}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Xóa tài khoản
                                </button>
                            </>
                        )}
                    </div>
                    <AppButton variant="grey" onClick={onClose}>
                        Đóng
                    </AppButton>
                </div>
            }
        >
            <div className="space-y-4 text-xs md:text-sm text-slate-700">
                {/* HEADER INFO BANNER */}
                <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-md relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-lg shadow-inner ring-2 ring-purple-400/30 shrink-0">
                                {dataToDisplay.fullName ? dataToDisplay.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                                    {dataToDisplay.fullName}
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-md text-[10px] font-bold">
                                        {dataToDisplay.role}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                                    <span>ID: {dataToDisplay.id}</span>
                                    <button
                                        onClick={() => handleCopy(dataToDisplay.id, 'id')}
                                        className="p-0.5 hover:text-white transition-colors cursor-pointer"
                                        title="Sao chép ID"
                                    >
                                        {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <AppBadge status={statusConfig.status} label={statusConfig.label} />
                            {loading && <RefreshCw className="w-4 h-4 text-purple-300 animate-spin" />}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {/* TAB NAVIGATION */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                        onClick={() => setActiveTab('GENERAL')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'GENERAL'
                                ? 'bg-purple-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                    >
                        <User className="w-3.5 h-3.5" /> Thông tin Tài khoản
                    </button>
                    <button
                        onClick={() => setActiveTab('BLOCKCHAIN')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'BLOCKCHAIN'
                                ? 'bg-purple-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                    >
                        <Wallet className="w-3.5 h-3.5" /> Ví Blockchain
                    </button>
                    {coop && (
                        <button
                            onClick={() => setActiveTab('COOPERATIVE')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'COOPERATIVE'
                                    ? 'bg-purple-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            <Building className="w-3.5 h-3.5" /> Hồ sơ Hợp tác xã
                        </button>
                    )}
                </div>

                {/* TAB 1: GENERAL INFO */}
                {activeTab === 'GENERAL' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                <User className="w-3.5 h-3.5 text-purple-600" /> Họ và tên
                            </div>
                            <p className="font-bold text-slate-900">{dataToDisplay.fullName || '—'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                <Mail className="w-3.5 h-3.5 text-purple-600" /> Email liên hệ
                            </div>
                            <p className="font-bold text-slate-900 break-all">{dataToDisplay.email || '—'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                <Phone className="w-3.5 h-3.5 text-purple-600" /> Số điện thoại
                            </div>
                            <p className="font-bold text-slate-900 font-mono">{dataToDisplay.phone || '—'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                <Shield className="w-3.5 h-3.5 text-purple-600" /> Vai trò (Role)
                            </div>
                            <p className="font-bold text-purple-700">{dataToDisplay.role}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-purple-600" /> Ngày khởi tạo
                            </div>
                            <p className="font-semibold text-slate-800">
                                {dataToDisplay.createdAt
                                    ? new Date(dataToDisplay.createdAt).toLocaleString('vi-VN')
                                    : '—'}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-purple-600" /> Cập nhật gần nhất
                            </div>
                            <p className="font-semibold text-slate-800">
                                {dataToDisplay.updatedAt
                                    ? new Date(dataToDisplay.updatedAt).toLocaleString('vi-VN')
                                    : 'Chưa cập nhật'}
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB 2: BLOCKCHAIN WALLET */}
                {activeTab === 'BLOCKCHAIN' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-emerald-600" />
                                    Ví Chuỗi Khối (Ethereum / Polygon)
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Địa chỉ ví lưu vết các hợp đồng thông minh trên Blockchain
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                dataToDisplay.hasCustodialKey
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : dataToDisplay.walletAddress
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-600'
                            }`}>
                                {dataToDisplay.hasCustodialKey
                                    ? 'Ví Custodial (Hệ thống cấp)'
                                    : dataToDisplay.walletAddress
                                    ? 'Ví MetaMask / Cá nhân'
                                    : 'Chưa liên kết'}
                            </span>
                        </div>

                        {dataToDisplay.walletAddress ? (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                                <span className="text-xs text-slate-400 font-semibold">Địa chỉ ví công khai (Public Address):</span>
                                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg font-mono text-xs font-bold text-slate-800 break-all">
                                    <span>{dataToDisplay.walletAddress}</span>
                                    <button
                                        onClick={() => handleCopy(dataToDisplay.walletAddress!, 'wallet')}
                                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="Sao chép"
                                    >
                                        {copiedWallet ? (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                                ⚠️ Tài khoản này chưa liên kết địa chỉ ví Blockchain. Nút cấp Whitelist sẽ không khả dụng cho tới khi ví được liên kết.
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: COOPERATIVE / ENTERPRISE PROFILE */}
                {activeTab === 'COOPERATIVE' && coop && (
                    <div className="space-y-3">
                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                            <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                                <Building className="w-4 h-4 text-emerald-700" />
                                Hồ sơ Hợp tác xã / Đơn vị sản xuất
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Tên đơn vị:</span>
                                    <span className="font-bold text-slate-900">{coop.unitName || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Loại hình tổ chức:</span>
                                    <span className="font-bold text-slate-900">{coop.entityType || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Người đại diện:</span>
                                    <span className="font-bold text-slate-900">{coop.representativeName || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Số ĐKKD / MST:</span>
                                    <span className="font-bold text-slate-900 font-mono">{coop.businessRegistrationNo || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-emerald-600" /> Địa chỉ trụ sở:
                                    </span>
                                    <span className="font-bold text-slate-900">{coop.address || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-emerald-600" /> Trang web:
                                    </span>
                                    {coop.website ? (
                                        <a href={coop.website.startsWith('http') ? coop.website : `https://${coop.website}`} target="_blank" rel="noreferrer" className="font-bold text-purple-700 hover:underline flex items-center gap-1">
                                            {coop.website} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="font-bold text-slate-900">—</span>
                                    )}
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Mã vùng trồng:</span>
                                    <span className="font-bold text-slate-900 font-mono">{coop.plantingAreaCode || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Sản phẩm chính:</span>
                                    <span className="font-bold text-slate-900">{coop.mainProducts || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Thị trường chính:</span>
                                    <span className="font-bold text-slate-900">{coop.mainMarket || '—'}</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                                    <span className="text-slate-400 font-semibold block">Số lượng lao động:</span>
                                    <span className="font-bold text-slate-900">{coop.totalEmployees || '—'}</span>
                                </div>
                            </div>

                            {/* CERTIFICATE FILES */}
                            {coop.certificateFiles && coop.certificateFiles.length > 0 && (
                                <div className="pt-2 border-t border-emerald-200/60">
                                    <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1 mb-2">
                                        <Award className="w-3.5 h-3.5 text-amber-600" /> Tệp Chứng nhận / Giấy phép đính kèm:
                                    </span>
                                    <div className="space-y-1.5">
                                        {coop.certificateFiles.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 bg-white rounded-lg border border-emerald-100 hover:border-emerald-300 flex items-center justify-between text-xs font-medium text-slate-800 hover:text-purple-700 transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-600" />
                                                    {file.name}
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppModal>
    );
};
