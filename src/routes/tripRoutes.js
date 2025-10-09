import express from 'express';
import { authenticate, authorize } from '../middlewares/index.js';
import { assignTrip, requestTrip, completeTrip, selectVehicleById, getCompletedTrips, getMyCurrentTrip,getAllActiveTrips } from '../controllers/index.js';

const router = express.Router();
router.get('/selectVehicle/:id', authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'), selectVehicleById);   


/**
 * Endpoint: POST /api/trips/plan
 * Açıklama: Yöneticilerin seyahat planı oluşturmasını sağlar.
 * Yetkili Roller: Admin, Mıntıka Yöneticisi, Kurum Yöneticisi
 */
router.post(
    '/assign',
    authenticate,
    authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'),
    assignTrip
);

/**
 * Endpoint: POST /api/trips/request
 * Açıklama: Herhangi bir rolün anlık araç talebi oluşturmasını sağlar.
 * Yetkili Roller: Admin, Mıntıka Yöneticisi, Kurum Yöneticisi, Kullanıcı
 * Not: Servis katmanı, kimin hangi aracı talep edebileceğini kontrol eder.
 */
router.post(
    '/request',
    authenticate,
    authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'),
    requestTrip
);

/**
 * Endpoint: POST /api/trips/:id/complete
 * Açıklama: Kullanıcının aktif bir yolculuğu tamamlamasını (aracı teslim etmesini) sağlar.
 * Yetkili Roller: Kullanıcı
 */
router.post(
    '/:id/complete',
    authenticate,
    authorize('Kullanıcı', 'Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'),
    //upload.single('last_photo'),
    completeTrip
);


/**
 * Endpoint: GET /api/trips/my-active
 * Açıklama: Giriş yapmış kullanıcının kendi aktif yolculuğunu getirir.
 * Yetkili Roller: Herkes (kendi kaydını görür).
 */
router.get(
    '/current',
    authenticate,
    authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'),
    getMyCurrentTrip
);

/**
 * Endpoint: GET /api/trips/active
 * Açıklama: Yetkiye göre filtrelenmiş, tüm aktif seyahatleri listeler.
 * Yetkili Roller: Herkes (filtreleme serviste yapılır).
 */
router.get(
    '/active',
    authenticate,
    authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'),
    getAllActiveTrips
);


/**
 * Endpoint: GET /api/trips/completed
 * Açıklama: Yetkiye göre filtrelenmiş, tamamlanmış (geçmiş) seyahatleri listeler.
 * Yetkili Roller: Tüm roller (filtreleme serviste yapılır).
 */
router.get(
    '/completed',
    authenticate,
    authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'),
    getCompletedTrips
);


export default router;