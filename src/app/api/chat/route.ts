import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { obtenerCombos } from "@/app/combos_2025_2026/actions";
import { obtenerDataKO } from "@/app/data-ko/actions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Escudo anti-caídas de Google
async function generarConReintentos(model: any, prompt: any[], maxRetries = 3) {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      console.warn(`[Intento ${i + 1}/${maxRetries}] Servidor saturado. Reintentando en ${delay}ms...`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

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

      const valorA = row.valorAManual != null ? row.valorAManual : (matchA ? parseFloat(String(matchA.valorComercial)) || 0 : 0);
      const valorB = row.valorBManual != null ? row.valorBManual : (matchB ? parseFloat(String(matchB.valorComercial)) || 0 : 0);

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

    const combosValidos = dataCalculada.filter((c: any) => !c.error && c.precioSoles > 0);
    combosValidos.sort((a: any, b: any) => b.ganancia - a.ganancia); 

    const topCombos = combosValidos.slice(0, 30);
    const peoresCombos = combosValidos.slice(-10);

    // 🔥 MODELO OFICIAL (Requiere el SDK actualizado)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    });    
    
    const systemPrompt = `
      Eres MiniJared, IA del ERP de Electrodomésticos Jared.
      Tipo de Cambio: S/ ${tc}.

      TOP 30 MÁS RENTABLES:
      ${JSON.stringify(topCombos)}

      TOP 10 CON PÉRDIDAS:
      ${JSON.stringify(peoresCombos)}

      REGLAS DE INTERFAZ:
      1. Escribe tu respuesta de forma amigable y LISTA SIEMPRE los combos de forma legible usando viñetas (Markdown). Menciona su ganancia.
      2. Si el usuario pide FILTRAR, BUSCAR o MOSTRAR combos, INCLUYE SIEMPRE al final de tu mensaje la etiqueta secreta: [FILTER:COMBO 1, COMBO 2]
      3. Si el usuario pide COTIZAR, SELECCIONAR o MARCAR combos, incluye al final: [SELECT:COMBO 1, COMBO 2]
      4. Si el usuario indica un NUEVO PRECIO, incluye al final: [UPDATE:COMBO 1=150.50, COMBO 2=200]
      
      IMPORTANTE: Primero dale la respuesta al usuario en texto normal, y en la ÚLTIMA LÍNEA pon la etiqueta de acción.
    `;

    const result = await generarConReintentos(model, [systemPrompt, `Usuario: ${mensaje}`]);
    const respuesta = result.response.text();

    return NextResponse.json({ respuesta });

  } catch (error: any) {
    console.error("🔥 Error en MiniJared:", error);
    return NextResponse.json({ respuesta: "⚠️ Servidor de IA congestionado. Por favor, intenta de nuevo." }, { status: 500 });
  }
}