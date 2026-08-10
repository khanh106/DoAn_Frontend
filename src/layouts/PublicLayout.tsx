import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';

export const PublicLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F4F5FA] flex flex-col font-sans">
            <AppHeader portalTitle="TRUY XUẤT NGUỒN GỐC SẢN PHẨM FRUITCHAIN" userName="Khách Hàng" userRole="Public Guest" />
            <main className="flex-1 p-6 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
