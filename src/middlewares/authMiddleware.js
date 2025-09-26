import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';


export const authenticate = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                 return res.status(401).json({ message: 'Bu kullanıcı bulunamadı.' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Yetkisiz erişim, token geçersiz.' });
        }
    } else {
        return res.status(401).json({ message: 'Yetkisiz erişim, token bulunamadı.' });
    }
};

// exports.authorize yerine export const kullanılır
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Erişim reddedildi. Bu işlem için gerekli yetki: ${roles.join(', ')}` 
            });
        }
        next();
    };
};
