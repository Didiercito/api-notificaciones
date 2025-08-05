const db = require('../config/database');
const { getMessaging } = require('../config/firebase');

const enviarNotificacionFamiliar = async ({ type, title, body, data = {} }) => {
    console.log(`🔔 Enviando notificación: ${type}`);
    
    try {
        const [results] = await db.query(
            'SELECT token_fcm FROM usuarios WHERE token_fcm IS NOT NULL AND activo = TRUE'
        );
        
        const tokens = results.map(row => row.token_fcm).filter(token => token);
        
        if (tokens.length === 0) {
            console.log('📱 No hay dispositivos registrados');
            return { success: true, sent: 0, message: 'No hay dispositivos' };
        }
        
        console.log(`📱 Enviando a ${tokens.length} dispositivos`);
        
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                type: type,
                ...data,
                timestamp: Date.now().toString()
            },
            tokens: tokens
        };
        
        const messaging = getMessaging();
        const response = await messaging.sendEachForMulticast(message);
        
        console.log(`✅ Notificaciones enviadas: ${response.successCount}/${tokens.length}`);
        
        if (response.failureCount > 0) {
            await limpiarTokensInvalidos(response.responses, tokens);
        }
        
        return { 
            success: true, 
            sent: response.successCount, 
            failed: response.failureCount 
        };
        
    } catch (error) {
        console.error('Error enviando notificación:', error);
        throw error;
    }
};

const enviarNotificacionAUsuario = async (nombreUsuario, mensaje) => {
    console.log(`🔔 Notificación para ${nombreUsuario}:`, mensaje);
    
    try {
        const [results] = await db.query(
            'SELECT token_fcm FROM usuarios WHERE nombre = ? AND token_fcm IS NOT NULL',
            [nombreUsuario]
        );
        
        if (results.length === 0) {
            console.log(`❌ Usuario ${nombreUsuario} no tiene token registrado`);
            return { success: false, message: 'Usuario sin token' };
        }
        
        const token = results[0].token_fcm;
        console.log(`📱 Enviando a ${nombreUsuario}`);
        
        const message = {
            notification: {
                title: '🛒 Lista de Compras',
                body: mensaje
            },
            data: {
                type: 'admin_reminder',
                usuario: nombreUsuario,
                message: mensaje,
                timestamp: Date.now().toString()
            },
            token: token
        };
        
        const messaging = getMessaging();
        const response = await messaging.send(message);
        
        console.log('✅ Notificación enviada a', nombreUsuario);
        return { success: true, messageId: response };
        
    } catch (firebaseError) {
        console.error('Error enviando con Firebase:', firebaseError);
        
        if (firebaseError.code === 'messaging/registration-token-not-registered') {
            await limpiarTokenUsuario(nombreUsuario);
        }
        
        throw firebaseError;
    }
};

const limpiarTokensInvalidos = async (responses, tokens) => {
    const tokensInvalidos = [];
    
    responses.forEach((response, index) => {
        if (!response.success) {
            const error = response.error;
            if (error.code === 'messaging/registration-token-not-registered' || 
                error.code === 'messaging/invalid-registration-token') {
                tokensInvalidos.push(tokens[index]);
            }
        }
    });
    
    if (tokensInvalidos.length > 0) {
        console.log(`🧹 Limpiando ${tokensInvalidos.length} tokens inválidos`);
        await db.query(
            'UPDATE usuarios SET token_fcm = NULL WHERE token_fcm IN (?)',
            [tokensInvalidos]
        );
    }
};

const limpiarTokenUsuario = async (nombreUsuario) => {
    console.log(`🧹 Limpiando token inválido de ${nombreUsuario}`);
    await db.query(
        'UPDATE usuarios SET token_fcm = NULL WHERE nombre = ?',
        [nombreUsuario]
    );
};

const enviarNotificacion = async (mensaje) => {
    return enviarNotificacionFamiliar({
        type: 'general',
        title: '🛒 Lista de Compras',
        body: mensaje
    });
};

module.exports = {
    enviarNotificacionFamiliar, 
    enviarNotificacion,          
    enviarNotificacionAUsuario
};