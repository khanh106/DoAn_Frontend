// src/components/layout/PageLayout.tsx
import React from 'react';

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, subtitle, actions, children }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
            <div>{children}</div>
        </div>
    );
};
