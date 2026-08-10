import React from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { RotateCw, AlertTriangle, TrendingUp } from 'lucide-react';

export const CooperativeDashboardPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F4F5FA] flex flex-col font-sans">
            <AppHeader
                portalTitle="HỢP TÁC XÃ NÔNG NGHIỆP HOÀNG SƠN"
                userName="Lê Trường Sinh"
                userRole="Chủ đơn vị (HTX)"
            />

            <div className="flex flex-1">
                <AppSidebar role="COOPERATIVE" />

                <main className="flex-1 p-6 space-y-6">
                    {/* Header Màn hình Tổng Quan */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Bảng Điều Khiển Tổng Quan</h2>
                        <button className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                            <RotateCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 4 Stat Cards Top Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <span className="text-xs font-semibold text-slate-500">Sản Phẩm Đang Trồng</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-slate-900">5 Loại</span>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <span className="text-xs font-semibold text-slate-500">Lô Phân Công Mới</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-slate-900">8 Lô</span>
                            </div>
                            <p className="text-[11px] text-slate-400">Tóm hôm nay</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <span className="text-xs font-semibold text-slate-500">Lượng Thu Hoạch Sắp Đến</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-green-700">12 tấn</span>
                            </div>
                            <p className="text-[11px] text-slate-400">in 2 tuần</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative">
                            <span className="text-xs font-semibold text-slate-500">Vấn Đề Ghi Nhận</span>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-extrabold text-red-600">2</span>
                                <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                                    <AlertTriangle className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 2: 2 Biểu Đồ Thống Kê (Bar Chart & Pie Chart) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Biểu đồ cột */}
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">
                                Báo Cáo Hoạt Động Theo Vùng
                            </h3>
                            <div className="h-48 flex items-end justify-between gap-6 px-6 pt-4 border-b border-slate-200">
                                <div className="w-12 bg-green-800 rounded-t-sm h-32"></div>
                                <div className="w-12 bg-green-600 rounded-t-sm h-40"></div>
                                <div className="w-12 bg-green-700 rounded-t-sm h-28"></div>
                                <div className="w-12 bg-green-600 rounded-t-sm h-44"></div>
                                <div className="w-12 bg-green-500 rounded-t-sm h-20"></div>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 mt-2 px-2">
                                <span>Vùng 1</span>
                                <span>Vùng 2</span>
                                <span>Vùng 3</span>
                                <span>Vùng 4</span>
                                <span>Vùng 5</span>
                            </div>
                        </div>

                        {/* Biểu đồ tròn */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                            <h3 className="text-sm font-bold text-slate-900">
                                Trạng Thái Quy Trình Nông Nghiệp
                            </h3>
                            <div className="w-36 h-36 rounded-full border-12 border-green-600 border-t-orange-500 border-r-green-800 mx-auto my-2"></div>
                            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600 font-semibold">
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 bg-green-800 rounded-full" /> Đúng tiến độ
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full" /> Chậm
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 bg-green-600 rounded-full" /> Đã hoàn thành
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 3: Bản Đồ Nông Trại */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Bản Đồ Nông Trại</h3>
                        <div className="h-44 bg-emerald-100 rounded-xl border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs relative overflow-hidden">
                            <div className="absolute left-6 top-6 bg-emerald-300/60 p-4 rounded-xl">Zone A</div>
                            <div className="absolute right-12 bottom-4 bg-emerald-200/60 p-4 rounded-xl">Zone B</div>
                            <span>[ Sơ Đồ Phân Vùng Canh Tác Hợp Tác Xã ]</span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
