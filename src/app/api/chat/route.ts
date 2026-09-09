import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { obtenerCombos } from "@/app/combos_2025_2026/actions";
import { obtenerDataKO } from "@/app/data-ko/actions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { mensaje, tc = 3.45 } = await req.json();

    const combos = await obtenerCombos();
    const dataKO = await obtenerDataKO();

    const dataCalculada = combos.map((row: any) => {
      const codigos = (row.codigoAB || "").includes('+') ? row.codigoAB.split('+') : [row.codigoAB];
      const codA = (codigos[0] || "").trim().toUpperCase().replace(/\s+/g, '');
      const codB = codigos.slice(1).join('+').trim().toUpperCase().replace(/\s+/g, '');

      const matchA = dataKO.find((d: any) => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codA);
      const matchB = dataKO.find((d: any) => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codB);

      const valorA = row.valorAManual != null ? row.valorAManual : (matchA ? parseFloat(matchA.valorComercial) || 0 : 0);
      const valorB = row.valorBManual != null ? row.valorBManual : (matchB ? parseFloat(matchB.valorComercial) || 0 : 0);

      const precioSoles = (row.precioDolares || 0) * tc;
      const totalUnitario = valorA + valorB;
      const diferencia = totalUnitario - precioSoles;

      const error = (row.valorAManual == null && codA !== "" && !matchA) || (row.valorBManual == null && codB !== "" && !matchB);

      return {
        combo: row.combo,
        codigos: row.codigoAB,
        precioSoles: precioSoles.toFixed(2),
        ganancia: diferencia,
        error: error
      };
    });

    // 🔥 BLINDAJE: Exigimos que el precio sea mayor a 0 para que no invente rentabilidades irreales
    const combosValidos = dataCalculada.filter((c: any) => !c.error && c.precioSoles > 0);
    combosValidos.sort((a: any, b: any) => b.ganancia - a.ganancia); 

    const topCombos = combosValidos.slice(0, 30);
    const peoresCombos = combosValidos.slice(-10);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.7-flash",
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
    });    
    
    const systemPrompt = `
      Eres MiniJared, IA del ERP de Electrodomésticos Jared.
      Tipo de Cambio: S/ ${tc}.

      TOP 30 MÁS RENTABLES:
      ${JSON.stringify(topCombos)}

      TOP 10 CON PÉRDIDAS:
      ${JSON.stringify(peoresCombos)}

      REGLAS DE INTERFAZ:
      1. Si el usuario pide FILTRAR, BUSCAR o MOSTRAR combos, incluye al final: [FILTER:COMBO 1, COMBO 2]
      2. Si el usuario pide COTIZAR, SELECCIONAR o MARCAR combos, incluye al final: [SELECT:COMBO 1, COMBO 2]
      3. Si el usuario te indica un NUEVO PRECIO para un combo, actualízalo usando el signo "=" y sin el signo de dólar. Incluye al final: [UPDATE:COMBO 1=150.50, COMBO 2=200]
      - SOLO usa la etiqueta que corresponda a la acción pedida. NUNCA uses más de una etiqueta del mismo tipo.
      - Sé extremadamente breve en tu texto visible.
    `;

    const result = await model.generateContent([systemPrompt, `Usuario: ${mensaje}`]);
    const respuesta = result.response.text();

    return NextResponse.json({ respuesta });

  } catch (error: any) {
    return NextResponse.json({ respuesta: "⚠️ Fallo de conexión." }, { status: 500 });
  }
}