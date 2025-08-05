const express = require('express');
const router = express.Router();
const { 
    registrarDispositivo, 
    enviarRecordatorio
} = require('../controllers/fcmController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/register-device', authMiddleware, registrarDispositivo);

router.post('/send-reminder', authMiddleware, adminMiddleware, enviarRecordatorio);

module.exports = router;