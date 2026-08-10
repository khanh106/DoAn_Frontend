// src/layouts/AppBaseLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';
import { AppSidebar } from '../components/layout/AppSidebar';
import type { UserRole } from '../types';

interface AppBaseLayoutProps {
    role: UserRole;
    portalTitle: string;
}

export const AppBaseLayout: React.FC<AppBaseLayoutProps> = ({ role, portalTitle }) => {
    return (
        <div className="min-h-screen bg-[#F4F5FA] flex flex-col font-sans">
            <AppHeader portalTitle={portalTitle} />
            <div className="flex flex-1">
                <AppSidebar role={role} />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
