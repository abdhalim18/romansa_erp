"use client";
import { useEffect, useState } from "react";

/**
 * Halaman Kasir (sederhana)
 * - Pencarian produk by nama
 * - Tambah ke keranjang (qty)
 * - Checkout: panggil /api/penjualan POST
 */

type Produk = {
  id: number;
  nama_produk: string;
  stok: number;
  harga_jual: number;
  nama_kategori?: string;
};

type CartItem = {
  produk: Produk;
  jumlah: number;
};

export default function KasirPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Produk[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [kasirId, setKasirId] = useState<number | null>(null);

  useEffect(() => {
    // Try get current user id (session) via API or leave null (frontend demo)
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      const id = s?.user?.id;
      if (id) setKasirId(id);
    }).catch(() => {});
  }, []);

  async function search() {
    const res = await fetch("/api/produk").then(r => r.json());
    // client-side filter by name
    const filtered = (res || []).filter((p: any) => p.nama_produk.toLowerCase().includes(query.toLowerCase()));
    setResults(filtered);
  }

  function addToCart(p: Produk) {
    const exist = cart.find(c => c.produk.id === p.id);
    if (exist) {
      setCart(cart.map(c => c.produk.id === p.id ? { ...c, jumlah: c.jumlah + 1 } : c));
    } else {
      setCart([...cart, { produk: p, jumlah: 1 }]);
    }
  }

  function changeQty(produkId: number, qty: number) {
    setCart(cart.map(c => c.produk.id === produkId ? { ...c, jumlah: qty } : c));
  }

  function removeItem(produkId: number) {
    setCart(cart.filter(c => c.produk.id !== produkId));
  }

  async function checkout(metode = "tunai") {
    if (!kasirId) {
      alert("Kasir tidak teridentifikasi. Silakan login ulang.");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang kosong.");
      return;
    }
    const total = cart.reduce((s, it) => s + it.jumlah * Number(it.produk.harga_jual || 0), 0);
    const detail = cart.map(it => ({ produk_id: it.produk.id, jumlah: it.jumlah, harga_jual: it.produk.harga_jual }));
    const payload = {
      kasir_id: kasirId,
      tanggal_penjualan: new Date().toISOString().slice(0,19).replace('T',' '),
      total,
      metode_pembayaran: metode,
      detail
    };
    const res = await fetch("/api/penjualan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json());
    if ((res && res.penjualanId) || res?.penjualanId === 0) {
      alert("Penjualan berhasil. ID: " + res.penjualanId);
      setCart([]);
      // show low stock warnings if any
      if (res.warning_low_stock && res.warning_low_stock.length) {
        const names = res.warning_low_stock.map((p: any) => `${p.nama_produk} (${p.stok})`).join(", ");
        alert("Peringatan stok rendah: " + names);
      }
    } else if (res.error) {
      alert("Error: " + res.error);
    } else {
      alert("Penjualan selesai.");
      setCart([]);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Kasir - Penjualan Cepat</h2>

      <div className="flex gap-2 mb-4">
        <input placeholder="Cari produk..." value={query} onChange={e => setQuery(e.target.value)} className="border p-2 rounded flex-1" />
        <button onClick={search} className="bg-slate-700 text-white px-3 py-2 rounded">Cari</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow lg:col-span-2">
          <h3 className="font-medium mb-2">Hasil Pencarian</h3>
          <ul>
            {results.map(r => (
              <li key={r.id} className="py-2 border-b flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.nama_produk}</div>
                  <div className="text-sm text-slate-500">{r.nama_kategori} — Stok: {r.stok}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="text-right">Rp {Number(r.harga_jual).toLocaleString("id-ID")}</div>
                  <button onClick={() => addToCart(r)} className="bg-green-500 text-white px-2 py-1 rounded">Tambah</button>
                </div>
              </li>
            ))}
            {results.length === 0 && <li className="py-4 text-sm text-slate-500">Tidak ada hasil</li>}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Keranjang</h3>
          <ul>
            {cart.map(it => (
              <li key={it.produk.id} className="py-2 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{it.produk.nama_produk}</div>
                    <div className="text-sm text-slate-500">Rp {Number(it.produk.harga_jual).toLocaleString("id-ID")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} value={it.jumlah} onChange={e => changeQty(it.produk.id, Number(e.target.value))}
                      className="w-16 border p-1 rounded text-center" />
                    <button onClick={() => removeItem(it.produk.id)} className="text-sm text-red-600">Hapus</button>
                  </div>
                </div>
              </li>
            ))}
            {cart.length === 0 && <li className="py-2 text-sm text-slate-500">Keranjang kosong</li>}
          </ul>

          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <div className="text-sm text-slate-600">Total</div>
              <div className="font-semibold">Rp {cart.reduce((s, it) => s + it.jumlah * (it.produk.harga_jual || 0), 0).toLocaleString("id-ID")}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => checkout("tunai")} className="flex-1 bg-indigo-600 text-white py-2 rounded">Bayar Tunai</button>
              <button onClick={() => checkout("transfer")} className="flex-1 bg-sky-600 text-white py-2 rounded">Transfer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}