"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Configuramos el adaptador requerido por Prisma para conectarse a Neon
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL } as any);

// 2. Mantenemos una única conexión global en desarrollo para no saturar la base de datos
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function obtenerCombos() {
  try {
    const combos = await prisma.comboMatriz.findMany({
      orderBy: { combo: 'asc' }
    });
    return combos;
  } catch (error) {
    console.error("Error al obtener combos:", error);
    return [];
  }
}

export async function sincronizarCombos(datosFilas: any[]) {
  try {
    // Filtro antiduplicados
    const combosUnicos = Array.from(
      new Map(datosFilas.map((item: any) => [item.combo, item])).values()
    );

    await prisma.$transaction(async (tx) => {
      await tx.comboMatriz.deleteMany({});
      
      const chunkSize = 1000;
      for (let i = 0; i < combosUnicos.length; i += chunkSize) {
        const lote = combosUnicos.slice(i, i + chunkSize);
        await tx.comboMatriz.createMany({
          data: lote.map((row: any) => ({
            combo: row.combo,
            codigoAB: row.codigoAB || "",
            precioDolares: row.precioDolares || 0,
            valorAManual: row.valorAManual,
            valorBManual: row.valorBManual
          })),
          skipDuplicates: true 
        });
      }
    }, { timeout: 20000 }); 
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al sincronizar:", error);
    return { success: false, error: error.message };
  }
}

export async function actualizarCombosParcial(combosModificados: any[]) {
  try {
    // Aplicamos la misma lógica ultrarrápida del Excel. 
    // Al reescribir la tabla completa en 1 segundo, garantizamos que los combos eliminados en pantalla desaparezcan de la DB.
    const combosUnicos = Array.from(
      new Map(combosModificados.map((item: any) => [item.combo, item])).values()
    );

    await prisma.$transaction(async (tx) => {
      await tx.comboMatriz.deleteMany({});
      
      const chunkSize = 1000;
      for (let i = 0; i < combosUnicos.length; i += chunkSize) {
        const lote = combosUnicos.slice(i, i + chunkSize);
        await tx.comboMatriz.createMany({
          data: lote.map((row: any) => ({
            combo: row.combo,
            codigoAB: row.codigoAB || "",
            precioDolares: row.precioDolares || 0,
            valorAManual: row.valorAManual,
            valorBManual: row.valorBManual
          })),
          skipDuplicates: true
        });
      }
    }, { timeout: 20000 }); // Tiempo de tolerancia ampliado a 20 segundos por si la red de la oficina es lenta

    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar parcialmente:", error);
    return { success: false, error: error.message };
  }
}