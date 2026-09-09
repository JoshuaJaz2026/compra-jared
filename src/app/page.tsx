"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, AlertTriangle, CheckCircle2, DollarSign, 
  Package, Loader2, ArrowUpRight, ArrowDownRight, BarChart3, HelpCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";

import { obtenerCombos } from "@/app/combos_2025_2026/actions";
import { obtenerDataKO } from "@/app/data-ko/actions";

let cacheGlobalCombos: any[] | null = null;
let cacheGlobalDataKO: any[] | null = null;

export default function DashboardPage() {
  const [cargando, setCargando] = useState(true);
  const [datosBrutos, setDatosBrutos] = useState<{ combos: any[], dataKO: any[] }>({ combos: [], dataKO: [] });
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )jared_user_nombre=([^;]+)'));
    if (match) setNombreUsuario(decodeURIComponent(match[2]));

    const cargarDatos = async () => {
      if (cacheGlobalCombos && cacheGlobalDataKO) {
        setDatosBrutos({ combos: cacheGlobalCombos, dataKO: cacheGlobalDataKO });
        setCargando(false);
        return;
      }

      const [combos, dataKO] = await Promise.all([obtenerCombos(), obtenerDataKO()]);
      cacheGlobalCombos = combos;
      cacheGlobalDataKO = dataKO;
      
      setDatosBrutos({ combos, dataKO });
      setCargando(false);
    };
    
    cargarDatos();
  }, []);

  const dataProcesada = useMemo(() => {
    const tc = 3.45; 
    if (!datosBrutos.combos.length) return [];

    return datosBrutos.combos.map(row => {
      const codigos = (row.codigoAB || "").includes('+') ? row.codigoAB.split('+') : [row.codigoAB];
      const codA = codigos[0]?.trim().toUpperCase().replace(/\s+/g, '') || "";
      const codB = codigos.slice(1).join('+').trim().toUpperCase().replace(/\s+/g, '') || "";
      
      const matchA = codA ? datosBrutos.dataKO.find(d => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codA) : null;
      const matchB = codB ? datosBrutos.dataKO.find(d => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codB) : null;
      
      const valorA = row.valorAManual != null ? row.valorAManual : (matchA ? parseFloat(matchA.valorComercial) || 0 : 0);
      const valorB = row.valorBManual != null ? row.valorBManual : (matchB ? parseFloat(matchB.valorComercial) || 0 : 0);
      
      const errorTotal = (row.valorAManual == null && codA !== "" && !matchA) || (row.valorBManual == null && codB !== "" && !matchB);
      const precioSoles = (row.precioDolares || 0) * tc;
      const ganancia = (valorA + valorB) - precioSoles;

      let estado = "NO CONVIENE";
      if (errorTotal) estado = "REVISAR";
      else if (ganancia >= 59) estado = "EXCELENTE";
      else if (ganancia >= 15) estado = "CONVIENE";
      else if (ganancia >= 1) estado = "REGULAR";
      else estado = "NO CONVIENE";

      return { combo: row.combo, precioSoles, ganancia, estado, errorTotal };
    });
  }, [datosBrutos]);

  const kpis = useMemo(() => {
    const total = dataProcesada.length;
    const conErrores = dataProcesada.filter(d => d.errorTotal).length;
    const validos = dataProcesada.filter(d => !d.errorTotal);
    const excelentes = validos.filter(d => d.estado === "EXCELENTE").length;
    const gananciaTotal = validos.reduce((acc, curr) => acc + curr.ganancia, 0);
    const gananciaPromedio = validos.length > 0 ? (gananciaTotal / validos.length) : 0;

    const top5 = [...validos].sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);
    
    const distribucion = [
      { name: "Excelentes", value: excelentes, color: "#eab308" }, // Amarillo
      { name: "Convienen", value: validos.filter(d => d.estado === "CONVIENE").length, color: "#22c55e" }, // Verde
      { name: "Regulares", value: validos.filter(d => d.estado === "REGULAR").length, color: "#60a5fa" }, // Celeste
      { name: "No Convienen", value: validos.filter(d => d.estado === "NO CONVIENE").length, color: "#ef4444" }, // Rojo
      { name: "Sin Datos", value: conErrores, color: "#94a3b8" } // Gris para errores
    ];

    return { total, conErrores, excelentes, gananciaPromedio, top5, distribucion };
  }, [dataProcesada]);

  // Función para pintar las barras según su categoría real
  const getColorPorEstado = (estado: string) => {
    if (estado === "EXCELENTE") return "#eab308";
    if (estado === "CONVIENE") return "#22c55e";
    if (estado === "REGULAR") return "#60a5fa";
    if (estado === "NO CONVIENE") return "#ef4444";
    return "#94a3b8";
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-black text-slate-800">Cargando métricas...</h2>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen bg-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hola, {nombreUsuario} 👋
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Aquí tienes el resumen financiero y operativo de tus combos al día de hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Package className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Combos</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{kpis.total}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1">Registrados en la matriz</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">S/ {kpis.gananciaPromedio.toFixed(2)}</h3>
            <p className="text-sm font-bold text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="w-4 h-4" /> Ganancia neta media</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oportunidades</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{kpis.excelentes}</h3>
            <p className="text-sm font-bold text-amber-500 flex items-center gap-1 mt-1"><ArrowUpRight className="w-4 h-4" /> Combos Excelentes</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center"><HelpCircle className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auditoría</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{kpis.conErrores}</h3>
            <p className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1"><ArrowDownRight className="w-4 h-4" /> Faltan precios (#N/A)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> Top 5 Mayor Rentabilidad</h2>
              <p className="text-sm font-medium text-slate-500">Los combos que generan más ganancia neta.</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.top5} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="combo" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `S/${val}`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="ganancia" radius={[6, 6, 0, 0]}>
                  {kpis.top5.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorPorEstado(entry.estado)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="text-lg font-black text-slate-800">Estado del Catálogo</h2>
            <p className="text-sm font-medium text-slate-500">Distribución de rentabilidad.</p>
          </div>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={kpis.distribucion} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {kpis.distribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}