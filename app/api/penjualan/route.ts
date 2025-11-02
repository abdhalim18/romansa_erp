import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * /api/penjualan
 * GET: list penjualan (opsional ?kasir_id=&tanggal=)
 * POST: create penjualan + detail_penjualan and decrement produk.stok
 *
 * POST body example:
 * {
 *   kasir_id: 2,
 *   tanggal_penjualan: "2025-11-02 10:00:00",
 *   total: 150000,
 *   metode_pembayaran: "tunai",
 *   detail: [
 *     { produk_id: 1, jumlah: 2, harga_jual: 50000 },
 *     ...
 *   ]
 * }
 *
 * After creating penjualan we check stok and return list of produk yang stok < 10 so UI can warn.
 */

async function createPenjualan(conn: any, kasir_id: number, tanggal_penjualan: string, total: number, metode_pembayaran: string, detail: any[]) {
  const [res] = await conn.query(
    `INSERT INTO penjualan (kasir_id, tanggal_penjualan, total, metode_pembayaran) VALUES (?, ?, ?, ?)`,
    [kasir_id, tanggal_penjualan, total, metode_pembayaran]
  );
  // @ts-ignore
  const penjualanId = res.insertId;
  for (const d of detail) {
    await conn.query(
      `INSERT INTO detail_penjualan (penjualan_id, produk_id, jumlah, harga_jual) VALUES (?, ?, ?, ?)`,
      [penjualanId, d.produk_id, d.jumlah, d.harga_jual]
    );
    // update stok produk berkurang
    await conn.query(`UPDATE produk SET stok = stok - ? WHERE id = ?`, [d.jumlah, d.produk_id]);
  }
  return penjualanId;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kasir_id = url.searchParams.get("kasir_id");
  const tanggal = url.searchParams.get("tanggal"); // format YYYY-MM-DD
  let sql = `SELECT p.*, u.nama AS nama_kasir FROM penjualan p LEFT JOIN user u ON p.kasir_id = u.id ORDER BY p.tanggal_penjualan DESC`;
  const params: any[] = [];
  if (kasir_id && tanggal) {
    sql = `SELECT p.*, u.nama AS nama_kasir FROM penjualan p LEFT JOIN user u ON p.kasir_id = u.id WHERE p.kasir_id = ? AND DATE(p.tanggal_penjualan) = ? ORDER BY p.tanggal_penjualan DESC`;
    params.push(kasir_id, tanggal);
  } else if (kasir_id) {
    sql = `SELECT p.*, u.nama AS nama_kasir FROM penjualan p LEFT JOIN user u ON p.kasir_id = u.id WHERE p.kasir_id = ? ORDER BY p.tanggal_penjualan DESC`;
    params.push(kasir_id);
  } else if (tanggal) {
    sql = `SELECT p.*, u.nama AS nama_kasir FROM penjualan p LEFT JOIN user u ON p.kasir_id = u.id WHERE DATE(p.tanggal_penjualan) = ? ORDER BY p.tanggal_penjualan DESC`;
    params.push(tanggal);
  }
  const [rows] = await db.query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { kasir_id, tanggal_penjualan, total = 0, metode_pembayaran = "tunai", detail = [] } = body;
  if (!kasir_id || !Array.isArray(detail) || detail.length === 0) {
    return NextResponse.json({ error: "kasir_id dan detail diperlukan" }, { status: 400 });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const penjualanId = await createPenjualan(conn, kasir_id, tanggal_penjualan, total, metode_pembayaran, detail);
    await conn.commit();
    conn.release();

    // After commit, check produk with stok < 10 and optionally create PO via auto PO function (external hook)
    const [lowStockRows] = await db.query("SELECT id, nama_produk, stok FROM produk WHERE stok < 10 ORDER BY stok ASC");
    return NextResponse.json({ penjualanId, warning_low_stock: lowStockRows });
  } catch (err) {
    await conn.rollback();
    conn.release();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}