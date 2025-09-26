import express from 'express';
import { createMintika, getAllMintikalar, updateMintika, getMintikaById, deleteMintika } from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = express.Router();

// Sadece Admin rolüne sahip kullanıcılar bu endpoint'lere erişebilir
router.route('/')
    .post(authenticate, authorize('Admin'), createMintika)
    .get(authenticate, authorize('Admin'), getAllMintikalar);
router.route('/:id')
    .get(authenticate, authorize('Admin'), getMintikaById)
    .put(authenticate, authorize('Admin'), updateMintika)
    .delete(authenticate, authorize('Admin'), deleteMintika);

export default router;
