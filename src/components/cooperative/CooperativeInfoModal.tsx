import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Building2,
    Save,
    Upload,
    FileText,
    AlertCircle,
    Phone,
    Mail,
    Globe,
    MapPin,
    Award,
    Users,
    DollarSign,
    Calendar,
    Trash2,
    Eye,
    Image as ImageIcon,
    ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { toast } from '../../utils/toast';


export interface CooperativeInfo {
    unitName: string;
    entityType: string;
    representativeName: string;
    mainProducts: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    businessRegistrationNo: string;
    businessSymbol: string;
    certificates: string;
    plantingAreaCode: string;
    totalRevenue: string;
    mainMarket: string;
    totalEmployees: string;
    establishedYear: string;
    certificateFiles: Array<{ id: string; name: string; url: string; type: 'image' | 'document'; size: string }>;
}

interface CooperativeInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'fruitchain_coop_info';

export const CooperativeInfoModal: React.FC<CooperativeInfoModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();

    // Dữ liệu khởi tạo mặc định
    const defaultData: CooperativeInfo = {
        unitName: user?.organization || 'Hợp Tác Xã Nông Nghiệp Chất Lượng Cao Tiền Giang',
        entityType: 'Hợp Tác Xã',
        representativeName: user?.fullName || 'Nguyễn Văn A',
        mainProducts: 'Sầu Riêng Ri6, Xoài Cát Hòa Lộc, Bưởi Da Xanh',
        phone: user?.phone || '0912 345 678',
        email: user?.email || 'cooperative@fruitchain.vn',
        address: 'Số 123 Đường Nông Nghiệp, Xã Mỹ Hạnh, Huyện Cái Bè, Tỉnh Tiền Giang',
        website: 'https://htxnongnghiep-tiengiang.vn',
        businessRegistrationNo: '1201987654',
        businessSymbol: 'HTX-TG-2024',
        certificates: 'VietGAP, GlobalGAP, HACCP, ISO 22000',
        plantingAreaCode: 'MSVT-TG-2024-0088',
        totalRevenue: '15 Tỷ VNĐ / Năm',
        mainMarket: 'Nội địa (Hệ thống siêu thị) & Xuất khẩu Trung Quốc, EU',
        totalEmployees: '120 Xã viên & Công nhân',
        establishedYear: '2018',
        certificateFiles: [
            {
                id: '1',
                name: 'Giay_Chung_Nhan_VietGAP_2024.pdf',
                url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
                type: 'image',
                size: '2.4 MB'
            }
        ]
    };

    const [formData, setFormData] = useState<CooperativeInfo>(defaultData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tải dữ liệu từ Backend (ưu tiên) hoặc LocalStorage khi mở Modal
    useEffect(() => {
        if (isOpen) {
            authService.getCooperativeProfile().then((data) => {
                if (data && Object.keys(data).length > 0) {
                    setFormData((prev) => ({ ...prev, ...data }));
                } else {
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) {
                        try {
                            setFormData(JSON.parse(saved));
                        } catch (e) {
                            console.error('Lỗi đọc thông tin HTX:', e);
                        }
                    }
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Xóa lỗi validation khi nhập
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // Xử lý upload tài liệu / hình ảnh Giấy chứng nhận
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                toast.warning(`File ${file.name} vượt quá dung lượng tối đa 10MB!`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                const isImg = file.type.startsWith('image/');

                const newFile = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    url: result,
                    type: isImg ? ('image' as const) : ('document' as const),
                    size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                };

                setFormData((prev) => ({
                    ...prev,
                    certificateFiles: [...prev.certificateFiles, newFile]
                }));
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            certificateFiles: prev.certificateFiles.filter((f) => f.id !== id)
        }));
    };

    // Kiểm tra tính hợp lệ dữ liệu
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.businessRegistrationNo.trim()) {
            newErrors.businessRegistrationNo = 'Vui lòng nhập Số đăng ký kinh doanh';
        }
        if (!formData.businessSymbol.trim()) {
            newErrors.businessSymbol = 'Vui lòng nhập Ký hiệu kinh doanh';
        }
        if (!formData.plantingAreaCode.trim()) {
            newErrors.plantingAreaCode = 'Vui lòng nhập Mã số vùng trồng';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            // 1. Lưu thông tin vào Backend Database
            await authService.updateCooperativeProfile(formData);

            // 2. Lưu đồng bộ vào LocalStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

            setIsSaving(false);
            setSuccessMessage(true);
            toast.success('Cập nhật thông tin Hợp tác xã / Doanh nghiệp thành công!');
            setTimeout(() => {
                setSuccessMessage(false);
                onClose();
            }, 1200);
        } catch (error) {
            console.error('Lỗi lưu thông tin HTX vào Backend:', error);
            toast.error('Có lỗi xảy ra khi lưu thông tin HTX vào hệ thống!');
            setIsSaving(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-extrabold uppercase tracking-wide">
                                THÔNG TIN HỢP TÁC XÃ / DOANH NGHIỆP
                            </h2>
                            <p className="text-xs text-slate-300">
                                Cập nhật hồ sơ năng lực & Thông tin chứng nhận pháp lý HTX
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* FORM NỘI DUNG */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
                    {/* KHỐI 1: THÔNG TIN PHÁP LÝ & ĐỊNH DANH */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-bold text-slate-900 text-sm uppercase">1. Thông tin Định danh & Pháp lý</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Tên đơn vị */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Tên đơn vị</label>
                                <input
                                    type="text"
                                    name="unitName"
                                    value={formData.unitName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Nhập tên HTX hoặc Doanh nghiệp"
                                />
                            </div>

                            {/* Loại hình */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Loại hình tổ chức</label>
                                <select
                                    name="entityType"
                                    value={formData.entityType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                >
                                    <option value="Hợp Tác Xã">Hợp Tác Xã</option>
                                    <option value="Liên Minh HTX">Liên Minh HTX</option>
                                    <option value="Công Ty TNHH">Công Ty TNHH</option>
                                    <option value="Công Ty Cổ Phần">Công Ty Cổ Phần</option>
                                    <option value="Doanh Nghiệp Tư Nhân">Doanh Nghiệp Tư Nhân</option>
                                </select>
                            </div>

                            {/* Tên đại diện */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Người đại diện pháp luật</label>
                                <input
                                    type="text"
                                    name="representativeName"
                                    value={formData.representativeName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Họ và tên người đại diện"
                                />
                            </div>

                            {/* Số đăng ký kinh doanh * */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Số đăng ký kinh doanh <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="businessRegistrationNo"
                                    value={formData.businessRegistrationNo}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 bg-white border ${errors.businessRegistrationNo ? 'border-rose-500' : 'border-slate-300'} rounded-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
                                    placeholder="Ví dụ: 1201987654"
                                />
                                {errors.businessRegistrationNo && (
                                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.businessRegistrationNo}
                                    </p>
                                )}
                            </div>

                            {/* Ký hiệu kinh doanh * */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Ký hiệu kinh doanh <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="businessSymbol"
                                    value={formData.businessSymbol}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 bg-white border ${errors.businessSymbol ? 'border-rose-500' : 'border-slate-300'} rounded-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
                                    placeholder="Ví dụ: HTX-TG-2024"
                                />
                                {errors.businessSymbol && (
                                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.businessSymbol}
                                    </p>
                                )}
                            </div>

                            {/* Mã số vùng trồng * */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Mã số vùng trồng <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="plantingAreaCode"
                                    value={formData.plantingAreaCode}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 bg-white border ${errors.plantingAreaCode ? 'border-rose-500' : 'border-slate-300'} rounded-lg font-semibold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
                                    placeholder="Ví dụ: MSVT-TG-2024-0088"
                                />
                                {errors.plantingAreaCode && (
                                    <p className="text-rose-500 text-[11px] mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.plantingAreaCode}
                                    </p>
                                )}
                            </div>

                            {/* Năm thành lập */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Năm thành lập</label>
                                <input
                                    type="text"
                                    name="establishedYear"
                                    value={formData.establishedYear}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ví dụ: 2018"
                                />
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2: THÔNG TIN LIÊN HỆ & QUY MÔ SẢN XUẤT */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-bold text-slate-900 text-sm uppercase">2. Liên hệ & Quy mô sản xuất</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Số điện thoại */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="0912 345 678"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Email liên hệ</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="cooperative@fruitchain.vn"
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Website chính thức</label>
                                <input
                                    type="text"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Tổng nhân viên */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Tổng nhân viên / Xã viên</label>
                                <input
                                    type="text"
                                    name="totalEmployees"
                                    value={formData.totalEmployees}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ví dụ: 120 Xã viên"
                                />
                            </div>

                            {/* Địa chỉ */}
                            <div className="md:col-span-2">
                                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Nhập địa chỉ đầy đủ"
                                />
                            </div>

                            {/* Sản phẩm chính */}
                            <div className="md:col-span-2">
                                <label className="block font-bold text-slate-700 mb-1">Sản phẩm chính</label>
                                <input
                                    type="text"
                                    name="mainProducts"
                                    value={formData.mainProducts}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ví dụ: Sầu Riêng Ri6, Xoài Cát Hòa Lộc, Bưởi Da Xanh"
                                />
                            </div>

                            {/* Chứng chỉ */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Chứng chỉ chất lượng</label>
                                <input
                                    type="text"
                                    name="certificates"
                                    value={formData.certificates}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="VietGAP, GlobalGAP, HACCP, ISO 22000"
                                />
                            </div>

                            {/* Tổng doanh thu */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Tổng doanh thu trung bình</label>
                                <input
                                    type="text"
                                    name="totalRevenue"
                                    value={formData.totalRevenue}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Ví dụ: 15 Tỷ VNĐ / Năm"
                                />
                            </div>

                            {/* Thị trường chính */}
                            <div className="md:col-span-2">
                                <label className="block font-bold text-slate-700 mb-1">Thị trường chính</label>
                                <input
                                    type="text"
                                    name="mainMarket"
                                    value={formData.mainMarket}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Nội địa & Xuất khẩu"
                                />
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 3: GIẤY CHỨNG NHẬN (UPLOAD TÀI LIỆU / HÌNH ẢNH) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-bold text-slate-900 text-sm uppercase">
                                    3. Giấy chứng nhận (Tài liệu & Hình ảnh)
                                </h3>
                            </div>
                            <span className="text-[11px] text-slate-500">Định dạng hỗ trợ: PNG, JPG, PDF (Tối đa 10MB)</span>
                        </div>

                        {/* KHU VỰC UPLOAD FILE */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-xl p-5 text-center cursor-pointer transition-all group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                multiple
                                accept="image/*,.pdf"
                                className="hidden"
                            />
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">
                                Nhấp để chọn file hoặc kéo thả tài liệu Giấy chứng nhận vào đây
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                (Giấy chứng nhận VietGAP, Giấy đăng ký kinh doanh, Chứng nhận xuất khẩu,...)
                            </p>
                        </div>

                        {/* DANH SÁCH FILE / HÌNH ẢNH ĐÃ UPLOAD */}
                        {formData.certificateFiles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                                {formData.certificateFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="relative flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs group hover:border-emerald-400 transition-colors"
                                    >
                                        {file.type === 'image' ? (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-medium">{file.size}</p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {file.type === 'image' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(file.url)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                                                    title="Xem ảnh phóng to"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(file.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                                title="Xóa file"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-400 text-xs py-2 italic">
                                Chưa có giấy chứng nhận nào được tải lên.
                            </p>
                        )}
                    </div>

                    {/* MODAL FOOTER */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thông Tin HTX'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* PREVIEW ẢNH GIẤY CHỨNG NHẬN PHÓNG TO */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2">
                        <img src={previewImage} alt="Giấy chứng nhận phóng to" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
