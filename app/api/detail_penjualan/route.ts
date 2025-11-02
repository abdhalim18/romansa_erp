import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Endpoint pembantu untuk admin dashboard: join detail_penjualan dengan produk untuk reporting
 * GET: list detail_penjualan dengan nama produk
 */

export async function GET() {
  const [rows] = await db.query(
    `SELECT dp.*, p.nama_produk FROM detail_penjualan dp LEFT JOIN produk p ON dp.produk_id = p.id ORDER BY dp.id DESC`
  );
  return NextResponse.json(rows);
}