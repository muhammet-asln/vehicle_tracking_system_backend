import { tripService } from '../services/index.js';

/**
 * Bir yönetici tarafından yeni bir seyahat planı oluşturma isteğini yönetir.
 * Gelen isteği ve kullanıcı bilgilerini 'createPlannedTrip' servisine yönlendirir.
 */
export const selectVehicleById = async (req, res) => {
    try {
        const selectVehicle = await tripService.checkVehicleAvailability(parseInt(req.params.id,10), req, res);
        const response= {
            message: 'araç başarıyla getirildi.',
            data: selectVehicle,
            success: true
        }
        res.status(201).json(response);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Seyahat planlama hatası:', error.error.message);
        res.status(500).json({ message:error.message  });
    }
};


/**
 * Bir yönetici tarafından yeni bir seyahat planı oluşturma isteğini yönetir.
 * Gelen isteği ve kullanıcı bilgilerini 'createPlannedTrip' servisine yönlendirir.
 */
export const assignTrip = async (req, res) => {
    try {
        const newTrip = await tripService.createPlannedTrip(req.body, req.user);
        const response= {
            message: 'Seyahat başarıyla planlandı.',
            data: {
                newTrip
            },
            success: true
        }
        
        res.status(201).json(response);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Seyahat planlama hatası:', error);
        res.status(500).json({ message:error.message  });
    }
};

/**
 * Bir kullanıcı tarafından anlık araç talebi isteğini yönetir.
 * Gelen isteği ve kullanıcı bilgilerini 'createRequestedTrip' servisine yönlendirir.
 */
export const requestTrip = async (req, res) => {
    try {
        const newTrip = await tripService.createRequestedTrip(req.body, req.user);
         const response= {
            message: 'Seyahat başarıyla planlandı.',
            data: {
                ...newTrip
            },
            success: true
        }
        
        res.status(201).json(response);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Araç talep etme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.'+ error.message });
    }
};

/**
 * Aktif bir yolculuğu tamamlama isteğini yönetir.
 * Gelen isteği ve kullanıcı bilgilerini 'completeTrip' servisine yönlendirir.
 */
export const completeTrip = async (req, res) => {
    console.log( req);
    try {
        const updatedTrip = await tripService.completeTrip(parseInt(req.params.id, 10), req.body, req.user);
        const respons= {
            message: 'Yolculuk başarıyla tamamlandı.',
            trip: updatedTrip,
            success: true
        }
        res.status(200).json(respons);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Araç teslim etme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.'+ error.message  });
    }
};
/**
 * İstek yapan kullanıcının kendi aktif yolculuğunu getirme isteğini yönetir.
 */
export const getMyCurrentTrip = async (req, res) => {
    try {
        const tripData = await tripService.getCurrentTrip(req.user);
        
        if (!tripData) {
            return res.status(200).json({ 
                success: false, 
                message: 'Aktif bir yolculuğunuz bulunmuyor.' 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Aktif yolculuk başarıyla getirildi.',
            data: tripData // Servisten gelen düzleştirilmiş veri
        });

    } catch (error) {
        console.error('Aktif yolculuk getirme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası oluştu.' + error.message
        });
    }
};

/**
 * Yetkiye göre filtrelenmiş tüm aktif yolculukları listeleme isteğini yönetir.
 */
export const getAllActiveTrips = async (req, res) => {
    try {
        const tripsData = await tripService.getAllActiveTrips(req.user);
        
        res.status(200).json({
            success: true,
            message: 'Aktif yolculuklar başarıyla listelendi.',
            data: tripsData // Servisten gelen düzleştirilmiş veri dizisi
        });
        
    } catch (error) {
        console.error('Aktif yolculukları listeleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası oluştu.' 
        });
    }
};
// TODO: Yolculukları listeleme (getAllTrips) ve detay görme (getTripById)
// gibi diğer controller fonksiyonları buraya eklenecek.

/**
 * Geçmiş seyahatleri listeleme isteğini yönetir.
 */
export const getCompletedTrips = async (req, res) => {
    try {
        const trips = await tripService.getCompletedTrips(req.user);
        res.status(200).json(trips);
    } catch (error) {
        console.error('Geçmiş seyahatleri listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};
