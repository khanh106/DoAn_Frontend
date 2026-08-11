// File: src/components/public/QrScannerModal.tsx
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner(
                'qr-reader-element',
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(
                (decodedText) => {
                    onScanSuccess(decodedText);
                    scanner.clear().catch(console.error);
                    onClose();
                },
                (_error) => {
                    // Bỏ qua các frame chưa nhận dạng được mã QR
                }
            );

            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [isOpen, onClose, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-100">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm uppercase">
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        Quét mã QR sản phẩm
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div id="qr-reader-element" className="w-full rounded-2xl overflow-hidden border border-slate-200"></div>

                <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                    Hướng camera vào mã QR trên tem nhãn để truy xuất dữ liệu thật
                </p>
            </div>
        </div>
    );
};
