// src/hooks/useContract.ts
import { useState, useEffect } from 'react';
import { web3Service } from '../services/web3Service';

export const useContract = () => {
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        web3Service.getAccount().then(setAccount);
    }, []);

    return { account };
};
