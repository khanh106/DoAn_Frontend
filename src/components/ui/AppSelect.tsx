import React from 'react';

interface Option {
    label: string;
    value: string | number;
}

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
}

export const AppSelect: React.FC<AppSelectProps> = ({ label, options, error, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
            <select
                className={`px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${error ? 'border-red-500 focus:ring-red-500' : ''
                    } ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
    );
};
