import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns'; // Tarih formatlama için (npm install date-fns)

// Fotoğrafların kaydedileceği klasör yolu
const uploadDir = './uploads/photos';

// Klasör yoksa oluştur
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Gelen resim buffer'ını WebP formatına dönüştürür ve özel formatta isimlendirerek kaydeder.
 * İsimlendirme Formatı: GGAYYYYY-userId-vehicleId-first/last-pozisyon.webp
 * @param {Buffer} buffer - Multer tarafından sağlanan dosya buffer'ı.
 * @param {object} namingData - İsimlendirme için gerekli veriler { userId, vehicleId, uploadType ('pickup'/'return'), fieldName ('vehicle_front' etc.) }.
 * @returns {Promise<string>} - Kaydedilen WebP dosyasının sunucudaki yolunu döner.
 */
export const processAndSaveTripImage = async (buffer, namingData) => {
    const { userId, vehicleId, uploadType, fieldName } = namingData;
    try {
        // 1. Tarih damgasını oluştur (GGAYYYYY)
        const dateStamp = format(new Date(), 'ddMMyyyy');

        // 2. Yükleme türünü belirle ('first' veya 'last')
        const typeString = uploadType === 'pickup' ? 'first' : 'last';

        // 3. Pozisyonu belirle ('front', 'back', 'left', 'right', 'inside')
        const positionString = fieldName.replace('vehicle_', '');

        // 4. Tüm parçaları birleştirerek dosya adını oluştur
        const filename = `${dateStamp}-${userId}-${vehicleId}-${typeString}-${positionString}.webp`;
        const filepath = path.join(uploadDir, filename);

        // 5. Sharp ile resmi işle (WebP'ye dönüştür, kalite ayarla) ve kaydet
        await sharp(buffer)
            .webp({ quality: 80 }) // Kalite %80 (isteğe bağlı)
            .toFile(filepath);

        // 6. Veritabanına kaydedilecek dosya yolunu döndür
        return filepath; // Örn: 'uploads/photos/25102025-27-3-first-front.webp'

    } catch (error) {
        console.error(`Görsel işleme hatası (${fieldName}):`, error);
        throw new Error(`Resim (${fieldName}) işlenirken veya kaydedilirken bir hata oluştu.`);
    }
};
