import multer from 'multer';

// Dosyaları disk yerine bellekte tut (işlemek için)
const storage = multer.memoryStorage();

// Sadece JPEG ve PNG dosyalarına izin veren filtre
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); // Kabul et
    } else {
        // Reddet ve hata ver
        cb(new Error('Sadece .jpeg veya .png formatında resim yüklenebilir!'), false);
    }
};

// Yükleme sırasında beklenen 5 alanın isimleri
const expectedFields = [
    { name: 'vehicle_front', maxCount: 1 },
    { name: 'vehicle_back', maxCount: 1 },
    { name: 'vehicle_left', maxCount: 1 },
    { name: 'vehicle_right', maxCount: 1 },
    { name: 'vehicle_inside', maxCount: 1 }
];

// Multer yapılandırması
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB dosya boyutu limiti
    }
});

// Birden çok alanı işlemek için 'fields' metodunu export et
export const uploadTripPhotos = upload.fields(expectedFields);