import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, RefreshCw, AlertCircle, Plus, Edit3, Search, Layers, CheckCircle2, Globe, Building2 } from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { processorService, type FarmAreaDto } from '../../services/processorService';

interface FarmAreaFormData {
    name: string;
    ownerName: string;
    province: string;
    district: string;
    ward: string;
    area: number | '';
    soilType: string;
    gps: string;
    plantingCode: string;
}

const initialFormData: FarmAreaFormData = {
    name: '',
    ownerName: '',
    province: '',
    district: '',
    ward: '',
    area: '',
    soilType: '',
    gps: '',
    plantingCode: '',
};

export const FarmAreaManagementPage: React.FC = () => {
    const [farmAreas, setFarmAreas] = useState<FarmAreaDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Filter states
    const [searchPlantingCode, setSearchPlantingCode] = useState<string>('');
    const [searchProvince, setSearchProvince] = useState<string>('');
    const [searchDistrict, setSearchDistrict] = useState<string>('');
    const [searchWard, setSearchWard] = useState<string>('');

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [selectedArea, setSelectedArea] = useState<FarmAreaDto | null>(null);
    const [formData, setFormData] = useState<FarmAreaFormData>(initialFormData);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Fetch data from API
    const fetchFarmAreas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await processorService.getFarmAreas({
                province: searchProvince.trim() || undefined,
                district: searchDistrict.trim() || undefined,
                ward: searchWard.trim() || undefined,
                plantingCode: searchPlantingCode.trim() || undefined,
            });
            setFarmAreas(data || []);
        } catch (err) {
            console.error('Lỗi tải vùng trồng:', err);
            setError('Không thể lấy danh sách vùng trồng từ Backend API.');
        } finally {
            setLoading(false);
        }
    }, [searchProvince, searchDistrict, searchWard, searchPlantingCode]);

    useEffect(() => {
        void fetchFarmAreas();
    }, [fetchFarmAreas]);

    // Thống kê nhanh
    const totalAreas = farmAreas.length;
    const totalHectares = useMemo(() => {
        return farmAreas.reduce((sum, item) => sum + (item.area || 0), 0);
    }, [farmAreas]);
    const totalPlantingCodes = useMemo(() => {
        return farmAreas.filter((item) => !!item.plantingCode).length;
    }, [farmAreas]);

    // Handle Form Submit (Create)
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.ownerName || !formData.province || !formData.district || !formData.ward) {
            setError('Vui lòng điền đầy đủ các thông tin bắt buộc (Tên vùng trồng, Chủ hộ, Tỉnh, Huyện, Xã).');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await processorService.createFarmArea({
                name: formData.name,
                ownerName: formData.ownerName,
                province: formData.province,
                district: formData.district,
                ward: formData.ward,
                area: Number(formData.area) || 0,
                soilType: formData.soilType || undefined,
                gps: formData.gps || undefined,
                plantingCode: formData.plantingCode || undefined,
            });

            setSuccessMsg('Thêm vùng trồng mới thành công!');
            setIsCreateOpen(false);
            setFormData(initialFormData);
            await fetchFarmAreas();
        } catch (err) {
            console.error('Lỗi tạo vùng trồng:', err);
            setError('Không thể thêm vùng trồng mới. Vui lòng kiểm tra lại dữ liệu.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Open Edit Modal
    const handleOpenEdit = (item: FarmAreaDto) => {
        setSelectedArea(item);
        setFormData({
            name: item.name || '',
            ownerName: item.ownerName || '',
            province: item.province || '',
            district: item.district || '',
            ward: item.ward || '',
            area: item.area ?? '',
            soilType: item.soilType || '',
            gps: item.gps || '',
            plantingCode: item.plantingCode || '',
        });
        setIsEditOpen(true);
    };

    // Handle Form Submit (Update)
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedArea) return;

        setSubmitting(true);
        setError(null);
        try {
            await processorService.updateFarmArea(selectedArea.id, {
                name: formData.name,
                ownerName: formData.ownerName,
                province: formData.province,
                district: formData.district,
                ward: formData.ward,
                area: Number(formData.area) || 0,
                soilType: formData.soilType || undefined,
                gps: formData.gps || undefined,
                plantingCode: formData.plantingCode || undefined,
            });

            setSuccessMsg('Cập nhật vùng trồng thành công!');
            setIsEditOpen(false);
            setSelectedArea(null);
            setFormData(initialFormData);
            await fetchFarmAreas();
        } catch (err) {
            console.error('Lỗi cập nhật vùng trồng:', err);
            setError('Không thể cập nhật vùng trồng. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    // Bảng Cột
    const columns: Column<FarmAreaDto>[] = [
        { header: 'Tên Vùng Trồng', key: 'name' },
        {
            header: 'Mã Số Vùng (MSVT)',
            key: 'plantingCode',
            render: (item) => (
                <span className="font-mono font-bold text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                    {item.plantingCode || 'Chưa cấp mã'}
                </span>
            ),
        },
        { header: 'Chủ Hộ / Quản Lý', key: 'ownerName' },
        {
            header: 'Địa Giới Hành Chính',
            key: 'province',
            render: (item) => (
                <div className="flex flex-col text-xs">
                    <span className="font-semibold text-slate-800">{item.ward || 'Xã/Phường N/A'}</span>
                    <span className="text-slate-500">{`${item.district || ''}, ${item.province || ''}`}</span>
                </div>
            ),
        },
        {
            header: 'Diện Tích',
            key: 'area',
            render: (item) => <span className="font-extrabold text-green-700">{item.area ? `${item.area} ha` : 'N/A'}</span>,
        },
        {
            header: 'Loại Đất',
            key: 'soilType',
            render: (item) => <span className="text-xs text-slate-600">{item.soilType || 'Chưa cập nhật'}</span>,
        },
        {
            header: 'Tọa Độ GPS',
            key: 'gps',
            render: (item) => (
                <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    {item.gps || 'Chưa định vị'}
                </span>
            ),
        },
        {
            header: 'Thao Tác',
            key: 'id',
            align: 'center',
            render: (item) => (
                <AppButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                    onClick={() => handleOpenEdit(item)}
                >
                    Sửa
                </AppButton>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header & Button Thêm mới */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quản Lý Vùng Trồng HTX</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Quản lý toàn bộ vùng trồng, diện tích, chủ hộ & mã số vùng trồng (MSVT) đồng bộ với Backend API.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <AppButton
                        variant="outline"
                        size="md"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        onClick={fetchFarmAreas}
                        disabled={loading}
                    >
                        Làm mới
                    </AppButton>
                    <AppButton
                        variant="green"
                        size="md"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => {
                            setFormData(initialFormData);
                            setIsCreateOpen(true);
                        }}
                    >
                        Thêm Vùng Trồng
                    </AppButton>
                </div>
            </div>

            {/* Thông Báo Toast/Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                    <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
                </div>
            )}

            {/* Thẻ Thống Kê Nhanh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Vùng Trồng</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">{totalAreas} <span className="text-xs font-normal text-slate-500">vùng</span></p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Diện Tích Quản Lý</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">{totalHectares.toFixed(1)} <span className="text-xs font-normal text-slate-500">ha</span></p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Số Vùng Trồng (MSVT)</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">{totalPlantingCodes} <span className="text-xs font-normal text-slate-500">đã cấp</span></p>
                    </div>
                </div>
            </div>

            {/* Thanh Lọc & Tìm Kiếm */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-slate-400" />
                    <span>Bộ Lọc Tìm Kiếm</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <AppInput
                        placeholder="Mã số vùng trồng (MSVT)..."
                        value={searchPlantingCode}
                        onChange={(e) => setSearchPlantingCode(e.target.value)}
                    />
                    <AppInput
                        placeholder="Tỉnh / Thành phố..."
                        value={searchProvince}
                        onChange={(e) => setSearchProvince(e.target.value)}
                    />
                    <AppInput
                        placeholder="Quận / Huyện..."
                        value={searchDistrict}
                        onChange={(e) => setSearchDistrict(e.target.value)}
                    />
                    <AppInput
                        placeholder="Xã / Phường..."
                        value={searchWard}
                        onChange={(e) => setSearchWard(e.target.value)}
                    />
                </div>
            </div>

            {/* Bảng Dữ Liệu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        <span>Đang tải danh sách vùng trồng từ Backend...</span>
                    </div>
                ) : farmAreas.length > 0 ? (
                    <AppTable columns={columns} data={farmAreas} showSTT={true} />
                ) : (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                        Chưa có vùng trồng nào phù hợp với bộ lọc.
                    </div>
                )}
            </div>

            {/* MODAL 1: THÊM VÙNG TRỒNG MỚI */}
            <AppModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Thêm Vùng Trồng Mới"
                maxWidth="lg"
                footer={
                    <>
                        <AppButton variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
                            Hủy
                        </AppButton>
                        <AppButton variant="green" onClick={handleCreateSubmit} isLoading={submitting}>
                            Tạo Vùng Trồng
                        </AppButton>
                    </>
                }
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AppInput
                            label="Tên Vùng Trồng *"
                            placeholder="Nhập tên vùng (VD: Vùng Trồng Sầu Riêng DL01)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <AppInput
                            label="Chủ Hộ / Quản Lý *"
                            placeholder="Tên chủ hộ nông dân hoặc quản lý"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <AppInput
                            label="Tỉnh / Thành *"
                            placeholder="Tỉnh/Thành"
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            required
                        />
                        <AppInput
                            label="Huyện / Quận *"
                            placeholder="Huyện/Quận"
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            required
                        />
                        <AppInput
                            label="Xã / Phường *"
                            placeholder="Xã/Phường"
                            value={formData.ward}
                            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AppInput
                            label="Diện Tích (Hécta - ha) *"
                            type="number"
                            step="0.1"
                            placeholder="VD: 2.5"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value ? Number(e.target.value) : '' })}
                            required
                        />
                        <AppInput
                            label="Mã Số Vùng Trồng (MSVT)"
                            placeholder="VD: VT-DL-2026"
                            value={formData.plantingCode}
                            onChange={(e) => setFormData({ ...formData, plantingCode: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AppInput
                            label="Loại Đất"
                            placeholder="VD: Đất đỏ bazan"
                            value={formData.soilType}
                            onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                        />
                        <AppInput
                            label="Tọa Độ GPS"
                            placeholder="VD: 10.762622, 106.660172"
                            value={formData.gps}
                            onChange={(e) => setFormData({ ...formData, gps: e.target.value })}
                        />
                    </div>
                </form>
            </AppModal>

            {/* MODAL 2: CHỈNH SỬA VÙNG TRỒNG */}
            <AppModal
                isOpen={isEditOpen}
                onClose={() => {
                    setIsEditOpen(false);
                    setSelectedArea(null);
                }}
                title="Chỉnh Sửa Vùng Trồng"
                maxWidth="lg"
                footer={
                    <>
                        <AppButton
                            variant="outline"
                            onClick={() => {
                                setIsEditOpen(false);
                                setSelectedArea(null);
                            }}
                            disabled={submitting}
                        >
                            Hủy
                        </AppButton>
                        <AppButton variant="green" onClick={handleEditSubmit} isLoading={submitting}>
                            Lưu Cập Nhật
                        </AppButton>
                    </>
                }
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AppInput
                            label="Tên Vùng Trồng *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <AppInput
                            label="Chủ Hộ / Quản Lý *"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <AppInput
                            label="Tỉnh / Thành *"
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            required
                        />
                        <AppInput
                            label="Huyện / Quận *"
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            required
                        />
                        <AppInput
                            label="Xã / Phường *"
                            value={formData.ward}
                            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AppInput
                            label="Diện Tích (Hécta - ha) *"
                            type="number"
                            step="0.1"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value ? Number(e.target.value) : '' })}
                            required
                        />
                        <AppInput
                            label="Mã Số Vùng Trồng (MSVT)"
                            value={formData.plantingCode}
                            onChange={(e) => setFormData({ ...formData, plantingCode: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AppInput
                            label="Loại Đất"
                            value={formData.soilType}
                            onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                        />
                        <AppInput
                            label="Tọa Độ GPS"
                            value={formData.gps}
                            onChange={(e) => setFormData({ ...formData, gps: e.target.value })}
                        />
                    </div>
                </form>
            </AppModal>
        </div>
    );
};
