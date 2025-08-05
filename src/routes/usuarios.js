const express = require('express');
const router = express.Router();
const {
    obtenerUsuarios,
    registrarToken
} = require('../controllers/usuariosController');

router.get('/', obtenerUsuarios);

router.post('/:nombre/token', registrarToken);

module.exports = router;