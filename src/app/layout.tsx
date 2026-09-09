import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GeminiBot from "@/components/GeminiBot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ElectroJared - ERP",
  description: "Cotizador Maestro y Análisis IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-slate-50`}>
        {/* El sidebar administra su propio ancho con la animación */}
        <Sidebar />

        {/* El contenido principal ocupa el resto del espacio. SIN margin left (ml-64) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
        
        {/* IA de MiniJared inyectada de forma global */}
        <GeminiBot />
      </body>
    </html>
  );
}