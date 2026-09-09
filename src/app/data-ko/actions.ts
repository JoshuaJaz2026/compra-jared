"use server";

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 🔥 Conexión segura a Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function obtenerDataKO() {
  try {
    console.log("📡 [NEON READ] Obteniendo matriz Data K.O. desde la nube...");
    const data = await prisma.dataKO.findMany({
      orderBy: { creadoEn: 'asc' } // 🔥 EL SECRETO: Orden fijo por fecha de creación
    });
    console.log(`✅ [NEON READ] Se extrajeron ${data.length} registros exitosamente.`);
    return data;
  } catch (error) {
    console.error("❌ [NEON ERROR] No se pudo leer la tabla Data K.O:", error);
    return [];
  }
}

export async function sincronizarDataKO(datosMasivos: any[]) {
  try {
    console.log(`🔥 [NEON WRITE] Iniciando guardado profundo... Recibidos ${datosMasivos.length} registros.`);

    const codigosValidos = datosMasivos.map(d => d.codigoInche).filter(c => c && c.trim() !== "");

    if (codigosValidos.length > 0) {
      const borrados = await prisma.dataKO.deleteMany({
        where: { codigoInche: { notIn: codigosValidos } }
      });
      console.log(`🗑️ [NEON LIMPIEZA] Se eliminaron ${borrados.count} registros antiguos que ya no están en tu tabla.`);
    } else {
      await prisma.dataKO.deleteMany();
      console.log(`🗑️ [NEON LIMPIEZA] La tabla fue vaciada por completo.`);
    }

    let procesados = 0;
    for (const item of datosMasivos) {
      if (!item.codigoInche || item.codigoInche.trim() === "") continue;

      await prisma.dataKO.upsert({
        where: { codigoInche: item.codigoInche },
        update: {
          costoPDF: parseFloat(item.costoPDF) || 0,
          valorComercial: parseFloat(item.valorComercial) || 0,
          costoSoles: parseFloat(item.costoSoles) || 0
        },
        create: {
          codigoInche: item.codigoInche.trim(),
          costoPDF: parseFloat(item.costoPDF) || 0,
          valorComercial: parseFloat(item.valorComercial) || 0,
          costoSoles: parseFloat(item.costoSoles) || 0
        }
      });
      procesados++;
    }

    console.log(`✅ [NEON SUCCESS] Sincronización perfecta. ${procesados} registros fueron insertados/actualizados.`);
    return { success: true };

  } catch (error) {
    console.error("❌ [NEON CRÍTICO] Falló la sincronización masiva:", error);
    return { success: false, error: "Error interno al guardar en Neon." };
  }
}