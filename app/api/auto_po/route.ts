import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * /api/auto_po/trigger
 * Simple automation:
 * - Cari produk dengan stok < 10
 * - Group them and create one pembelian per supplier placeholder (this example uses supplier_id from request OR creates a "Supplier Auto" default)
 * - NOTE: This is a simple demo. In real app you'll choose supplier per produk or mapping table product->supplier.
 *
 * POST body optional: { supplier_id: number } to assign PO to an existing supplier.
 */

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const supplier_id = body?.supplier_id || null;

  // 1. ambil produk stok < 10
  const [rows]: any = await db.query("SELECT * FROM produk WHERE stok < 10 ORDER BY stok ASC");
  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: "Tidak ada produk dengan stok < 10" });
  }

  // 2. if no supplier_id, buat supplier default "Supplier Auto"
  let finalSupplierId = supplier_id;
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

  // 3. create pembelian with suggested jumlah (restock to e.g., 50 units)
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
    // update total
    await conn.query("UPDATE pembelian SET total = ? WHERE id = ?", [total, pembelianId]);
    await conn.commit();
    conn.release();
    return NextResponse.json({ success: true, pembelianId, total });
  } catch (err) {
    await conn.rollback();
    conn.release();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}