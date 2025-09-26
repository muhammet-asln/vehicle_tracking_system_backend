import { login } from '../services/index.js';

export const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Servisten artık { token, user } şeklinde bir nesne dönüyor
        const { token, user } = await login(username, password);

        // Yanıt için temiz bir kullanıcı nesnesi hazırlayalım
        const userData = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            kurum_id: user.kurum_id,
            mintika_id: user.mintika_id,
            phone: user.phone,
            status: user.status,
            // İlişkili tablolardan gelen isimleri ekliyoruz
            // Eğer kurum veya mıntıka atanmamışsa (null ise) hata vermemesi için kontrol ekliyoruz
            kurum_name: user.Kurum ? user.Kurum.name : null,
            mintika_name: user.Mintika ? user.Mintika.name : null
        };

        res.status(200).json({
            message: 'Giriş başarılı!',
            success: true,
            data: {
            token: token,
            ...userData} // Tüm kullanıcı bilgilerini içeren nesneyi yanıta ekliyoruz
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Login hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
};