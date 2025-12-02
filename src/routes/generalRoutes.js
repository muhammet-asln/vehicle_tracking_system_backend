// routes/dashboardRoutes.js (Örnek)
import express from 'express';
import { getDashboardData } from '../controllers/index.js'; // Controller'ı import edin
import { authenticate } from '../middlewares/index.js';

const router = express.Router();

// Tüm roller erişebilir, içerik serviste role göre değişir
router.get('/dashboard', authenticate, getDashboardData);

export default router;