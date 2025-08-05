const jwt = require('jsonwebtoken');

const generarToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

const verificarToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};

module.exports = {
    generarToken,
    verificarToken
};