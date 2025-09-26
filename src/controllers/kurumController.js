import { response } from 'express';
import * as kurumService from '../services/index.js';

// Yeni bir kurum oluşturur
export const createKurum = async (req, res) => {
    try {
        const newKurum = await kurumService.createKurum(req.body, req.user);
        const response= {
          
            success: true
          
        }
        res.status(201).json(response);

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Kurum oluşturma hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// Tüm kurumları listeler
export const getAllKurumlar = async (req, res) => {
    try {
        const kurumlar = await kurumService.getAllKurumlar();
        const response= {
            message: "Kurumlar başarıyla getirildi.",
            success: true,
            data: kurumlar
        }
        res.status(200).json(response);

    } catch (error) {
        console.error('Kurum listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// Belirtilen ID'ye sahip kurumu getirir
export const getKurumById = async (req, res) => {
    try {
        const kurum = await kurumService.getKurumById(parseInt(req.params.id, 10));
        const response= {
            message: "Kurum detayı başarıyla getirildi.",
            success: true,
            data: kurum
        }
        res.status(200).json(response);
    } catch (error) {
        // Servisten gelen özel hataları yakala (örn: 404 Not Found)
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Kurum detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// Bir kurumu günceller
export const updateKurum = async (req, res) => {
    try {
        const result = await kurumService.updateKurumById(parseInt(req.params.id, 10), req.body);
        const response= {
           
            success: true,
     
        }

        res.status(200).json(response);
        console.log(result);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Kurum güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// Bir kurumu siler
export const deleteKurum = async (req, res) => {
    try {
        const result = await kurumService.deleteKurumById(parseInt(req.params.id, 10));
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        // Bu kuruma bağlı kullanıcı veya araç varken silinmesini engelle
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'Bu kurum başka kayıtlarda kullanıldığı için silinemez.' });
        }
        console.error('Kurum silme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};
