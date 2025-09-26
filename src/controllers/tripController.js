import { tripService } from '../services/index.js';

/**
 * Bir yönetici tarafından yeni bir seyahat planı oluşturur.
 * @param {object} req - Express request nesnesi.
 * @param {object} res - Express response nesnesi.
 */
export const planTrip = async (req, res) => {
    try {
        // İş mantığı için doğrudan servis katmanını çağırıyoruz
        const newTrip = await tripService.planTripByManager(req.body, req.user);
        const response= {
            message: "Seyahat başarıyla planlandı.",
            success: true,
            data: newTrip
        }
        res.status(201).json(response);
    } catch (error) {
        // Servisten gelen özel hataları yakala
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        // Beklenmedik sunucu hataları
        console.error('Seyahat planlama hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

/**
 * Bir kullanıcı tarafından anlık araç talebi oluşturur.
 * @param {object} req - Express request nesnesi.
 * @param {object} res - Express response nesnesi.
 */
export const requestVehicle = async (req, res) => {
    try {
        const newTrip = await tripService.requestVehicleByUser(req.body, req.user);
        res.status(201).json(newTrip);
    } catch (error) {
        // Servisten gelen özel hataları (örn: 409 Araç kullanımda) yakala
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        // Beklenmedik sunucu hataları
        console.error('Araç talep etme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// TODO: Seyahatleri listeleme, güncelleme, teslim etme gibi diğer controller fonksiyonları buraya eklenecek.
