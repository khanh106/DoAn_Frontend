
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface TransactionBadgeProps {
    txHash: string;
    explorerUrl?: string;
}

export const TransactionBadge: React.FC<TransactionBadgeProps> = ({
    txHash,
    explorerUrl = 'https://etherscan.io/tx/',
}) => {
    const shortenedHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

    return (
        <a
            href={`${explorerUrl}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-mono font-bold hover:bg-purple-100 transition-colors"
        >
            <span>{shortenedHash}</span>
            <ExternalLink className="w-3 h-3" />
        </a>
    );
};
