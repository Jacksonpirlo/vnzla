import express, { json } from 'express';
import cors from 'cors';
import db from './db/db.js'

const app = express();
app.use(cors());
app.use(json());

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
    await db.query('INSERT INTO empleados (name, "lastName", department, age, salary, "startDate", password, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [name, lastName, department, age, salary, startDate, password, role]);
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
    await db.query('INSERT INTO empleados (user, "lastName", department, age, salary, "startDate", password, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [user, lastName, department, age, salary, startDate, password, role]);
    res.json({ message: 'Usuario agregado' });
  } catch (err) {
    res.status(500).json(err);
  }
});


app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
