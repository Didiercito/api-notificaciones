const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const productosRoutes = require('./src/routes/productos');
const usuariosRoutes = require('./src/routes/usuarios');
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));


app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);

async function startServer() {
    try {
        
        app.listen(PORT, () => {
            console.log('✅ Firebase inicializado correctamente');
            console.log('✅ Conectado a MySQL');
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
        process.exit(1);
    }
}

startServer();