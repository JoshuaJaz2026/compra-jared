"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Calculator, Sparkles, Search, FilterX, Plus, Save, Trash2, 
  AlertTriangle, CheckCircle2, XCircle, Loader2, Pencil, RotateCcw, 
  ChevronLeft, ChevronRight, FileSpreadsheet, ClipboardPaste, ListChecks, Filter, ChevronDown, SearchX, Copy, CheckSquare, Send, Upload
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx"; 

import { obtenerDataKO } from "@/app/data-ko/actions"; 
import { obtenerCombos, sincronizarCombos, actualizarCombosParcial } from "./actions";

let cacheGlobalCombos: any[] | null = null;
let cacheGlobalDataKO: any[] | null = null;

function CustomSelect({ icono: Icono, valor, onChange, opciones, tituloBase }: any) {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const opcionActiva = opciones.find((o: any) => o.valor === valor);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setAbierto(!abierto)}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-all border ${
          valor !== "TODOS" 
            ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
        } min-w-[170px] focus:outline-none whitespace-nowrap`}
      >
        <div className="flex items-center gap-2 truncate">
          <Icono className={`w-4 h-4 flex-shrink-0 ${valor !== "TODOS" ? "text-indigo-500" : "text-slate-400"}`} />
          <span className="truncate">{valor === "TODOS" ? tituloBase : opcionActiva?.etiquetaTexto || valor}</span>
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${abierto ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
      </button>

      {abierto && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 custom-scrollbar max-h-80 overflow-y-auto">
          <div className="flex flex-col p-1">
            {opciones.map((opcion: any) => (
              <button
                key={opcion.valor}
                onClick={() => { onChange(opcion.valor); setAbierto(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all rounded-lg ${
                  valor === opcion.valor
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opcion.iconoAdicional && <span>{opcion.iconoAdicional}</span>}
                {opcion.etiquetaRender || opcion.etiquetaTexto || opcion.valor}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CombosPage() {
  const [datos, setDatos] = useState<any[]>([]);
  const [dataKO, setDataKO] = useState<any[]>([]); 
  
  const [cargando, setCargando] = useState(true);
  const [progresoCarga, setProgresoCarga] = useState(0);
  const [mostrarInterfaz, setMostrarInterfaz] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tipoCambio, setTipoCambio] = useState<number | string>(3.49);
  
  const [inputBusqueda, setInputBusqueda] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState("");
  
  const [filtroRentabilidad, setFiltroRentabilidad] = useState("TODOS");
  const [filtroModelo, setFiltroModelo] = useState("TODOS");
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(15);
  
  const [modalImportar, setModalImportar] = useState(false);
  const [tipoImportacion, setTipoImportacion] = useState<'excel' | 'whatsapp'>('whatsapp');
  const [textoImportacion, setTextoImportacion] = useState("");
  const [pasoImportacion, setPasoImportacion] = useState(1);
  const [analisisImportacion, setAnalisisImportacion] = useState<{ actualizar: any[], nuevos: any[] }>({ actualizar: [], nuevos: [] });
  const [filtroListaImportada, setFiltroListaImportada] = useState<string[]>([]);

  const [alerta, setAlerta] = useState<{ visible: boolean; tipo: 'exito' | 'error' | 'confirmacion'; titulo: string; mensaje: string; textoConfirmar?: string; accionConfirma?: () => void; }>({ visible: false, tipo: 'exito', titulo: '', mensaje: '' });

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [modalExportarTexto, setModalExportarTexto] = useState(false);
  const [textoExportacion, setTextoExportacion] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setBusquedaActiva(inputBusqueda);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputBusqueda]);

  const datosRef = useRef(datos);
  useEffect(() => { datosRef.current = datos; }, [datos]);

  useEffect(() => {
    const arrancarMotores = async () => {
      const tcGuardado = localStorage.getItem('tc_combos_jared');
      if (tcGuardado) setTipoCambio(parseFloat(tcGuardado));

      if (cacheGlobalCombos && cacheGlobalDataKO) {
        setDataKO(cacheGlobalDataKO);
        setDatos(cacheGlobalCombos);
        setCargando(false);
        setMostrarInterfaz(true);
        return;
      }

      setProgresoCarga(15);
      const catalogoKO = await obtenerDataKO();
      cacheGlobalDataKO = catalogoKO;
      setDataKO(catalogoKO);
      
      setProgresoCarga(75);
      const combosDB = await obtenerCombos();
      const datosFinales = combosDB; 
      cacheGlobalCombos = datosFinales;
      setDatos(datosFinales);
      
      setProgresoCarga(100);
      setTimeout(() => { setCargando(false); setTimeout(() => setMostrarInterfaz(true), 100); }, 500);
    };
    arrancarMotores();
  }, []);

  useEffect(() => {
    if (!cargando) cacheGlobalCombos = datos;
  }, [datos, cargando]);

  const agregarFila = () => { setDatos([{ id: Date.now().toString(), combo: "", codigoAB: "", precioDolares: 0 }, ...datos]); setPaginaActual(1); };
  const actualizarCelda = (id: string, campo: string, valor: any) => { setDatos(datos.map(fila => fila.id === id ? { ...fila, [campo]: valor } : fila)); };
  const eliminarFila = (id: string) => { 
    setDatos(datos.filter(fila => fila.id !== id)); 
    const nuevosSeleccionados = new Set(seleccionados);
    nuevosSeleccionados.delete(id);
    setSeleccionados(nuevosSeleccionados);
  };

  const vaciarTabla = () => {
    setAlerta({
      visible: true, 
      tipo: 'confirmacion', 
      titulo: '¿Vaciar Toda la Matriz?',
      mensaje: 'Estás a punto de borrar todos los combos de la pantalla y de la base de datos en la nube. Esta acción no se puede deshacer.',
      textoConfirmar: 'Sí, Eliminar Todo',
      accionConfirma: async () => { 
        setAlerta(prev => ({ ...prev, visible: false }));
        setGuardando(true);
        
        const resultado = await actualizarCombosParcial([]);
        
        setGuardando(false);
        if (resultado.success) {
          setDatos([]); 
          cacheGlobalCombos = []; 
          setPaginaActual(1); 
          setSeleccionados(new Set()); 
          setAlerta({ visible: true, tipo: 'exito', titulo: 'Base de Datos Vaciada', mensaje: 'Se han eliminado todos los combos correctamente.' });
        } else {
          setAlerta({ visible: true, tipo: 'error', titulo: 'Error', mensaje: 'Ocurrió un problema al intentar vaciar la base de datos.' });
        }
      }
    });
  };

  const ejecutarGuardado = async () => {
    setAlerta(prev => ({ ...prev, visible: false })); 
    setGuardando(true);
    const resultado = await actualizarCombosParcial(datos);
    setGuardando(false);
    if (resultado.success) setAlerta({ visible: true, tipo: 'exito', titulo: 'Matriz Actualizada', mensaje: `Se guardaron los cambios exitosamente en la base de datos.` });
    else setAlerta({ visible: true, tipo: 'error', titulo: 'Error', mensaje: resultado.error || 'Ocurrió un problema.' });
  };

  const intentarGuardar = () => {
    const hayErroresNA = datos.some(row => {
      const codigoAB = row.codigoAB || "";
      const codigos = codigoAB.includes('+') ? codigoAB.split('+') : [codigoAB];
      const codA = codigos[0]?.trim().toUpperCase().replace(/\s+/g, '') || "";
      const codB = codigos[1]?.trim().toUpperCase().replace(/\s+/g, '') || "";
      const matchA = codA ? dataKO.find(d => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codA) : null;
      const matchB = codB ? dataKO.find(d => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codB) : null;
      return (row.valorAManual == null && codA !== "" && !matchA) || (row.valorBManual == null && codB !== "" && !matchB);
    });

    if (hayErroresNA) {
      setAlerta({ visible: true, tipo: 'confirmacion', titulo: '⚠️ Datos Incompletos', mensaje: 'Hay combos marcando error (#N/A). ¿Seguro que deseas guardar?', textoConfirmar: 'Sí, Guardar', accionConfirma: ejecutarGuardado });
    } else { ejecutarGuardado(); }
  };

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
        
        json.forEach((row: any, index: number) => {
          if (Array.isArray(row)) {
            const validCols = row.filter((c: any) => c !== undefined && c !== null && String(c).trim() !== '');
            if (validCols.length >= 3) {
              const combo = String(row[0] || '').trim().toUpperCase();
              const codigoAB = String(row[1] || '').trim().toUpperCase();
              
              if (combo.startsWith('COMBO') && combo !== 'COMBO') {
                const precioRaw = String(validCols[validCols.length - 1]).replace('$', '').replace(',', '.').trim();
                const precio = parseFloat(precioRaw) || 0;
                
                listaNuevos.push({ 
                  id: `excel_${Date.now()}_${index}`, 
                  combo, 
                  codigoAB, 
                  precioDolares: precio, 
                  valorAManual: null, 
                  valorBManual: null 
                });
              }
            }
          }
        });

        if (listaNuevos.length > 0) {
          ejecutarImportacion([], listaNuevos);
        } else {
          setAlerta({ visible: true, tipo: 'error', titulo: 'Formato Incorrecto', mensaje: 'No se encontraron combos válidos. Asegúrate de que tu Excel tenga los datos correctos.' });
        }
      } catch (error) {
        setAlerta({ visible: true, tipo: 'error', titulo: 'Error de Lectura', mensaje: 'El archivo Excel está dañado o no tiene un formato válido.' });
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = ''; 
  };

  const procesarTextoImportacion = () => {
    if (!textoImportacion.trim()) return;
    const lineas = textoImportacion.split('\n').filter(l => l.trim() !== '');
    const listaActualizar: any[] = []; const listaNuevos: any[] = [];
    
    lineas.forEach((linea, index) => {
      const columnas = linea.split('\t');
      if (columnas.length >= 3) {
        const combo = columnas[0].trim().toUpperCase();
        const codigoAB = columnas[1].trim().toUpperCase();
        
        const precioRaw = columnas[columnas.length - 1].replace('$', '').replace(',', '.').trim();
        const precio = parseFloat(precioRaw) || 0;
        
        const comboExistente = datos.find(d => d.combo === combo);
        if (comboExistente) listaActualizar.push({ ...comboExistente, codigoAB, precioDolares: precio });
        else listaNuevos.push({ id: `import_${Date.now()}_${index}`, combo, codigoAB, precioDolares: precio, valorAManual: null, valorBManual: null });
      }
    });
    setAnalisisImportacion({ actualizar: listaActualizar, nuevos: listaNuevos });
    
    if (listaNuevos.length > 0) setPasoImportacion(2);
    else ejecutarImportacion(listaActualizar, listaNuevos);
  };

  const ejecutarImportacion = (listaActualizar: any[], listaNuevos: any[]) => {
    if (tipoImportacion === 'excel') {
      const datosFinales = [...listaNuevos];
      setDatos(datosFinales);
      setModalImportar(false); setTextoImportacion(""); setPasoImportacion(1); setPaginaActual(1);
      
      setAlerta({ 
        visible: true, 
        tipo: 'confirmacion', 
        titulo: '⚠️ Sobrescribir Base de Datos', 
        mensaje: `Has cargado ${datosFinales.length} combos desde Excel. Esto ELIMINARÁ la matriz anterior de la nube y guardará esta nueva. ¿Proceder?`, 
        textoConfirmar: 'Sí, Reemplazar Todo', 
        accionConfirma: async () => {
          setGuardando(true);
          const res = await sincronizarCombos(datosFinales);
          setGuardando(false);
          setAlerta({ visible: true, tipo: res.success ? 'exito' : 'error', titulo: res.success ? 'Completado' : 'Error', mensaje: res.success ? 'Base de datos sobrescrita masivamente.' : 'Ocurrió un error.' });
        }
      });
    } else {
      const mapaActualizaciones = new Map(listaActualizar.map(item => [item.combo, item]));
      const datosModificados = datos.map(row => mapaActualizaciones.has(row.combo) ? mapaActualizaciones.get(row.combo) : row);
      const datosFinales = [...listaNuevos, ...datosModificados];
      
      setDatos(datosFinales); 
      setFiltroListaImportada([...listaActualizar, ...listaNuevos].map(item => item.combo));
      setModalImportar(false); setTextoImportacion(""); setPasoImportacion(1); setPaginaActual(1);
      setAlerta({ visible: true, tipo: 'exito', titulo: 'Proforma Importada', mensaje: `Se actualizaron precios de ${listaActualizar.length} combos y se crearon ${listaNuevos.length} nuevos. Presiona Guardar para subirlos a la nube.` });
    }
  };

  const tcNumerico = typeof tipoCambio === 'number' ? tipoCambio : 0;
  
  const dataPreCalculada = useMemo(() => {
    return datos.map((row) => {
      const codigoAB = row.codigoAB || "";
      const codigos = codigoAB.includes('+') ? codigoAB.split('+') : [codigoAB];
      const codA = codigos[0]?.trim().toUpperCase() || "";
      const codB = codigos.slice(1).join('+').trim().toUpperCase() || "";
      const precioSoles = (row.precioDolares || 0) * tcNumerico;
      const codALimpio = codA.replace(/\s+/g, '');
      const codBLimpio = codB.replace(/\s+/g, '');
      
      const matchA = codALimpio ? dataKO.find(d => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codALimpio) : null;
      const valorA_calc = matchA ? parseFloat(String(matchA.valorComercial)) || 0 : 0;
      const valorA_final = row.valorAManual != null ? row.valorAManual : valorA_calc;
      const errorA = row.valorAManual == null && codALimpio !== "" && !matchA;
      
      const matchB = codBLimpio ? dataKO.find(d => (d.codigoInche || "").replace(/\s+/g, '').toUpperCase() === codBLimpio) : null;
      const valorB_calc = matchB ? parseFloat(String(matchB.valorComercial)) || 0 : 0;
      const valorB_final = row.valorBManual != null ? row.valorBManual : valorB_calc;
      const errorB = row.valorBManual == null && codBLimpio !== "" && !matchB;
      
      const errorTotal = errorA || errorB;
      const totalUnitario = valorA_final + valorB_final;
      const diferencia = totalUnitario - precioSoles;

      let estadoRentabilidad = "NO CONVIENE";
      if (errorTotal) estadoRentabilidad = "REVISAR";
      else if (diferencia >= 59) estadoRentabilidad = "EXCELENTE";
      else if (diferencia >= 15) estadoRentabilidad = "CONVIENE";
      else if (diferencia >= 1) estadoRentabilidad = "REGULAR";
      else estadoRentabilidad = "NO CONVIENE";

      return { row, codA, codB, precioSoles, valorA_final, valorB_final, totalUnitario, diferencia, errorA, errorB, errorTotal, estadoRentabilidad };
    });
  }, [datos, dataKO, tcNumerico]);

  const modelosUnicos = useMemo(() => {
    return Array.from(new Set(dataPreCalculada.map(d => d.codA))).filter(Boolean).sort();
  }, [dataPreCalculada]);

  const dataFiltrada = useMemo(() => {
    let filtrada = [...dataPreCalculada];
    if (filtroListaImportada.length > 0) filtrada = filtrada.filter(d => filtroListaImportada.includes(d.row.combo));
    if (filtroRentabilidad !== "TODOS") filtrada = filtrada.filter(d => d.estadoRentabilidad === filtroRentabilidad);
    if (filtroModelo !== "TODOS") filtrada = filtrada.filter(d => d.codA === filtroModelo);
    if (busquedaActiva) {
      const termino = busquedaActiva.toLowerCase();
      filtrada = filtrada.filter(d => (d.row.combo || "").toLowerCase().includes(termino) || (d.row.codigoAB || "").toLowerCase().includes(termino));
    }
    
    return filtrada.sort((a, b) => (a.row.combo || "").localeCompare(b.row.combo || "", undefined, { numeric: true, sensitivity: 'base' }));
  }, [dataPreCalculada, busquedaActiva, filtroRentabilidad, filtroModelo, filtroListaImportada]);

  useEffect(() => { setPaginaActual(1); }, [busquedaActiva, filtroRentabilidad, filtroModelo, itemsPorPagina, filtroListaImportada]);

  const totalRegistros = dataFiltrada.length;
  const totalPaginas = Math.ceil(totalRegistros / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const datosDeEstaPagina = dataFiltrada.slice(indiceInicio, indiceFin);

  const opcionesRentabilidad = [
    { valor: "TODOS", etiquetaTexto: "Rentabilidad (Todas)", iconoAdicional: null },
    { valor: "EXCELENTE", etiquetaTexto: "Excelentes (≥ S/59)", iconoAdicional: <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div> },
    { valor: "CONVIENE", etiquetaTexto: "Convienen (S/15 a 58.99)", iconoAdicional: <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> },
    { valor: "REGULAR", etiquetaTexto: "Regulares (S/1 a 14.99)", iconoAdicional: <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div> },
    { valor: "NO CONVIENE", etiquetaTexto: "No Convienen (< S/1)", iconoAdicional: <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div> },
    { valor: "REVISAR", etiquetaTexto: "Sin Datos", iconoAdicional: <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> },
  ];

  const opcionesModelos = [
    { valor: "TODOS", etiquetaTexto: "Modelos (Todos)" },
    ...modelosUnicos.map(mod => ({ valor: mod, etiquetaTexto: mod }))
  ];

  const limpiarFiltros = () => {
    setInputBusqueda("");
    setBusquedaActiva("");
    setFiltroRentabilidad("TODOS");
    setFiltroModelo("TODOS");
    setFiltroListaImportada([]);
  };

  const toggleSeleccion = (id: string) => {
    const nuevos = new Set(seleccionados);
    if (nuevos.has(id)) nuevos.delete(id);
    else nuevos.add(id);
    setSeleccionados(nuevos);
  };

  const toggleSeleccionarTodo = () => {
    if (seleccionados.size === dataFiltrada.length && dataFiltrada.length > 0) {
      setSeleccionados(new Set()); 
    } else {
      setSeleccionados(new Set(dataFiltrada.map(d => d.row.id))); 
    }
  };

  const abrirModalExportacion = () => {
    const combosExportarPre = dataPreCalculada.filter(d => seleccionados.has(d.row.id));
    const hayErrores = combosExportarPre.some(d => d.errorTotal);

    if (hayErrores) {
      setAlerta({
        visible: true,
        tipo: 'error',
        titulo: 'Combos con Errores (#N/A)',
        mensaje: 'Has seleccionado combos que no tienen el valor completo definido (están en gris con #N/A). Por favor, desmárcalos o asígnales un valor manual antes de generar la cotización.'
      });
      return; 
    }

    const lineas = combosExportarPre.map(c => `${c.row.combo}\t${c.row.codigoAB}\t10\t1\tUND\t${c.row.precioDolares}`);
    setTextoExportacion(lineas.join('\n'));
    setModalExportarTexto(true);
  };

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(textoExportacion);
    setModalExportarTexto(false);
    setAlerta({ visible: true, tipo: 'exito', titulo: '¡Texto Copiado!', mensaje: 'La lista de combos se ha copiado al portapapeles y está lista para enviarse por WhatsApp o Correo.' });
  };

  const enviarPorWhatsApp = () => {
    const numeroDestino = "51992849784"; 
    const url = `https://api.whatsapp.com/send?phone=${numeroDestino}&text=${encodeURIComponent(textoExportacion)}`;
    window.open(url, '_self');
  };

  return (
    <main className="p-4 sm:p-6 flex flex-col h-[calc(100vh)] bg-slate-50 relative overflow-hidden">
      
      {cargando && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md transition-opacity duration-500">
          <Loader2 className="w-14 h-14 text-indigo-600 animate-spin mb-6" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Conectando Motores...</h2>
          <p className="text-slate-500 font-bold text-sm mb-6">Sincronizando Bóveda de ElectroJared</p>
          <div className="w-72 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${progresoCarga}%` }}></div>
          </div>
          <div className="mt-3 text-xs font-black text-slate-400">{progresoCarga}% COMPLETADO</div>
        </div>
      )}

      <div className={`flex flex-col h-full w-full transition-all duration-700 ${mostrarInterfaz ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        
        <div className="max-w-[1800px] mx-auto w-full mb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Calculator className="w-8 h-8 text-indigo-600" /> Combos 2025 - 2026
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Auditoría con Filtros Avanzados e Importación.
            </p>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto w-full mb-4 flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex-shrink-0">
          
          <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap flex-shrink-0">
            <button onClick={agregarFila} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> Agregar Fila
            </button>
            
            <button onClick={() => { setTipoImportacion('excel'); setModalImportar(true); }} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap">
              <FileSpreadsheet className="w-4 h-4" /> Excel (Masivo)
            </button>

            <button onClick={() => { setTipoImportacion('whatsapp'); setModalImportar(true); }} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap">
              <ClipboardPaste className="w-4 h-4" /> WhatsApp (Parcial)
            </button>

            {seleccionados.size > 0 && (
              <button onClick={abrirModalExportacion} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm animate-in fade-in zoom-in duration-300 whitespace-nowrap">
                <Copy className="w-4 h-4 text-amber-400" /> Cotizar ({seleccionados.size})
              </button>
            )}

            <button onClick={intentarGuardar} disabled={guardando || cargando} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-60 whitespace-nowrap">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar Cambios
            </button>
          </div>

          <div className="hidden lg:block w-px h-8 bg-slate-200 mx-1 flex-shrink-0"></div>

          <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap flex-1 min-w-0">
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
                  onBlur={() => { 
                    if (!tipoCambio) {
                      setTipoCambio(3.49);
                      localStorage.setItem('tc_combos_jared', '3.49');
                    }
                  }} 
                  className="w-14 bg-transparent text-slate-800 font-black focus:outline-none p-0 m-0 text-sm" 
                />
              </div>
            </div>

            <CustomSelect 
              icono={Filter} 
              valor={filtroRentabilidad} 
              onChange={setFiltroRentabilidad} 
              opciones={opcionesRentabilidad} 
              tituloBase="Rentabilidad (Todas)" 
            />

            <CustomSelect 
              icono={Filter} 
              valor={filtroModelo} 
              onChange={setFiltroModelo} 
              opciones={opcionesModelos} 
              tituloBase="Modelos (Todos)" 
            />

            <div className="relative group flex-1 min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar combo o texto..." value={inputBusqueda} onChange={(e) => setInputBusqueda(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              {inputBusqueda && <button onClick={() => setInputBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><FilterX className="w-4 h-4" /></button>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {filtroListaImportada.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl text-sm border border-indigo-200 shadow-sm animate-in fade-in zoom-in duration-300 whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="font-bold hidden sm:inline">Filtro Activo ({filtroListaImportada.length})</span>
                <button onClick={() => setFiltroListaImportada([])} className="hover:text-rose-500 bg-indigo-100 hover:bg-rose-100 p-1 rounded-md transition-colors"><XCircle className="w-4 h-4"/></button>
              </div>
            )}

            <button onClick={vaciarTabla} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl font-bold text-sm whitespace-nowrap">
              <AlertTriangle className="w-4 h-4" /> Vaciar
            </button>
          </div>
          
        </div>

        <div className="max-w-[1800px] mx-auto w-full bg-white rounded-t-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-200/60 flex-1 flex flex-col min-h-0 overflow-hidden relative border-b-0">
          <div className="overflow-auto flex-1 w-full relative custom-scrollbar">
            <table className="w-full text-xs border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-20 shadow-sm bg-slate-100">
                <tr>
                  <th className="px-3 py-3 w-10 text-center border-r border-white">
                    <input 
                      type="checkbox" 
                      checked={seleccionados.size > 0 && seleccionados.size === dataFiltrada.length} 
                      onChange={toggleSeleccionarTodo} 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                    />
                  </th>
                  <th className="font-black text-slate-500 px-2 py-3 text-center border-r border-white w-12">Nº</th>
                  <th className="font-black text-slate-700 px-3 py-3 text-left border-r border-white w-36 min-w-[140px]">COMBO</th>
                  <th className="font-black text-slate-700 px-3 py-3 text-center border-r border-white w-80 min-w-[320px]">CÓDIGO A + CÓDIGO B</th>
                  <th className="font-black text-purple-700 bg-purple-100 px-3 py-3 text-center border-r border-white min-w-[160px]">CÓDIGO A</th>
                  <th className="font-black text-purple-700 bg-purple-100 px-3 py-3 text-center border-r border-white min-w-[160px]">CÓDIGO B</th>
                  <th className="font-black text-blue-700 bg-blue-100 px-3 py-3 text-center border-r border-white">PRECIO ($)</th>
                  <th className="font-black text-emerald-700 bg-emerald-100 px-3 py-3 text-center border-r border-white">PRECIO (S/)</th>
                  <th className="font-black text-orange-700 bg-orange-50 px-2 py-3 text-center border-r border-white">VALOR A (S/)</th>
                  <th className="font-black text-orange-700 bg-orange-50 px-2 py-3 text-center border-r border-white">VALOR B (S/)</th>
                  <th className="font-black text-orange-800 bg-orange-100 px-3 py-3 text-center border-r border-white">TOTAL (A+B)</th>
                  <th className="font-black text-slate-800 bg-slate-200 px-3 py-3 text-center border-r border-white">DIFERENCIA (S/)</th>
                  <th className="font-black text-rose-700 bg-rose-100 px-2 py-3 text-center w-12">🗑️</th>
                </tr>
              </thead>
              
              <tbody>
                {datosDeEstaPagina.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="h-[400px]">
                      <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                          <SearchX className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-1">Sin Resultados</h3>
                        <p className="text-sm font-medium text-slate-500 mx-auto mt-2">
                          No hay combos que coincidan con la búsqueda.<br />
                          Intenta usar otros términos o limpia los filtros.
                        </p>
                        {(busquedaActiva !== "" || filtroRentabilidad !== "TODOS" || filtroModelo !== "TODOS" || filtroListaImportada.length > 0) && (
                          <button 
                            onClick={limpiarFiltros}
                            className="mt-6 flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-md"
                          >
                            <FilterX className="w-4 h-4" /> Limpiar Filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  datosDeEstaPagina.map(({ row, codA, codB, precioSoles, valorA_final, valorB_final, totalUnitario, diferencia, errorA, errorB, estadoRentabilidad }, renderIndex) => {
                    
                    let colorDiferencia = "bg-slate-200 text-slate-500 font-black"; 
                    if (estadoRentabilidad === "REVISAR") colorDiferencia = "bg-slate-200 text-slate-500 font-black"; 
                    else if (estadoRentabilidad === "EXCELENTE") colorDiferencia = "bg-yellow-400 text-slate-900 font-black";
                    else if (estadoRentabilidad === "CONVIENE") colorDiferencia = "bg-green-500 text-white font-black";
                    else if (estadoRentabilidad === "REGULAR") colorDiferencia = "bg-blue-400 text-white font-black";
                    else if (estadoRentabilidad === "NO CONVIENE") colorDiferencia = "bg-red-600 text-white font-black";

                    const estaSeleccionado = seleccionados.has(row.id);

                    return (
                      <tr key={row.id} className={`border-b transition-colors group ${estaSeleccionado ? "bg-indigo-100 border-indigo-300" : "border-slate-100 hover:bg-indigo-50/50"}`}>
                        <td className={`p-1 border-r text-center ${estaSeleccionado ? "bg-indigo-200 border-indigo-300" : "bg-white border-slate-100"}`}>
                          <input 
                            type="checkbox" 
                            checked={estaSeleccionado} 
                            onChange={() => toggleSeleccion(row.id)} 
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                          />
                        </td>
                        {/* 🔥 CORRECCIÓN: La numeración se calcula basándose estrictamente en la fila visible */}
                        <td className={`p-1 border-r text-center font-black ${estaSeleccionado ? "bg-indigo-600 text-white border-indigo-600 shadow-inner" : "bg-slate-50 text-slate-400 border-slate-100"}`}>{indiceInicio + renderIndex + 1}</td>
                        <td className={`p-0 border-r ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-white border-slate-100"}`}><input type="text" value={row.combo} onChange={(e) => actualizarCelda(row.id, 'combo', e.target.value.toUpperCase())} className="w-full h-10 px-3 bg-transparent font-bold text-slate-700 outline-none focus:bg-white" /></td>
                        <td className={`p-0 border-r ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-white border-slate-100"}`}><input type="text" value={row.codigoAB} onChange={(e) => actualizarCelda(row.id, 'codigoAB', e.target.value.toUpperCase())} className="w-full h-10 px-3 text-center font-mono font-bold text-slate-800 bg-transparent outline-none focus:bg-white" /></td>
                        <td className={`p-2 border-r text-center font-mono font-bold text-purple-700 ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-purple-50/30 border-purple-100"}`}>{codA}</td>
                        <td className={`p-2 border-r text-center font-mono font-bold text-purple-700 ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-purple-50/30 border-purple-100"}`}>{codB}</td>
                        <td className={`p-0 border-r ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-blue-50/20 border-blue-100"}`}><div className="relative flex items-center justify-center h-10"><span className="absolute left-3 font-bold text-blue-400">$</span><input type="number" step="0.01" value={row.precioDolares || ''} onChange={(e) => actualizarCelda(row.id, 'precioDolares', parseFloat(e.target.value) || 0)} className="w-full h-full text-center font-bold text-blue-700 bg-transparent outline-none pl-6 focus:bg-white" /></div></td>
                        <td className={`p-2 border-r text-center font-black text-emerald-700 ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-emerald-50/30 border-emerald-100"}`}>S/ {precioSoles.toFixed(2)}</td>
                        
                        <td className={`p-0 border-r relative group/celda ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-orange-50/20 border-orange-100"}`}>
                          {row.editA ? (
                            <div className="relative flex items-center justify-center h-10 px-1"><input type="number" step="0.01" value={row.valorAManual != null ? row.valorAManual : ''} onChange={(e) => actualizarCelda(row.id, 'valorAManual', e.target.value === '' ? null : parseFloat(e.target.value))} onBlur={() => actualizarCelda(row.id, 'editA', false)} autoFocus className="w-full h-8 text-center font-bold text-indigo-700 bg-white outline-none border border-indigo-300 rounded shadow-inner" /></div>
                          ) : (
                            <div className="flex items-center justify-center h-10 w-full relative">
                              <span className={row.valorAManual != null ? "text-indigo-600 font-black" : (errorA ? "text-slate-400 font-black" : "text-orange-700 font-bold")}>{errorA ? "#N/A" : (valorA_final > 0 ? `S/ ${valorA_final.toFixed(2)}` : "-")}</span>
                              <div className="absolute right-1 hidden group-hover/celda:flex gap-1 bg-orange-50/90 p-1 rounded backdrop-blur-sm shadow-sm z-10">
                                <button onClick={() => actualizarCelda(row.id, 'editA', true)} className="p-1 hover:bg-orange-200 rounded text-orange-500 hover:text-orange-700"><Pencil className="w-3 h-3" /></button>
                                {row.valorAManual != null && <button onClick={() => actualizarCelda(row.id, 'valorAManual', null)} className="p-1 hover:bg-rose-200 rounded text-rose-500 hover:text-rose-700"><RotateCcw className="w-3 h-3" /></button>}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className={`p-0 border-r relative group/celda ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-orange-50/20 border-orange-100"}`}>
                          {row.editB ? (
                            <div className="relative flex items-center justify-center h-10 px-1"><input type="number" step="0.01" value={row.valorBManual != null ? row.valorBManual : ''} onChange={(e) => actualizarCelda(row.id, 'valorBManual', e.target.value === '' ? null : parseFloat(e.target.value))} onBlur={() => actualizarCelda(row.id, 'editB', false)} autoFocus className="w-full h-8 text-center font-bold text-indigo-700 bg-white outline-none border border-indigo-300 rounded shadow-inner" /></div>
                          ) : (
                            <div className="flex items-center justify-center h-10 w-full relative">
                              <span className={row.valorBManual != null ? "text-indigo-600 font-black" : (errorB ? "text-slate-400 font-black" : "text-orange-700 font-bold")}>{errorB ? "#N/A" : (valorB_final > 0 ? `S/ ${valorB_final.toFixed(2)}` : "-")}</span>
                              <div className="absolute right-1 hidden group-hover/celda:flex gap-1 bg-orange-50/90 p-1 rounded backdrop-blur-sm shadow-sm z-10">
                                <button onClick={() => actualizarCelda(row.id, 'editB', true)} className="p-1 hover:bg-orange-200 rounded text-orange-500 hover:text-orange-700"><Pencil className="w-3 h-3" /></button>
                                {row.valorBManual != null && <button onClick={() => actualizarCelda(row.id, 'valorBManual', null)} className="p-1 hover:bg-rose-200 rounded text-rose-500 hover:text-rose-700"><RotateCcw className="w-3 h-3" /></button>}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className={`p-2 border-r text-center font-black text-orange-800 ${estaSeleccionado ? "bg-transparent border-indigo-300" : "bg-orange-100/50 border-orange-200"}`}>{estadoRentabilidad === "REVISAR" ? <span className="text-slate-400">#N/A</span> : `S/ ${totalUnitario.toFixed(2)}`}</td>
                        <td className={`p-2 text-center text-sm ${colorDiferencia}`}>{estadoRentabilidad === "REVISAR" ? "#N/A" : `S/ ${diferencia.toFixed(2)}`}</td>
                        <td className={`p-1 text-center ${estaSeleccionado ? "bg-transparent" : "bg-white"}`}><button onClick={() => eliminarFila(row.id)} className="w-8 h-8 mx-auto flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    );
                  })
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
          <div className="text-sm font-bold text-slate-500">Mostrando {totalRegistros === 0 ? 0 : indiceInicio + 1} a {Math.min(indiceFin, totalRegistros)} de {totalRegistros} combos filtrados</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1 || totalRegistros === 0} className="rounded-xl border-slate-200 text-slate-600 font-bold"><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual >= totalPaginas || totalRegistros === 0} className="rounded-xl border-slate-200 text-slate-600 font-bold">Siguiente <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      </div>

      <Dialog open={modalExportarTexto} onOpenChange={setModalExportarTexto}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] rounded-3xl p-6 shadow-2xl border-slate-100">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-indigo-500" />
              Copiar Cotización
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
              Has seleccionado <strong>{seleccionados.size}</strong> combos. El texto a continuación está en formato crudo para que puedas enviarlo directamente al proveedor.
            </DialogDescription>
          </DialogHeader>

          <textarea 
            className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono text-slate-700 outline-none resize-none custom-scrollbar whitespace-pre overflow-x-auto"
            readOnly
            value={textoExportacion}
          />

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setModalExportarTexto(false)} className="rounded-xl h-12 font-bold text-slate-600 w-full sm:w-auto">
              Cerrar
            </Button>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
              <Button onClick={copiarAlPortapapeles} className="rounded-xl h-12 font-black text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-md">
                <Copy className="w-4 h-4 mr-2" /> Copiar Texto
              </Button>
              <Button onClick={enviarPorWhatsApp} className="rounded-xl h-12 font-black text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto shadow-md shadow-emerald-500/30">
                <Send className="w-4 h-4 mr-2" /> Enviar por WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalImportar} onOpenChange={(open) => { setModalImportar(open); if(!open){ setPasoImportacion(1); setTextoImportacion(""); } }}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] rounded-3xl p-6 shadow-2xl border-slate-100">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              {tipoImportacion === 'excel' ? <FileSpreadsheet className="w-6 h-6 text-orange-500" /> : <ClipboardPaste className="w-6 h-6 text-amber-500" />}
              {tipoImportacion === 'excel' ? 'Importar Archivo Excel' : 'Importar de WhatsApp (Parcial)'}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
              {tipoImportacion === 'excel' 
                ? "Sube tu archivo .xlsx original. Al cargarlo, el sistema reemplazará por completo la matriz actual en la base de datos."
                : (pasoImportacion === 1 
                  ? "Pega aquí la lista de texto recibida por WhatsApp. El sistema extraerá los datos y actualizará los precios sin borrar el resto de tus combos."
                  : "El sistema ha detectado combos que no existen en tu base actual. ¿Deseas agregarlos a la interfaz?")
              }
            </DialogDescription>
          </DialogHeader>

          {tipoImportacion === 'excel' ? (
            <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-10 flex flex-col items-center justify-center transition-colors hover:bg-indigo-50">
              <FileSpreadsheet className="w-12 h-12 text-indigo-400 mb-4" />
              <h3 className="text-lg font-black text-indigo-900 mb-2">Sube tu matriz Excel</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 text-center max-w-sm">
                Selecciona tu archivo original con extensión .xlsx o .xls. Extraeremos los códigos y precios automáticamente.
              </p>
              <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black cursor-pointer shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2">
                <Upload className="w-5 h-5" /> Seleccionar Archivo
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={procesarArchivoExcel} />
              </label>
            </div>
          ) : (
            pasoImportacion === 1 ? (
              <textarea 
                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none custom-scrollbar whitespace-pre overflow-x-auto"
                placeholder="COMBO 20373    BLSTKAG RPB 053+GCSTCC 5000 053    10    1    UND    80"
                value={textoImportacion}
                onChange={(e) => setTextoImportacion(e.target.value)}
              />
            ) : (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center">
                <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <h3 className="text-lg font-black text-indigo-900 mb-1">¡Combos Nuevos Detectados!</h3>
                <p className="text-sm font-medium text-indigo-700">
                  Se actualizarán los precios de <strong>{analisisImportacion.actualizar.length}</strong> combos existentes y se prepararán <strong>{analisisImportacion.nuevos.length}</strong> combos totalmente nuevos.
                </p>
              </div>
            )
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setModalImportar(false); setPasoImportacion(1); setTextoImportacion(""); }} className="rounded-xl h-12 font-bold text-slate-600 w-full sm:w-auto">Cancelar</Button>
            
            {tipoImportacion === 'whatsapp' && pasoImportacion === 1 && (
              <Button onClick={procesarTextoImportacion} disabled={!textoImportacion.trim()} className="rounded-xl h-12 font-black text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-md">Analizar Texto</Button>
            )}
            {tipoImportacion === 'whatsapp' && pasoImportacion === 2 && (
              <Button onClick={() => ejecutarImportacion(analisisImportacion.actualizar, analisisImportacion.nuevos)} className="rounded-xl h-12 font-black text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto shadow-md shadow-emerald-500/30">Sí, Importar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alerta.visible} onOpenChange={(open) => setAlerta(prev => ({ ...prev, visible: open }))}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl text-center p-6 shadow-2xl border-slate-100">
          <DialogHeader className="items-center gap-4">
            {alerta.tipo === 'exito' && <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-2"><CheckCircle2 className="w-10 h-10 text-emerald-500" /></div>}
            {alerta.tipo === 'error' && <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-2"><XCircle className="w-10 h-10 text-rose-500 animate-pulse" /></div>}
            {alerta.tipo === 'confirmacion' && <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-2"><AlertTriangle className="w-10 h-10 text-amber-500" /></div>}
            <DialogTitle className="text-2xl font-black text-slate-800">{alerta.titulo}</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 leading-relaxed">{alerta.mensaje}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-center flex gap-3 w-full">
            {alerta.tipo === 'confirmacion' ? (
              <><Button variant="outline" onClick={() => setAlerta(prev => ({ ...prev, visible: false }))} className="w-full sm:w-1/2 rounded-xl h-12 font-bold text-slate-600">Cancelar</Button><Button onClick={alerta.accionConfirma} className="w-full sm:w-1/2 rounded-xl h-12 font-black text-white bg-rose-500 shadow-lg shadow-rose-500/30">{alerta.textoConfirmar || 'Confirmar'}</Button></>
            ) : (
              <Button onClick={() => setAlerta(prev => ({ ...prev, visible: false }))} className={`w-full rounded-xl h-12 font-black text-white shadow-lg ${alerta.tipo === 'exito' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>Entendido</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </main>
  );
}