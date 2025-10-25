import sharp from "sharp";
import { format } from "date-fns";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// .env'den MinIO bilgilerini al
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  forcePathStyle: true, // MinIO için şart
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
});

const BUCKET = process.env.MINIO_BUCKET;

/**
 * Fotoğrafı WebP formatına çevirip MinIO'ya yükler.
 * İsimlendirme Formatı: GGAYYYYY-tripId-last-pozisyon.webp
 * @param {Buffer} buffer - Multer tarafından gelen dosya buffer'ı
 * @param {object} namingData - { tripId, fieldName }
 * @returns {Promise<string>} - Yüklenen dosyanın MinIO URL'i
 */
export const imageService = async (buffer, namingData) => {
  const { tripId, fieldName } = namingData;

  try {
    // 1. Tarih damgası
    const currentDate = format(new Date(), "yyyyMMdd");
    const folderDate= format(new Date(), "yyyyMM");

    // 2. Tür sabit
    const typeString = "last";

    // 3. Pozisyon (front, back, left, right, inside)
    const positionString = fieldName.replace("vehicle_", "");

    // 4. Dosya adı
    const filename = `${currentDate}-trip${tripId}-${typeString}-${positionString}.webp`;
    const objectKey = `${folderDate}/${filename}`; // klasör/dosya adı


    // 5. Görseli WebP formatına dönüştür (RAM'de)
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // 6. MinIO'ya yükle
    const params = {
      Bucket: BUCKET,
      Key: objectKey,
      Body: webpBuffer,
      ContentType: "image/webp",
    };

    await s3.send(new PutObjectCommand(params));

    // 7. Erişim URL'sini oluştur
    // Eğer endpoint başında http yoksa otomatik ekle
    const dataUrl = process.env.MINIO_ENDPOINT.startsWith("http")
      ? process.env.MINIO_ENDPOINT
      :`http://${process.env.MINIO_ENDPOINT}`;

    const fileUrl = `${dataUrl}/${BUCKET}/${filename}`;

    console.log("✅ MinIO'ya yüklendi:", fileUrl);

    // 8. URL'i döndür
    return fileUrl;
  } catch (error) {
    console.error(`❌ Görsel işleme veya MinIO yükleme hatası (${fieldName}):`, error.message);
    throw new Error(`Resim (${fieldName}) yüklenirken bir hata oluştu.`,error.message);
  }
};
