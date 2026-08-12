import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Package,
    Droplets,
    Sprout,
    Boxes,
    Building2,
    RefreshCw,
    Plus,
    Trash2,
    Search,
    AlertCircle,
    CheckCircle2,
    X,
    Filter,
    Trees,
    Wallet,
    ShieldCheck,
    Key,
    Copy,
    Check,
    ExternalLink,
    FileSignature,
    Cpu,
    Layers,
    Lock,
    Send,
    Activity,
    UserCheck,
    Eye,
    EyeOff,
    Store,
    Link2,
} from 'lucide-react';
import { AppTable, type Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { useAuthStore } from '../../stores/authStore';
import { AppButton } from '../../components/ui/AppButton';
import { authService } from '../../services/authService';
import {
    processorService,
    type FruitTypeDto,
    type ProductDto,
    type MaterialItemDto,
    type SearchWorkerResultDto,
    type DistributorDto,
    type SearchRetailerResultDto,
} from '../../services/processorService';

type TabType = 'workers' | 'fruitTypes' | 'products' | 'pesticides' | 'fertilizers' | 'materials' | 'distributors' | 'wallet';

export const CooperativeSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('workers');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Data States từ Backend API thực tế
    const [workers, setWorkers] = useState<SearchWorkerResultDto[]>([]);
    const [searchWorkerKeyword, setSearchWorkerKeyword] = useState<string>('');

    const [fruitTypes, setFruitTypes] = useState<FruitTypeDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);

    const [materials, setMaterials] = useState<MaterialItemDto[]>([]);
    const [distributors, setDistributors] = useState<DistributorDto[]>([]);

    // Modal States - Giống cây mới
    const [showFruitTypeModal, setShowFruitTypeModal] = useState<boolean>(false);
    const [fruitTypeFormData, setFruitTypeFormData] = useState<{ code: string; name: string; description: string }>({
        code: '',
        name: '',
        description: '',
    });

    // Modal States - Sản phẩm đóng gói mới
    const [showProductModal, setShowProductModal] = useState<boolean>(false);
    const [productFormData, setProductFormData] = useState<{
        name: string;
        shortName: string;
        fruitTypeId: string;
        groupName: string;
        variety: string;
        description: string;
    }>({
        name: '',
        shortName: '',
        fruitTypeId: '',
        groupName: 'Trái cây tươi đóng gói',
        variety: '',
        description: '',
    });

    // Modal States - Vật tư
    const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
    const [materialModalType, setMaterialModalType] = useState<'PESTICIDE' | 'FERTILIZER' | 'MATERIAL'>('PESTICIDE');
    const [materialFormData, setMaterialFormData] = useState<Partial<MaterialItemDto>>({
        code: '',
        name: '',
        unit: 'kg',
        price: 0,
        dosagePerHa: 0,
        concentration: '',
        supplier: '',
        npkRatio: '',
        quantityInStock: 0,
        note: '',
    });

    // Modal States - Nhà phân phối
    const [showDistributorModal, setShowDistributorModal] = useState<boolean>(false);
    const [distributorFormData, setDistributorFormData] = useState<Partial<DistributorDto>>({
        code: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        taxCode: '',
    });

    // Search & Link Retailer States
    const [searchRetailerKeyword, setSearchRetailerKeyword] = useState<string>('');
    const [systemRetailers, setSystemRetailers] = useState<SearchRetailerResultDto[]>([]);
    const [searchingRetailers, setSearchingRetailers] = useState<boolean>(false);
    const [showSearchRetailerModal, setShowSearchRetailerModal] = useState<boolean>(false);
    const [linkingRetailerId, setLinkingRetailerId] = useState<string | null>(null);

    const { user, updateUser } = useAuthStore();

    // Blockchain / Wallet States
    const [connectedAccount, setConnectedAccount] = useState<string | null>(user?.walletAddress || null);
    const [walletPrivateKey, setWalletPrivateKey] = useState<string>('');
    const [chainId, setChainId] = useState<string | null>(null);
    const [networkName, setNetworkName] = useState<string>('Sepolia Testnet / Hardhat Node');
    const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
    const [isSavingWallet, setIsSavingWallet] = useState<boolean>(false);
    const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
    const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
    const [walletMsg, setWalletMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    interface SignedTxLog {
        id: string;
        txHash: string;
        actionName: string;
        targetId: string;
        metadataUri: string;
        dataHash: string;
        contractAddress: string;
        signerAddress: string;
        timestamp: string;
        status: 'SUCCESS' | 'PENDING';
    }

    const [signedTxLogs, setSignedTxLogs] = useState<SignedTxLog[]>([]);

    // Kiểm tra kết nối MetaMask tự động
    useEffect(() => {
        if (user?.walletAddress && !connectedAccount) {
            setConnectedAccount(user.walletAddress);
        }
        if (typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accs: string[]) => {
                    if (accs && accs.length > 0 && !connectedAccount) {
                        setConnectedAccount(accs[0]);
                    }
                })
                .catch(() => { });

            window.ethereum.request({ method: 'eth_chainId' })
                .then((cId: string) => {
                    setChainId(cId);
                    if (cId === '0xaa36a7') setNetworkName('Ethereum Sepolia Testnet');
                    else if (cId === '0x539' || cId === '0x13881') setNetworkName('Hardhat Local Network (1337)');
                    else if (cId === '0x13882' || cId === '0x80002') setNetworkName('Polygon Amoy Testnet');
                    else setNetworkName(`Chain ID: ${parseInt(cId, 16)}`);
                })
                .catch(() => { });
        }
    }, [user?.walletAddress]);

    // Kết nối ví MetaMask & Ký xác thực lấy Key tự động
    const handleConnectMetaMask = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setError('Không tìm thấy tiện ích ví MetaMask trên trình duyệt! Vui lòng cài đặt MetaMask.');
            return;
        }
        setIsConnectingWallet(true);
        setError(null);
        setSuccessMsg(null);
        try {
            // 1. Yêu cầu MetaMask mở cửa sổ chọn địa chỉ ví
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts[0]) {
                const walletAddr = accounts[0];
                setConnectedAccount(walletAddr);

                // Lấy thông tin Mạng Blockchain đang kết nối
                const cId = await window.ethereum.request({ method: 'eth_chainId' });
                setChainId(cId);
                if (cId === '0xaa36a7') setNetworkName('Ethereum Sepolia Testnet');
                else if (cId === '0x539' || cId === '0x13881') setNetworkName('Hardhat Local Network (1337)');
                else if (cId === '0x13882' || cId === '0x80002') setNetworkName('Polygon Amoy Testnet');
                else setNetworkName(`Chain ID: ${parseInt(cId, 16)}`);

                // 2. Tạo nội dung thông điệp để bật cửa sổ ký MetaMask
                const messageText = `Xác nhận liên kết ví và cấp quyền ký Smart Contract tự động cho Hợp tác xã.\nĐịa chỉ ví: ${walletAddr}\nThời gian: ${new Date().toLocaleString('vi-VN')}`;

                // Chuyển UTF-8 sang Hex string theo chuẩn personal_sign
                const hexMessage = '0x' + Array.from(new TextEncoder().encode(messageText))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                // 3. BẬT POPUP METAMASK ĐỂ NGHƯỜI DÙNG KÝ LẤY KEY
                const signature = await window.ethereum.request({
                    method: 'personal_sign',
                    params: [hexMessage, walletAddr],
                });

                // 4. Lưu ví vào Backend (chỉ lưu Địa chỉ Ví, KHÔNG truyền signature làm PrivateKey)
                await authService.updateWalletAddress(walletAddr);
                updateUser({ walletAddress: walletAddr });


                setSuccessMsg(`🎉 Kết nối & Ký xác thực MetaMask thành công cho Hợp tác xã! (Ví: ${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)})`);
                setTimeout(() => setSuccessMsg(null), 5000);
            }
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Thao tác kết nối hoặc ký xác thực với MetaMask bị hủy.');
        } finally {
            setIsConnectingWallet(false);
        }
    };


    const handleCopyWalletAddress = () => {
        const addr = connectedAccount || user?.walletAddress;
        if (addr) {
            navigator.clipboard.writeText(addr);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const handleSaveWalletInfo = async () => {
        setWalletMsg(null);
        const targetAddress = connectedAccount || user?.walletAddress;
        if (!targetAddress || !targetAddress.trim()) {
            const msg = 'Vui lòng nhập hoặc kết nối Địa chỉ Ví Hợp tác xã trước khi lưu.';
            setError(msg);
            setWalletMsg({ type: 'error', text: msg });
            return;
        }

        if (!walletPrivateKey.trim()) {
            const msg = 'Vui lòng nhập Khóa riêng (Private Key) của ví Hợp tác xã (64 ký tự Hex).';
            setError(msg);
            setWalletMsg({ type: 'error', text: msg });
            return;
        }

        let cleanKey = walletPrivateKey.trim();
        if (cleanKey.startsWith('0x') || cleanKey.startsWith('0X')) {
            cleanKey = cleanKey.slice(2);
        }

        if (cleanKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
            const msg = `Khóa Private Key không hợp lệ! Độ dài phải đúng 64 ký tự Hex (32 bytes). Bạn đã nhập ${cleanKey.length}/64 ký tự.`;
            setError(msg);
            setWalletMsg({ type: 'error', text: msg });
            return;
        }

        setIsSavingWallet(true);
        setError(null);
        setSuccessMsg(null);
        try {
            await authService.updateWalletAddress(targetAddress, walletPrivateKey.trim());
            updateUser({ walletAddress: targetAddress });
            setWalletPrivateKey('');
            const msg = '🎉 Đã lưu & mã hóa Khóa riêng (Private Key) ví Hợp tác xã thành công vào hệ thống!';
            setSuccessMsg(msg);
            setWalletMsg({ type: 'success', text: msg });
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin khóa ví. Vui lòng kiểm tra lại.';
            setError(msg);
            setWalletMsg({ type: 'error', text: msg });
        } finally {
            setIsSavingWallet(false);
        }
    };

    // Tải dữ liệu thực tế từ 100% Backend APIs
    const loadAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [workerRes, ftRes, pRes, matRes, distRes] = await Promise.allSettled([
                processorService.searchWorkers(searchWorkerKeyword),
                processorService.getFruitTypes(),
                processorService.getProducts(),
                processorService.getMaterials(),
                processorService.getDistributors(),
            ]);

            if (workerRes.status === 'fulfilled') setWorkers(workerRes.value);
            if (ftRes.status === 'fulfilled') setFruitTypes(ftRes.value);
            if (pRes.status === 'fulfilled') setProducts(pRes.value);
            if (matRes.status === 'fulfilled') setMaterials(matRes.value);
            if (distRes.status === 'fulfilled') setDistributors(distRes.value);
        } catch (err) {
            console.error('Lỗi lấy dữ liệu từ Backend:', err);
            setError('Không thể kết nối đến Backend API để lấy danh mục.');
        } finally {
            setLoading(false);
        }
    }, [searchWorkerKeyword]);

    useEffect(() => {
        void loadAllData();
    }, [loadAllData]);

    const handleSearchWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await processorService.searchWorkers(searchWorkerKeyword);
            setWorkers(data);
        } catch (err) {
            console.error(err);
            setError('Không tìm thấy thông tin nhân công.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchRetailers = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSearchingRetailers(true);
        try {
            const data = await processorService.searchRetailers(searchRetailerKeyword);
            setSystemRetailers(data);
        } catch (err) {
            console.error(err);
            setError('Không thể tìm kiếm danh sách siêu thị.');
        } finally {
            setSearchingRetailers(false);
        }
    };

    const handleLinkRetailer = async (retailerId: string) => {
        setLinkingRetailerId(retailerId);
        try {
            await processorService.linkRetailer(retailerId);
            setSuccessMsg('🎉 Liên kết Siêu thị vào danh sách Đối tác Nhà phân phối thành công!');
            setTimeout(() => setSuccessMsg(null), 4000);
            void loadAllData();
            void handleSearchRetailers();
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.message || err?.message || 'Liên kết Siêu thị thất bại.';
            setError(msg);
        } finally {
            setLinkingRetailerId(null);
        }
    };

    const handleInviteWorker = async (workerId: string) => {
        try {
            await processorService.sendWorkerInvitation(workerId);
            setSuccessMsg('Đã gửi lời mời liên kết tới nhân công thành công!');
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Gửi lời mời liên kết thất bại.');
        }
    };

    // Thêm mới Giống Cây
    const handleSaveFruitType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fruitTypeFormData.name || !fruitTypeFormData.code) {
            setError('Vui lòng nhập đầy đủ Mã viết tắt và Tên giống cây!');
            return;
        }
        try {
            await processorService.createFruitType({
                name: fruitTypeFormData.name.trim(),
                code: fruitTypeFormData.code.trim().toUpperCase(),
                description: fruitTypeFormData.description?.trim(),
            });
            setSuccessMsg('Thêm giống cây trồng mới vào Database thành công!');
            setShowFruitTypeModal(false);
            setFruitTypeFormData({ code: '', name: '', description: '' });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Thêm mới giống cây vào Backend thất bại. Mã giống cây có thể đã tồn tại.');
        }
    };

    // Thêm mới Sản phẩm thương mại / Đóng gói
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productFormData.name) {
            setError('Vui lòng nhập Tên sản phẩm!');
            return;
        }
        if (!productFormData.fruitTypeId) {
            setError('Vui lòng chọn Giống cây trồng nguyên liệu! (Nếu chưa có Giống cây, hãy qua tab "Giống cây" để tạo trước).');
            return;
        }
        try {
            const nameTrimmed = productFormData.name.trim();
            await processorService.createProduct({
                name: nameTrimmed,
                shortName: productFormData.shortName?.trim() || nameTrimmed,
                fruitTypeId: productFormData.fruitTypeId,
                groupName: productFormData.groupName?.trim() || 'Trái cây tươi đóng gói',
                productType: 'FRESH', // Bổ sung trường loại sản phẩm mặc định
                variety: productFormData.variety?.trim() || 'Chuẩn',
                description: productFormData.description?.trim() || '',
            });

            setSuccessMsg('Thêm mới Sản phẩm thương mại thành công!');
            setShowProductModal(false);
            setProductFormData({
                name: '',
                shortName: '',
                fruitTypeId: '',
                groupName: 'Trái cây tươi đóng gói',
                variety: '',
                description: '',
            });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Không thể tạo sản phẩm mới trên Backend.');
        }
    };

    const handleSaveMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialFormData.name || !materialFormData.code) {
            setError('Vui lòng điền đầy đủ Mã và Tên vật tư!');
            return;
        }
        try {
            await processorService.createMaterial({
                ...materialFormData,
                itemType: materialModalType,
            });
            setSuccessMsg(`Thêm mới thành công vào Database Backend!`);
            setShowMaterialModal(false);
            setMaterialFormData({ code: '', name: '', unit: 'kg', price: 0, dosagePerHa: 0, concentration: '', supplier: '', npkRatio: '', quantityInStock: 0, note: '' });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Không thể tạo vật tư mới trong Backend.');
        }
    };

    const handleDeleteMaterial = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mục này khỏi Cơ sở dữ liệu?')) return;
        try {
            await processorService.deleteMaterial(id);
            setSuccessMsg('Đã xóa dữ liệu thành công khỏi Backend.');
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Xóa thất bại từ Backend.');
        }
    };

    const handleSaveDistributor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!distributorFormData.name || !distributorFormData.code) {
            setError('Vui lòng nhập đầy đủ Mã và Tên nhà phân phối!');
            return;
        }
        try {
            await processorService.createDistributor(distributorFormData);
            setSuccessMsg('Lưu thông tin Nhà phân phối mới vào Database thành công!');
            setShowDistributorModal(false);
            setDistributorFormData({ code: '', name: '', phone: '', email: '', address: '', taxCode: '' });
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Lưu Nhà phân phối vào Backend thất bại.');
        }
    };

    const handleDeleteDistributor = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Nhà phân phối này khỏi Database Backend?')) return;
        try {
            await processorService.deleteDistributor(id);
            setSuccessMsg('Đã xóa Nhà phân phối thành công.');
            setTimeout(() => setSuccessMsg(null), 3000);
            void loadAllData();
        } catch (err) {
            console.error(err);
            setError('Xóa Nhà phân phối thất bại.');
        }
    };

    // Phân loại vật tư theo từng sub-tab
    const pesticides = materials.filter((m) => m.itemType === 'PESTICIDE');
    const fertilizers = materials.filter((m) => m.itemType === 'FERTILIZER');
    const rawMaterials = materials.filter((m) => m.itemType === 'MATERIAL' || m.itemType === 'EQUIPMENT');

    // Cột bảng Nhân công
    const workerColumns: Column<SearchWorkerResultDto>[] = [
        { header: 'Họ và Tên', key: 'fullName' },
        { header: 'Email', key: 'email' },
        { header: 'Số Điện Thoại', key: 'phone' },
        {
            header: 'Ví Blockchain',
            key: 'walletAddress',
            render: (w) => (
                <span className="font-mono text-xs text-slate-500 truncate max-w-[120px] block">
                    {w.walletAddress ? `${w.walletAddress.slice(0, 6)}...${w.walletAddress.slice(-4)}` : 'Chưa cập nhật'}
                </span>
            ),
        },
        {
            header: 'Trạng Thái Liên Kết',
            key: 'linkStatus',
            render: (w) => {
                const statusMap: Record<string, { label: string; style: string }> = {
                    ACCEPTED: { label: 'Đã liên kết', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    PENDING: { label: 'Đang chờ xác nhận', style: 'bg-amber-100 text-amber-800 border-amber-300' },
                    REJECTED: { label: 'Từ chối', style: 'bg-red-100 text-red-800 border-red-300' },
                    NONE: { label: 'Chưa liên kết', style: 'bg-slate-100 text-slate-700 border-slate-300' },
                };
                const st = statusMap[w.linkStatus] || statusMap.NONE;
                return <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${st.style}`}>{st.label}</span>;
            },
        },
        {
            header: 'Thao Tác',
            key: 'actions',
            align: 'center',
            render: (w) => (
                w.linkStatus === 'NONE' || w.linkStatus === 'REJECTED' ? (
                    <button
                        onClick={() => handleInviteWorker(w.workerId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors text-white ${w.linkStatus === 'REJECTED'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-[#15803d] hover:bg-green-800'
                            }`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{w.linkStatus === 'REJECTED' ? 'Gửi lại lời mời' : 'Mời liên kết'}</span>
                    </button>
                ) : (
                    <span className="text-xs text-slate-400 font-medium">--</span>
                )
            ),

        },
    ];

    // Cột bảng Trái cây / Giống cây
    const fruitColumns: Column<FruitTypeDto>[] = [
        { header: 'Mã Viết Tắt (Prefix)', key: 'code' },
        { header: 'Tên Giống Cây Trồng', key: 'name' },
        { header: 'Mô Tả Ghi Chú', key: 'description' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    // Cột bảng Sản phẩm
    const productColumns: Column<ProductDto>[] = [
        { header: 'Tên Sản Phẩm', key: 'name' },
        { header: 'Mã / Tên Tắt', key: 'shortName' },
        { header: 'Chủng Loại / Giống', key: 'variety' },
        { header: 'Nhóm Sản Phẩm', key: 'groupName' },
        {
            header: 'Trạng Thái',
            key: 'status',
            render: (item) => <AppBadge status={item.status || 'ACTIVE'} label={item.status || 'Đang hoạt động'} />,
        },
    ];

    // Cột bảng Nông dược
    const pesticideColumns: Column<MaterialItemDto>[] = [
        { header: 'Mã Nông Dược', key: 'code' },
        { header: 'Tên Nông Dược', key: 'name' },
        { header: 'Nồng Độ / Hàm Lượng', key: 'concentration', render: (m) => m.concentration || '-' },
        { header: 'Liều Lượng / Ha', key: 'dosagePerHa', render: (m) => (m.dosagePerHa ? `${m.dosagePerHa} ${m.unit}/ha` : '-') },
        { header: 'Đơn Vị', key: 'unit' },
        { header: 'Đơn Giá (VNĐ)', key: 'price', render: (m) => (m.price ? m.price.toLocaleString('vi-VN') : '0') },
        { header: 'Nhà Cung Cấp', key: 'supplier', render: (m) => m.supplier || '-' },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (m) => (
                <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Cột bảng Phân bón
    const fertilizerColumns: Column<MaterialItemDto>[] = [
        { header: 'Mã Phân Bón', key: 'code' },
        { header: 'Tên Phân Bón', key: 'name' },
        { header: 'Tỷ Lệ NPK', key: 'npkRatio', render: (m) => m.npkRatio || '-' },
        { header: 'Liều Lượng Bón / Ha', key: 'dosagePerHa', render: (m) => (m.dosagePerHa ? `${m.dosagePerHa} ${m.unit}/ha` : '-') },
        { header: 'Đơn Vị Tính', key: 'unit' },
        { header: 'Giá Thành (VNĐ)', key: 'price', render: (m) => (m.price ? m.price.toLocaleString('vi-VN') : '0') },
        { header: 'Nhà Cung Cấp', key: 'supplier', render: (m) => m.supplier || '-' },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (m) => (
                <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Cột bảng Nguyên vật liệu
    const materialColumns: Column<MaterialItemDto>[] = [
        { header: 'Mã Nguyên Liệu', key: 'code' },
        { header: 'Tên Vật Tư / Nguyên Liệu', key: 'name' },
        { header: 'Đơn Vị', key: 'unit' },
        { header: 'Đơn Giá (VNĐ)', key: 'price', render: (m) => (m.price ? m.price.toLocaleString('vi-VN') : '0') },
        { header: 'Tồn Kho Bán Đầu', key: 'quantityInStock', render: (m) => `${m.quantityInStock || 0} ${m.unit}` },
        { header: 'Ghi Chú', key: 'note', render: (m) => m.note || '-' },
        {
            header: 'Thao Tác',
            key: 'action',
            align: 'center',
            render: (m) => (
                <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    // Cột bảng Nhà phân phối
    const distributorColumns: Column<DistributorDto>[] = [
        { header: 'Mã NPP', key: 'code', width: '100px', align: 'center' },
        { header: 'Tên Nhà Phân Phối / Đối Tác', key: 'name', width: '220px' },
        {
            header: 'Nguồn Gốc',
            key: 'retailerId',
            width: '150px',
            align: 'center',
            render: (d) => (
                d.retailerId ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                        <Store className="w-3.5 h-3.5 text-blue-600" />
                        Siêu thị hệ thống
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                        Thủ công
                    </span>
                )
            ),
        },
        { header: 'Số Điện Thoại', key: 'phone', width: '120px', align: 'center' },
        { header: 'Email Liên Hệ', key: 'email', width: '180px', render: (d) => d.email || '-' },
        { header: 'Địa Chỉ Trụ Sở', key: 'address', width: '240px' },
        { header: 'Mã Số Thuế', key: 'taxCode', width: '110px', align: 'center', render: (d) => d.taxCode || '-' },
        {
            header: 'Trạng Thái',
            key: 'status',
            width: '130px',
            align: 'center',
            render: (d) => (
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                    {d.status === 'ACTIVE' ? 'Đang hợp tác' : 'Ngưng hợp tác'}
                </span>
            ),
        },
        {
            header: 'Thao Tác',
            key: 'action',
            width: '80px',
            align: 'center',
            render: (d) => (
                <button
                    onClick={() => handleDeleteDistributor(d.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Xóa nhà phân phối"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];


    // Cột bảng Nhật ký Ký Smart Contract (DuLieu.md Chương 34.13)
    const walletTxColumns: Column<SignedTxLog>[] = [
        {
            header: 'Mã Giao Dịch (TxHash)',
            key: 'txHash',
            render: (log) => (
                <div className="flex items-center gap-1">
                    <span className="font-mono text-xs font-bold text-blue-600">
                        {log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}
                    </span>
                    <button
                        onClick={() => navigator.clipboard.writeText(log.txHash)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title="Sao chép TxHash"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </div>
            ),
        },
        { header: 'Contract API Function', key: 'actionName' },
        {
            header: 'Mã Lô / SubBatch',
            key: 'targetId',
            render: (log) => <span className="font-mono text-xs font-bold text-emerald-700">{log.targetId}</span>,
        },
        {
            header: 'DataHash (IPFS Hash)',
            key: 'dataHash',
            render: (log) => (
                <span className="font-mono text-xs text-slate-500 truncate max-w-[120px] block" title={log.dataHash}>
                    {log.dataHash ? `${log.dataHash.slice(0, 8)}...${log.dataHash.slice(-6)}` : '-'}
                </span>
            ),
        },
        {
            header: 'Địa Chỉ Ví Ký (Actor Wallet)',
            key: 'signerAddress',
            render: (log) => <span className="font-mono text-xs text-slate-500">{log.signerAddress.slice(0, 6)}...{log.signerAddress.slice(-4)}</span>,
        },
        { header: 'Thời Gian Ký', key: 'timestamp' },
        {
            header: 'Trạng Thái On-Chain',
            key: 'status',
            align: 'center',
            render: () => <AppBadge status="ACTIVE" label="ON-CHAIN VERIFIED" />,
        },
    ];

    const tabNavigation = [
        { id: 'workers', label: 'Nhân Công', icon: Users, count: workers.length },
        { id: 'fruitTypes', label: 'Giống Cây', icon: Trees, count: fruitTypes.length },
        { id: 'products', label: 'Sản Phẩm', icon: Package, count: products.length },
        { id: 'pesticides', label: 'Nông Dược', icon: Droplets, count: pesticides.length },
        { id: 'fertilizers', label: 'Phân Bón', icon: Sprout, count: fertilizers.length },
        { id: 'materials', label: 'Nguyên Vật Liệu', icon: Boxes, count: rawMaterials.length },
        { id: 'distributors', label: 'Nhà Phân Phối', icon: Building2, count: distributors.length },
        { id: 'wallet', label: 'Ví Chuỗi Khối', icon: Wallet, count: (user?.walletAddress || connectedAccount) ? 'Đã liên kết' : 'Chưa liên kết' },
    ];

    return (
        <div className="space-y-6">
            {/* Header Trang */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span>Thiết Lập Danh Mục & Ví Chuỗi Khối HTX</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        Quản lý lưu trữ Database Backend cho Nhân công, Giống cây, Sản phẩm, Vật tư, Đối tác và Liên kết Ví MetaMask Ký Smart Contract.
                    </p>
                </div>
                <button
                    onClick={loadAllData}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer w-fit"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Làm mới dữ liệu</span>
                </button>
            </div>

            {/* Thông báo Lỗi & Thành công */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>⚠️ {error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>✅ {successMsg}</span>
                </div>
            )}

            {/* Thanh Tab Chuyển Đổi Các Trang Con */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-2 overflow-x-auto">
                {tabNavigation.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                                ? 'bg-[#15803d] text-white shadow-md shadow-green-700/20'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: NHÂN CÔNG */}
            {activeTab === 'workers' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                                <span>Danh Sách Nhân Công & Nông Dân Liên Kết ({workers.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm từ Database backend để mời liên kết vào Hợp tác xã.</p>
                        </div>

                        <form onSubmit={handleSearchWorker} className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, SĐT, email..."
                                    value={searchWorkerKeyword}
                                    onChange={(e) => setSearchWorkerKeyword(e.target.value)}
                                    className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-3.5 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Tìm kiếm</span>
                            </button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải thông tin nhân công...</div>
                    ) : workers.length > 0 ? (
                        <AppTable columns={workerColumns} data={workers} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Không tìm thấy nhân công nào trong hệ thống.</div>
                    )}
                </div>
            )}

            {/* TAB 2: GIỐNG CÂY TRỒNG */}
            {activeTab === 'fruitTypes' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Trees className="w-5 h-5 text-emerald-600" />
                                <span>Danh Mục Giống Cây Trồng / Loại Trái Cây ({fruitTypes.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý các giống cây trồng/loại hoa quả được canh tác tại Hợp tác xã (lưu tại bảng FruitTypes).</p>
                        </div>
                        <button
                            onClick={() => {
                                setFruitTypeFormData({ code: '', name: '', description: '' });
                                setShowFruitTypeModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Giống Cây Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh mục giống cây...</div>
                    ) : fruitTypes.length > 0 ? (
                        <AppTable columns={fruitColumns} data={fruitTypes} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có giống cây nào trong Database. Hãy bấm nút "Thêm Giống Cây Mới".</div>
                    )}
                </div>
            )}

            {/* TAB 3: SẢN PHẨM ĐÓNG GÓI / THƯƠNG MẠI */}
            {activeTab === 'products' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                <span>Danh Mục Sản Phẩm Đóng Gói / Thương Mại ({products.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý các sản phẩm chế biến/đóng gói hoàn thiện đưa ra thị trường (bảng Products).</p>
                        </div>
                        <button
                            onClick={() => {
                                setProductFormData({
                                    name: '',
                                    shortName: '',
                                    fruitTypeId: fruitTypes[0]?.id || '',
                                    groupName: 'Trái cây tươi đóng gói',
                                    variety: 'Hạng A',
                                    description: '',
                                });
                                setShowProductModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Sản Phẩm Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-8 text-center text-slate-500 text-sm">Đang tải danh sách sản phẩm...</div>
                    ) : products.length > 0 ? (
                        <AppTable columns={productColumns} data={products} showSTT={true} />
                    ) : (
                        <div className="py-8 text-center text-slate-400 italic text-sm">Chưa có sản phẩm thương mại nào trong Database. Bấm "Thêm Sản Phẩm Mới" để tạo.</div>
                    )}
                </div>
            )}

            {/* TAB 4: NÔNG DƯỢC */}
            {activeTab === 'pesticides' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-purple-600" />
                                <span>Danh Mục Nông Dược & Thuốc Bảo Vệ Thực Vật ({pesticides.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Dữ liệu được lưu trữ trực tiếp vào bảng MaterialItems trên Server Backend.</p>
                        </div>
                        <button
                            onClick={() => {
                                setMaterialModalType('PESTICIDE');
                                setMaterialFormData({ code: `ND-${Date.now().toString().slice(-4)}`, name: '', unit: 'Lít', price: 0, dosagePerHa: 0, concentration: '', supplier: '', note: '' });
                                setShowMaterialModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Nông Dược Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh mục nông dược...</div>
                    ) : pesticides.length > 0 ? (
                        <AppTable columns={pesticideColumns} data={pesticides} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có thông tin nông dược trong Database. Hãy bấm "Thêm Nông Dược Mới".</div>
                    )}
                </div>
            )}

            {/* TAB 5: PHÂN BÓN */}
            {activeTab === 'fertilizers' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-emerald-600" />
                                <span>Danh Mục Phân Bón ({fertilizers.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý định mức, tỷ lệ NPK được đồng bộ Backend.</p>
                        </div>
                        <button
                            onClick={() => {
                                setMaterialModalType('FERTILIZER');
                                setMaterialFormData({ code: `PB-${Date.now().toString().slice(-4)}`, name: '', unit: 'kg', price: 0, dosagePerHa: 0, npkRatio: '16-16-8', supplier: '', note: '' });
                                setShowMaterialModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Phân Bón Mới</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh mục phân bón...</div>
                    ) : fertilizers.length > 0 ? (
                        <AppTable columns={fertilizerColumns} data={fertilizers} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có dữ liệu phân bón trong Database.</div>
                    )}
                </div>
            )}

            {/* TAB 6: NGUYÊN VẬT LIỆU */}
            {activeTab === 'materials' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-amber-600" />
                                <span>Danh Mục Nguyên Vật Liệu & Dụng Cụ ({rawMaterials.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Bao bì, túi bọc hoa quả, thùng carton, tem nhãn QR lưu trữ trên Backend Server.</p>
                        </div>
                        <button
                            onClick={() => {
                                setMaterialModalType('MATERIAL');
                                setMaterialFormData({ code: `NVL-${Date.now().toString().slice(-4)}`, name: '', unit: 'Cái', price: 0, quantityInStock: 0, supplier: '', note: '' });
                                setShowMaterialModal(true);
                            }}
                            className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm Nguyên Vật Liệu</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải nguyên vật liệu...</div>
                    ) : rawMaterials.length > 0 ? (
                        <AppTable columns={materialColumns} data={rawMaterials} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có nguyên vật liệu nào trong Database.</div>
                    )}
                </div>
            )}

            {/* TAB 7: NHÀ PHÂN PHỐI */}
            {activeTab === 'distributors' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <span>Danh Sách Đối Tác Nhà Phân Phối ({distributors.length})</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm siêu thị hệ thống hoặc thêm đối tác thu mua nông sản của Hợp tác xã.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setShowSearchRetailerModal(true);
                                    void handleSearchRetailers();
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                                <Search className="w-4 h-4" />
                                <span>Tìm Kiếm & Liên Kết Siêu Thị</span>
                            </button>
                            <button
                                onClick={() => setShowDistributorModal(true)}
                                className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm Thủ Công</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh sách nhà phân phối từ Database Backend...</div>
                    ) : distributors.length > 0 ? (
                        <AppTable columns={distributorColumns} data={distributors} showSTT={true} />
                    ) : (
                        <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có nhà phân phối nào trong Database. Bấm "Tìm Kiếm & Liên Kết Siêu Thị" hoặc "Thêm Thủ Công" để bắt đầu.</div>
                    )}
                </div>
            )}

            {/* TAB 8: VÍ CHUỖI KHỐI METAMASK & TRẠNG THÁI GÁN ROLE TỪ ADMIN */}
            {activeTab === 'wallet' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                    {/* Header Tab Ví Chuỗi Khối */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-600" />
                                <span>Liên Kết Ví Chuỗi Khối MetaMask & Phân Quyền Smart Contract</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Kết nối địa chỉ ví MetaMask đại diện Hợp tác xã để Admin kiểm tra và cấp quyền `PROCESSOR_ROLE` On-Chain. Các giao dịch Smart Contract sẽ được ký tự động tại từng công đoạn sản xuất.
                            </p>
                        </div>
                    </div>

                    {/* Thông báo chưa cài MetaMask nếu có */}
                    {typeof window !== 'undefined' && !window.ethereum && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-2">
                            <div className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span>Chưa phát hiện tiện ích ví MetaMask trên trình duyệt!</span>
                            </div>
                            <p>Để liên kết địa chỉ ví đại diện Hợp tác xã, vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt Chrome/Brave/Edge.</p>
                            <a
                                href="https://metamask.io/download/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 font-bold underline hover:text-emerald-800"
                            >
                                <span>Tải & Cài Đặt MetaMask Ngay</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    )}

                    {/* 4 Thẻ Trạng Thái Nhanh */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Ví MetaMask đang kết nối:</div>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-slate-800 truncate">
                                    {connectedAccount ? `${connectedAccount.slice(0, 8)}...${connectedAccount.slice(-6)}` : 'Chưa kết nối'}
                                </span>
                                {connectedAccount && (
                                    <button onClick={handleCopyWalletAddress} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer" title="Sao chép">
                                        {copiedAddress ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Ví đã lưu trên Hệ thống HTX:</div>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-emerald-700 truncate">
                                    {user?.walletAddress ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}` : 'Chưa lưu ví'}
                                </span>
                                <AppBadge status={user?.walletAddress ? 'ACTIVE' : 'INACTIVE'} label={user?.walletAddress ? 'Đã liên kết' : 'Chưa liên kết'} />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Trạng thái Quyền On-Chain (Admin):</div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800 truncate">PROCESSOR_ROLE</span>
                                <AppBadge status="ACTIVE" label="Admin Đã Gán Role" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Mạng Blockchain (Network):</div>
                            <div className="font-bold text-xs text-slate-800 truncate">{networkName}</div>
                        </div>
                    </div>

                    {/* Khối Cấu Hình & Lưu Khóa Riêng (Private Key) Ví Blockchain Hợp Tác Xã */}
                    <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
                            <div>
                                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                    <Key className="w-4.5 h-4.5 text-emerald-700" />
                                    <span>Thiết Lập Địa Chỉ Ví & Khóa Riêng (Private Key) Ví Hợp Tác Xã</span>
                                </h4>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    Nhập Địa chỉ Ví và Khóa riêng (Private Key) để Hợp tác xã tự động ký các giao dịch Smart Contract (Tạo lô sản xuất, Thu hoạch, Phân chia). Khóa riêng sẽ được mã hóa AES-256 an toàn trong CSDL.
                                </p>
                            </div>
                            <AppButton
                                variant="green"
                                onClick={handleConnectMetaMask}
                                disabled={isConnectingWallet}
                                leftIcon={<RefreshCw className={`w-4 h-4 ${isConnectingWallet ? 'animate-spin' : ''}`} />}
                                className="text-xs font-bold px-4 py-2 shrink-0 whitespace-nowrap cursor-pointer"
                            >
                                {isConnectingWallet ? 'Đang mở MetaMask...' : 'Lấy Ví từ MetaMask'}
                            </AppButton>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* 1. ĐỊA CHỈ VÍ */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Địa Chỉ Ví Blockchain (Wallet Address)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={connectedAccount || user?.walletAddress || ''}
                                        onChange={(e) => setConnectedAccount(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                    {(connectedAccount || user?.walletAddress) && (
                                        <button
                                            onClick={handleCopyWalletAddress}
                                            className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                        >
                                            {copiedAddress ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                                <span className="text-[11px] text-slate-500 mt-1 block">
                                    Địa chỉ ví đại diện của Hợp tác xã được Admin gán quyền <code className="text-emerald-700 font-bold">PROCESSOR_ROLE</code>.
                                </span>
                            </div>

                            {/* 2. KHÓA RIÊNG PRIVATE KEY */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                    <span>Khóa Riêng (Private Key) Ví Hợp Tác Xã</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Mã hóa AES-256</span>
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showPrivateKey ? 'text' : 'password'}
                                        value={walletPrivateKey}
                                        onChange={(e) => setWalletPrivateKey(e.target.value)}
                                        placeholder="Nhập 64 ký tự Hex của Private Key (ví dụ: 647d16be...)"
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        title={showPrivateKey ? 'Ẩn khóa riêng' : 'Hiện khóa riêng'}
                                    >
                                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-[11px] mt-1">
                                    <span className="text-slate-500">
                                        Độ dài nhập: <strong className="font-mono text-slate-800">{walletPrivateKey.replace(/^0x/i, '').length}/64</strong> ký tự Hex
                                    </span>
                                    {walletPrivateKey.replace(/^0x/i, '').length === 64 && (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Hợp lệ (32 bytes)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* THÔNG BÁO THỰC TẾ NGAY TRONG KHỐI VÍ */}
                        {walletMsg && (
                            <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${walletMsg.type === 'success'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-red-100 text-red-900 border border-red-300'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {walletMsg.type === 'success' ? (
                                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4.5 h-4.5 text-red-700 shrink-0" />
                                    )}
                                    <span>{walletMsg.text}</span>
                                </div>
                                <button onClick={() => setWalletMsg(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* NÚT LƯU KHÓA VI */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-emerald-200/60">
                            <div className="text-xs text-slate-500 italic">
                                * Khóa riêng Private Key của bạn sẽ được bảo mật tuyệt đối bằng thuật toán mã hóa AES-256 trước khi lưu vào CSDL.
                            </div>
                            <AppButton
                                variant="green"
                                onClick={handleSaveWalletInfo}
                                disabled={isSavingWallet}
                                leftIcon={<Lock className={`w-4 h-4 ${isSavingWallet ? 'animate-spin' : ''}`} />}
                                className="text-xs font-bold px-6 py-2.5 cursor-pointer shrink-0"
                            >
                                {isSavingWallet ? 'Đang mã hóa & lưu...' : 'Lưu Khóa Ví Blockchain'}
                            </AppButton>
                        </div>
                    </div>


                    {/* Khối Thông Tin Chi Tiết Về Phân Quyền Admin & Cơ Chế Ký Tự Động */}
                    <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                            <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                <ShieldCheck className="w-4.5 h-4.5 text-emerald-700" />
                                <span>Cơ Chế Phân Quyền On-Chain & Ký Tự Động Theo Công Đoạn</span>
                            </h4>
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-300">
                                PROCESSOR_ROLE Whitelisted
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
                                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    <span>1. Admin Gán Role `PROCESSOR_ROLE` Cho Ví</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    Sau khi Hợp tác xã liên kết địa chỉ ví Web3, Admin sẽ kiểm tra hồ sơ và gọi hàm <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">grantRole(PROCESSOR_ROLE, walletAddress)</code> trên Smart Contract để mở khóa quyền ký cho ví HTX.
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
                                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                    <Cpu className="w-4 h-4 text-emerald-600" />
                                    <span>2. Ký Giao Dịch Smart Contract Tự Động</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    Người dùng không cần thực hiện ký thủ công. Hệ thống sẽ tự động tổng hợp dữ liệu IPFS MetadataURI và DataHash để ký và ghi nhận On-Chain trực tiếp khi bạn thực hiện các thao tác quản lý sản xuất.
                                </p>
                            </div>
                        </div>

                        {/* Sơ Đồ Workflow Các Bước Ký Tự Động */}
                        <div className="pt-2">
                            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <span>Các công đoạn nghiệp vụ ký On-Chain tự động:</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mx-auto">1</div>
                                    <div className="font-bold text-xs text-slate-900">Tạo Lô Sản Xuất</div>
                                    <code className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded block">createBatch()</code>
                                    <span className="text-[10px] text-slate-500 block">STAGE_PLANTING</span>
                                </div>

                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mx-auto">2</div>
                                    <div className="font-bold text-xs text-slate-900">Tiếp Nhận & Sơ Chế</div>
                                    <code className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded block">processBatch()</code>
                                    <span className="text-[10px] text-slate-500 block">STAGE_PROCESSED</span>
                                </div>

                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center mx-auto">3</div>
                                    <div className="font-bold text-xs text-slate-900">Kiểm Định & Đóng Gói</div>
                                    <code className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded block">packageParent()</code>
                                    <span className="text-[10px] text-slate-500 block">STAGE_PACKAGED</span>
                                </div>

                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mx-auto">4</div>
                                    <div className="font-bold text-xs text-slate-900">Vận Chuyển Hàng</div>
                                    <code className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded block">shipParent()</code>
                                    <span className="text-[10px] text-slate-500 block">STAGE_SHIPPING</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khối Nhật Ký Bảng Dữ Liệu AppTable Giao Dịch Tự Động */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-600" />
                                <span>Lịch Sử Giao Dịch On-Chain Đã Được Ký Tự Động ({signedTxLogs.length})</span>
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">Tự động đồng bộ từ Smart Contract</span>
                        </div>

                        {signedTxLogs.length > 0 ? (
                            <AppTable columns={walletTxColumns} data={signedTxLogs} showSTT={true} />
                        ) : (
                            <div className="py-12 text-center text-slate-400 italic text-sm">Chưa có giao dịch Smart Contract nào được thực hiện. Các giao dịch sẽ tự động lưu lại khi bạn quản lý lô sản xuất.</div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL THÊM GIỐNG CÂY MỚI */}
            {showFruitTypeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Trees className="w-5 h-5 text-emerald-600" />
                                <span>🌳 Thêm Giống Cây Trồng Mới</span>
                            </h3>
                            <button onClick={() => setShowFruitTypeModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveFruitType} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Giống Cây / Tiền Tố (Viết hoa) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: CAM, BUOI, SAURIENG, XOAI..."
                                    value={fruitTypeFormData.code}
                                    onChange={(e) => setFruitTypeFormData({ ...fruitTypeFormData, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">Mã này sẽ dùng làm tiền tố cho Mã lô sản xuất (VD: CAM-2026-001)</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Giống Cây / Loại Trái Cây *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Cam Sành Tam Bình, Sầu Riêng Ri6, Bưởi Da Xanh..."
                                    value={fruitTypeFormData.name}
                                    onChange={(e) => setFruitTypeFormData({ ...fruitTypeFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả / Đặc Tính Giống Cây</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ghi chú về nguồn gốc, quy chuẩn VietGAP, thời gian sinh trưởng..."
                                    value={fruitTypeFormData.description}
                                    onChange={(e) => setFruitTypeFormData({ ...fruitTypeFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowFruitTypeModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Giống Cây Mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM SẢN PHẨM ĐÓNG GÓI / THƯƠNG MẠI */}
            {showProductModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                <span>📦 Thêm Sản Phẩm Đóng Gói / Thương Mại Mới</span>
                            </h3>
                            <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Giống Cây Nguyên Liệu Trồng</label>
                                <select
                                    value={productFormData.fruitTypeId}
                                    onChange={(e) => setProductFormData({ ...productFormData, fruitTypeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                >
                                    <option value="">-- Chọn Giống Cây Trồng (Bắt buộc) --</option>
                                    {fruitTypes.map((ft) => (
                                        <option key={ft.id} value={ft.id}>
                                            {ft.name} ({ft.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Sản Phẩm Đóng Gói Thương Mại *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Cam Sành Tam Bình Hộp 5kg, Nước ép cam 330ml..."
                                    value={productFormData.name}
                                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã / Tên Viết Tắt</label>
                                    <input
                                        type="text"
                                        placeholder="CAM-BOX-5KG..."
                                        value={productFormData.shortName}
                                        onChange={(e) => setProductFormData({ ...productFormData, shortName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm Sản Phẩm</label>
                                    <input
                                        type="text"
                                        placeholder="Trái cây tươi đóng gói, Nước ép..."
                                        value={productFormData.groupName}
                                        onChange={(e) => setProductFormData({ ...productFormData, groupName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Chủng Loại / Giống / Hạng Chất Lượng</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Hạng A, Loại 1 VietGAP, Xuất khẩu..."
                                    value={productFormData.variety}
                                    onChange={(e) => setProductFormData({ ...productFormData, variety: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô Tả Quy Cách Đóng Gói & Bảo Quản</label>
                                <textarea
                                    rows={3}
                                    placeholder="Đóng thùng carton 5kg, bảo quản nhiệt độ 10-12 độ C, dán tem QR truy xuất Nguồn gốc..."
                                    value={productFormData.description}
                                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowProductModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Sản Phẩm Mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM NÔNG DƯỢC / PHÂN BÓN / NVL */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                {materialModalType === 'PESTICIDE'
                                    ? '🧪 Thêm Nông Dược / Thuốc BVTV Mới'
                                    : materialModalType === 'FERTILIZER'
                                        ? '🌾 Thêm Phân Bón Mới'
                                        : '📦 Thêm Nguyên Vật Liệu / Bao Bì Mới'}
                            </h3>
                            <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMaterial} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Vật Tư *</label>
                                    <input
                                        type="text"
                                        required
                                        value={materialFormData.code || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Vị Tính *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="kg, Lít, Chai, Bao..."
                                        value={materialFormData.unit || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Vật Tư / Tên Sản Phẩm *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Phân NPK 16-16-8, Thuốc trừ sâu Anvil..."
                                    value={materialFormData.name || ''}
                                    onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            {materialModalType === 'PESTICIDE' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Nồng Độ / Hàm Lượng Active</label>
                                        <input
                                            type="text"
                                            placeholder="5SC, 250EC..."
                                            value={materialFormData.concentration || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, concentration: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Liều Lượng Khuyên Dùng / Ha</label>
                                        <input
                                            type="number"
                                            placeholder="Số lượng"
                                            value={materialFormData.dosagePerHa || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, dosagePerHa: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {materialModalType === 'FERTILIZER' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Tỷ Lệ NPK</label>
                                        <input
                                            type="text"
                                            placeholder="16-16-8, 20-20-15..."
                                            value={materialFormData.npkRatio || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, npkRatio: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Liều Lượng Bón / Ha</label>
                                        <input
                                            type="number"
                                            placeholder="Số lượng"
                                            value={materialFormData.dosagePerHa || ''}
                                            onChange={(e) => setMaterialFormData({ ...materialFormData, dosagePerHa: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Đơn Giá Ước Tính (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={materialFormData.price || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, price: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhà Cung Cấp</label>
                                    <input
                                        type="text"
                                        placeholder="Công ty SX..."
                                        value={materialFormData.supplier || ''}
                                        onChange={(e) => setMaterialFormData({ ...materialFormData, supplier: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowMaterialModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Vào Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM NHÀ PHÂN PHỐI (LƯU DB BACKEND) */}
            {showDistributorModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">🏢 Thêm Nhà Phân Phối Mới Vào Database</h3>
                            <button onClick={() => setShowDistributorModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDistributor} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Nhà Phân Phối *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="NPP-001..."
                                        value={distributorFormData.code || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại *</label>
                                    <input
                                        type="text"
                                        required
                                        value={distributorFormData.phone || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Nhà Phân Phối / Doanh Nghiệp Thu Mua *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Công ty ABC, Chuỗi siêu thị XYZ..."
                                    value={distributorFormData.name || ''}
                                    onChange={(e) => setDistributorFormData({ ...distributorFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
                                    <input
                                        type="email"
                                        placeholder="contact@company.com"
                                        value={distributorFormData.email || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế</label>
                                    <input
                                        type="text"
                                        placeholder="0312345678"
                                        value={distributorFormData.taxCode || ''}
                                        onChange={(e) => setDistributorFormData({ ...distributorFormData, taxCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Trụ Sở *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh..."
                                    value={distributorFormData.address || ''}
                                    onChange={(e) => setDistributorFormData({ ...distributorFormData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowDistributorModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#15803d] hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Lưu Vào Database Backend
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TÌM KIẾM & LIÊN KẾT SIÊU THỊ HỆ THỐNG */}
            {showSearchRetailerModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Store className="w-5 h-5 text-blue-600" />
                                    <span>Tìm Kiếm & Liên Kết Siêu Thị Hệ Thống</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm siêu thị/điểm bán lẻ đã đăng ký tài khoản và liên kết với Hợp tác xã</p>
                            </div>
                            <button onClick={() => setShowSearchRetailerModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Thanh tìm kiếm */}
                        <form onSubmit={handleSearchRetailers} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nhập tên siêu thị, số điện thoại hoặc email để tìm kiếm..."
                                    value={searchRetailerKeyword}
                                    onChange={(e) => setSearchRetailerKeyword(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searchingRetailers}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {searchingRetailers ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                <span>Tìm Kiếm</span>
                            </button>
                        </form>

                        {/* Danh sách kết quả */}
                        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                            {searchingRetailers ? (
                                <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                                    <span>Đang tìm kiếm siêu thị...</span>
                                </div>
                            ) : systemRetailers.length > 0 ? (
                                systemRetailers.map((r) => (
                                    <div key={r.retailerId} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-blue-600" />
                                                <span className="font-bold text-sm text-slate-900">{r.fullName}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <span>SĐT: <strong className="text-slate-700">{r.phone}</strong></span>
                                                <span>Email: <strong className="text-slate-700">{r.email}</strong></span>
                                                {r.walletAddress && (
                                                    <span className="truncate max-w-[200px]" title={r.walletAddress}>Ví: <code className="text-blue-700 bg-blue-100/60 px-1 py-0.5 rounded">{r.walletAddress}</code></span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            {r.isLinked ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Đã liên kết
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleLinkRetailer(r.retailerId)}
                                                    disabled={linkingRetailerId === r.retailerId}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                                                >
                                                    {linkingRetailerId === r.retailerId ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Link2 className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>Liên Kết Siêu Thị</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center text-slate-400 text-sm">
                                    Không tìm thấy siêu thị / cửa hàng bán lẻ nào phù hợp với từ khóa.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowSearchRetailerModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
