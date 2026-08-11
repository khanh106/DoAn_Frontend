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

    /**
     * Bật Popup MetaMask để người dùng (Hợp tác xã) ký và gửi giao dịch createBatch lên Blockchain
     */
    async signCreateBatchOnChain(
        contractAddress: string,
        batchId: string,
        batchCode: string,
        fruitType: string,
        metadataURI: string,
        dataHash: string
    ): Promise<string> {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('Không tìm thấy tiện ích ví MetaMask trên trình duyệt! Vui lòng cài đặt MetaMask.');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const abi = [
            "function createBatch(bytes32 batchId, bytes32 batchCode, bytes32 fruitType, string metadataURI, bytes32 dataHash) public"
        ];

        const contract = new ethers.Contract(contractAddress, abi, signer);

        const batchIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(batchId));
        const batchCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(batchCode));
        const fruitTypeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(fruitType));
        const dataHashBytes32 = dataHash.startsWith("0x") && dataHash.length === 66
            ? dataHash
            : ethers.keccak256(ethers.toUtf8Bytes(dataHash));

        // POPUP METAMASK BẬT LÊN TRÊN MÀN HÌNH NGHƯỜI DÙNG KÝ
        const tx = await contract.createBatch(
            batchIdBytes32,
            batchCodeBytes32,
            fruitTypeBytes32,
            metadataURI,
            dataHashBytes32
        );

        const receipt = await tx.wait();
        return receipt.hash || tx.hash;
    }
}

export const web3Service = new Web3Service();
