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
            <style>{`
                #qr-reader-element {
                    border: none !important;
                    background: #f8fafc !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                }
                #qr-reader-element__dashboard {
                    padding: 12px !important;
                    background: #f8fafc !important;
                    box-sizing: border-box !important;
                }
                #qr-reader-element__camera_permission_button {
                    background: #059669 !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 8px !important;
                    font-weight: bold !important;
                    font-size: 13px !important;
                    cursor: pointer !important;
                }
                #qr-reader-element__dashboard_section_swaplink {
                    color: #059669 !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                }
                #qr-reader-element select {
                    padding: 6px 10px !important;
                    border-radius: 8px !important;
                    border: 1px solid #cbd5e1 !important;
                    font-size: 12px !important;
                    outline: none !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                }
                #qr-reader-element video {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 12px !important;
                    object-fit: cover !important;
                }
                #qr-reader-element img {
                    max-width: 100% !important;
                    height: auto !important;
                }
                #qr-reader-element__scan_region {
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                }
            `}</style>
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
