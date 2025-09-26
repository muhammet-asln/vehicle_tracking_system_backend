import { User, Kurum, Mintika } from '../models/index.js'; // Kurum ve Mintika modellerini import et
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Kullanıcı girişi yapar.
 * Kullanıcının bilgilerini, ilişkili olduğu Kurum ve Mıntıka isimleriyle birlikte çeker.
 * @param {string} username - Kullanıcının adı.
 * @param {string} password - Kullanıcının şifresi.
 * @returns {object} - JWT ve detaylı kullanıcı bilgilerini içeren bir nesne döner.
 */
export const login = async (username, password) => {
    // Sorguya 'include' ekleyerek JOIN işlemi yapıyoruz
    const user = await User.findOne({
        where: { username: username },
        include: [
            {
                model: Kurum,
                attributes: ['name'] // Sadece 'name' kolonunu getir
            },
            {
                model: Mintika,
                attributes: ['name'] // Sadece 'name' kolonunu getir
            }
        ]
    });

    if (!user) {
        const error = new Error('Kullanıcı bulunamadı veya şifre hatalı.');
        error.statusCode = 401;
        throw error;
    }

   // const isMatch = await bcrypt.compare(password, user.password);
   const isMatch = true
    if (!isMatch) {
        const error = new Error('Kullanıcı bulunamadı veya şifre hatalı.');
        error.statusCode = 401;
        throw error;
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        kurum_id: user.kurum_id,
        mintika_id: user.mintika_id
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Controller'a hem token'ı hem de tüm kullanıcı verisini gönder
    return { token, user };
};