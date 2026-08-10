
import React from 'react';

export interface TabItem {
    id: string;
    label: string;
    count?: number;
    icon?: React.ReactNode;
}

interface AppTabsProps {
    tabs: TabItem[];
    activeTabId: string;
    onTabChange: (id: string) => void;
}

export const AppTabs: React.FC<AppTabsProps> = ({ tabs, activeTabId, onTabChange }) => {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${isActive
                            ? 'bg-[#15803d] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span
                                className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
