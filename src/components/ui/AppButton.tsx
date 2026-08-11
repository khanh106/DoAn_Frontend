
import React from 'react';
import { clsx } from 'clsx';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'green' | 'orange' | 'grey' | 'outline' | 'red';
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
    children,
    variant = 'green',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading,
    className,
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        green: 'bg-[#15803d] hover:bg-[#166534] text-white shadow-xs',
        orange: 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-xs',
        grey: 'bg-[#64748b] hover:bg-[#475569] text-white shadow-xs',
        outline: 'border border-slate-300 hover:bg-slate-100 text-slate-700 bg-white',
        red: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
        <button
            className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                leftIcon
            )}
            <span>{children}</span>
            {!isLoading && rightIcon}
        </button>
    );
};
