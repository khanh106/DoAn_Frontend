import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { AppButton } from '../ui/AppButton';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export const WalletConnect: React.FC = () => {
    const [account, setAccount] = useState<string | null>(null);

    const handleConnect = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts[0]) {
                    setAccount(accounts[0]);
                }
            } catch (err) {
                console.error("Wallet connection error:", err);
            }
        } else {
            alert('Vui lòng cài đặt MetaMask!');
        }
    };

    return (
        <div>
            {account ? (
                <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                    {account.slice(0, 6)}...{account.slice(-4)}
                </span>
            ) : (
                <AppButton variant="outline" size="sm" leftIcon={<Wallet className="w-4 h-4" />} onClick={handleConnect}>
                    Kết nối Ví
                </AppButton>
            )}
        </div>
    );
};
