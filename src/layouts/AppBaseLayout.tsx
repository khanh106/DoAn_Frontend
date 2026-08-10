import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

interface AppBaseLayoutProps {
    role?: UserRole;
    portalTitle: string;
}

export const AppBaseLayout: React.FC<AppBaseLayoutProps> = ({ role, portalTitle }) => {
    const user = useAuthStore((state) => state.user);
    const activeRole: UserRole = user?.role || role || 'ADMIN';

    return (
        <div className="min-h-screen bg-[#F4F5FA] flex flex-col font-sans">
            <AppHeader portalTitle={portalTitle} />
            <div className="flex flex-1">
                <AppSidebar role={activeRole} />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
