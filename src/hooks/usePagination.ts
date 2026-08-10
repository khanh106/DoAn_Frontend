// src/hooks/usePagination.ts
import { useState } from 'react';

export const usePagination = (totalItems: number, itemsPerPage: number = 10) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return {
        currentPage,
        totalPages,
        goToPage,
    };
};
