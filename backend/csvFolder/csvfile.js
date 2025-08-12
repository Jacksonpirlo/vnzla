import fs from 'fs';
import csv from 'csv-parser';
import db from '../db/db.js';

export async function parseAndInsertCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    // Lee el CSV subido y acumula las filas
    const stream = fs
      .createReadStream(filePath)
      .pipe(csv({
        separator: ',',
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
      }));

    stream
      .on('data', (row) => {
        rows.push(row);
      })
      .on('error', (err) => reject(err))
      .on('end', async () => {
        let inserted = 0;
        let failed = 0;

        try {
          // Inserta cada fila. Manteniendo simpleza y claridad.
          for (const row of rows) {
            try {
              const product = row.product || row.Product || row.PRODUCT || row.nombre || row.name;
              const priceRaw = row.price || row.Price || row.Precio || row.precio;
              const amountRaw = row.amount || row.Amount || row.cantidad || row.Cantidad;
              const isActiveRaw = row.isActive || row.active || row.Activo || row.activo;

              if (!product) {
                failed++;
                continue;
              }

              const price = priceRaw !== undefined && priceRaw !== '' ? Number(priceRaw) : 0;
              const amount = amountRaw !== undefined && amountRaw !== '' ? parseInt(amountRaw, 10) : 0;

              const onStr = (isActiveRaw ?? '').toString().toLowerCase();
              const isActive = ['true', '1', 'si', 'sí', 'yes', 'y', 'on'].includes(onStr);

              await db.query(
                'INSERT INTO products ("product", price, amount, "isActive") VALUES ($1, $2, $3, $4)',
                [product, price, amount, isActive]
              );
              inserted++;
            } catch (errRow) {
              failed++;
              // Continúa con las demás filas para mantener simpleza
            }
          }

          resolve({ total: rows.length, inserted, failed });
        } catch (err) {
          reject(err);
        }
      });
  });
}
