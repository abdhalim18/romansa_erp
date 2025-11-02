import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * /api/kategori_produk
 * GET: list kategori
 * POST: create kategori { nama_kategori }
 * DELETE: delete kategori { id }
 */

export async function GET() {
  const [rows] = await db.query("SELECT * FROM kategori_produk ORDER BY nama_kategori ASC");
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nama_kategori } = body;
  if (!nama_kategori) return NextResponse.json({ error: "nama_kategori diperlukan" }, { status: 400 });
  const [res] = await db.query("INSERT INTO kategori_produk (nama_kategori) VALUES (?)", [nama_kategori]);
  // @ts-ignore
  const insertId = res.insertId;
  const [rows] = await db.query("SELECT * FROM kategori_produk WHERE id = ?", [insertId]);
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
  // Optional: check if products reference this category and prevent delete or set null
  await db.query("DELETE FROM kategori_produk WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}