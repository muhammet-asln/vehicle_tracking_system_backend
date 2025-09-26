import { Kurum  } from '../models/index.js';

/**
 * Yeni bir kurum oluşturur ve veritabanına kaydeder.
 * @param {object} kurumData - Yeni kurum için veriler.
 * @param {object} requester - İsteği yapan yönetici (Admin) bilgileri.
 * @returns {object} - Oluşturulan yeni kurum nesnesi.
 */
export const createKurum = async (kurumData, requester) => {
    const { name, responsible_name, responsible_phone, mintika_id } = kurumData;

     // Eğer isteği yapan Mıntıka Yöneticisi ise,
    // sadece kendi mıntıkasına kurum ekleyebildiğinden emin ol.
    if (requester.role === 'Mıntıka Yöneticisi') {
        // Postman'den gelen mintika_id ile yöneticinin kendi mintika_id'si aynı mı?
        if (parseInt(mintika_id, 10) !== requester.mintika_id) {
            const error = new Error('Yasaklandı: Sadece kendi mıntıkanıza kurum ekleyebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }
    if (!name || !mintika_id) {
        const error = new Error('Kurum adı ve mıntıka ID zorunludur.');
        error.statusCode = 400;
        throw error;
    }

    const newKurumPayload = {
        name,
        responsible_name,
        responsible_phone,
        mintika_id,
        crtuser: requester.username, // İşlemi yapan admin'in kullanıcı adı
        crtdate: new Date()
    };

    const newKurum = await Kurum.create(newKurumPayload);
    return newKurum;
};

/**
 * Veritabanındaki tüm kurum kayıtlarını listeler.
 * @returns {Array} - Kurum nesnelerinden oluşan bir dizi.
 */
export const getAllKurumlar = async () => {
    const kurumlar = await Kurum.findAll();
    return kurumlar;
};

/**
 * Belirtilen ID'ye sahip kurumu bulur ve döndürür.
 * @param {number} id - Aranacak kurumun ID'si.
 * @returns {object} - Bulunan kurum nesnesi.
 */
export const getKurumById = async (id) => {
    const kurum = await Kurum.findByPk(id);
    if (!kurum) {
        const error = new Error('Kurum bulunamadı.');
        error.statusCode = 404;
        throw error;
    }
    return kurum;
};

/**
 * Bir kurumun bilgilerini günceller.
 * @param {number} id - Güncellenecek kurumun ID'si.
 * @param {object} updateData - Kurum için yeni veriler (req.body).
 * @returns {object} - Başarı durumu ve güncellenmiş kurum.
 */
export const updateKurumById = async (id, updateData) => {
    // Önce kurumun var olup olmadığını kontrol et, bulunamazsa getKurumById hata fırlatacaktır.
    const kurum = await getKurumById(id);

    // Kurumu yeni verilerle güncelle
    await kurum.update(updateData);

    return { success: true, kurum };
};

/**
 * Belirtilen ID'ye sahip kurumu siler.
 * @param {number} id - Silinecek kurumun ID'si.
 * @returns {object} - Başarı durumu ve mesaj.
 */
export const deleteKurumById = async (id) => {
    // Önce kurumun var olup olmadığını kontrol et
    const kurum = await getKurumById(id);

    // Kurumu sil
    await kurum.destroy();

    return { success: true, message: 'Kurum başarıyla silindi.' };
};