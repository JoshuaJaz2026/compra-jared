"use server";

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { unstable_noStore as noStore } from "next/cache";

// 🔥 Conexión segura a Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 📊 MOTOR ESTADÍSTICO DEL DASHBOARD GLOBAL
export async function obtenerMetricasDashboardGlobal() {
  // Obligamos a Next.js a traer datos frescos siempre (sin caché)
  noStore();

  try {
    console.log("📡 [DASHBOARD] Extrayendo métricas globales de la bóveda Neon...");

    // 1. Escaneo de Data K.O.
    const totalCodigosKO = await prisma.dataKO.count();
    
    // Suma de valorización del catálogo K.O.
    const dataKO = await prisma.dataKO.findMany({
      select: { valorComercial: true }
    });
    const valorizacionCatalogoSoles = dataKO.reduce((acc, item) => acc + (Number(item.valorComercial) || 0), 0);

    // 2. Escaneo de Matriz de Combos
    const totalCombos = await prisma.matrizCombo.count();

    return {
      exito: true,
      totalCodigosKO,
      totalCombos,
      valorizacionCatalogoSoles
    };

  } catch (error) {
    console.error("❌ [DASHBOARD ERROR] Falló la extracción de métricas:", error);
    return {
      exito: false,
      totalCodigosKO: 0,
      totalCombos: 0,
      valorizacionCatalogoSoles: 0
    };
  }
}