import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastState {
    toasts: ToastItem[];
    addToast: (message: string, type?: ToastType, duration?: number) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
    // shorthands
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
}

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],

    addToast: (message, type = 'info', duration = 3500) => {
        const id =
            Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
        }));
        if (duration > 0) {
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }
        return id;
    },

    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },

    clearAll: () => set({ toasts: [] }),

    success: (message, duration) => get().addToast(message, 'success', duration),
    error: (message, duration) => get().addToast(message, 'error', duration ?? 5000),
    warning: (message, duration) => get().addToast(message, 'warning', duration),
    info: (message, duration) => get().addToast(message, 'info', duration),
}));
