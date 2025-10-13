import express from 'express';
import { createKurum, getAllKurumlar, getKurumById , updateKurum , deleteKurum} from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = express.Router();

// Sadece Admin rolüne sahip kullanıcılar bu endpoint'lere erişebilir
router.route('/')
    .post(authenticate, authorize('Admin', 'Mıntıka Yöneticisi'), createKurum)
    .get(authenticate, authorize('Admin','Mıntıka Yöneticisi'), getAllKurumlar);
router.route('/:id')
    .get(authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'), getKurumById)
    .put(authenticate, authorize('Admin', 'Mıntıka Yöneticisi'), updateKurum)
    .delete(authenticate, authorize('Admin'), deleteKurum);


export default router;
