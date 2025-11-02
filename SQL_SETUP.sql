```sql
-- Buat database dan tabel sesuai spesifikasi
CREATE DATABASE IF NOT EXISTS roman_erp;
USE roman_erp;

CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','kasir'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kategori_produk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS produk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_produk VARCHAR(150) NOT NULL,
  kategori_id INT,
  stok INT DEFAULT 0,
  harga_beli DECIMAL(10,2),
  harga_jual DECIMAL(10,2),
  nomor_batch VARCHAR(50),
  tanggal_kedaluwarsa DATE,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori_produk(id)
);

CREATE TABLE IF NOT EXISTS supplier (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_supplier VARCHAR(150),
  kontak VARCHAR(100),
  alamat TEXT,
  syarat_pembayaran VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pembelian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  tanggal_pembelian DATE,
  total DECIMAL(10,2),
  status VARCHAR(50),
  FOREIGN KEY (supplier_id) REFERENCES supplier(id)
);

CREATE TABLE IF NOT EXISTS detail_pembelian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pembelian_id INT,
  produk_id INT,
  jumlah INT,
  harga_satuan DECIMAL(10,2),
  FOREIGN KEY (pembelian_id) REFERENCES pembelian(id),
  FOREIGN KEY (produk_id) REFERENCES produk(id)
);

CREATE TABLE IF NOT EXISTS penjualan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kasir_id INT,
  tanggal_penjualan DATETIME,
  total DECIMAL(10,2),
  metode_pembayaran VARCHAR(50),
  FOREIGN KEY (kasir_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS detail_penjualan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  penjualan_id INT,
  produk_id INT,
  jumlah INT,
  harga_jual DECIMAL(10,2),
  FOREIGN KEY (penjualan_id) REFERENCES penjualan(id),
  FOREIGN KEY (produk_id) REFERENCES produk(id)
);
```