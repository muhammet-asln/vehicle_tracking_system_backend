
import { Trip, Vehicle, User, Kurum,Mintika } from '../models/index.js';
import { imageService } from './imageService.js';
import { Op } from 'sequelize';
import  {FileLog} from "../models/index.js";
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
    
    console.log('✅ Tüm fotoğraflar işlendi ve yüklendi:', processedPhotos);
    //DB de Dosya log kaydı oluştur
    await FileLog.create({
        trip_id: trip.id,
        vehicle_front: processedPhotos['vehicle_front'] || null,
        vehicle_back: processedPhotos['vehicle_back'] || null,
        vehicle_left: processedPhotos['vehicle_left'] || null,
        vehicle_right: processedPhotos['vehicle_right'] || null,
        vehicle_inside: processedPhotos['vehicle_inside'] || null,
        type: 'last',
        crtuser: requester.username,
        crtdate: new Date()
    });
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


// src/services/tripService.js dosyana bu fonksiyonu güncelle/ekle

/**
 * Tüm aktif (tamamlanmamış) seyahatleri listeler.
 * İsteği yapanın rolüne göre otomatik filtreleme yapar.
 */
export const getAllActiveTrips = async (requester) => {
    const { role, kurum_id, mintika_id, id: userId } = requester;

    // Temel Sorgu: Bitiş tarihi (end_date) henüz NULL olanlar
    const queryOptions = {
        where: {
            end_date: null 
        },
        include: [
            {
                model: User,
                attributes: ['id', 'name', 'username', 'phone'] // Kullanıcı detayları
            },
            {
                model: Vehicle,
                attributes: ['id', 'plate', 'brand', 'model', 'type'],
                required: true, // Araç olmadan trip olmaz (Inner Join)
                include: [
                    {
                        model: Kurum,
                        attributes: ['id', 'name', 'mintika_id'],
                        required: true,
                        include: [{
                             model: Mintika,
                             attributes: ['id', 'name']
                        }]
                    }
                ]
            }
        ],
        order: [['start_date', 'DESC']] // En yeni seyahat en üstte
    };

    // --- ROL BAZLI FİLTRELEME ---

    if (role === 'Mıntıka Yöneticisi') {
        // Sadece kendi mıntıkasındaki kurumların araçlarıyla yapılan seyahatleri görsün
        queryOptions.include[1].include[0].where = { mintika_id: mintika_id };
    } 
    else if (role === 'Kurum Yöneticisi') {
        // Sadece kendi kurumunun araçlarıyla yapılan seyahatleri görsün
        queryOptions.include[1].where = { id: kurum_id };
    }
    else if (role === 'Kullanıcı') {
        // Kullanıcı sadece kendi aktif seyahatini (varsa) görebilir.
        // Genelde "current" endpoint'i kullanılır ama bu listede de kısıtlama yapalım.
        queryOptions.where.user_id = userId;
    }
    // Admin için filtre yok, hepsini görür.

    // Sorguyu çalıştır
    const trips = await Trip.findAll(queryOptions);
    
    // Veriyi ön yüz için düzleştir (Flatten) ve istenen formatta döndür
    //return trips.map(trip => flattenTripData(trip)); bu format da kullanılabilir  ama geerekli ve minimal format aşağıdaki gibi daha sade


    return trips.map(trip => {
        const plainTrip = trip.toJSON();
        return {
            id: plainTrip.id,
            user_name: plainTrip.User?.name,
            user_phone: plainTrip.User?.phone,
            plate: plainTrip.Vehicle?.plate,
            vehicle_info: `${plainTrip.Vehicle?.brand} ${plainTrip.Vehicle?.model}`,
            kurum_name: plainTrip.Vehicle?.Kurum?.name,
            mintika_name: plainTrip.Vehicle?.Kurum?.Mintika?.name,
            destination: plainTrip.destination,
            start_date: plainTrip.start_date,
            return_estimate: plainTrip.return_estimate,
            reason: plainTrip.reason,
            description: plainTrip.description,
            trip_type: plainTrip.trip_type
        };
    });
};

// ... Diğer servis fonksiyonları da benzer şekilde 'flattenTripData' kullanacak şekilde güncellenebilir.
/**
 * Tamamlanmış yolculukları (geçmiş seyahatleri) rol bazlı filtreleyerek listeler.
 * @param {object} requester - İsteği yapan, giriş yapmış kullanıcı nesnesi.
 * @returns {Promise<Array>} - Tamamlanmış trip nesnelerinden oluşan bir dizi döner.
 */
// src/services/tripService.js içindeki fonksiyon

export const getCompletedTrips = async (requester) => {
    const { role, id: requesterId, kurum_id, mintika_id } = requester;

    // Temel sorgu: Sadece tamamlanmış yolculukları al.
    const queryOptions = {
        where: {
            end_date: {
                [Op.not]: null 
            }
        },
        include: [
            { 
                model: User, 
                attributes: ['id', 'name'] 
            },
            { 
                model: Vehicle, 
                attributes: ['id', 'plate', 'brand', 'model'],
                required: true, // Araç bilgisi zorunlu
                include: [{ 
                    model: Kurum, 
                    attributes: ['id', 'name'],
                    required: true, // Kurum bilgisi zorunlu
                    include: [{
                        model: Mintika, // <--- MINTIKA EKLENDİ
                        attributes: ['id', 'name'],
                        required: true
                    }]
                }] 
            }
        ],
        order: [['end_date', 'DESC']]
    };

    // --- YETKİ KURALI: Rol bazlı filtreleme ---
    if (role === 'Kullanıcı') {
        queryOptions.where.user_id = requesterId;
    } 
    else if (role === 'Kurum Yöneticisi') {
        // Vehicle -> Kurum ilişkisi üzerinden filtreleme
        // include[1] = Vehicle, include[0] = Kurum
        queryOptions.include[1].include[0].where = { id: kurum_id };
    } 
    else if (role === 'Mıntıka Yöneticisi') {
        // Vehicle -> Kurum -> Mintika üzerinden filtreleme
        // include[1] = Vehicle, include[0] = Kurum
        queryOptions.include[1].include[0].where = { mintika_id: mintika_id };
    }

    const trips = await Trip.findAll(queryOptions);

    // --- VERİYİ DÜZLEŞTİRME (FLATTEN) ---
    return trips.map(trip => {
        const t = trip.toJSON(); // Sequelize nesnesini saf JSON'a çevir
        
        return {
            id: t.id,
            // Trip bilgileri
            start_date: t.start_date,
            end_date: t.end_date,
            destination: t.destination,
            reason: t.reason,
            description: t.description,
            trip_type: t.trip_type,
            first_photo: t.first_photo,
            last_photo: t.last_photo,
            
            // Kullanıcı bilgileri (Düzleştirilmiş)
            user_id: t.user_id,
            user_name: t.User?.name,

            // Araç bilgileri (Düzleştirilmiş)
            vehicle_id: t.vehicle_id,
            vehicle_plate: t.Vehicle?.plate,
            vehicle_brand: t.Vehicle?.brand,
            vehicle_model: t.Vehicle?.model,

            // Kurum ve Mıntıka bilgileri (Düzleştirilmiş)
            kurum_name: t.Vehicle?.Kurum?.name,
            mintika_name: t.Vehicle?.Kurum?.Mintika?.name // <--- EKLENEN VERİ
        };
    });
};