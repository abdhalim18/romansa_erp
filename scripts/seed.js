/**
 * Seeder script (Node.js)
 * - membuat akun admin (email admin@roman.test, password: admin123) -- password di-hash
 * - membuat sample kategori, produk, supplier
 *
 * Jalankan: node scripts/seed.js
 *
 * Pastikan environment variables sudah di-set, atau ubah koneksi db di bawah sesuai kebutuhan.
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "roman_erp",
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    // 1. create admin user if not exists
    const adminEmail = "admin@roman.test";
    const adminPass = "admin123";
    const [users] = await pool.query("SELECT * FROM user WHERE email = ?", [adminEmail]);
    if (Array.isArray(users) && users.length === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await pool.query("INSERT INTO user (nama, email, password, role) VALUES (?, ?, ?, ?)", [
        "Admin Roman",
        adminEmail,
        hash,
        "admin"
      ]);
      console.log("User admin created ->", adminEmail, "password:", adminPass);
    } else {
      console.log("User admin already exists:", adminEmail);
    }

    // 2. create kasir user
    const kasirEmail = "kasir@roman.test";
    const kasirPass = "kasir123";
    const [kasirs] = await pool.query("SELECT * FROM user WHERE email = ?", [kasirEmail]);
    if (Array.isArray(kasirs) && kasirs.length === 0) {
      const hash = await bcrypt.hash(kasirPass, 10);
      await pool.query("INSERT INTO user (nama, email, password, role) VALUES (?, ?, ?, ?)", [
        "Kasir Roman",
        kasirEmail,
        hash,
        "kasir"
      ]);
      console.log("User kasir created ->", kasirEmail, "password:", kasirPass);
    } else {
      console.log("User kasir already exists:", kasirEmail);
    }

    // 3. sample kategori
    const kategoris = ["Obat", "Vitamin", "Vaksin", "Suplemen", "Pakan", "Aksesoris"];
    for (const k of kategoris) {
      const [r] = await pool.query("SELECT * FROM kategori_produk WHERE nama_kategori = ?", [k]);
      if (Array.isArray(r) && r.length === 0) {
        await pool.query("INSERT INTO kategori_produk (nama_kategori) VALUES (?)", [k]);
      }
    }
    console.log("Kategori sample siap.");

    // 4. sample supplier
    const [sup] = await pool.query("SELECT * FROM supplier WHERE nama_supplier = ?", ["PT. Farma Animal"]);
    if (!Array.isArray(sup) || sup.length === 0) {
      await pool.query(
        "INSERT INTO supplier (nama_supplier, kontak, alamat, syarat_pembayaran) VALUES (?, ?, ?, ?)",
        ["PT. Farma Animal", "08123456789", "Jl. Veteriner No.10", "Net 30"]
      );
    }
    console.log("Supplier sample siap.");

    // 5. sample produk
    const [cats] = await pool.query("SELECT * FROM kategori_produk");
    const catMap = {};
    for (const c of cats) catMap[c.nama_kategori] = c.id;

    const sampleProducts = [
      { nama: "Antibiotik A", kategori: "Obat", stok: 5, hb: 10000, hj: 15000, batch: "A-001", exp: "2026-02-01" },
      { nama: "Vitamin C", kategori: "Vitamin", stok: 25, hb: 5000, hj: 8000, batch: "V-010", exp: "2026-06-15" },
      { nama: "Vaksin Rabies", kategori: "Vaksin", stok: 8, hb: 20000, hj: 30000, batch: "VX-100", exp: "2025-12-01" },
      { nama: "Pakan Protein", kategori: "Pakan", stok: 50, hb: 20000, hj: 26000, batch: "P-500", exp: "2027-01-01" }
    ];

    for (const p of sampleProducts) {
      const [exists] = await pool.query("SELECT * FROM produk WHERE nama_produk = ?", [p.nama]);
      if (!Array.isArray(exists) || exists.length === 0) {
        await pool.query(
          "INSERT INTO produk (nama_produk, kategori_id, stok, harga_beli, harga_jual, nomor_batch, tanggal_kedaluwarsa, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [p.nama, catMap[p.kategori] || null, p.stok, p.hb, p.hj, p.batch, p.exp, `${p.nama} sample`]
        );
      }
    }
    console.log("Produk sample siap.");

    console.log("Seeding selesai.");
    await pool.end();
  } catch (err) {
    console.error("Seeder failed:", err);
    process.exit(1);
  }
})();