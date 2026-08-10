import React, { useState } from 'react';
import { AppButton } from '../components/ui/AppButton';
import { AppBadge } from '../components/ui/AppBadge';
import { AppTable, type Column } from '../components/ui/AppTable';
import { AppTabs } from '../components/ui/AppTabs';
import { AppModal } from '../components/ui/AppModal';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Download, Users, CheckCircle, Lock } from 'lucide-react';

interface DemoUser {
    name: string;
    role: string;
    status: string;
}

export const DesignSystemShowcase: React.FC = () => {
    const [activeTab, setActiveTab] = useState('TAB_ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const tabs = [
        { id: 'TAB_ALL', label: 'Tất cả tài khoản', count: 10, icon: <Users className="w-4 h-4" /> },
        { id: 'TAB_PENDING', label: 'Chờ duyệt', count: 3, icon: <CheckCircle className="w-4 h-4" /> },
        { id: 'TAB_LOCKED', label: 'Bị khóa', count: 1, icon: <Lock className="w-4 h-4" /> },
    ];

    const columns: Column<DemoUser>[] = [
        { header: 'Họ và tên', key: 'name' },
        { header: 'Chức vụ', key: 'role' },
        {
            header: 'Trạng thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status} label={item.status} />,
        },
    ];

    const data: DemoUser[] = [
        { name: 'Nguyễn Văn A', role: 'FARMER', status: 'DA_DUYET' },
        { name: 'Trần Thị B', role: 'PROCESSOR', status: 'DANG_XU_LY' },
        { name: 'Lê Văn C', role: 'RETAILER', status: 'DA_HUY' },
    ];

    return (
        <div className="p-8 space-y-8 bg-[#F4F5FA] min-h-screen">
            <h1 className="text-2xl font-extrabold text-slate-900">FRUITCHAIN DESIGN SYSTEM SHOWCASE (TASK 01)</h1>

            {/* SECTION 1: BUTTONS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase">1. Nút Bấm chuẩn (Buttons)</h3>
                <div className="flex flex-wrap gap-3">
                    <AppButton variant="green" leftIcon={<Plus className="w-4 h-4" />}>
                        Thêm tài khoản (Green)
                    </AppButton>
                    <AppButton variant="orange">Duyệt nhanh (Orange)</AppButton>
                    <AppButton variant="grey" leftIcon={<Download className="w-4 h-4" />}>
                        Xuất file (Grey)
                    </AppButton>
                    <AppButton variant="outline">Nút viền (Outline)</AppButton>
                </div>
            </div>

            {/* SECTION 2: BADGES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase">2. Thẻ trạng thái (Badges)</h3>
                <div className="flex flex-wrap gap-3">
                    <AppBadge status="DA_DUYET" label="Đã duyệt" />
                    <AppBadge status="DANG_XU_LY" label="Đang xử lý" />
                    <AppBadge status="DA_HUY" label="Đã hủy" />
                    <AppBadge status="CAN_BO_SUNG" label="Cần bổ sung" />
                    <AppBadge status="HET_HAN" label="Hết hạn" />
                    <AppBadge status="TAM_KHOA" label="Tạm khóa" />
                </div>
            </div>

            {/* SECTION 3: TABS & TABLE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase">3. Thanh Tab & Bảng Header Tím #F1F0FE</h3>
                <AppTabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} />
                <AppTable columns={columns} data={data} />
                <Pagination currentPage={1} totalPages={3} onPageChange={() => { }} />
            </div>

            {/* MODAL DEMO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase">4. Popup Modal</h3>
                <AppButton variant="green" onClick={() => setIsModalOpen(true)}>
                    Mở Popup Modal Demo
                </AppButton>
            </div>

            <AppModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="THÊM MỚI TÀI KHOẢN HỆ THỐNG"
                footer={
                    <>
                        <AppButton variant="grey" onClick={() => setIsModalOpen(false)}>
                            Hủy
                        </AppButton>

                        <AppButton variant="green" onClick={() => setIsModalOpen(false)}>
                            Lưu thay đổi
                        </AppButton>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Nội dung Form nhập liệu của Popup Modal tại đây...</p>
            </AppModal>
        </div>
    );
};
