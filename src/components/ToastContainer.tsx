import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastItem, type ToastType } from '../stores/toastStore';

const ICON_MAP: Record<ToastType, React.ComponentType<{ className?: string }>> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const STYLE_MAP: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
};

const ICON_STYLE_MAP: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-sky-500',
};

const SingleToast: React.FC<{ toast: ToastItem }> = ({ toast }) => {
    const removeToast = useToastStore((s) => s.removeToast);
    const Icon = ICON_MAP[toast.type];

    return (
        <div
            role="alert"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${STYLE_MAP[toast.type]}`}
        >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_STYLE_MAP[toast.type]}`} />
            <div className="flex-1 text-sm font-medium leading-snug break-words">
                {toast.message}
            </div>
            <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-2 shrink-0 rounded-md p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Đóng thông báo"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 sm:bottom-6 sm:right-6"
        >
            {toasts.map((t) => (
                <SingleToast key={t.id} toast={t} />
            ))}
        </div>
    );
};
