import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request Interceptor: Đính kèm Authorization Header
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Flag tránh lặp vô tận Refresh Token
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Bắt lỗi 401 & 403
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Bắt lỗi 401 Unauthorized -> Thử Refresh Token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const accessToken = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken || !accessToken) {
                isRefreshing = false;
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(`${BASE_URL}/v1/auth/refresh-token`, {
                    accessToken,
                    refreshToken,
                });

                const newAccessToken = res.data.accessToken;
                const newRefreshToken = res.data.refreshToken;

                localStorage.setItem('token', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                processQueue(null, newAccessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return apiClient(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr as AxiosError, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        // Bắt lỗi 403 Forbidden -> Không có quyền truy cập
        if (error.response?.status === 403) {
            console.error('Access Forbidden (403):', error.response.data);
        }

        return Promise.reject(error);
    }
);
