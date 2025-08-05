const db = require('../config/database');
const { enviarNotificacionFamiliar } = require('../services/notificationService');

// Registrar token FCM del dispositivo
const registrarDispositivo = async (req, res) => {
    const { fcmToken } = req.body;
    const usuarioId = req.usuario?.id;
    const usuarioNombre = req.usuario?.nombre;

    if (!fcmToken) {
        return res.status(400).json({ 
            success: false, 
            error: 'fcmToken es requerido' 
        });
    }

    if (!usuarioId) {
        return res.status(401).json({ 
            success: false, 
            error: 'Usuario no autenticado' 
        });
    }

    try {
        // Actualizar token FCM del usuario logueado
        const [result] = await db.query(
            'UPDATE usuarios SET token_fcm = ?, ultimo_acceso = NOW() WHERE id = ?',
            [fcmToken, usuarioId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        console.log(`✅ Token FCM registrado para ${usuarioNombre}: ${fcmToken.substring(0, 20)}...`);

        res.json({ 
            success: true, 
            message: 'Token FCM registrado exitosamente' 
        });

    } catch (err) {
        console.error('Error registrando token FCM:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
};

// ✅ Enviar recordatorio manual desde el dashboard admin
const enviarRecordatorio = async (req, res) => {
    const { mensaje, titulo } = req.body;
    const admin = req.usuario?.nombre;

    // Validar que sea admin (ya se valida en middleware, pero por seguridad)
    if (req.usuario?.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Solo administradores pueden enviar recordatorios' 
        });
    }

    if (!mensaje) {
        return res.status(400).json({ 
            success: false, 
            error: 'Mensaje es requerido' 
        });
    }

    try {
        const result = await enviarNotificacionFamiliar({
            type: 'admin_reminder',
            title: titulo || '📋 Recordatorio Familiar',
            body: mensaje,
            data: {
                sent_by: admin,
                is_manual: 'true'
            }
        });

        console.log(`📢 Admin ${admin} envió recordatorio: "${mensaje}"`);

        res.json({
            success: true,
            message: 'Recordatorio enviado exitosamente',
            enviados: result.sent,
            fallidos: result.failed || 0
        });

    } catch (error) {
        console.error('Error enviando recordatorio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar recordatorio',
            detalles: error.message
        });
    }
};

module.exports = {
    registrarDispositivo,
    enviarRecordatorio
};