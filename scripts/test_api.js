/**
 * Smoke test sederhana untuk endpoint utama.
 * Jalankan: node scripts/test_api.js
 * Pastikan server dev berjalan di http://localhost:3000
 */

const fetch = require("node-fetch");

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  try {
    console.log("1) GET /api/kategori_produk");
    let r = await fetch(BASE + "/api/kategori_produk");
    console.log("status:", r.status);
    console.log("body sample:", (await r.json()).slice?.(0,2) || []);

    console.log("2) GET /api/produk");
    r = await fetch(BASE + "/api/produk");
    console.log("status:", r.status);
    console.log("sample produk:", (await r.json()).slice?.(0,3) || []);

    console.log("3) GET /api/supplier");
    r = await fetch(BASE + "/api/supplier");
    console.log("status:", r.status);
    console.log("sample supplier:", (await r.json()).slice?.(0,2) || []);

    console.log("4) POST /api/auto_po/trigger (dry run)");
    r = await fetch(BASE + "/api/auto_po/trigger", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({}) });
    console.log("status:", r.status);
    console.log("body:", await r.json());
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();