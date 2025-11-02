"use client";
import { useEffect, useState } from "react";
import { formatTanggalIndonesia } from "@/lib/utils";

/**
 * Admin: CRUD Produk (contoh sederhana)
 * - List produk
 * - Filter berdasarkan kategori atau stok rendah
 * - Tambah produk / Edit produk (modal-like inline form)
 */

type Produk = {
  id?: number;
  nama_produk: string;
  kategori_id?: number | null;
  stok?: number;
  harga_beli?: number;
  harga_jual?: number;
  nomor_batch?: string;
  tanggal_kedaluwarsa?: string | null;
  deskripsi?: string | null;
  nama_kategori?: string;
};

export default function ProdukAdminPage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<any[]>([]);
  const [qKategori, setQKategori] = useState<string>("");
  const [stokFilter, setStokFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Produk | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchKategori();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const params = new URLSearchParams();
    if (qKategori) params.set("kategori", qKategori);
    if (stokFilter) params.set("stok", stokFilter);
    const res = await fetch("/api/produk?" + params.toString()).then(r => r.json());
    setProduk(Array.isArray(res) ? res : []);
    setLoading(false);
  }

  async function fetchKategori() {
    const res = await fetch("/api/kategori_produk").then(r => r.json());
    setKategori(Array.isArray(res) ? res : []);
  }

  function openNew() {
    setEditing({
      nama_produk: "",
      kategori_id: null,
      stok: 0,
      harga_beli: 0,
      harga_jual: 0,
      nomor_batch: "",
      tanggal_kedaluwarsa: null,
      deskripsi: ""
    });
    setShowForm(true);
  }

  function openEdit(p: Produk) {
    setEditing({ ...p });
    setShowForm(true);
  }

  async function save() {
    if (!editing) return;
    const payload = { ...editing };
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/produk", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json());
    setShowForm(false);
    setEditing(null);
    fetchAll();
  }

  async function remove(id?: number) {
    if (!id) return;
    if (!confirm("Hapus produk ini?")) return;
    await fetch("/api/produk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Manajemen Produk</h2>
        <div>
          <button onClick={openNew} className="bg-indigo-600 text-white px-3 py-1 rounded">Tambah Produk</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={qKategori} onChange={e => setQKategori(e.target.value)} className="border p-2 rounded">
          <option value="">Semua Kategori</option>
          {kategori.map(k => <option key={k.id} value={k.nama_kategori}>{k.nama_kategori}</option>)}
        </select>

        <select value={stokFilter} onChange={e => setStokFilter(e.target.value)} className="border p-2 rounded">
          <option value="">Semua Stok</option>
          <option value="low">Stok Rendah (&lt;10)</option>
        </select>

        <button onClick={fetchAll} className="bg-slate-700 text-white px-3 py-1 rounded">Filter</button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Nama</th>
              <th className="p-2 text-left">Kategori</th>
              <th className="p-2 text-right">Stok</th>
              <th className="p-2 text-right">Harga Jual</th>
              <th className="p-2 text-left">Batch / Exp</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-4 text-center">Memuat...</td></tr>}
            {!loading && produk.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.nama_produk}</td>
                <td className="p-2">{p.nama_kategori ?? "-"}</td>
                <td className="p-2 text-right">{p.stok}</td>
                <td className="p-2 text-right">Rp {Number(p.harga_jual || 0).toLocaleString("id-ID")}</td>
                <td className="p-2">{p.nomor_batch || "-"} / {p.tanggal_kedaluwarsa ? formatTanggalIndonesia(p.tanggal_kedaluwarsa) : "-"}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-sm bg-yellow-400 px-2 rounded">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-sm bg-red-500 text-white px-2 rounded">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && produk.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">Tidak ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">{editing.id ? "Edit Produk" : "Tambah Produk"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Nama Produk</label>
                <input className="border p-2 w-full rounded" value={editing.nama_produk} onChange={e => setEditing({ ...editing, nama_produk: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm">Kategori</label>
                <select className="border p-2 w-full rounded" value={editing.kategori_id ?? ""} onChange={e => setEditing({ ...editing, kategori_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">-- Pilih --</option>
                  {kategori.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm">Stok</label>
                <input type="number" className="border p-2 w-full rounded" value={editing.stok} onChange={e => setEditing({ ...editing, stok: Number(e.target.value) })} />
              </div>

              <div>
                <label className="block text-sm">Harga Beli</label>
                <input type="number" className="border p-2 w-full rounded" value={editing.harga_beli} onChange={e => setEditing({ ...editing, harga_beli: Number(e.target.value) })} />
              </div>

              <div>
                <label className="block text-sm">Harga Jual</label>
                <input type="number" className="border p-2 w-full rounded" value={editing.harga_jual} onChange={e => setEditing({ ...editing, harga_jual: Number(e.target.value) })} />
              </div>

              <div>
                <label className="block text-sm">Nomor Batch</label>
                <input className="border p-2 w-full rounded" value={editing.nomor_batch || ""} onChange={e => setEditing({ ...editing, nomor_batch: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm">Tanggal Kedaluwarsa</label>
                <input type="date" className="border p-2 w-full rounded" value={editing.tanggal_kedaluwarsa ? editing.tanggal_kedaluwarsa.toString().slice(0,10) : ""} onChange={e => setEditing({ ...editing, tanggal_kedaluwarsa: e.target.value || null })} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Deskripsi</label>
                <textarea className="border p-2 w-full rounded" value={editing.deskripsi || ""} onChange={e => setEditing({ ...editing, deskripsi: e.target.value })} />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-3 py-1 rounded border">Batal</button>
              <button onClick={save} className="px-3 py-1 rounded bg-indigo-600 text-white">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}