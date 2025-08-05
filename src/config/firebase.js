const admin = require('firebase-admin');

let firebaseApp = null;

try {
    const serviceAccount = require('./credenciales-lista-de-compras.json');
    
    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    console.log('📝 Asegúrate de que el archivo firebase-credentials.json esté en la raíz del proyecto');
}

const getMessaging = () => {
    if (!firebaseApp) {
        throw new Error('Firebase no está inicializado');
    }
    return admin.messaging();
};

module.exports = {
    admin,
    getMessaging
};