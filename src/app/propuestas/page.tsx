"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Calculator, Search, FilterX, Plus, Save, Trash2, 
  AlertTriangle, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, SearchX, ChevronDown, Pencil,
  FileSpreadsheet, Upload // Nuevos iconos para Excel
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx"; // Librería para procesar Excel

import { obtenerPropuestas, sincronizarPropuestas } from "./actions";
import { obtenerDataKO } from "@/app/data-ko/actions";
import { obtenerCombos } from "@/app/combos_2025_2026/actions";

let cacheGlobalPropuestas: any[] | null = null;
let cacheGlobalDataKO_Prop: any[] | null = null;
let cacheGlobalCombos_Prop: any[] | null = null;

function PerfiladoComboBox({ valor, onChange }: { valor: string, onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const opciones = [
    "BLST3B CAG 053", "FPSTHB460A 053", "CKSTRC15DFBLK 053", 
    "GCSTGS7050 053", "COMPLEMENTO", "BLSTKAG RPB 053", 
    "BLSTXPG BGW 053", "250 22"
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center" ref={menuRef}>
      <button 
        onClick={() => setAbierto(!abierto)}
        className="w-full h-full flex items-center justify-between px-2 font-bold text-slate-700 bg-transparent outline-none hover:bg-slate-100 transition-colors"
      >
        <span className="truncate flex-1 text-center">{valor || "..."}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 flex-shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      
      {abierto && (
        <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-slate-200/80 rounded-xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
          <div className="p-2 max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
            {opciones.map(op => (
              <button
                key={op}
                onClick={() => { onChange(op); setAbierto(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-bold transition-all truncate border ${
                  valor === op 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                    : 'bg-slate-100 border-transparent text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2 bg-slate-50/50 flex justify-end">
            <button className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-600">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropuestasPage() {
  const [datos, setDatos] = useState<any[]>([]);
  
  const [catalogoKO, setCatalogoKO] = useState<any[]>([]);
  const [catalogoCombos, setCatalogoCombos] = useState<any[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tipoCambio, setTipoCambio] = useState<number>(3.40);
  
  const [inputBusqueda, setInputBusqueda] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(15);

  const [modalImportar, setModalImportar] = useState(false);
  const [alerta, setAlerta] = useState<{ visible: boolean; tipo: 'exito' | 'error' | 'confirmacion'; titulo: string; mensaje: string; textoConfirmar?: string; accionConfirma?: () => void; }>({ visible: false, tipo: 'exito', titulo: '', mensaje: '' });

  useEffect(() => {
    const handler = setTimeout(() => {
      setBusquedaActiva(inputBusqueda);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputBusqueda]);

  useEffect(() => {
    const cargarDatos = async () => {
      const tcGuardado = localStorage.getItem('tc_combos_jared');
      if (tcGuardado) setTipoCambio(parseFloat(tcGuardado));

      if (cacheGlobalPropuestas && cacheGlobalDataKO_Prop && cacheGlobalCombos_Prop) {
        setCatalogoKO(cacheGlobalDataKO_Prop);
        setCatalogoCombos(cacheGlobalCombos_Prop);
        setDatos(cacheGlobalPropuestas);
        setCargando(false);
        return;
      }

      const [dbData, koData, combosData] = await Promise.all([
        obtenerPropuestas(),
        obtenerDataKO(),
        obtenerCombos()
      ]);
      
      cacheGlobalDataKO_Prop = koData;
      cacheGlobalCombos_Prop = combosData;
      cacheGlobalPropuestas = dbData;

      setCatalogoKO(koData);
      setCatalogoCombos(combosData);
      setDatos(dbData);
      setCargando(false);
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!cargando) {
      cacheGlobalPropuestas = datos;
    }
  }, [datos, cargando]);

  const agregarFila = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setDatos([{ id: Date.now().toString(), fechaCompra: hoy, perfilado: "", cantidad: 1, combo: "", codigoAB: "", codigoA: "", codigoB: "", precioDolares: 0, valorA: 0, valorB: 0 }, ...datos]);
    setPaginaActual(1);
  };

  const actualizarCelda = (id: string, campo: string, valor: any) => {
    setDatos(prev => prev.map(fila => {
      if (fila.id !== id) return fila;

      const nuevaFila = { ...fila, [campo]: valor };

      if (campo === 'combo') {
        const comboTexto = (valor || "").toUpperCase().trim();
        const matchCombo = catalogoCombos.find(c => c.combo === comboTexto);
        
        if (matchCombo) {
          nuevaFila.codigoAB = matchCombo.codigoAB || "";
          
          const codigos = nuevaFila.codigoAB.split('+');
          nuevaFila.codigoA = codigos[0]?.trim() || "";
          nuevaFila.codigoB = codigos.slice(1).join('+').trim() || "";
          
          nuevaFila.precioDolares = matchCombo.precioDolares || 0;

          const matchA = catalogoKO.find(k => (k.codigoInche || "").replace(/\s+/g, '').toUpperCase() === nuevaFila.codigoA.replace(/\s+/g, ''));
          nuevaFila.valorA = matchCombo.valorAManual ?? (matchA ? parseFloat(matchA.valorComercial) || 0 : 0);

          const matchB = catalogoKO.find(k => (k.codigoInche || "").replace(/\s+/g, '').toUpperCase() === nuevaFila.codigoB.replace(/\s+/g, ''));
          nuevaFila.valorB = matchCombo.valorBManual ?? (matchB ? parseFloat(matchB.valorComercial) || 0 : 0);
        } else {
          nuevaFila.codigoAB = "";
          nuevaFila.codigoA = "";
          nuevaFila.codigoB = "";
          nuevaFila.precioDolares = 0;
          nuevaFila.valorA = 0;
          nuevaFila.valorB = 0;
        }
      }

      return nuevaFila;
    }));
  };

  const eliminarFila = (id: string) => {
    setDatos(datos.filter(fila => fila.id !== id));
  };

  // 🔥 PROCESAMIENTO MÁGICO DE EXCEL CON AUTOCOMPLETADO
  const procesarArchivoExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const listaNuevos: any[] = [];
        const hoy = new Date().toISOString().split('T')[0];

        json.forEach((row: any, index: number) => {
          if (Array.isArray(row) && row.length > 0) {
            // Busca el código del combo donde sea que esté en la fila
            const comboStr = row.find(c => typeof c === 'string' && c.toUpperCase().includes('COMBO'));
            const comboFinal = comboStr ? comboStr.trim().toUpperCase() : String(row[3] || row[0] || '').trim().toUpperCase();

            if (comboFinal.startsWith('COMBO') && comboFinal !== 'COMBO') {
              const cantidad = parseInt(row.find((c: any) => typeof c === 'number') || row[2]) || 1;
              const perfilado = String(row[1] || (row.find((c: any) => typeof c === 'string' && (c.includes('CLIENTE') || c.includes('BLST'))) || ''));

              // BUSCARV EN TIEMPO DE IMPORTACIÓN
              const matchCombo = catalogoCombos.find(c => c.combo === comboFinal);
              let codigoAB = "", codigoA = "", codigoB = "", precioDolares = 0, valorA = 0, valorB = 0;

              if (matchCombo) {
                codigoAB = matchCombo.codigoAB || "";
                const codigos = codigoAB.split('+');
                codigoA = codigos[0]?.trim() || "";
                codigoB = codigos.slice(1).join('+').trim() || "";
                precioDolares = matchCombo.precioDolares || 0;

                const matchA = catalogoKO.find(k => (k.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codigoA.replace(/\s+/g, ''));
                valorA = matchCombo.valorAManual ?? (matchA ? parseFloat(matchA.valorComercial) || 0 : 0);

                const matchB = catalogoKO.find(k => (k.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codigoB.replace(/\s+/g, ''));
                valorB = matchCombo.valorBManual ?? (matchB ? parseFloat(matchB.valorComercial) || 0 : 0);
              }

              listaNuevos.push({
                id: `excel_${Date.now()}_${index}`,
                fechaCompra: hoy,
                perfilado: perfilado,
                cantidad,
                combo: comboFinal,
                codigoAB,
                codigoA,
                codigoB,
                precioDolares,
                valorA,
                valorB
              });
            }
          }
        });

        if (listaNuevos.length > 0) {
          setDatos([...listaNuevos, ...datos]);
          setModalImportar(false);
          setAlerta({ visible: true, tipo: 'exito', titulo: 'Importación Exitosa', mensaje: `Se agregaron ${listaNuevos.length} propuestas a la pantalla. Presiona Guardar Cambios para subir a la nube.` });
        } else {
          setAlerta({ visible: true, tipo: 'error', titulo: 'Formato Incorrecto', mensaje: 'No se encontraron combos válidos. Asegúrate de que tu Excel contenga los nombres de los Combos.' });
        }
      } catch (error) {
        setAlerta({ visible: true, tipo: 'error', titulo: 'Error de Lectura', mensaje: 'El archivo Excel está dañado o no tiene un formato válido.' });
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = ''; 
  };

  const vaciarTabla = () => {
    setAlerta({
      visible: true, 
      tipo: 'confirmacion', 
      titulo: '¿Vaciar Todas las Propuestas?',
      mensaje: 'Estás a punto de borrar todas las proformas de la pantalla y de la nube. Esta acción no se puede deshacer.',
      textoConfirmar: 'Sí, Eliminar Todo',
      accionConfirma: async () => { 
        setAlerta(prev => ({ ...prev, visible: false }));
        setGuardando(true);
        const resultado = await sincronizarPropuestas([]);
        setGuardando(false);
        if (resultado.success) {
          setDatos([]); 
          setPaginaActual(1); 
          setAlerta({ visible: true, tipo: 'exito', titulo: 'Base de Datos Vaciada', mensaje: 'Se han eliminado todas las propuestas.' });
        } else {
          setAlerta({ visible: true, tipo: 'error', titulo: 'Error', mensaje: 'Ocurrió un problema.' });
        }
      }
    });
  };

  const guardarCambios = async () => {
    setGuardando(true);
    const resultado = await sincronizarPropuestas(datos);
    setGuardando(false);
    if (resultado.success) {
      setAlerta({ visible: true, tipo: 'exito', titulo: 'Propuestas Guardadas', mensaje: 'Se han guardado todas las propuestas en la base de datos.' });
    } else {
      setAlerta({ visible: true, tipo: 'error', titulo: 'Error', mensaje: 'Ocurrió un problema al guardar.' });
    }
  };

  const dataCalculada = useMemo(() => {
    return datos.map(row => {
      const precioSoles = (row.precioDolares || 0) * tipoCambio;
      const totalAB = (row.valorA || 0) + (row.valorB || 0);
      const ahorroUnitario = totalAB - precioSoles;
      const ahorroTotal = ahorroUnitario * (row.cantidad || 1);
      const pedidoTotalDolares = (row.precioDolares || 0) * (row.cantidad || 1);

      return { ...row, precioSoles, totalAB, ahorroUnitario, ahorroTotal, pedidoTotalDolares };
    });
  }, [datos, tipoCambio]);

  const dataFiltrada = useMemo(() => {
    let filtrada = [...dataCalculada];
    if (busquedaActiva) {
      const terminos = busquedaActiva.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      filtrada = filtrada.filter(d => 
        terminos.some(termino => 
          (d.combo || "").toLowerCase().includes(termino) || 
          (d.codigoAB || "").toLowerCase().includes(termino) ||
          (d.perfilado || "").toLowerCase().includes(termino)
        )
      );
    }
    return filtrada;
  }, [dataCalculada, busquedaActiva]);

  useEffect(() => { setPaginaActual(1); }, [busquedaActiva, itemsPorPagina]);

  const totalRegistros = dataFiltrada.length;
  const totalPaginas = Math.ceil(totalRegistros / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const datosDeEstaPagina = dataFiltrada.slice(indiceInicio, indiceFin);

  return (
    <main className="p-4 sm:p-6 flex flex-col h-[calc(100vh)] bg-slate-50 relative overflow-hidden">
      
      {cargando && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/90 backdrop-blur-md">
          <Loader2 className="w-14 h-14 text-indigo-600 animate-spin" />
        </div>
      )}

      <div className="max-w-[1800px] mx-auto w-full mb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-indigo-600" /> Propuestas del Día
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Módulo de armado de proformas y cálculo de ahorro.
          </p>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto w-full mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button onClick={agregarFila} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Agregar Fila
          </button>
          
          <button onClick={() => setModalImportar(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4" /> Excel (Masivo)
          </button>

          <button onClick={guardarCambios} disabled={guardando} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-60 whitespace-nowrap">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar Cambios
          </button>
        </div>

        <div className="hidden xl:block w-px h-8 bg-slate-200 mx-1 flex-shrink-0"></div>

        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex-shrink-0">
            <label className="text-xs font-black text-slate-500">T.C.</label>
            <div className="flex items-center">
              <span className="text-emerald-600 font-bold mr-1">S/</span>
              <input 
                type="number" 
                step="0.01" 
                value={tipoCambio} 
                onChange={(e) => { 
                  const nuevoTC = parseFloat(e.target.value) || 0;
                  setTipoCambio(nuevoTC);
                  localStorage.setItem('tc_combos_jared', nuevoTC.toString());
                }} 
                className="w-14 bg-transparent text-slate-800 font-black focus:outline-none p-0 m-0 text-sm" 
              />
            </div>
          </div>

          <div className="relative group flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar (ej: COMBO 1, CLIENTE A)..." 
              value={inputBusqueda} 
              onChange={(e) => setInputBusqueda(e.target.value)} 
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
            />
            {inputBusqueda && <button onClick={() => setInputBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><FilterX className="w-4 h-4" /></button>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button onClick={vaciarTabla} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl font-bold text-sm whitespace-nowrap">
            <AlertTriangle className="w-4 h-4" /> Vaciar
          </button>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto w-full bg-white rounded-t-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-200/60 flex-1 flex flex-col min-h-0 overflow-hidden relative border-b-0">
        <div className="overflow-hidden flex-1 w-full relative">
          
          <table className="w-full text-[10px] xl:text-[11px] border-collapse table-fixed">
            <thead className="sticky top-0 z-20 shadow-sm bg-slate-100">
              <tr>
                <th className="px-1 py-2 w-[3%] text-center border-r border-white">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </th>
                <th className="font-black text-slate-500 px-1 py-2 text-center border-r border-white w-[3%]">Nº</th>
                <th className="font-black text-slate-800 bg-yellow-300 px-1 py-2 text-center border-r border-white w-[8%] leading-tight">COMPRA DEL DÍA</th>
                <th className="font-black text-slate-800 bg-yellow-300 px-1 py-2 text-center border-r border-white w-[8%] leading-tight">PERFILADO</th>
                <th className="font-black text-slate-700 px-1 py-2 text-center border-r border-white w-[3%] leading-tight">CANT.</th>
                <th className="font-black text-slate-700 px-1 py-2 text-center border-r border-white w-[7%] leading-tight">COMBO</th>
                <th className="font-black text-slate-700 px-1 py-2 text-center border-r border-white w-[13%] leading-tight">CÓDIGOS<br/>(A + B)</th>
                <th className="font-black text-rose-800 bg-rose-100 px-1 py-2 text-center border-r border-white w-[9%] leading-tight">CÓDIGO A</th>
                <th className="font-black text-blue-800 bg-blue-100 px-1 py-2 text-center border-r border-white w-[9%] leading-tight">CÓDIGO B</th>
                <th className="font-black text-emerald-800 bg-emerald-100 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">PRECIO $</th>
                <th className="font-black text-slate-700 bg-slate-200 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">PRECIO<br/>(S/)</th>
                <th className="font-black text-rose-800 bg-rose-50 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">VALOR A<br/>(S/)</th>
                <th className="font-black text-blue-800 bg-blue-50 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">VALOR B<br/>(S/)</th>
                <th className="font-black text-orange-800 bg-orange-100 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">TOTAL<br/>(A+B)</th>
                <th className="font-black text-white bg-emerald-500 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">AHORRO</th>
                <th className="font-black text-white bg-emerald-600 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">AHORRO<br/>TOTAL</th>
                <th className="font-black text-slate-900 bg-yellow-400 px-1 py-2 text-center border-r border-white w-[5%] leading-tight">PEDIDO<br/>TOTAL</th>
                <th className="font-black text-rose-700 bg-rose-100 px-1 py-2 text-center w-[2%] leading-tight">🗑️</th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto block w-full h-[calc(100%-40px)] custom-scrollbar" style={{ display: "table-row-group" }}>
              {datosDeEstaPagina.length === 0 ? (
                <tr>
                  <td colSpan={18} className="h-[400px]">
                    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-500">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <SearchX className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-black text-slate-700 mb-1">Sin Resultados</h3>
                      <p className="text-sm font-medium text-slate-500 mx-auto mt-2">
                        No hay proformas en la tabla.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                datosDeEstaPagina.map((row, renderIndex) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group h-10">
                    <td className="p-1 border-r text-center bg-white"><input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" /></td>
                    <td className="p-1 border-r text-center font-black bg-slate-50 text-slate-400">{indiceInicio + renderIndex + 1}</td>
                    
                    <td className="p-0 border-r relative align-middle">
                      <input 
                        type="date" 
                        value={row.fechaCompra || ""} 
                        onChange={(e) => actualizarCelda(row.id, 'fechaCompra', e.target.value)} 
                        className="w-full h-full text-center font-bold text-slate-700 bg-transparent outline-none cursor-pointer flex items-center justify-center px-1" 
                      />
                    </td>
                    
                    <td className="p-0 border-r relative align-middle">
                      <PerfiladoComboBox valor={row.perfilado || ""} onChange={(v) => actualizarCelda(row.id, 'perfilado', v)} />
                    </td>
                    
                    <td className="p-0 border-r overflow-hidden"><input type="number" min="1" value={row.cantidad ?? ''} onChange={(e) => actualizarCelda(row.id, 'cantidad', parseInt(e.target.value) || 1)} className="w-full h-full text-center font-black text-slate-700 bg-transparent outline-none min-w-0" /></td>
                    <td className="p-0 border-r overflow-hidden"><input type="text" value={row.combo || ""} onChange={(e) => actualizarCelda(row.id, 'combo', e.target.value.toUpperCase())} placeholder="Ej: COMBO..." className="w-full h-full px-1 text-center font-bold text-indigo-700 bg-indigo-50/30 outline-none focus:bg-white truncate min-w-0" /></td>
                    <td className="p-0 border-r overflow-hidden"><input type="text" value={row.codigoAB || ""} onChange={(e) => actualizarCelda(row.id, 'codigoAB', e.target.value.toUpperCase())} className="w-full h-full px-1 text-center font-mono font-bold text-slate-800 bg-transparent outline-none focus:bg-white truncate min-w-0" /></td>
                    <td className="p-0 border-r bg-rose-50/30 overflow-hidden"><input type="text" value={row.codigoA || ""} onChange={(e) => actualizarCelda(row.id, 'codigoA', e.target.value.toUpperCase())} className="w-full h-full px-1 text-center font-mono font-bold text-rose-700 bg-transparent outline-none focus:bg-white truncate min-w-0" /></td>
                    <td className="p-0 border-r bg-blue-50/30 overflow-hidden"><input type="text" value={row.codigoB || ""} onChange={(e) => actualizarCelda(row.id, 'codigoB', e.target.value.toUpperCase())} className="w-full h-full px-1 text-center font-mono font-bold text-blue-700 bg-transparent outline-none focus:bg-white truncate min-w-0" /></td>
                    <td className="p-0 border-r bg-emerald-50/30 overflow-hidden"><div className="flex items-center h-full justify-center"><span className="text-emerald-600 font-bold ml-1">$</span><input type="number" step="0.01" value={row.precioDolares ?? ''} onChange={(e) => actualizarCelda(row.id, 'precioDolares', parseFloat(e.target.value) || 0)} className="w-full h-full text-center font-bold text-emerald-700 bg-transparent outline-none focus:bg-white min-w-0" /></div></td>
                    <td className="p-1 border-r text-center font-black text-slate-700 bg-slate-50 truncate">S/ {row.precioSoles.toFixed(2)}</td>
                    <td className="p-0 border-r bg-rose-50/20 overflow-hidden"><div className="flex items-center h-full justify-center"><span className="text-rose-400 font-bold ml-1">S/</span><input type="number" step="0.01" value={row.valorA ?? ''} onChange={(e) => actualizarCelda(row.id, 'valorA', parseFloat(e.target.value) || 0)} className="w-full h-full text-center font-bold text-rose-700 bg-transparent outline-none focus:bg-white min-w-0" /></div></td>
                    <td className="p-0 border-r bg-blue-50/20 overflow-hidden"><div className="flex items-center h-full justify-center"><span className="text-blue-400 font-bold ml-1">S/</span><input type="number" step="0.01" value={row.valorB ?? ''} onChange={(e) => actualizarCelda(row.id, 'valorB', parseFloat(e.target.value) || 0)} className="w-full h-full text-center font-bold text-blue-700 bg-transparent outline-none focus:bg-white min-w-0" /></div></td>
                    <td className="p-1 border-r text-center font-black text-orange-800 bg-orange-50/50 truncate">S/ {row.totalAB.toFixed(2)}</td>
                    <td className="p-1 border-r text-center font-black text-emerald-700 bg-emerald-100 truncate">S/ {row.ahorroUnitario.toFixed(2)}</td>
                    <td className="p-1 border-r text-center font-black text-emerald-800 bg-emerald-200 truncate">S/ {row.ahorroTotal.toFixed(2)}</td>
                    <td className="p-1 border-r text-center font-black text-slate-900 bg-yellow-100 truncate">${row.pedidoTotalDolares.toFixed(2)}</td>
                    <td className="p-0 text-center bg-white group-hover:bg-rose-50/50 transition-colors"><button onClick={() => eliminarFila(row.id)} className="w-full h-full flex items-center justify-center text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto w-full bg-white border border-slate-200/60 rounded-b-3xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-500">Mostrar</label>
          <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" value={itemsPorPagina} onChange={(e) => setItemsPorPagina(Number(e.target.value))}>
            <option value={15}>15 registros</option><option value={30}>30 registros</option><option value={50}>50 registros</option><option value={100}>100 registros</option>
          </select>
        </div>
        <div className="text-sm font-bold text-slate-500">Mostrando {totalRegistros === 0 ? 0 : indiceInicio + 1} a {Math.min(indiceFin, totalRegistros)} de {totalRegistros} propuestas</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1 || totalRegistros === 0} className="rounded-xl border-slate-200 text-slate-600 font-bold"><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual >= totalPaginas || totalRegistros === 0} className="rounded-xl border-slate-200 text-slate-600 font-bold">Siguiente <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>

      {/* 🔥 MODAL PARA IMPORTAR EXCEL */}
      <Dialog open={modalImportar} onOpenChange={setModalImportar}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-6 shadow-2xl border-slate-100">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-orange-500" />
              Importar Excel (Masivo)
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
              Sube tu archivo .xlsx o .xls con la lista de combos. El sistema aplicará la magia del autocompletado para llenar los códigos y precios al instante.
            </DialogDescription>
          </DialogHeader>

          <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-10 flex flex-col items-center justify-center transition-colors hover:bg-indigo-50">
            <FileSpreadsheet className="w-12 h-12 text-indigo-400 mb-4" />
            <h3 className="text-lg font-black text-indigo-900 mb-2">Sube tu matriz Excel</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 text-center max-w-sm">
              Selecciona tu archivo original. Las propuestas se agregarán al final de tu lista actual.
            </p>
            <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black cursor-pointer shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2">
              <Upload className="w-5 h-5" /> Seleccionar Archivo
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={procesarArchivoExcel} />
            </label>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setModalImportar(false)} className="rounded-xl h-12 font-bold text-slate-600 w-full">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alerta.visible} onOpenChange={(open) => setAlerta(prev => ({ ...prev, visible: open }))}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 border-slate-100 shadow-2xl flex flex-col items-center text-center">
          
          {alerta.tipo === 'exito' && <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-1"><CheckCircle2 className="w-10 h-10 text-emerald-500" /></div>}
          {alerta.tipo === 'error' && <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-1"><XCircle className="w-10 h-10 text-rose-500 animate-pulse" /></div>}
          {alerta.tipo === 'confirmacion' && <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-1"><AlertTriangle className="w-10 h-10 text-amber-500" /></div>}
          
          <DialogHeader className="flex flex-col items-center w-full">
            <DialogTitle className="text-2xl font-black text-slate-800 text-center">{alerta.titulo}</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 leading-relaxed text-center mt-2">{alerta.mensaje}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 flex sm:justify-center w-full gap-3">
            {alerta.tipo === 'confirmacion' ? (
              <>
                <Button variant="outline" onClick={() => setAlerta(prev => ({ ...prev, visible: false }))} className="w-full sm:w-1/2 rounded-xl h-12 font-bold text-slate-600">Cancelar</Button>
                <Button onClick={alerta.accionConfirma} className="w-full sm:w-1/2 rounded-xl h-12 font-black text-white bg-rose-500 shadow-lg shadow-rose-500/30">{alerta.textoConfirmar || 'Confirmar'}</Button>
              </>
            ) : (
              <Button onClick={() => setAlerta(prev => ({ ...prev, visible: false }))} className="w-full rounded-xl h-12 font-black text-white bg-slate-900 shadow-md hover:bg-slate-800 transition-all">Entendido</Button>
            )}
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </main>
  );
}