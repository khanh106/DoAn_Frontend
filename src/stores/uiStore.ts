import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    // Map quản lý trạng thái tải của các tác vụ chạy ngầm
    submittingOperations: Record<string, boolean>;
    setSubmittingOperation: (opName: string, isSubmitting: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    submittingOperations: {},
    setSubmittingOperation: (opName, isSubmitting) =>
        set((state) => ({
            submittingOperations: {
                ...state.submittingOperations,
                [opName]: isSubmitting,
            },
        })),
}));
