import { vehicleService } from '../services/index.js';

// Yeni bir araç oluşturur
export const createVehicle = async (req, res) => {
    try {
        const newVehicle = await vehicleService.createVehicle(req.body, req.user);
        const response= {
           
            success: true,
        
        }
        res.status(201).json(response);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        console.error('Araç oluşturma hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Gelen vehicle nesnesini ön yüzün istediği formata dönüştürür.
 * @param {object} vehicle - Sequelize'den gelen vehicle nesnesi.
 * @returns {object} - Düzleştirilmiş ve temizlenmiş vehicle nesnesi.
 */
const transformVehicleData = (vehicle) => {
    const plainVehicle = vehicle.toJSON(); // Sequelize nesnesini basit bir JSON objesine çevirir.

    return {
        ...plainVehicle, // Aracın tüm kendi alanlarını kopyala (id, plate, brand vs.)
        kurum_name: plainVehicle.Kurum?.name || null, // Kurum adını ekle
        mintika_name: plainVehicle.Kurum?.Mintika?.name || null, // Mıntıka adını ekle
        Kurum: undefined, // İç içe olan Kurum objesini yanıttan kaldır
    };
};

// Tüm araçları listeler
export const getAllVehicles = async (req, res) => {
    try {
        const vehicles = await vehicleService.getAllVehicles(req.user);
        
        // Her bir araç objesini dönüştür
        const transformedData = vehicles.map(transformVehicleData);

        res.status(200).json({
            success: true,
            message: "Araçlar başarıyla listelendi.",
            data: transformedData
        });
    } catch (error) {
        console.error('Araç listeleme hatası:', error);
        res.status(500).json({ success: false, message: error.message});
    }
};

// ID'ye göre bir araç getirir ve formatlar
export const getVehicleById = async (req, res) => {
    try {
        const vehicle = await vehicleService.getVehicleById(parseInt(req.params.id, 10), req.user);
        
        // Tekil araç objesini dönüştür
        const transformedData = transformVehicleData(vehicle);

        res.status(200).json({
            success: true,
            message: "Araç detayı başarıyla getirildi.",
            data: transformedData
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Araç detayı getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
    }
};
// Bir aracı günceller
export const updateVehicle = async (req, res) => {
    try {
        const result = await vehicleService.updateVehicleById(parseInt(req.params.id, 10), req.body, req.user);
            const response= { 
            message: "Araç başarıyla güncellendi."}
        res.status(200).json(response);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        console.error('Araç güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// Bir aracı siler
export const deleteVehicle = async (req, res) => {
    try {
        const result = await vehicleService.deleteVehicleById(parseInt(req.params.id, 10), req.user);
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'Bu araç başka kayıtlarda kullanıldığı için silinemez.' });
        }
        console.error('Araç silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};