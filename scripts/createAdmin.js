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

    // Kullanıcıdan bilgileri al
    rl.question('Admin kullanıcı adını girin: ', (username) => {
      rl.question('Admin şifresini girin: ', async (password) => {
        if (!username || !password) {
          console.error('Kullanıcı adı ve şifre boş olamaz.');
          rl.close();
          return;
        }

        // Sequelize modeli ile kullanıcı oluştur. 
        // Bu yöntem şifreyi otomatik olarak hash'leyecektir!
        const adminUser = await User.create({
          username: username.trim(),
          password: password,
          role: 'Admin', // Rol dokümandaki gibi 'Admin' [cite: 27]
          status: 'true' // Aktif kullanıcı
        });

        console.log(`✅ '${adminUser.username}' adlı Admin kullanıcısı başarıyla oluşturuldu.`);
        rl.close();
      });
    });

  } catch (error) {
    console.error('❌ Admin oluşturulurken bir hata oluştu:', error);
    rl.close();
  }
};

createAdminUser();
