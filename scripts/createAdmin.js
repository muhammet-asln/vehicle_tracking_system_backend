import { sequelize } from '../src/config/db.js';
import { User } from '../src/models/index.js';
import readline from 'readline';

// Konsoldan kullanıcı girdisi almak için arayüz oluştur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const createAdminUser = async () => {
  try {
    // Veritabanı bağlantısını kontrol et
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    // Adım adım kullanıcıdan bilgileri al
    rl.question('Admin Adı Soyadı: ', (name) => {
      rl.question('Admin Kullanıcı Adı: ', (username) => {
        rl.question('Admin Şifresi: ', (password) => {
          rl.question('Admin Telefon Numarası (opsiyonel, boş bırakılabilir): ', async (phone) => {

            if (!name || !username || !password) {
              console.error('Hata: Ad Soyad, Kullanıcı Adı ve Şifre alanları boş olamaz.');
              rl.close();
              process.exit(1); // Hata ile çık
            }

            // Sequelize modeli ile kullanıcı oluştur.
            // Bu yöntem şifreyi otomatik olarak hash'leyecektir!
            const adminUser = await User.create({
              name: name.trim(),
              username: username.trim(),
              password: password,
              phone: phone.trim(),
              role: 'Admin', // Admin rolü, sistemdeki en yetkili roldür [cite: 1]
              status: true, // Veritabanı boolean tipine uygun
              kurum_id: null,
              mintika_id: null,
              cruser: username.trim(), // İlk kaydı kendisi oluşturduğu için
              crtdate: new Date()
            });

            console.log(`✅ '${adminUser.username}' adlı Admin kullanıcısı başarıyla oluşturuldu.`);
            rl.close();
            process.exit(0); // Başarı ile çık

          });
        });
      });
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        console.error(`❌ Hata: '${error.errors[0].value}' kullanıcı adı zaten mevcut.`);
    } else {
        console.error('❌ Admin oluşturulurken bir hata oluştu:', error);
    }
    rl.close();
    process.exit(1); // Hata ile çık
  }
};

createAdminUser();