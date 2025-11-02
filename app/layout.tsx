import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Roman – ERP Toko Obat Hewan",
  description: "Sistem ERP untuk Toko Obat Hewan Roman"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900">
        <div className="min-h-screen">
          {/* Global header */}
          <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Roman – ERP</h1>
              <nav>
                {/* bisa ditambahkan menu, login status */}
              </nav>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">{children}</main>

          <footer className="mt-10 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Roman – ERP
          </footer>
        </div>
      </body>
    </html>
  );
}