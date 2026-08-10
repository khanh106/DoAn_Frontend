export const uploadToIPFS = async (file: File): Promise<string> => {
    console.log("Tải file lên IPFS:", file.name);
    return `ipfs://QmDemoHash${Date.now()}`;
};
