const db = require('../config/database');
const { enviarNotificacionFamiliar } = require('../services/notificationService');

const obtenerProductos = async (req, res) => {
    try {
        const [productos] = await db.query('SELECT * FROM productos ORDER BY fecha_agregado DESC');
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

const agregarProducto = async (req, res) => {
    const { nombre } = req.body; 
    const agregado_por = req.usuario?.nombre;

    if (!agregado_por) {
        return res.status(400).json({ error: 'Usuario no autenticado' });
    }

    if (!nombre) {
        return res.status(400).json({ error: 'Nombre del producto es requerido' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO productos (nombre, agregado_por) VALUES (?, ?)',
            [nombre, agregado_por]
        );
        
        const producto = {
            id: result.insertId,
            nombre,
            agregado_por
        };

        // ✅ Enviar notificación a toda la familia
        try {
            await enviarNotificacionFamiliar({
                type: 'product_added',
                title: 'Producto agregado 🛒',
                body: `${agregado_por} agregó '${nombre}' a la lista`,
                data: {
                    product_name: nombre,
                    added_by: agregado_por,
                    product_id: result.insertId.toString()
                }
            });
        } catch (notifError) {
            console.error('Error enviando notificación:', notifError);
            // No fallar la operación si la notificación falla
        }

        res.json(producto);
    } catch (err) {
        res.status(500).json({ 
            error: 'Error al agregar producto',
            detalles: err.message
        });
    }
};

const marcarComprado = async (req, res) => {
    const { id } = req.params;
    const { comprado } = req.body;
    const fechaComprado = comprado ? new Date() : null;
    const usuario = req.usuario?.nombre;

    try {
        const estadoComprado = comprado ? 1 : 0;

        const [result] = await db.query(
            'UPDATE productos SET comprado = ?, fecha_comprado = ? WHERE id = ?',
            [estadoComprado, fechaComprado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Obtener el producto actualizado
        const [updatedProduct] = await db.query(
            'SELECT * FROM productos WHERE id = ?',
            [id]
        );

        const producto = updatedProduct[0];

        // ✅ Enviar notificación solo si se marcó como comprado
        if (comprado) {
            try {
                await enviarNotificacionFamiliar({
                    type: 'product_purchased',
                    title: 'Producto comprado ✅',
                    body: `${usuario} marcó '${producto.nombre}' como comprado`,
                    data: {
                        product_name: producto.nombre,
                        purchased_by: usuario,
                        product_id: id
                    }
                });
            } catch (notifError) {
                console.error('Error enviando notificación:', notifError);
            }
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            producto: producto
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Error al actualizar producto',
            detalles: err.message
        });
    }
};

const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    const usuario = req.usuario?.nombre;

    try {
        const [selectResult] = await db.query('SELECT nombre FROM productos WHERE id = ?', [id]);
        
        if (selectResult.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const nombreProducto = selectResult[0].nombre;

        await db.query('DELETE FROM productos WHERE id = ?', [id]);

        // ✅ Enviar notificación de eliminación
        try {
            await enviarNotificacionFamiliar({
                type: 'product_deleted',
                title: 'Producto eliminado 🗑️',
                body: `${usuario} eliminó '${nombreProducto}' de la lista`,
                data: {
                    product_name: nombreProducto,
                    deleted_by: usuario,
                    product_id: id
                }
            });
        } catch (notifError) {
            console.error('Error enviando notificación:', notifError);
        }

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};

module.exports = {
    obtenerProductos,
    agregarProducto,
    marcarComprado,
    eliminarProducto
};

