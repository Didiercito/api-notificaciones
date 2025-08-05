const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);

router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.json({ message: 'Ruta solo para administradores' });
});

module.exports = router;