"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Simple login page. On success, fetch session to determine role and redirect accordingly.
 * In production: add proper form validation, error handling, "register" flow, and secure password hashing on creation.
 */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password
    });
    if (res?.error) {
      setErr("Login gagal: email atau password salah.");
      return;
    }
    // get session to check role
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;
    if (role === "admin") router.push("/admin");
    else if (role === "kasir") router.push("/kasir");
    else router.push("/");
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Masuk ke Roman</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        {err && <div className="text-red-600">{err}</div>}
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Masuk</button>
      </form>
    </div>
  );
}