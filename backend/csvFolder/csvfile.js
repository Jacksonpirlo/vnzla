import fs from "fs";
import csv from "csv-parser";
import db from "../db.js"; // Assuming db.js exports the database connection
let inserts = [];

  const uploadCSVfromBackend = (req, res) => {
  fs.createReadStream("tienda.csv")
    .pipe(csv())
    .on("data", (row) => {
      const insertPromise = db.query(
        "INSERT INTO products (product, price, amount, isActive ) VALUES ($1, $2, $3, $4)",
        [row.product, row.price, row.amount, row.isActive],
        (error, results) => {
          if (error) throw error;
          console.log(`Fila insertada: ${results.affectedRows}`);
        }
      );

      inserts.push(insertPromise);

      console.log(row);
      console.log("--");
    })
    .on("end", async () => {
      try {
        await Promise.all(inserts);
        console.log(`Insertadas ${inserts.length} filas correctamente.`);
      } catch (err) {
        console.error("Error insertando datos:", err);
      }
    });
};
