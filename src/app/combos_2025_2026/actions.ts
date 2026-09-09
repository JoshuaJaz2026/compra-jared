'use server'

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function obtenerCombos() {
  try {
    const data = await prisma.matrizCombo.findMany({
      orderBy: { creadoEn: 'asc' }
    });
    return data;
  } catch (error) {
    console.error("Error al obtener combos:", error);
    return [];
  }
}

export async function sincronizarCombos(datos: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Vaciamos la tabla para sincronizar limpio
      await tx.matrizCombo.deleteMany();

      if (datos.length === 0) return;

      // 2. Insertamos la data nueva respetando los manuales
      const datosAInsertar = datos.map(item => ({
        combo: item.combo.trim(),
        codigoAB: item.codigoAB || "",
        precioDolares: parseFloat(item.precioDolares) || 0,
        valorAManual: item.valorAManual != null ? parseFloat(item.valorAManual) : null,
        valorBManual: item.valorBManual != null ? parseFloat(item.valorBManual) : null,
      }));

      await tx.matrizCombo.createMany({
        data: datosAInsertar,
        skipDuplicates: true
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al sincronizar combos:", error);
    return { success: false, error: error.message };
  }
}