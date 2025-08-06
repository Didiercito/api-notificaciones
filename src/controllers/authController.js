// RUTA: src/controllers/authController.js

const db = require('../config/database');
const { generarToken } = require('../services/jwtService');
const bcrypt = require('bcrypt');

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// La función de registro no cambia
const register = async (req, res) => {
  const { nombre, email, password, rol = 'familia' } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nombre, email y contraseña son requeridos' 
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'El email no tiene un formato válido' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      success: false, 
      error: 'La contraseña debe tener al menos 8 caracteres' 
    });
  }

  try {
    const [existingUser] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?', 
      [email.toLowerCase()]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El email ya está registrado' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.query(
      `INSERT INTO usuarios 
      (nombre, email, password_hash, rol, activo) 
      VALUES (?, ?, ?, ?, TRUE)`,
      [nombre, email.toLowerCase(), passwordHash, rol]
    );

    return res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente' 
    });

  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
};


// ==========================================================
// ===== ESTA ES LA FUNCIÓN ACTUALIZADA Y MÁS IMPORTANTE =====
// ==========================================================
const login = async (req, res) => {
  // 1. AHORA RECIBIMOS TAMBIÉN el fcm_token
  const { email, password, fcm_token } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email y contraseña son requeridos' 
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trimmedPassword = password.trim();

  try {
    const [users] = await db.query(
      `SELECT id, nombre, email, password_hash, rol, activo 
      FROM usuarios WHERE email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    const user = users[0];
    
    if (!user.activo) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cuenta desactivada' 
      });
    }
    
    const match = await bcrypt.compare(trimmedPassword, user.password_hash);

    if (!match) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    // 2. LÓGICA AÑADIDA: Si el login es correcto, guardamos el token FCM
    if (fcm_token) {
      console.log(`✅ Actualizando token FCM para ${user.nombre} durante el login...`);
      // Usamos la columna 'token_fcm' que ya tienes en tu base de datos
      await db.query(
        'UPDATE usuarios SET token_fcm = ?, ultimo_acceso = NOW() WHERE id = ?',
        [fcm_token, user.id]
      );
    } else {
      // Si por alguna razón no viene el token, al menos actualizamos la fecha de acceso
      await db.query(
        'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
        [user.id]
      );
    }

    const token = generarToken({
      id: user.id,
      email: user.email,
      nombre: user.nombre, 
      rol: user.rol
    });

    return res.json({
      success: true,
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
    
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor'
    });
  }
};

module.exports = { 
  register, 
  login 
};