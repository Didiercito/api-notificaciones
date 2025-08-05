const mysql = require('mysql2/promise'); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('✅ Conectado a MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err);
        process.exit(1);
    });

module.exports = pool;