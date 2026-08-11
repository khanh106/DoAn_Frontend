import React, { useState, useRef } from 'react';
import {
    User,
    Mail,
    Phone,
    Shield,
    Camera,
    CheckCircle,
    Save,
    Copy,
    Check,
    Building,
    FileText,
    Sparkles,
    Upload,
    Wallet
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuthStore();

    // Dữ liệu Form khởi tạo từ User hiện tại
    const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');
    const [organization, setOrganization] = useState(user?.organization || 'Hợp Tác Xã Nông Nghiệp Chất Lượng Cao');
    const [bio, setBio] = useState(user?.bio || 'Chuyên canh và chế biến nông sản theo tiêu chuẩn VietGAP & Blockchain.');
    const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '');

    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getRoleName = (role?: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Quản Trị Viên (System Admin)';
            case 'FARMER':
                return 'Nông Dân / Nhà Vườn';
            case 'PROCESSOR':
            case 'COOPERATIVE':
                return 'Hợp Tác Xã / Nhà Máy Chế Biến';
            case 'RETAILER':
                return 'Siêu Thị / Cửa Hàng Bán Lẻ';
            default:
                return role || 'Người dùng hệ thống';
        }
    };

    // Hàm chọn & đọc ảnh từ máy tính (Up ảnh đại diện)
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Dung lượng ảnh tối đa cho phép là 5MB!');
                return;
            }
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                const base64Img = uploadEvent.target?.result as string;
                setAvatarUrl(base64Img);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopyWallet = () => {
        if (user?.walletAddress) {
            navigator.clipboard.writeText(user.walletAddress);
            setCopiedWallet(true);
            setTimeout(() => setCopiedWallet(false), 2000);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        setTimeout(() => {
            updateUser({
                fullName,
                name: fullName,
                phone,
                email,
                organization,
                bio,
                avatar: avatarUrl,
            });
            setIsSaving(false);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        }, 400);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Thông báo thành công */}
            {savedSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-bold">
                            Cập nhật thông tin tài khoản và ảnh đại diện thành công!
                        </span>
                    </div>
                </div>
            )}

            {/* Header Card Banner */}
            <div className="relative bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 rounded-3xl p-6 md:p-8 text-white shadow-xl overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative group shrink-0">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white/20 bg-emerald-700/80 shadow-2xl flex items-center justify-center overflow-hidden text-4xl font-extrabold text-white">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                fullName ? fullName.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 p-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                            title="Tải ảnh đại diện mới"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-center md:text-left space-y-2 flex-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="px-3 py-1 bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {getRoleName(user?.role)}
                            </span>
                            <span className="px-2.5 py-1 bg-emerald-400/20 rounded-full text-xs font-semibold text-emerald-200">
                                Trạng thái: {user?.status || 'APPROVED'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">{fullName || 'Tài khoản Nông nghiệp'}</h1>
                        <p className="text-emerald-100/80 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4 text-emerald-300" />
                            {email || 'Chưa cập nhật email'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chi tiết thông tin & Đổi ảnh */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Tải ảnh đại diện & Địa chỉ Ví */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            Ảnh đại diện tài khoản
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">Tải lên ảnh khuôn mặt hoặc logo đại diện.</p>
                    </div>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 transition-colors bg-slate-50/50">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-800 text-3xl font-extrabold shadow-inner mb-4">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-emerald-600" />
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Chọn hình ảnh mới</span>
                        </button>
                        <span className="text-[11px] text-slate-400 mt-2">Định dạng JPG, PNG, WEBP (Tối đa 5MB)</span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            Địa chỉ ví Blockchain
                        </label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono text-slate-600 truncate font-semibold">
                                {user?.walletAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyWallet}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors shrink-0 cursor-pointer"
                            >
                                {copiedWallet ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Form nhập thông tin */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-emerald-600" />
                                Thông tin chi tiết tài khoản
                            </h2>
                            <p className="text-slate-500 text-xs mt-0.5">Cập nhật họ tên, liên hệ và đơn vị sản xuất.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Họ và tên <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Nhập họ và tên..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Số điện thoại liên hệ</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Nhập số điện thoại..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Địa chỉ Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@domain.com"
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Tên Đơn vị / Cơ sở / HTX</label>
                                <div className="relative">
                                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        placeholder="Tên đơn vị sản xuất..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Shield className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase">Vai trò hệ thống</p>
                                    <p className="text-xs font-black text-slate-900">{getRoleName(user?.role)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái xác thực</p>
                                    <p className="text-xs font-black text-emerald-700">{user?.status || 'APPROVED'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Giới thiệu ngắn</label>
                            <div className="relative">
                                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <textarea
                                    rows={3}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Mô tả ngắn gọn về mô hình hoạt động..."
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSaving ? 'Đang lưu thay đổi...' : 'Lưu thông tin tài khoản'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
