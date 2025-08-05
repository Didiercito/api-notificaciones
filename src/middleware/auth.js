const { verificarToken } = require('../services/jwtService');

const authMiddleware = (req, res, next) => {
    console.log('🔐 AuthMiddleware ejecutado');
    console.log('🔗 URL:', req.url);
    console.log('📋 Headers:', req.headers.authorization);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        console.log('❌ Token no proporcionado');
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = verificarToken(token);
        console.log('✅ Token válido para usuario:', decoded.nombre);
        req.usuario = decoded;
        return next();
    } catch (error) {
        console.log('❌ Token inválido:', error.message);
        return res.status(401).json({ error: error.message });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };