import * as userService from '../services/index.js';

/**
 * Gelen user nesnesini ön yüzün istediği formata dönüştürür.
 * @param {object} user - Sequelize'den gelen user nesnesi.
 * @returns {object} - Düzleştirilmiş ve temizlenmiş user nesnesi.
 */
const transformUserData = (user) => {
    const plainUser = user.toJSON();
    // Not: Servis katmanında zaten şifreyi hariç tuttuk ama burada yine de silebiliriz.
    delete plainUser.password;

    return {
        ...plainUser,
        kurum_name: plainUser.Kurum?.name || null,
        mintika_name: plainUser.Kurum?.Mintika?.name || null,
        Kurum: undefined, // İç içe objeyi yanıttan kaldır
    };
};

/**
 * /register endpoint'ini yönetir.
 * Gelen isteği userService'e yönlendirir ve sonucu kullanıcıya döner.
 */
export const registerUser = async (req, res) => {
    try {
        // Servis artık { newUser, providedPassword } şeklinde bir nesne döndürüyor
        const { newUser, providedPassword } = await userService.createUser(req.body, req.user);

        // Yanıta, yöneticinin girdiği şifreyi ekliyoruz.
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu.',
            success: true,
            data: {
                id: newUser.id,
                username: newUser.username,
                password: providedPassword // Test için şifreyi geri döndür
            }
        });
    } catch (error) {
        // Servisten gelen özel hataları yakala
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        // Veritabanı (unique constraint) hatasını yakala
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Bu kullanıcı adı zaten mevcut.' });
        }
        // Beklenmedik diğer tüm sunucu hataları
        console.error("Kullanıcı kaydı hatası:", error);
        res.status(500).json({ message: 'Kullanıcı oluşturulurken bir sunucu hatası oluştu.' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers(req.user);
        const transformedData = users.map(transformUserData);
        const response= {
            message: "Kullanıcılar başarıyla getirildi.",
            success: true,
            data: transformedData
        }
        res.status(200).json(response);
    } catch (error) {
        console.error('Kullanıcıları listeleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

// ... mevcut registerUser ve getAllUsers fonksiyonları ...

export const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(parseInt(req.params.id, 10), req.user);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        const transformedData = transformUserData(user);

        const response= {
            message: "Kullanıcı detayı başarıyla getirildi.",
            success: true,
            data:transformedData
        }
        res.status(200).json(response);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Kullanıcı detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};

export const updateUser = async (req, res) => {
    try {
        const result = await userService.updateUserById(parseInt(req.params.id, 10), req.body, req.user);
        const response= {
            message: "Kullanıcı başarıyla güncellendi.",
            success: true,
            data: result
        }
        res.status(200).json(response);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Kullanıcı güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};
