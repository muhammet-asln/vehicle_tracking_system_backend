import express from 'express';
import { loginUser } from '../controllers/index.js';

const router = express.Router();

// /api/auth/login adresine gelen POST isteklerini loginUser fonksiyonu karşılayacak
router.post('/login', loginUser);

export default router;
