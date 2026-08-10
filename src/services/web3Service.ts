import { ethers } from 'ethers';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export class Web3Service {
    private provider: ethers.BrowserProvider | null = null;

    async init() {
        if (window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
        }
    }

    async getAccount(): Promise<string | null> {
        if (!this.provider) await this.init();
        if (!this.provider) return null;
        const signer = await this.provider.getSigner();
        return signer.getAddress();
    }
}

export const web3Service = new Web3Service();
