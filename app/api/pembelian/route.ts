import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * /api/pembelian
 * GET: list pembelian (opsional ?supplier_id=)
 * POST: create pembelian + detail_pembelian and update produk.stok
 *
 * POST body example:
 * {
 *   supplier_id: 1,
 *   tanggal_pembelian: "2025-11-02",
 *   total: 100000,
 *   status: "diterima",
 *   detail: [
 *     { produk_id: 1, jumlah: 10, harga_satuan: 5000 },
 *     ...
 *   ]
 * }
 */

async function createPembelian(transactionConn: any, supplier_id: number, tanggal_pembelian: string, total: number, status: string, detail: any[]) {
  const [res] = await transactionConn.query(
    `INSERT INTO pembelian (supplier_id, tanggal_pembelian, total, status) VALUES (?, ?, ?, ?)`,
    [supplier_id, tanggal_pembelian, total, status]
  );
  // @ts-ignore
  const pembelianId = res.insertId;
  for (const d of detail) {
    await transactionConn.query(
      `INSERT INTO detail_pembelian (pembelian_id, produk_id, jumlah, harga_satuan) VALUES (?, ?, ?, ?)`,
      [pembelianId, d.produk_id, d.jumlah, d.harga_satuan]
    );
    // update stok produk bertambah
    await transactionConn.query(`UPDATE produk SET stok = stok + ? WHERE id = ?`, [d.jumlah, d.produk_id]);
  }
  return pembelianId;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const supplier_id = url.searchParams.get("supplier_id");
  let sql = `SELECT p.*, s.nama_supplier FROM pembelian p LEFT JOIN supplier s ON p.supplier_id = s.id ORDER BY p.tanggal_pembelian DESC`;
  const params: any[] = [];
  if (supplier_id) {
    sql = `SELECT p.*, s.nama_supplier FROM pembelian p LEFT JOIN supplier s ON p.supplier_id = s.id WHERE p.supplier_id = ? ORDER BY p.tanggal_pembelian DESC`;
    params.push(supplier_id);
  }
  const [rows] = await db.query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { supplier_id, tanggal_pembelian, total = 0, status = "diterima", detail = [] } = body;
  if (!supplier_id || !Array.isArray(detail) || detail.length === 0) {
    return NextResponse.json({ error: "supplier_id dan detail diperlukan" }, { status: 400 });
  }

  // Use transaction via getConnection
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const pembelianId = await createPembelian(conn, supplier_id, tanggal_pembelian, total, status, detail);
    await conn.commit();
    conn.release();
    const [rows] = await db.query("SELECT * FROM pembelian WHERE id = ?", [pembelianId]);
    return NextResponse.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    conn.release();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}