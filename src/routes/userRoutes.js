import express from 'express';
// Controller ve Middleware'ler named export olduğu için süslü parantez içinde import edilir
import {  registerUser, getAllUsers, getUserById, updateUser } from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = express.Router();


// GET /api/users -> Tüm (yetkili olunan) kullanıcıları listeler
router.get('/', authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'), getAllUsers);

// POST /api/users/register -> Yeni kullanıcı oluşturur
router.post('/register', authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'), registerUser);

// GET /api/users/:id -> Belirli bir kullanıcının detayını getirir
router.get('/:id', authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'), getUserById);

// PUT /api/users/:id -> Belirli bir kullanıcının bilgilerini günceller
router.put('/:id', authenticate, authorize('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi'), updateUser);

export default router;