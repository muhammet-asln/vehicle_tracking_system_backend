// list-routes.js
import listEndpoints from 'express-list-endpoints';
import app from '../src/app.js'; // app.js yolunun doğru olduğundan emin olun
import fs from 'fs';

try {
    // Tüm endpointleri çek
    const endpoints = listEndpoints(app);

    // Okunabilir bir formata çevir
    // Örn: [GET] /api/users
    const formattedRoutes = endpoints.map(route => {
        const methods = route.methods.join(', ');
        return `[${methods}] \t ${route.path}`;
    }).join('\n');

    // Dosyaya yazdır
    fs.writeFileSync('all_endpoints.txt', formattedRoutes);

    console.log('✅ Tüm endpointler "all_endpoints.txt" dosyasına yazdırıldı.');
    
    // İşlem bitince, app.js içindeki açık DB bağlantılarını kapatmak için çıkış yap
    process.exit(0);

} catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
}