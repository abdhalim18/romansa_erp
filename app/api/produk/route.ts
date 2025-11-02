import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * API Endpoint: /api/produk
 * Methods:
 *  - GET: list produk (opsional query ?kategori=, ?stok=low)
 *  - POST: buat produk
 *  - PUT: update produk (body must include id)
 *  - DELETE: hapus produk (body must include id)
 */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kategori = url.searchParams.get("kategori");
  const stok = url.searchParams.get("stok"); // e.g., "low" => stok < 10

  let sql = `SELECT p.*, kp.nama_kategori FROM produk p LEFT JOIN kategori_produk kp ON p.kategori_id = kp.id`;
  const params: any[] = [];
  const wheres: string[] = [];
  if (kategori) {
    wheres.push("kp.nama_kategori = ?");
    params.push(kategori);
  }
  if (stok === "low") {
    wheres.push("p.stok < 10");
  }
  if (wheres.length) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY p.nama_produk ASC";
  const [rows] = await db.query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    nama_produk,
    kategori_id = null,
    stok = 0,
    harga_beli = 0,
    harga_jual = 0,
    nomor_batch = null,
    tanggal_kedaluwarsa = null,
    deskripsi = null
  } = body;

  const sql = `INSERT INTO produk
    (nama_produk,kategori_id,stok,harga_beli,harga_jual,nomor_batch,tanggal_kedaluwarsa,deskripsi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [nama_produk, kategori_id, stok, harga_beli, harga_jual, nomor_batch, tanggal_kedaluwarsa, deskripsi];
  const [result] = await db.query(sql, params);
  // @ts-ignore
  const insertId = result.insertId;
  const [rows] = await db.query("SELECT * FROM produk WHERE id = ?", [insertId]);
  return NextResponse.json(rows[0]);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const {
    id,
    nama_produk,
    kategori_id = null,
    stok = 0,
    harga_beli = 0,
    harga_jual = 0,
    nomor_batch = null,
    tanggal_kedaluwarsa = null,
    deskripsi = null
  } = body;

  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

  const sql = `UPDATE produk SET nama_produk=?, kategori_id=?, stok=?, harga_beli=?, harga_jual=?, nomor_batch=?, tanggal_kedaluwarsa=?, deskripsi=? WHERE id=?`;
  const params = [nama_produk, kategori_id, stok, harga_beli, harga_jual, nomor_batch, tanggal_kedaluwarsa, deskripsi, id];
  await db.query(sql, params);
  const [rows] = await db.query("SELECT * FROM produk WHERE id = ?", [id]);
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
  await db.query("DELETE FROM produk WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}