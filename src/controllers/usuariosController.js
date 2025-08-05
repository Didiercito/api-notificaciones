const db = require('../config/database');

const obtenerUsuarios = (req, res) => {
    const query = 'SELECT nombre FROM usuarios WHERE activo = TRUE';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
    });
};

const registrarToken = (req, res) => {
    const { nombre } = req.params;
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Token es requerido' });
    }
    
    const query = 'UPDATE usuarios SET token_fcm = ?, ultimo_acceso = NOW() WHERE nombre = ?';
    
    db.query(query, [token, nombre], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al actualizar token' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ message: 'Token actualizado exitosamente' });
    });
};

module.exports = {
    obtenerUsuarios,
    registrarToken
};