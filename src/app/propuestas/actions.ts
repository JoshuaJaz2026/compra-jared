"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL } as any);
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function obtenerPropuestas() {
  try {
    const propuestas = await prisma.propuesta.findMany({
      orderBy: { creadoEn: 'desc' }
    });
    return propuestas;
  } catch (error) {
    console.error("Error al obtener propuestas:", error);
    return [];
  }
}

export async function sincronizarPropuestas(datos: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Limpiamos la tabla de propuestas actuales
      await tx.propuesta.deleteMany({});
      
      if (datos.length > 0) {
        await tx.propuesta.createMany({
          data: datos.map(row => ({
            fechaCompra: row.fechaCompra || "",
            perfilado: row.perfilado || "",
            cantidad: row.cantidad || 1,
            combo: row.combo || "",
            codigoAB: row.codigoAB || "",
            codigoA: row.codigoA || "",
            codigoB: row.codigoB || "",
            precioDolares: row.precioDolares || 0,
            valorA: row.valorA || 0,
            valorB: row.valorB || 0
          }))
        });
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error al guardar propuestas:", error);
    return { success: false, error: error.message };
  }
}