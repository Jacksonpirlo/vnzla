import express, { json } from 'express';
import cors from 'cors';
import db from './db/db.js'
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parseAndInsertCSV } from './csvFolder/csvfile.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Asegurar carpeta uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subir archivos CSV a una carpeta temporal
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.csv';
      cb(null, `csv_${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsv) return cb(new Error('Solo se permiten archivos .csv'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Endpoint para subir CSV y cargarlo a la DB
app.post('/api/csv/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const result = await parseAndInsertCSV(req.file.path);

    // Limpia el archivo temporal (no hace fallar si ya no existe)
    await fs.promises.unlink(req.file.path).catch(() => {});

    res.json({ message: 'CSV procesado', ...result });
  } catch (err) {
    console.error('Error procesando CSV:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
});

// Obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Agregar nuevo producto
app.post('/api/products', async (req, res) => {
  const { product, price, amount, isActive } = req.body;
  console.log('Datos del producto recibidos:', req.body);
  try {
    await db.query('INSERT INTO products ("product", price, amount, "isActive") VALUES ($1, $2, $3, $4)', [product, price, amount, isActive]);
    res.json({ message: 'Producto agregado' });
  } catch (err) {
    console.error('Error al agregar producto:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Actualizar producto
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { product, price, amount, isActive } = req.body;
  console.log('Actualizando producto:', id, req.body);
  try {
    await db.query('UPDATE products SET "product" = $1, price = $2, amount = $3, "isActive" = $4 WHERE id = $5', [product, price, amount, isActive, id]);
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Eliminar producto
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Eliminando producto con ID:', id);
  try {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM empleados');
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Agregar nuevo usuario
app.post('/api/users', async (req, res) => {
  const { name, lastName, department, age, salary, startDate, password, role } = req.body;
  console.log('Datos recibidos:', req.body);
  try {
    const hashed = await bcrypt.hash(String(password), 10);
    await db.query('INSERT INTO empleados (name, "lastName", department, age, salary, "startDate", password, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [name, lastName, department, age, salary, startDate, hashed, role]);
    res.json({ message: 'Usuario agregado' });
  } catch (err) {
    console.error('Error al agregar usuario:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

app.post('/api/users/addUser', async (req, res) => {
  const { user, lastName, department, age, salary, startDate, password, role } = req.body;
   console.log('Datos recibidos:', req.body);
  try {
    const hashed = await bcrypt.hash(String(password), 10);
    await db.query('INSERT INTO empleados (user, "lastName", department, age, salary, "startDate", password, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [user, lastName, department, age, salary, startDate, hashed, role]);
    res.json({ message: 'Usuario agregado' });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login: verifica password con bcrypt
app.post('/api/auth/login', async (req, res) => {
  try {
    const username = req.body.user || req.body.name;
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const { rows } = await db.query('SELECT id, name, "user", password, role FROM empleados WHERE name = $1 OR "user" = $1 LIMIT 1', [username]);
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'Usuario o contraseña inválidos' });

    const stored = u.password == null ? '' : String(u.password);

    let ok = false;
    if (stored.startsWith('$2')) {
      // Parece hash bcrypt
      ok = await bcrypt.compare(password, stored);
    } else {
      // Posible texto plano (compatibilidad)
      ok = stored === password;
      if (ok) {
        // Actualiza a hash para mayor seguridad
        try {
          const newHash = await bcrypt.hash(password, 10);
          await db.query('UPDATE empleados SET password = $1 WHERE id = $2', [newHash, u.id]);
        } catch (_) {
          // Silenciar error de actualización, el login sigue siendo válido
        }
      }
    }

    if (!ok) return res.status(401).json({ error: 'Usuario o contraseña inválidos' });

    res.json({ ok: true, role: u.role || 'user', user: u.name || u.user });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
