import { useToastStore } from '../stores/toastStore';

export const toast = {
    success: (message: string, duration?: number) =>
        useToastStore.getState().success(message, duration),
    error: (message: string, duration?: number) =>
        useToastStore.getState().error(message, duration),
    warning: (message: string, duration?: number) =>
        useToastStore.getState().warning(message, duration),
    info: (message: string, duration?: number) =>
        useToastStore.getState().info(message, duration),
};
