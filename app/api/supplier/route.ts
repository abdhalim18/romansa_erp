import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * /api/supplier
 * GET: list suppliers
 * POST: create supplier
 * PUT: update supplier (body must include id)
 * DELETE: delete supplier (body must include id)
 */

export async function GET() {
  const [rows] = await db.query("SELECT * FROM supplier ORDER BY created_at DESC");
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nama_supplier, kontak, alamat, syarat_pembayaran } = body;
  const sql = `INSERT INTO supplier (nama_supplier, kontak, alamat, syarat_pembayaran) VALUES (?, ?, ?, ?)`;
  const [result] = await db.query(sql, [nama_supplier, kontak, alamat, syarat_pembayaran]);
  // @ts-ignore
  const insertId = result.insertId;
  const [rows] = await db.query("SELECT * FROM supplier WHERE id = ?", [insertId]);
  return NextResponse.json(rows[0]);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, nama_supplier, kontak, alamat, syarat_pembayaran } = body;
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
  await db.query(
    `UPDATE supplier SET nama_supplier=?, kontak=?, alamat=?, syarat_pembayaran=? WHERE id=?`,
    [nama_supplier, kontak, alamat, syarat_pembayaran, id]
  );
  const [rows] = await db.query("SELECT * FROM supplier WHERE id = ?", [id]);
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
  await db.query("DELETE FROM supplier WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}