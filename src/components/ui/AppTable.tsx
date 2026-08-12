import React from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
    header: string;
    key: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (item: T, index: number) => React.ReactNode;
}

interface AppTableProps<T> {
    columns: Column<T>[];
    data: T[];
    showSTT?: boolean;
}

export function AppTable<T>({ columns, data, showSTT = true }: AppTableProps<T>) {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto min-h-[260px]">
                <table className="w-full text-left text-xs md:text-sm text-slate-800 border-collapse">
                    {/* HEADER CHUẨN MÀU TÍM NHẠT #F1F0FE NHƯ TRONG 7 ẢNH THỰC TẾ */}
                    <thead className="bg-[#F1F0FE] text-slate-900 font-bold border-b border-slate-200">
                        <tr>
                            {showSTT && <th className="px-4 py-3.5 text-center w-14">STT</th>}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width }}
                                    className={clsx(
                                        'px-4 py-3.5 font-bold whitespace-nowrap',
                                        col.align === 'center' && 'text-center',
                                        col.align === 'right' && 'text-right'
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                {showSTT && (
                                    <td className="px-4 py-3 text-center text-slate-500 font-medium">
                                        {index + 1}
                                    </td>
                                )}
                                {columns.map((col) => {
                                    const val = (item as Record<string, unknown>)[col.key];
                                    return (
                                        <td
                                            key={col.key}
                                            style={{ width: col.width }}
                                            className={clsx(
                                                'px-4 py-3 font-medium',
                                                col.align === 'center' && 'text-center',
                                                col.align === 'right' && 'text-right'
                                            )}
                                        >
                                            {col.render ? col.render(item, index) : (val as React.ReactNode)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
