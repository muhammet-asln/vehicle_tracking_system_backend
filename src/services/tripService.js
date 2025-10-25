
import { Trip, Vehicle, User, Kurum } from '../models/index.js';
import { imageService } from './imageService.js';
import { Op } from 'sequelize';
// araç faailiyette ve araç diğer aktif bir tripte değilse araci getVehicleById ile getir ve trip oluştur


/**
 * Bir aracın talep edilebilir olup olmadığını kontrol eden middleware.
 * İsteğin body'sinde 'vehicle_id' olmalıdır.
 * 1. Aracın kendi durumunun 'aktif' olup olmadığını kontrol eder.
 * 2. Aracın başka bir 'aktif' yolculukta olup olmadığını kontrol eder.
 */
export const checkVehicleAvailability = async ( id, req, res, ) => {
    const vehicle_id  =id;

    if (!vehicle_id) {
        const response= { 
            message: 'İstek gövdesinde vehicle_id zorunludur.',
        success: false}
    
        return res.status(400).json(response);    
    }
    // Araç ID'si sağlanmış, 
    // yetki kontrolü 
    if (req.user.role === 'Mıntıka Yöneticisi' || req.user.role === 'Kurum Yöneticisi' || req.user.role === 'Kullanıcı') {
        try {
            const vehicle = await Vehicle.findByPk(vehicle_id, { include: [Kurum] });
            if (!vehicle) {
                return res.status(404).json({ message: 'Belirtilen araç bulunamadı.', success: false });
            }   
            if (req.user.role === 'Mıntıka Yöneticisi' && vehicle.Kurum.mintika_id !== req.user.mintika_id) {
                return res.status(403).json({ message: 'Yasaklandı: Sadece kendi mıntıkanızdaki araçları talep edebilirsiniz.', success: false });
            }
            if (req.user.role === 'Kurum Yöneticisi' && vehicle.kurum_id !== req.user.kurum_id) {
                return res.status(403).json({ message: 'Yasaklandı: Sadece kendi kurumunuzdaki araçları talep edebilirsiniz.', success: false });
            }
            if (req.user.role === 'Kullanıcı' && vehicle.kurum_id !== req.user.kurum_id) {
                return res.status(403).json({ message: 'Yasaklandı: Sadece kendi kurumunuza ait araçları talep edebilirsiniz.', success: false });
            }
        } catch (error) {
            console.error('Araç yetki kontrolü hatası:', error);
            return res.status(500).json({ message: error.message, success: false });
        }
    }
    try {
        // 1. ADIM: Aracın kendi durumunu kontrol et.
        const vehicle = await Vehicle.findByPk(vehicle_id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Belirtilen araç bulunamadı.', success: false });
        }
        
        // Araç "pasif" ise (faal değilse) işlemi durdur.
        if (!vehicle.is_active) {
            return res.status(400).json({ message: 'Bu araç şu an kullanım dışı veya bakımda. Talep edilemez.', success: false });
        }

        // 2. ADIM: Araç başka bir aktif yolculukta mı diye kontrol et.
        const activeTrip = await Trip.findOne({ where: { vehicle_id, end_date: null } });
        if (activeTrip) {
            return res.status(409).json({ message: 'Bu araç şu anda başka bir görevde.', success: false });
        }
        
        return (vehicle.dataValues); // Araç müsait, işlemi devam ettir.

    } catch (error) {
        console.error('Araç müsaitlik kontrolü hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

/**
 * Bir yönetici tarafından yeni bir yolculuk planlar.
 * @param {object} tripData - Controller'dan gelen, yeni yolculuk detaylarını içeren nesne (user_id, vehicle_id, destination vb.).
 * @param {object} requester - İsteği yapan, giriş yapmış yönetici kullanıcısının nesnesi.
 * @returns {Promise<object>} - Başarıyla oluşturulan trip nesnesini bir Promise olarak döner.
 * @throws {Error} - Gerekli alanlar eksikse veya yetki ihlali varsa hata fırlatır.
 */
export const createPlannedTrip = async (tripData, requester) => {
    
    const { user_id, vehicle_id, destination, start_date, return_estimate, reason, description } = tripData;
    if (!user_id || !vehicle_id || !destination || !start_date ) {
        const error = new Error('Kullanıcı, Araç, Güzergah, Başlangıç ve Bitiş tarihleri zorunludur.');
        error.statusCode = 400;
        throw error;
    }
    
    // Yetki Kontrolleri
    const vehicle = await Vehicle.findByPk(vehicle_id, { include: [Kurum] });
    const user = await User.findByPk(user_id);
    if (!vehicle || !user) {
        const error = new Error('Belirtilen araç veya kullanıcı bulunamadı.');
        error.statusCode = 404;
        throw error;
    }

    if (requester.role === 'Mıntıka Yöneticisi' && (vehicle.Kurum.mintika_id !== requester.mintika_id || user.mintika_id !== requester.mintika_id)) {
        const error = new Error('Yasaklandı: Sadece kendi mıntıkanızdaki kaynakları kullanabilirsiniz.');
        error.statusCode = 403;
        throw error;
    } else if (requester.role === 'Kurum Yöneticisi' && (vehicle.kurum_id !== requester.kurum_id || user.kurum_id !== requester.kurum_id)) {
        const error = new Error('Yasaklandı: Sadece kendi kurumunuzdaki kaynakları kullanabilirsiniz.');
        error.statusCode = 403;
        throw error;
    }
    // araç aktif mi kontrol et
    const isVehicleActive = await Trip.findOne({ where: { vehicle_id, end_date: null } });
    if (isVehicleActive) {
        const error = new Error('Bu araç şu anda başka bir görevde.');
        error.statusCode = 409; // Conflict
        throw error;
    }
    // Her şey yolundaysa yeni trip oluştur (fotoğraflar yok)

    const newTrip = await Trip.create({
        user_id, vehicle_id, destination, reason, description, start_date, return_estimate,
        assigned_by: requester.id,
        trip_type: 'assigned',
        crtuser: requester.username,
        crtdate: new Date()
    });
    return newTrip;
};

/**
 * Bir kullanıcı/yönetici tarafından anlık araç talebi oluşturur ve otomatik zimmetler.
 * Bu fonksiyon, isteği yapan kişinin rolüne göre aracı talep etme yetkisi olup olmadığını kontrol eder.
 * @param {object} tripData - Controller'dan gelen, araç talep verilerini içeren nesne.
 * @param {object} requester - İsteği yapan, giriş yapmış kullanıcı nesnesi.
 * @returns {Promise<object>} - Başarıyla oluşturulan trip nesnesini bir Promise olarak döner.
 * @throws {Error} - Gerekli alanlar eksikse, araç müsait değilse veya yetki yoksa hata fırlatır.
 */
export const createRequestedTrip = async (tripData, requester) => {
    const { vehicle_id, destination,  return_estimate, reason, description } = tripData;
    if (!vehicle_id || !destination ) {
        const error = new Error('Araç, Güzergah ve Başlangıç tarihi zorunludur.');
        error.statusCode = 400;
        throw error;
    }

    // --- YENİ EKLENEN YETKİ KONTROLÜ ---
    
    // 1. Talep edilen aracın bilgilerini ve bağlı olduğu kurumun bilgilerini al.
    const vehicle = await Vehicle.findByPk(vehicle_id, { include: [Kurum] });
    if (!vehicle) {
        const error = new Error('Belirtilen araç bulunamadı.');
        error.statusCode = 404;
        throw error;
    }

    // 2. İstek yapanın rolüne göre yetkisi var mı diye kontrol et.
    const { role, kurum_id, mintika_id } = requester;

    if (role === 'Mıntıka Yöneticisi') {
        // YETKİ KURALI: Mıntıka Yöneticisi, sadece kendi mıntıkasındaki bir aracı talep edebilir.
        if (vehicle.Kurum.mintika_id !== mintika_id) {
            const error = new Error('Yasaklandı: Sadece kendi mıntıkanızdaki araçları talep edebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    } else if (role === 'Kurum Yöneticisi') {
        // YETKİ KURALI: Kurum Yöneticisi, sadece kendi kurumundaki bir aracı talep edebilir.
        if (vehicle.kurum_id !== kurum_id) {
            const error = new Error('Yasaklandı: Sadece kendi kurumunuzdaki araçları talep edebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    } else if (role === 'Kullanıcı') {
        // YETKİ KURALI: Kullanıcı, sadece kendi kurumundaki bir aracı talep edebilir.
        if (vehicle.kurum_id !== kurum_id) {
            const error = new Error('Yasaklandı: Sadece kendi kurumunuza ait araçları talep edebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }
    // Not: Admin rolü bu kontrollere takılmaz, her aracı talep edebilir.

    // --- YETKİ KONTROLÜ SONU ---

    // Aracın başka bir aktif görevde olup olmadığını kontrol et
    const isVehicleActive = await Trip.findOne({ where: { vehicle_id, end_date: null } });
    if (isVehicleActive) {
        const error = new Error('Bu araç şu anda başka bir görevde.');
        error.statusCode = 409; // Conflict
        throw error;
    }
    
    const newTrip = await Trip.create({
        vehicle_id, destination,  return_estimate, reason, description,
        user_id: requester.id,
        assigned_by: requester.id,
        trip_type: 'requested',
        crtuser: requester.username,
        crtdate: new Date()
    });
    const returnedTrip = await Trip.findByPk(newTrip.id, {
        include: [
            { model: Vehicle, attributes: ['plate', 'brand', 'model', 'category', 'owner_name'] }
        ]
    });
    return  flattenTripData(returnedTrip) ;
};


/**
 * Aktif bir yolculuğu tamamlar (Aracı Teslim Etme).
 * Bu fonksiyon, trip kaydının 'enddate' alanını doldurarak yolculuğu 'completed' (tamamlanmış) durumuna geçirir.
 * @param {number} tripId - Tamamlanacak yolculuğun ID'si.
 * @param {object} returnData - Teslim etme verileri (last_photo, description).
 * @param {object} requester - İsteği yapan, giriş yapmış kullanıcı nesnesi.
 * @returns {Promise<object>} - Başarıyla güncellenmiş trip nesnesini bir Promise olarak döner.
 * @throws {Error} - Gerekli alanlar eksikse, yolculuk bulunamazsa, yetki yoksa veya yolculuk zaten tamamlanmışsa hata fırlatır.
 */
export const completeTrip = async ( body,requester , getPhotos ) => {
    // 1. Gelen verileri al
    //const { last_photo, description } = returnData;

    // 2. Doğrulama: Kullanıcı Senaryosu'na göre teslim fotoğrafı zorunludur.
   // if (!last_photo) {
     //   const error = new Error('Teslim fotoğrafı zorunludur.');
     //   error.statusCode = 400;
      //  throw error;
   // }
   // Fotoğrafların gelip gelmediğini kontrol et
   if (!getPhotos || Object.keys(getPhotos).length === 0) {
        const error = new Error('Teslim etme fotoğrafları zorunludur.');
        error.statusCode = 400;
        throw error;
    }

    // 3. Veritabanından ilgili yolculuk kaydını bul
   const trip = await Trip.findOne({
  where: {
    
    user_id: requester.id, 
     end_date: null // aktif yolculuk
  }
});

    if (!trip) {
        const error = new Error('Yolculuk kaydı bulunamadı.' + error.message);
        error.statusCode = 404;
        throw error;
    }

    // 4. Yetki Kontrolü: İsteği yapan kullanıcı, bu yolculuğun sahibi mi?
    if (trip.user_id !== requester.id) {
        const error = new Error('Yasaklandı: Bu yolculuğu tamamlama yetkiniz yok.' + requester.id + '---' + trip.user_id);
        error.statusCode = 403;
        throw error;
    }
    
    // 5. Durum Kontrolü: Bu yolculuk zaten tamamlanmış mı? ('enddate' dolu mu?)
    if (trip.end_date !== null) {
        const error = new Error('Bu yolculuk zaten tamamlanmış.');
        error.statusCode = 400;
        throw error;
    }

    // 6. Kaydı Güncelle: Yolculuğu 'tamamlanmış' olarak işaretle
    // fotoğrafları kaydet
    const processedPhotos = {};
        // 2. Gelen her bir dosyayı işle
        for (const fieldName in getPhotos) {
            const file = getPhotos[fieldName][0];
             const namingData = {
                tripId: trip.id,
                fieldName: fieldName
            };
            processedPhotos[fieldName] = await imageService(file.buffer, namingData);
            //saçma bir şey oldu burda
        }
    
   
    trip.end_date = new Date(); // Bu satır, yolculuğun durumunu 'tamamlanmış' yapar.
    
    // 7. Değişiklikleri kaydet
    await trip.save();

    // Not: Senaryoya göre bu aşamada Kurum Yöneticisine bildirim gönderilir[cite: 349].
    // TODO: Bildirim gönderme mantığı buraya eklenebilir.

    // 8. Güncellenmiş yolculuk nesnesini geri döndür
    return trip;
};

/**
 * Sequelize'den gelen iç içe Trip nesnesini, istenen düz formata çevirir.
 * @param {object} trip - Sequelize Trip nesnesi.
 * @returns {object} - Düzleştirilmiş veri nesnesi.
 */
const flattenTripData = (trip) => {
    if (!trip) return null;

    // Sequelize nesnesini basit bir JSON'a çevir
    const tripJSON = trip.toJSON();

    // İlişkili verileri ana nesneye taşı
    const vehicleData = tripJSON.Vehicle || {};
    delete tripJSON.Vehicle; // Orijinal iç içe nesneyi sil

    return {
        ...tripJSON,
        plate: vehicleData.plate || null,
        owner_name: vehicleData.owner_name || null,
        brand: vehicleData.brand || null,
        model: vehicleData.model || null,
        vehicle_type: vehicleData.category || null, // 'category' alanını 'vehicle_type' olarak eşle
    };
};

/**
 * Herhangi bir rolün, sadece kendisine ait olan aktif yolculuğu getirir.
 */
export const getCurrentTrip = async (requester) => {
    const trip = await Trip.findOne({
        where: {
            user_id: requester.id,
            end_date: null
        },
        include: [
            { 
                model: Vehicle, 
                attributes: ['plate', 'brand', 'model', 'category', 'owner_name']
            }
        ]
    });

    return flattenTripData(trip); // Düzleştirilmiş veriyi döndür
};

/**
 * Tüm aktif yolculukları, isteği yapanın rolüne göre filtreleyerek listeler.
 */
export const getAllActiveTrips = async (requester) => {
    // ... (queryOptions'ı ve filtrelemeyi önceki gibi yapıyoruz) ...
    
    const trips = await Trip.findAll(queryOptions);

    // Dönen dizideki her bir elemanı düzleştir
    return trips.map(trip => flattenTripData(trip));
};

// ... Diğer servis fonksiyonları da benzer şekilde 'flattenTripData' kullanacak şekilde güncellenebilir.
/**
 * Tamamlanmış yolculukları (geçmiş seyahatleri) rol bazlı filtreleyerek listeler.
 * @param {object} requester - İsteği yapan, giriş yapmış kullanıcı nesnesi.
 * @returns {Promise<Array>} - Tamamlanmış trip nesnelerinden oluşan bir dizi döner.
 */
export const getCompletedTrips = async (requester) => {
    const { role, id: requesterId, kurum_id, mintika_id } = requester;

    // Temel sorgu: Sadece tamamlanmış yolculukları (end_date'i dolu olanlar) al.
    const queryOptions = {
        where: {
            end_date: {
                [Op.not]: null // Op.not, 'IS NOT NULL' anlamına gelir.
            }
        },
        include: [
            { model: User, attributes: ['id', 'name', 'username'] },
            { 
                model: Vehicle, 
                attributes: ['id', 'plate', 'brand', 'model'],
                include: [{ model: Kurum, attributes: ['id', 'name'] }] 
            }
        ],
        order: [['end_date', 'DESC']] // En yeniden eskiye doğru sırala
    };

    // --- YETKİ KURALI: Rol bazlı filtreleme ---
    if (role === 'Kullanıcı') {
        // YETKİ: Kullanıcı sadece kendi geçmiş seyahatlerini görebilir.
        queryOptions.where.user_id = requesterId;
    } 
    else if (role === 'Kurum Yöneticisi') {
        // YETKİ: Kurum Yöneticisi sadece kendi kurumundaki seyahatleri görebilir.
        // Bu sorgu, kurum ID'sine göre araçları filtreler.
        queryOptions.include[1].where = { kurum_id: kurum_id };
        queryOptions.include[1].required = true;
    } 
    else if (role === 'Mıntıka Yöneticisi') {
        // YETKİ: Mıntıka Yöneticisi sadece kendi mıntıkasındaki seyahatleri görebilir.
        // Bu sorgu, kurumun mıntıka ID'sine göre araçları filtreler.
        queryOptions.include[1].include[0].where = { mintika_id: mintika_id };
        queryOptions.include[1].required = true;
    }
    // Not: Admin için ek bir filtre gerekmez, tüm kayıtları görür.

    const trips = await Trip.findAll(queryOptions);
    return trips;
};
