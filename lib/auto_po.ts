import { db } from "@/lib/db";

/**
 * Utility function yang bisa dipanggil dari server-side untuk menjalankan auto PO.
 * Mengembalikan info pembelian yang dibuat.
 *
 * Usage: import { runAutoPo } from "@/lib/auto_po"; await runAutoPo(supplier_id?)
 */

export async function runAutoPo(supplierId?: number) {
  const [rows]: any = await db.query("SELECT * FROM produk WHERE stok < 10 ORDER BY stok ASC");
  if (!rows || rows.length === 0) return { message: "none" };

  let finalSupplierId = supplierId;
  if (!finalSupplierId) {
    const [existing] = await db.query("SELECT * FROM supplier WHERE nama_supplier = ?", ["Supplier Auto"]);
    if (Array.isArray(existing) && existing.length > 0) {
      finalSupplierId = existing[0].id;
    } else {
      const [res] = await db.query("INSERT INTO supplier (nama_supplier, kontak, alamat, syarat_pembayaran) VALUES (?, ?, ?, ?)", [
        "Supplier Auto",
        "-",
        "-",
        "Net 30"
      ]);
      // @ts-ignore
      finalSupplierId = res.insertId;
    }
  }

  const suggestedRestockLevel = 50;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query("INSERT INTO pembelian (supplier_id, tanggal_pembelian, total, status) VALUES (?, CURDATE(), ?, ?)", [
      finalSupplierId,
      0,
      "permintaan"
    ]);
    // @ts-ignore
    const pembelianId = ins.insertId;
    let total = 0;
    for (const p of rows) {
      const need = suggestedRestockLevel - p.stok;
      if (need <= 0) continue;
      const harga = p.harga_beli || 0;
      await conn.query("INSERT INTO detail_pembelian (pembelian_id, produk_id, jumlah, harga_satuan) VALUES (?, ?, ?, ?)", [
        pembelianId,
        p.id,
        need,
        harga
      ]);
      total += need * harga;
    }
    await conn.query("UPDATE pembelian SET total = ? WHERE id = ?", [total, pembelianId]);
    await conn.commit();
    conn.release();
    return { success: true, pembelianId, total };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
}