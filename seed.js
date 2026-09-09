require("dotenv/config");
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// 🔥 Configuramos el adaptador seguro hacia Neon para el script
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Inyectando catálogo a Neon...");

  // 1. Crear Productos Individuales (Código A y B)
  const p1 = await prisma.productoUnitario.upsert({ where: { codigo: 'TSSTTV35FDMAFNS 053' }, update: {}, create: { codigo: 'TSSTTV35FDMAFNS 053', nombre: 'Oven Oster', costo: 420.00 } });
  const p2 = await prisma.productoUnitario.upsert({ where: { codigo: 'FPSTSMPL3R 053' }, update: {}, create: { codigo: 'FPSTSMPL3R 053', nombre: 'Mixer Oster', costo: 650.00 } });
  const p3 = await prisma.productoUnitario.upsert({ where: { codigo: 'BLST3A CPG 053' }, update: {}, create: { codigo: 'BLST3A CPG 053', nombre: 'Blender Oster', costo: 495.00 } });
  const p4 = await prisma.productoUnitario.upsert({ where: { codigo: 'FPSTHM3532 053' }, update: {}, create: { codigo: 'FPSTHM3532 053', nombre: 'Hand Mixer Oster', costo: 60.00 } });

  // 2. Crear COMBO 25907 (El que CONVIENE)
  await prisma.combo.upsert({
    where: { codigoCombo: 'COMBO 25907' }, update: {},
    create: {
      codigoCombo: 'COMBO 25907', nombre: 'Pack Premium', precioOferta: 1047.08,
      detalles: { create: [{ productoUnitarioId: p1.id, cantidad: 1 }, { productoUnitarioId: p2.id, cantidad: 1 }] }
    }
  });

  // 3. Crear COMBO 14305 (El que NO CONVIENE)
  await prisma.combo.upsert({
    where: { codigoCombo: 'COMBO 14305' }, update: {},
    create: {
      codigoCombo: 'COMBO 14305', nombre: 'Pack Básico', precioOferta: 557.18,
      detalles: { create: [{ productoUnitarioId: p3.id, cantidad: 1 }, { productoUnitarioId: p4.id, cantidad: 1 }] }
    }
  });

  console.log("✅ Combos inyectados con éxito.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());