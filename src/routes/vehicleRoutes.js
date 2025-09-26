import express from 'express';
import { createVehicle, getAllVehicles, getVehicleById, updateVehicle, deleteVehicle } from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = express.Router();

router.route('/')
    .post(authenticate, authorize('Admin', 'Kurum Yöneticisi'), createVehicle)
    .get(authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'), getAllVehicles);
router.route('/:id')
    .get(authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'), getVehicleById)
    .put(authenticate, updateVehicle)
    .delete(authenticate, deleteVehicle);

export default router;
