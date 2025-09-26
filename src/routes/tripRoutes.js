import express from 'express';
import { authenticate, authorize } from '../middlewares/index.js';
import { planTrip, requestVehicle } from '../controllers/index.js';

const router = express.Router();

// Yöneticilerin (Admin, Mıntıka Yöneticisi, Kurum Yöneticisi) seyahat planı oluşturacağı endpoint.
// Örneğin: POST /api/trips/plan
router.post(
    '/plan',
    authenticate,
    authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'),
    planTrip
);

// Kullanıcıların anlık araç talebi oluşturacağı endpoint.
// Örneğin: POST /api/trips/request
router.post(
    '/request',
    authenticate,
    authorize('Kullanıcı'),
    requestVehicle
);

// TODO: Seyahatleri listeleme, güncelleme, onaylama ve tamamlama için diğer rotalar buraya eklenecek.
// GET /
// PUT /:id/approve
// PUT /:id/complete

export default router;
