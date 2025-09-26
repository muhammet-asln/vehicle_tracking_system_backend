import { Mintika } from '../models/index.js';

/**
 * Yeni bir mıntıka oluşturur ve veritabanına kaydeder.
 * @param {object} mintikaData - Yeni mıntıka için veriler (name, responsible_name etc.).
 * @param {object} requester - İsteği yapan yönetici (Admin) bilgileri.
 * @returns {object} - Oluşturulan yeni mıntıka nesnesi.
 */
export const createMintika = async (mintikaData, requester) => {
    const { name, responsible_name, responsible_phone } = mintikaData;

    if (!name) {
        const error = new Error('Mıntıka adı zorunludur.');
        error.statusCode = 400;
        throw error;
    }

    const newMintikaPayload = {
        name,
        responsible_name,
        responsible_phone,
        crtuser: requester.username, // İşlemi yapan admin'in kullanıcı adı
        crtdate: new Date()
    };

    const newMintika = await Mintika.create(newMintikaPayload);
    return newMintika;
};

/**
 * Veritabanındaki tüm mıntıka kayıtlarını listeler.
 * @returns {Array} - Mıntıka nesnelerinden oluşan bir dizi.
 */
export const getAllMintikalar = async () => {
    const mintikalar = await Mintika.findAll();
    return mintikalar;
};

/**
 * Belirtilen ID'ye sahip mıntıkayı bulur.
 * @param {number} id - Aranacak mıntıkanın ID'si.
 * @returns {object|null} - Bulunan mıntıka nesnesi veya bulunamazsa null.
 */
export const getMintikaById = async (id) => {
    const mintika = await Mintika.findByPk(id);
    if (!mintika) {
        const error = new Error('Mıntıka bulunamadı.');
        error.statusCode = 404;
        throw error;
    }
    return mintika;
};

/**
 * Bir mıntıkanın bilgilerini günceller.
 * @param {number} id - Güncellenecek mıntıkanın ID'si.
 * @param {object} updateData - Yeni veriler (req.body).
 * @returns {object} - Başarı durumu ve güncellenmiş mıntıka.
 */
export const updateMintikaById = async (id, updateData) => {
    const mintika = await getMintikaById(id); // Önce mıntıkanın varlığını kontrol et

    await mintika.update(updateData);
    return { success: true, mintika };
};

/**
 * Belirtilen ID'ye sahip mıntıkayı siler.
 * @param {number} id - Silinecek mıntıkanın ID'si.
 * @returns {object} - Başarı durumu.
 */
export const deleteMintikaById = async (id) => {
    const mintika = await getMintikaById(id); // Önce mıntıkanın varlığını kontrol et

    await mintika.destroy();
    return { success: true, message: 'Mıntıka başarıyla silindi.' };
};