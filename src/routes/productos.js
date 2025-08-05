const express = require('express');
const router = express.Router();
const {
    obtenerProductos,
    agregarProducto,
    marcarComprado,
    eliminarProducto
} = require('../controllers/productosController');

const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', agregarProducto);
router.get('/', obtenerProductos);
router.put('/:id/comprado', marcarComprado);
router.delete('/:id', eliminarProducto);

module.exports = router;
