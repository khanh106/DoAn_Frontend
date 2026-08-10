// src/config/constants.ts

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me',
    },
    ADMIN: {
        USERS: '/admin/users',
        ROLES: '/admin/roles',
    },
    BATCH: {
        BASE: '/batch',
        PLANTING: '/batch/planting',
    },
    FARM: '/farm-area',
    PRODUCT: '/product',
    FRUIT_TYPE: '/fruit-type',
    CULTIVATION_LOG: '/cultivation-log',
    HARVEST: '/harvest',
    PROCESSOR_RECEIVE: '/processor/batch-receive',
    PROCESSOR_PROCESSING: '/processor/batch-processing',
    INSPECTION: '/inspection',
    PACKAGING: '/packaging',
    SHIPMENT: '/shipment',
    RETAILER: '/retailer',
    QR_CODE: '/qr-code',
    PUBLIC_TRACE: '/public/traceability',
};

export const CONTRACT_CONFIG = {
    RPC_URL: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
    TRACEABILITY_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
};
