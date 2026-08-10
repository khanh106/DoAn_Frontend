import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    return (
        <div className="flex items-center justify-center gap-1.5 py-4 bg-white border-t border-slate-200">
            {/* Nút Prev `<` */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Các nút số trang `[ 1 ] [ 2 ] [ 3 ]` */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all cursor-pointer ${isActive
                            ? 'bg-[#15803d] text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                    >
                        {page}
                    </button>
                );
            })}

            {/* Nút Next `>` */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};
