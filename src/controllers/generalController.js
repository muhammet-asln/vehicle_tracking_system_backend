import { getDashboardStats } from '../services/index.js';

export const getDashboardData = async (req, res) => {
    try {
        // req.user authMiddleware'den geliyor
        const stats = await getDashboardStats(req.user);
        
        res.status(200).json({
            success: true,
            message: 'Dashboard verileri başarıyla getirildi.',
            data: stats
        });
    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).json({ success: false, message: error.message || 'Sunucu hatası.' });
    }
};