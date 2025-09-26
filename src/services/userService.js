import { User, Kurum, Mintika } from '../models/index.js';
import bcrypt from 'bcryptjs';

const userIncludeOptions = [{
    model: Kurum,
    as: 'Kurum',
    required: false,
    include: [{
        model: Mintika,
        as: 'Mintika',
        required: false
    }]
}];

/**
 * Yeni bir kullanıcı oluşturur ve veritabanına kaydeder.
 * Yöneticinin belirlediği şifreyi kullanır ve bu şifreyi teyit amaçlı geri döner.
 * @param {object} userData - Yeni kullanıcı için veriler (username, password, role, etc.).
 * @param {object} requester - İsteği yapan yönetici bilgileri.
 * @returns {object} - Oluşturulan kullanıcı ve yöneticinin girdiği şifreyi içeren nesne.
 */
export const createUser = async (userData, requester) => {
    // 'password' alanı artık zorunlu
    const { username, password, role, kurum_id, mintika_id, phone, name } = userData;

    // Şifre kontrolü
    if (!password) {
        const error = new Error('Yeni kullanıcı için bir şifre belirtilmelidir.');
        error.statusCode = 400;
        throw error;
    }
        // Eğer istekte bir kurum ID'si belirtilmişse, o kurumun gerçekten belirtilen mıntıkaya
    // ait olup olmadığını kontrol et.
    if (kurum_id) {
        const targetKurum = await Kurum.findByPk(kurum_id);

        if (!targetKurum) {
            const error = new Error(`ID'si ${kurum_id} olan bir kurum bulunamadı.`);
            error.statusCode = 404; // Not Found
            throw error;
        }

        // Kurumun veritabanındaki mintika_id'si ile istekte gelen mintika_id eşleşiyor mu?
        if (targetKurum.mintika_id !==  parseInt(mintika_id) ) {
            const error = new Error(` ${typeof targetKurum.mintika_id}fh ${typeof mintika_id}Tutarsız veri: ID'si ${kurum_id} olan kurum, ID'si ${mintika_id} olan mıntıkaya ait değil.`);
            error.statusCode = 400; // Bad Request - Gelen veri kendi içinde tutarsız
            
            throw error;
        }
    }

    // === YETKİ KONTROL MANTIĞI ===
    // (Bu kısım aynı kalıyor, çünkü bu kontroller isteği yapan "yönetici" ile ilgili)
    if (requester.role === 'Mıntıka Yöneticisi') {
        // ...
    } else if (requester.role === 'Kurum Yöneticisi') {
        // ...
    }


    // === YETKİ KONTROL MANTIĞI ===
    if (requester.role === 'Mıntıka Yöneticisi') {
        if (!kurum_id) {
            const error = new Error('Atama yapılacak Kurum ID belirtilmelidir.');
            error.statusCode = 400;
            throw error;
        }
        const targetKurum = await Kurum.findByPk(kurum_id);
        if (!targetKurum) {
            const error = new Error('Belirtilen kurum bulunamadı.');
            error.statusCode = 404;
            throw error;
        }
        if (targetKurum.mintika_id !== requester.mintika_id) {
            const error = new Error('Yasaklandı: Sadece kendi mıntıkanıza bağlı kurumlara atama yapabilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    } else if (requester.role === 'Kurum Yöneticisi') {
        if (kurum_id && requester.kurum_id !== parseInt(kurum_id, 10)) {
            const error = new Error('Yasaklandı: Sadece kendi kurumunuza kullanıcı ekleyebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }

    // === KULLANICI OLUŞTURMA MANTIĞI ===
    const newUserPayload = {
        username,
        password: password, // Yöneticinin girdiği şifre (modeldeki hook bunu hash'leyecek)
        name,
        role: role || 'Kullanıcı',
        kurum_id: requester.role === 'Kurum Yöneticisi' ? requester.kurum_id : kurum_id,
        mintika_id,
        phone,
        status: true,
        crtuser: requester.username,
        crtdate: new Date()
    };

    const newUser = await User.create(newUserPayload);

    // Controller'a hem kullanıcıyı hem de girilen şifreyi geri dön
    return { newUser, providedPassword: password };
};

/**
 * Kullanıcıları listeler. Rol bazlı filtreleme uygular ve ilişkili verileri getirir.
 * @param {object} requester - İsteği yapan yönetici.
 * @returns {Array} - Kullanıcı nesnelerinden oluşan dizi.
 */
export const getAllUsers = async (requester) => {
    const whereClause = {};
    // Kopyasını alarak include yapısını dinamik olarak değiştireceğiz
    const include = JSON.parse(JSON.stringify(userIncludeOptions)); 
    
    // Modelleri kopyaya yeniden atıyoruz çünkü JSON çevrimi onları kaybeder
    include[0].model = Kurum;
    include[0].include[0].model = Mintika;

    if (requester.role === 'Mıntıka Yöneticisi') {
        // Mıntıka Yöneticisi, direkt User tablosunda mintika_id'si eşleşenleri DEĞİL,
        // BAĞLI OLDUĞU KURUM'un mintika_id'si eşleşen kullanıcıları görmelidir.
        // Bu yüzden filtreyi include içine koyuyoruz.
        include[0].where = { mintika_id: requester.mintika_id };
        include[0].required = true; // Sadece bu mıntıkadaki kurumlara bağlı kullanıcıları getir (INNER JOIN)
    } 
    else if (requester.role === 'Kurum Yöneticisi') {
        // Kurum Yöneticisi sadece kendi kurumundaki kullanıcıları görebilir.
        whereClause.kurum_id = requester.kurum_id;
    }
    // Admin herkesi görebilir, filtre yok.

    const users = await User.findAll({
        where: whereClause,
        include: include,
        attributes: { exclude: ['password'] }
    });

    return users;
};


/**
 * Belirtilen ID'ye sahip bir kullanıcının detaylarını, yetki kontrolü yaparak getirir.
 * @param {number} targetUserId - Görüntülenmek istenen kullanıcının ID'si.
 * @param {object} requester - İsteği yapan, giriş yapmış kullanıcı.
 * @returns {object} - Kullanıcı nesnesi.
 */
export const getUserById = async (targetUserId, requester) => {
    const targetUser = await User.findByPk(targetUserId, {
        include: userIncludeOptions,
        attributes: { exclude: ['password'] }
    });
    if (!targetUser) {
        const error = new Error('Kullanıcı bulunamadı.');
        error.statusCode = 404;
        throw error;
    }

    // --- YETKİ KONTROLÜ ---
    const requesterRole = requester.role;
    
    if (requesterRole === 'Admin') {
        return targetUser; // Admin herkesi görebilir.
    }
    if (requesterRole === 'Kullanıcı') {
        if (requester.id !== targetUser.id) {
            const error = new Error('Yasaklandı: Sadece kendi profilinizi görüntüleyebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }
   // Kurum Yöneticisi kendi kurumundakileri görebilir.
    if (requesterRole === 'Kurum Yöneticisi' && requester.kurum_id !== targetUser.kurum_id) {
        const error = new Error('Yasaklandı: Sadece kendi kurumunuzdaki kullanıcıları görüntüleyebilirsiniz.');
        error.statusCode = 403;
        throw error;
    }
    if (requesterRole === 'Mıntıka Yöneticisi') {
        if (requester.mintika_id !== targetUser.mintika_id) {
            const error = new Error('Yasaklandı: Sadece kendi mıntıkanızdaki kullanıcıları görüntüleyebilirsiniz.');
            error.statusCode = 403;
            throw error;
        }
    }

    return targetUser;
};

/**
 * Bir kullanıcının bilgilerini, yetki kontrolü yaparak günceller.
 * @param {number} targetUserId - Güncellenecek kullanıcının ID'si.
 * @param {object} updateData - Yeni veriler (req.body).
 * @param {object} requester - İsteği yapan, giriş yapmış kullanıcı.
 * @returns {object} - Başarı durumu.
 */
export const updateUserById = async (targetUserId, updateData, requester) => {
    const targetUser = await User.findByPk(targetUserId);

    if (!targetUser) {
        const error = new Error('Kullanıcı bulunamadı.');
        error.statusCode = 404;
        throw error;
    }

    // --- YETKİ KONTROLÜ ---
    const requesterRole = requester.role;

    if (requesterRole === 'Kullanıcı') {
        const error = new Error('Yasaklandı: Kendi bilgilerinizi düzenleme yetkiniz yok.');
        error.statusCode = 403;
        throw error;
    }
    if (requesterRole === 'Kurum Yöneticisi' && requester.kurum_id !== targetUser.kurum_id) {
        const error = new Error('Yasaklandı: Sadece kendi kurumunuzdaki kullanıcıları güncelleyebilirsiniz.');
        error.statusCode = 403;
        throw error;
    }
    if (requesterRole === 'Mıntıka Yöneticisi' && requester.mintika_id !== targetUser.mintika_id) {
        const error = new Error('Yasaklandı: Sadece kendi mıntıkanızdaki kullanıcıları güncelleyebilirsiniz.');
        error.statusCode = 403;
        throw error;
    }
    // Admin'in yetkisi tam olduğu için ekstra kontrol gerekmez.

    // Şifre güncelleme mantığı
    if (updateData.password && updateData.password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        targetUser.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // Diğer alanları güncelle (şifre hariç)
    targetUser.name = updateData.name ?? targetUser.name;
    targetUser.username = updateData.username ?? targetUser.username;
    targetUser.role = updateData.role ?? targetUser.role;
    targetUser.kurum_id = updateData.kurum_id ?? targetUser.kurum_id;
    targetUser.mintika_id = updateData.mintika_id ?? targetUser.mintika_id;
    targetUser.phone = updateData.phone ?? targetUser.phone;
    targetUser.status = updateData.status ?? targetUser.status;

    await targetUser.save();

    return { success: true };
};