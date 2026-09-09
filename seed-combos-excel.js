require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const XLSX = require('xlsx'); 

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("🚀 [SEED] Leyendo tu archivo original EXCEL_COMBOSINCHE.xlsx...");
    
    // 1. Leemos el archivo
    const libro = XLSX.readFile('EXCEL_COMBOSINCHE.xlsx');
    
    // 🔥 LA SOLUCIÓN: Tomamos la primera hoja automáticamente, sin importar su nombre
    const nombrePrimeraHoja = libro.SheetNames[0];
    console.log(`📂 Detectada la pestaña: "${nombrePrimeraHoja}". Analizando datos...`);
    const hoja = libro.Sheets[nombrePrimeraHoja];

    // 3. Extraemos como matriz pura
    const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });

    // 🧠 CEREBRO RADAR: Buscar en qué columnas exactas están tus datos
    let headerRowIdx = -1;
    let colComboIdx = -1;
    let colCodABIdx = -1;
    let colPrecioIdx = -1;

    for (let i = 0; i < Math.min(filas.length, 20); i++) {
      const row = filas[i];
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j]).toUpperCase().trim();
        if (val === "COMBO") colComboIdx = j;
        if (val.includes("CÓDIGO A +") || val.includes("CODIGO A +")) colCodABIdx = j;
        if (val.includes("PRECIO") && (val.includes("DOLAR") || val.includes("DÓLAR"))) colPrecioIdx = j;
      }
      if (colComboIdx !== -1 && colCodABIdx !== -1) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      throw new Error("❌ El Radar no pudo encontrar las cabeceras 'COMBO' y 'CÓDIGO A + CÓDIGO B'.");
    }

    console.log(`🎯 ¡Radar calibrado! Escaneando a partir de la fila ${headerRowIdx + 2}...`);

    let datosMapeados = [];

    // 4. Extracción fila por fila con limpieza de precios
    for (let i = headerRowIdx + 1; i < filas.length; i++) {
      const row = filas[i];
      const combo = String(row[colComboIdx] || "").trim().toUpperCase();
      const codigoAB = String(row[colCodABIdx] || "").trim().toUpperCase();

      if (combo === "") continue;

      let precioLimpio = 0;
      const valorCelda = row[colPrecioIdx];
      
      if (typeof valorCelda === 'number') {
        precioLimpio = valorCelda; 
      } else if (valorCelda) {
        let texto = String(valorCelda).replace(/\$/g, '').trim();
        if (texto.includes(',') && !texto.includes('.')) {
            texto = texto.replace(',', '.');
        } 
        else if (texto.includes(',') && texto.includes('.')) {
            texto = texto.replace(/,/g, '');
        }
        precioLimpio = parseFloat(texto) || 0;
      }

      datosMapeados.push({
        combo: combo,
        codigoAB: codigoAB,
        precioDolares: precioLimpio,
      });
    }

    console.log("🔥 [SEED] Vaciando la matriz antigua en Neon para evitar choques...");
    await prisma.matrizCombo.deleteMany(); 

    // 🛡️ ESCUDO ANTI-DUPLICADOS
    const mapaUnicos = new Map();
    datosMapeados.forEach(item => {
       mapaUnicos.set(item.combo, item);
    });
    const datosLimpios = Array.from(mapaUnicos.values());

    console.log(`⚡ [SEED] Inyectando ${datosLimpios.length} combos únicos a la bóveda...`);
    
    const resultado = await prisma.matrizCombo.createMany({
      data: datosLimpios,
      skipDuplicates: true,
    });

    console.log(`✅ [SEED] ¡Éxito rotundo! Se inyectaron ${resultado.count} combos perfectamente en tu base de datos.`);
    
  } catch (error) {
    console.error("❌ Ocurrió un problema:", error.message);
  }
}

main().finally(async () => { await prisma.$disconnect(); });