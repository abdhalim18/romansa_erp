"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { formatTanggalIndonesia } from "@/lib/utils";

/**
 * Halaman dashboard admin contoh dengan Recharts.
 * - Menampilkan ringkasan
 * - Grafik penjualan (sample) — data diambil dari /api/penjualan (aggregate sederhana)
 * - Daftar produk paling laris (sample) diambil dari detail_penjualan join produk
 */

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>({});
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);

  useEffect(() => {
    fetchSummary();
    fetchSalesGraph();
    fetchTopProducts();
    fetchExpiring();
  }, []);

  async function fetchSummary() {
    // summary: total produk, total supplier, total penjualan (today)
    const [prodRes, supRes, penRes] = await Promise.all([
      fetch("/api/produk").then(r => r.json()),
      fetch("/api/supplier").then(r => r.json()),
      fetch(`/api/penjualan?tanggal=${new Date().toISOString().slice(0,10)}`).then(r => r.json()).catch(() => [])
    ]);
    setSummary({
      totalProduk: Array.isArray(prodRes) ? prodRes.length : 0,
      totalSupplier: Array.isArray(supRes) ? supRes.length : 0,
      totalPenjualanHariIni: Array.isArray(penRes) ? penRes.length : 0
    });
  }

  async function fetchSalesGraph() {
    // Build a simple daily sales aggregation for last 7 days (client-side)
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    const promises = days.map(d => fetch(`/api/penjualan?tanggal=${d.toISOString().slice(0,10)}`).then(r => r.json()));
    const results = await Promise.all(promises);
    const data = days.map((d, idx) => {
      const total = Array.isArray(results[idx]) ? results[idx].reduce((s: number, it: any) => s + Number(it.total || 0), 0) : 0;
      return { date: formatTanggalIndonesia(d), total };
    });
    setSalesData(data);
  }

  async function fetchTopProducts() {
    // Simple endpoint-less aggregation: call detail_penjualan join produk
    const res = await fetch("/api/detail_penjualan").then(r => r.json()).catch(() => []);
    if (!Array.isArray(res)) return;
    const map: Record<number, any> = {};
    for (const r of res) {
      if (!map[r.produk_id]) {
        map[r.produk_id] = { produk_id: r.produk_id, jumlah: 0, nama_produk: r.nama_produk || "" };
      }
      map[r.produk_id].jumlah += Number(r.jumlah || 0);
    }
    const arr = Object.values(map).sort((a, b) => b.jumlah - a.jumlah).slice(0, 10);
    setTopProducts(arr);
  }

  async function fetchExpiring() {
    // ambil produk yang kedaluwarsa dalam 30 hari
    const res = await fetch("/api/produk?stok=low").then(r => r.json()).catch(() => []);
    // just fetch all products and filter expiration - simple demo
    const all = await fetch("/api/produk").then(r => r.json()).catch(() => []);
    const now = new Date();
    const soon = (all || []).filter((p: any) => p.tanggal_kedaluwarsa).filter((p: any) => {
      const d = new Date(p.tanggal_kedaluwarsa);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });
    setExpiringSoon(soon);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard Admin</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-slate-500">Total Produk</div>
          <div className="text-2xl font-bold">{summary.totalProduk ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-slate-500">Total Supplier</div>
          <div className="text-2xl font-bold">{summary.totalSupplier ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-slate-500">Transaksi Hari Ini</div>
          <div className="text-2xl font-bold">{summary.totalPenjualanHariIni ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Grafik Penjualan 7 Hari</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Produk Paling Laris (Top 10)</h3>
          <div>
            <BarChart width={500} height={240} data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nama_produk" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jumlah" fill="#10b981" />
            </BarChart>
            <ul className="mt-2">
              {topProducts.map((p: any) => (
                <li key={p.produk_id} className="py-1 border-b">
                  <div className="flex justify-between">
                    <span>{p.nama_produk || `Produk ${p.produk_id}`}</span>
                    <span className="text-sm text-slate-500">{p.jumlah}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Produk Hampir Kedaluwarsa (30 hari)</h3>
          <ul>
            {expiringSoon.map((p: any) => (
              <li key={p.id} className="py-2 border-b">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{p.nama_produk}</div>
                    <div className="text-sm text-slate-500">Batch: {p.nomor_batch || "-"}</div>
                  </div>
                  <div className="text-sm">{formatTanggalIndonesia(p.tanggal_kedaluwarsa)}</div>
                </div>
              </li>
            ))}
            {expiringSoon.length === 0 && <li className="py-2 text-sm text-slate-500">Tidak ada</li>}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Notifikasi Stok Rendah</h3>
          <LowStockList />
        </div>
      </div>
    </div>
  );
}

function LowStockList() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/produk?stok=low")
      .then(r => r.json())
      .then(d => setList(d))
      .catch(() => setList([]));
  }, []);
  return (
    <ul>
      {list.map((p: any) => (
        <li key={p.id} className="py-2 border-b flex justify-between items-center">
          <div>
            <div className="font-medium">{p.nama_produk}</div>
            <div className="text-sm text-slate-500">{p.nama_kategori || "-"}</div>
          </div>
          <div className="text-red-600 font-semibold">{p.stok}</div>
        </li>
      ))}
      {list.length === 0 && <li className="py-2 text-sm text-slate-500">Tidak ada stok rendah</li>}
    </ul>
  );
}