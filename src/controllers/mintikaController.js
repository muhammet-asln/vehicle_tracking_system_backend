import * as mintikaService from '../services/index.js';

// Yeni bir mıntıka oluşturur
export const createMintika = async (req, res) => {
    try {
        // Tüm iş mantığı servise devredildi.
        const newMintika = await mintikaService.createMintika(req.body, req.user);
        const response= {
            message: "Mıntıka başarıyla oluşturuldu.",
            success: true,
            data: newMintika
        }
        res.status(201).json(response);

    } catch (error) {
        // Servisten gelen özel hataları yakala
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        // Beklenmedik sunucu hataları
        console.error('Mıntıka oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// Tüm mıntıkaları listeler
export const getAllMintikalar = async (req, res) => {

    try {
        const mintikalar = await mintikaService.getAllMintikalar();
        const response= {
            message: "Mıntıkalar başarıyla getirildi.",
            success: true,
            data: mintikalar
        }
        res.status(200).json(response);

    } catch (error) {
        console.error('Mıntıka listeleme hatası:', error);
        res.status(500).json({message: error.message});
    }
};

// Belirtilen ID'ye sahip mıntıkayı getirir
export const getMintikaById = async (req, res) => {
    try {
        const mintika = await mintikaService.getMintikaById(parseInt(req.params.id, 10));
        const response= {
            message: "Mıntıka detayı başarıyla getirildi.",
            success: true,
            data: mintika
        }
        res.status(200).json(response);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        console.error('Mıntıka detayı getirme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Bir mıntıkayı günceller
export const updateMintika = async (req, res) => {
    try {
        const result = await mintikaService.updateMintikaById(parseInt(req.params.id, 10), req.body);
        const response= {
           
            success: true,
            
        
        }
        res.status(200).json(response);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        console.error('Mıntıka güncelleme hatası:', error);
        res.status(500).json({ message:  error.message});
    }
};

// Bir mıntıkayı siler
export const deleteMintika = async (req, res) => {
    try {
        const result = await mintikaService.deleteMintikaById(parseInt(req.params.id, 10));
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        // Foreign key hatası (bu mıntıkaya bağlı kurum varken silinmeye çalışılırsa)
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'Bu mıntıka başka kayıtlarda kullanıldığı için silinemez.' });
        }
        console.error('Mıntıka silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};