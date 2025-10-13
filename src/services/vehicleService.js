import { Vehicle , Kurum ,Mintika} from '../models/index.js';

const baseVehicleIncludeOptions = [{
    model: Kurum,
    as: 'Kurum',
    required: true,
    include: [{
        model: Mintika,
        as: 'Mintika',
        required: true
    }]
}];
/**
 * Yeni bir araç oluşturur.
 * @param {object} vehicleData - Yeni araç için veriler.
 * @param {object} requester - İsteği yapan yönetici.
 * @returns {object} - Oluşturulan araç nesnesi.
 */
export const createVehicle = async (vehicleData, requester) => {
    const { plate, kurum_id } = vehicleData;
    

    if (!plate || !kurum_id) {
        const error = new Error('Plaka ve Kurum ID zorunludur.');
        error.statusCode = 400;
        throw error;
    }
    
    // Güvenlik Kontrolü: Kurum Yöneticisi sadece kendi kurumuna araç ekleyebilir.
    if (requester.role === 'Kurum Yöneticisi' && parseInt(kurum_id, 10) !== requester.kurum_id) {
        const error = new Error('Yasaklandı: Sadece kendi kurumunuza araç ekleyebilirsiniz.');
        error.statusCode = 403;
        throw error;
    }

    const newVehiclePayload = {
        ...vehicleData,
        cruser: requester.username,
        crtdate: new Date(),
    };

    const newVehicle = await Vehicle.create(newVehiclePayload);
    return newVehicle;
};

/**
 * Araçları listeler. Yöneticinin rolüne göre filtreleme yapar.
 * @param {object} requester - İsteği yapan yönetici.
 * @returns {Array} - Araç nesnelerinden oluşan dizi.
 */
export const getAllVehicles = async (requester) => {
    let whereClause = {};
    
    // include seçeneklerini her seferinde yeniden oluşturuyoruz.
    const includeOptions = [{
        model: Kurum,
        as: 'Kurum',
        required: true,
        include: [{
            model: Mintika,
            as: 'Mintika',
            required: true
        }]
    }];

    // Rol bazlı filtrelemeyi dinamik olarak ekliyoruz.
    if (requester.role === 'Mıntıka Yöneticisi') {
        // Kurum modeline ait 'where' koşulunu burada ekliyoruz.
        includeOptions[0].where = { mintika_id: requester.mintika_id };
    }
    else if (requester.role === 'Kurum Yöneticisi') {
        // Ana Vehicle modeline ait 'where' koşulunu burada ekliyoruz.
        whereClause.kurum_id = requester.kurum_id;
    }

    const vehicles = await Vehicle.findAll({ 
        where: whereClause,
        include: includeOptions // Artık doğru çalışan include yapısını kullanıyoruz.
    });
    return vehicles;
};

/**
 * ID'ye göre bir aracı getirir ve yetki kontrolü yapar.
 * @param {number} id - Araç ID'si.
 * @param {object} requester - İstek yapan kullanıcı.
 * @returns {object} - Bulunan araç nesnesi.
 */
export const getVehicleById = async (id, requester) => {
    const vehicle = await Vehicle.findByPk(id, {
        include: baseVehicleIncludeOptions // Sabit yapıyı burada güvenle kullanabiliriz.
    });

    if (!vehicle) {
        const error = new Error('Araç bulunamadı.');
        error.statusCode = 404;
        throw error;
    }

    // YETKİ KONTROLÜ
    if (requester.role === 'Mıntıka Yöneticisi' && vehicle.Kurum.mintika_id !== requester.mintika_id) {
        const error = new Error('Yasaklandı: Bu aracı görme yetkiniz yok.');
        error.statusCode = 403;
        throw error;
    }
    if (requester.role === 'Kurum Yöneticisi' && vehicle.kurum_id !== requester.kurum_id) {
        const error = new Error('Yasaklandı: Bu aracı görme yetkiniz yok.');
        error.statusCode = 403;
        throw error;
    }

    return vehicle;
};
/**
 * Bir aracın bilgilerini günceller ve yetki kontrolü yapar.
 * @param {number} id - Araç ID'si.
 * @param {object} updateData - Yeni veriler.
 * @param {object} requester - İstek yapan kullanıcı.
 * @returns {object} - Güncellenmiş araç.
 */
export const updateVehicleById = async (id, updateData, requester) => {
    // getVehicleById fonksiyonu hem aracı bulur hem de yetki kontrolü yapar.
    // Eğer yetkisi yoksa veya araç bulunamazsa zaten hata fırlatacaktır.
    const vehicle = await getVehicleById(id, requester);

    await vehicle.update(updateData);
    return { success: true, vehicle };
};

/**
 * Bir aracı siler ve yetki kontrolü yapar.
 * @param {number} id - Araç ID'si.
 * @param {object} requester - İstek yapan kullanıcı.
 * @returns {object} - Başarı mesajı.
 */
export const deleteVehicleById = async (id, requester) => {
    // Yetki kontrolü ve varlık kontrolü için yine getVehicleById kullanılır.
    const vehicle = await getVehicleById(id, requester);

    await vehicle.destroy();
    return { success: true, message: 'Araç başarıyla silindi.' };
};
