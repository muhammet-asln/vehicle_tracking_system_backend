import { Trip, Vehicle, User, Kurum } from '../models/index.js';

/**
 * Bir yönetici tarafından önceden seyahat planı oluşturur.
 * @param {object} tripData - Seyahat planı verileri.
 * @param {object} requester - İsteği yapan yönetici.
 * @returns {object} - Oluşturulan seyahat planı (trip) nesnesi.
 */
export const planTripByManager = async (tripData, requester) => {
    const { vehicle_id, user_id, destination, reason, description, start_time, end_time } = tripData;

    if (!vehicle_id || !user_id || !destination || !start_time || !end_time) {
        const error = new Error('Araç, Kullanıcı, Güzergah, Başlangıç ve Bitiş zamanları zorunludur.');
        error.statusCode = 400;
        throw error;
    }

    // TODO: Yöneticinin bu aracı ve kullanıcıyı atama yetkisi var mı diye kontrol edilebilir.
    // Örneğin Kurum Yöneticisi, sadece kendi kurumundaki araç ve kullanıcıları atayabilmelidir.

        // Eğer isteği yapan Kurum Yöneticisi ise, atama yaptığı aracın ve kullanıcının
    // kendi kurumuna ait olduğundan emin ol.
    if (requester.role === 'Kurum Yöneticisi') {
        const vehicle = await Vehicle.findByPk(vehicle_id);
        const user = await User.findByPk(user_id);

        if (!vehicle || !user) {
            const error = new Error('Belirtilen araç veya kullanıcı bulunamadı.');
            error.statusCode = 404;
            throw error;
        }
        if (requester.role === 'Mıntıka Yöneticisi') {
        // Aracın bağlı olduğu kurumun mıntıka ID'si yöneticininkiyle eşleşiyor mu?
        if (vehicle.Kurum.mintika_id !== requester.mintika_id) {
            const error = new Error('Yasaklandı: Sadece kendi mıntıkanızdaki bir aracı atayabilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
        // Atanan kullanıcının mıntıka ID'si yöneticininkiyle eşleşiyor mu?
        if (user.mintika_id !== requester.mintika_id) {
            const error = new Error('Yasaklandı: Sadece kendi mıntıkanızdaki bir kullanıcıyı atayabilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    } 
    // Mevcut Kurum Yöneticisi kontrolü
    else if (requester.role === 'Kurum Yöneticisi') {
        if (vehicle.kurum_id !== requester.kurum_id || user.kurum_id !== requester.kurum_id) {
            const error = new Error('Yasaklandı: Sadece kendi kurumunuzdaki araçları ve kullanıcıları atayabilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }  

        if (vehicle.kurum_id !== requester.kurum_id || user.kurum_id !== requester.kurum_id) {
            const error = new Error('Yasaklandı: Sadece kendi kurumunuzdaki araçları ve kullanıcıları atayabilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }

    const newTripPayload = {
        user_id,
        vehicle_id,
        trip_type: 'PLAN',
        status: 'Planned', // Seyahat planlandığı için durumu 'Planned' 
        destination,
        reason,
        description,
        start_time,
        end_time,
        assigned_date: new Date(),
        cruser: requester.username
    };

    const newTrip = await Trip.create(newTripPayload);

    // TODO: Kullanıcıya seyahat planı hakkında bildirim gönderilebilir. [cite: 366]

    return newTrip;
};

/**
 * Bir kullanıcı tarafından anlık araç talebi oluşturur.
 * Senaryoya göre araç otomatik olarak kullanıcıya zimmetlenir.
 * @param {object} requestData - Araç talep verileri.
 * @param {object} requester - İsteği yapan kullanıcı.
 * @returns {object} - Oluşturulan trip nesnesi.
 */
export const requestVehicleByUser = async (requestData, requester) => {
    const { vehicle_id, destination, reason, description } = requestData;

    if (!vehicle_id || !destination) {
        const error = new Error('Araç ve Güzergah zorunludur.');
        error.statusCode = 400;
        throw error;
    }

    // Aracın başka bir aktif görevde olup olmadığını kontrol et
    const isVehicleActive = await Trip.findOne({
        where: {
            vehicle_id: vehicle_id,
            status: 'Active'
        }
    });

    if (isVehicleActive) {
        const error = new Error('Bu araç şu anda başka bir görevde. Lütfen farklı bir araç seçin.');
        error.statusCode = 409; // Conflict - Çakışma
        throw error;
    }

    const newTripPayload = {
        user_id: requester.id,
        vehicle_id,
        trip_type: 'REQUEST',
        status: 'Active', // Senaryoya göre araç otomatik zimmetlendiği için 'Active' 
        destination,
        reason,
        description,
        request_date: new Date(),
        cruser: requester.username
    };

    const newTrip = await Trip.create(newTripPayload);

    // TODO: Kurum yöneticisine WhatsApp bildirimi gönderilir. [cite: 337]

    return newTrip;
};

// TODO: Gelecekte eklenecek diğer servis fonksiyonları
// export const getAllTrips = async (requester) => { ... };
// export const getTripById = async (id, requester) => { ... };
// export const completeTrip = async (id, completionData, requester) => { ... };
