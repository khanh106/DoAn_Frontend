/**
 * Tiện ích nén ảnh phía client (Client-side Image Compressor)
 * Tự động resize và giảm dung lượng ảnh chụp điện thoại từ 5MB-15MB xuống ~200KB-500KB
 * trước khi tải lên IPFS/Backend.
 */

export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    minSizeToCompressKb?: number;
}

const DEFAULT_OPTIONS: CompressOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.75,
    minSizeToCompressKb: 300, // Nếu file nhỏ hơn 300KB thì không cần nén
};

/**
 * Nén 1 file ảnh
 */
export async function compressImage(file: File, options?: CompressOptions): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Không nén nếu không phải ảnh hoặc dung lượng đã rất nhỏ
    if (!file.type.startsWith('image/') || file.size <= (opts.minSizeToCompressKb ?? 300) * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                let { width, height } = img;
                const maxWidth = opts.maxWidth ?? 1920;
                const maxHeight = opts.maxHeight ?? 1920;

                // Tính toán tỷ lệ co giãn giữ nguyên aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                // Vẽ ảnh lên canvas với kích thước mới
                ctx.drawImage(img, 0, 0, width, height);

                // Xuất ra dạng JPEG blob
                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size < file.size) {
                            // Tạo file mới với đuôi .jpg
                            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                            const compressedFile = new File([blob], cleanName, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            // Nếu nén xong mà file không nhỏ hơn (hoặc lỗi blob) thì trả về file gốc
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    opts.quality ?? 0.75
                );
            };

            img.onerror = () => resolve(file);
        };

        reader.onerror = () => resolve(file);
    });
}

/**
 * Nén danh sách nhiều file ảnh song song
 */
export async function compressImages(files: File[], options?: CompressOptions): Promise<File[]> {
    if (!files || files.length === 0) return [];
    return await Promise.all(files.map((file) => compressImage(file, options)));
}
