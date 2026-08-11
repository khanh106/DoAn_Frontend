
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AppModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const AppModal: React.FC<AppModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'md',
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEscape);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const widthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col ${widthClasses[maxWidth]}`}>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>

                {/* Modal Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
