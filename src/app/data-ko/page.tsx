"use client";

import { useState, useEffect } from "react";
import { FileWarning, Sparkles, Search, FilterX, SearchX, Plus, Save, Trash2, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { obtenerDataKO, sincronizarDataKO } from "./actions";

export default function DataKOPage() {
  const [datos, setDatos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [tipoCambio, setTipoCambio] = useState<number | string>(3.49);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  const [modalExito, setModalExito] = useState({ visible: false, registros: 0 });

  useEffect(() => {
    const cargarBD = async () => {
      console.log("🚀 [CLIENTE] Solicitando matriz a la base de datos...");
      const dataReal = await obtenerDataKO();
      setDatos(dataReal);
      
      if (dataReal.length > 0) {
        const registroValido = dataReal.find(d => d.costoPDF > 0 && d.costoSoles > 0);
        if (registroValido) {
           const tcGuardado = registroValido.costoSoles / registroValido.costoPDF;
           setTipoCambio(parseFloat(tcGuardado.toFixed(3)));
        }
      }
      
      setCargando(false);
    };
    cargarBD();
  }, []);

  const agregarFila = () => {
    const nuevaFila = { 
      id: Date.now().toString(),
      codigoInche: "", 
      costoPDF: 0, 
      valorComercial: 0 
    };
    // Ahora las nuevas filas se agregan AL FINAL como en Excel
    setDatos([...datos, nuevaFila]);
    setPaginaActual(Math.ceil((datos.length + 1) / ITEMS_POR_PAGINA)); 
  };

  const actualizarCelda = (id: string, campo: string, valor: any) => {
    setDatos(datos.map(fila => fila.id === id ? { ...fila, [campo]: valor } : fila));
  };

  const eliminarFila = (id: string) => {
    setDatos(datos.filter(fila => fila.id !== id));
  };

  const vaciarTabla = async () => {
    if(confirm("⚠️ ¿Peligro: ¿Estás seguro de VACIAR toda la base de datos de Data K.O. en Neon? Esta acción es irreversible.")) {
      setGuardando(true);
      setDatos([]);
      setPaginaActual(1);
      
      // 🔥 Le enviamos un array vacío directo a la bóveda para aniquilar los datos
      const resultado = await sincronizarDataKO([]);
      
      if (resultado.success) {
        setModalExito({ visible: true, registros: 0 });
      } else {
        alert("Hubo un error al vaciar la base de datos.");
      }
      setGuardando(false);
    }
  };

  const guardarEnBaseDeDatos = async () => {
    setGuardando(true);
    const tcActual = typeof tipoCambio === 'number' ? tipoCambio : 3.49;

    const datosListosParaBaseDeDatos = datos.map(fila => ({
      ...fila,
      costoSoles: (fila.costoPDF || 0) * tcActual
    }));

    const resultado = await sincronizarDataKO(datosListosParaBaseDeDatos);

    if (resultado.success) {
      setModalExito({ visible: true, registros: datos.length });
    } else {
      alert("Hubo un error al guardar. Abre tu terminal de VS Code para leer los Rayos X.");
    }
    
    setGuardando(false);
  };

  const datosFiltrados = datos.filter((row) =>
    row.codigoInche?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(datosFiltrados.length / ITEMS_POR_PAGINA);
  const datosPaginados = datosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA, 
    paginaActual * ITEMS_POR_PAGINA
  );

  const tcNumerico = typeof tipoCambio === 'number' ? tipoCambio : 0;

  return (
    <main className="p-4 sm:p-8 animate-in fade-in duration-700 flex flex-col h-[calc(100vh)] bg-slate-50 relative">
      
      {/* 🚀 CABECERA REDUCIDA Y LIMPIA */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileWarning className="w-8 h-8 text-rose-500" />
            Data de K.O.
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Control de costos Inche vs. Valor Comercial.
          </p>
        </div>
      </div>

      {/* 🛠️ BARRA DE HERRAMIENTAS CRUD REORGANIZADA */}
      <div className="max-w-[1600px] mx-auto w-full mb-4 flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60">
        
        <button type="button" onClick={agregarFila} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow">
          <Plus className="w-4 h-4" /> Agregar Fila
        </button>
        
        <button 
          type="button" 
          onClick={guardarEnBaseDeDatos} 
          disabled={guardando || cargando}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className={`w-4 h-4 ${guardando ? 'animate-pulse' : ''}`} /> 
          {guardando ? "Guardando..." : "Guardar Todo"}
        </button>

        {/* 🔍 BUSCADOR DE CÓDIGO */}
        <div className="relative group w-full sm:w-64 ml-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input 
            type="text" placeholder="Buscar código..." value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
          {busqueda && (
            <button 
              onClick={() => { setBusqueda(''); setPaginaActual(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Separador Visual */}
        <div className="hidden lg:block w-px h-8 bg-slate-200 mx-2"></div>

        {/* 💱 TIPO DE CAMBIO */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl transition-colors focus-within:border-emerald-400 focus-within:bg-emerald-50/50">
          <label className="text-xs font-black text-slate-500 tracking-wider">T.C.</label>
          <div className="flex items-center">
            <span className="text-emerald-600 font-bold mr-1">S/</span>
            <input 
              type="number" step="0.01" 
              value={tipoCambio}
              onChange={(e) => setTipoCambio(e.target.value === '' ? '' : parseFloat(e.target.value))}
              onBlur={() => { if (!tipoCambio) setTipoCambio(3.49); }}
              className="w-16 bg-transparent text-slate-800 font-black focus:outline-none focus:ring-0 p-0 m-0 text-sm"
            />
          </div>
        </div>

        {/* 🗑️ VACIAR TABLA AL EXTREMO DERECHO */}
        <button type="button" onClick={vaciarTabla} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ml-auto">
          <AlertTriangle className="w-4 h-4" /> Vaciar Tabla
        </button>
      </div>

      {/* 📋 MATRIZ CON SCROLL INTERNO NATIVO Y CABECERA FIJA */}
      <div className="max-w-[1600px] mx-auto w-full bg-white rounded-t-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-x border-t border-slate-200/60 flex-1 flex flex-col min-h-0 relative">
        <div className="overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full relative">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-20 shadow-sm bg-white">
              <tr>
                {/* 🔥 NUEVA COLUMNA DE ID */}
                <th className="font-black text-slate-500 bg-slate-100 whitespace-nowrap px-4 py-4 text-center rounded-tl-3xl w-12 border-r border-white">Nº</th>
                <th className="font-black text-purple-700 bg-purple-100 whitespace-nowrap px-4 py-4 text-center">CÓDIGOS INCHE</th>
                <th className="font-black text-blue-700 bg-blue-100 whitespace-nowrap px-4 py-4 text-center">COSTOS DEL PDF ($)</th>
                <th className="font-black text-emerald-700 bg-emerald-100 whitespace-nowrap px-4 py-4 text-center">COSTOS DEL PDF EN SOLES (S/)</th>
                <th className="font-black text-orange-700 bg-orange-100 whitespace-nowrap px-4 py-4 text-center">VALOR COMERCIAL (S/)</th>
                <th className="font-black text-rose-700 bg-rose-100 whitespace-nowrap px-4 py-4 text-center rounded-tr-3xl w-16">ACCIONES</th>
              </tr>
            </thead>
            
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="h-64 text-center align-middle bg-slate-50/50 p-0 border-b border-slate-100">
                    <div className="w-full flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 fade-in duration-500">
                      <Search className="w-12 h-12 text-slate-300 animate-pulse" />
                      <p className="text-slate-500 font-bold text-sm">Leyendo bóveda en Neon...</p>
                    </div>
                  </td>
                </tr>
              ) : datosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-96 text-center align-middle bg-slate-50/50 p-0 border-b border-slate-100">
                    <div className="w-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
                      <div className="relative flex flex-col items-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center animate-bounce shadow-xl border border-slate-100 relative z-10">
                          <SearchX className="w-10 h-10 text-rose-500" />
                        </div>
                        <div className="absolute -bottom-4 w-16 h-3 bg-black/5 rounded-[100%] blur-sm animate-pulse"></div>
                      </div>
                      <div className="space-y-3 flex flex-col items-center">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight text-center">No se encontraron resultados</h3>
                        <p className="text-sm font-medium text-slate-500 flex flex-col items-center text-center">
                          {busqueda ? (
                            <>
                              <span>No hay registros que coincidan con <strong className="text-slate-700">"{busqueda}"</strong>.</span>
                              <span className="mt-1">Verifica el código e intenta nuevamente.</span>
                            </>
                          ) : (
                            <span>La tabla está vacía. Haz clic en "Agregar Fila" para empezar.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                datosPaginados.map((row, idx) => {
                  const costoSolesCalculado = (row.costoPDF || 0) * tcNumerico;
                  const numeroFila = (paginaActual - 1) * ITEMS_POR_PAGINA + idx + 1;
                  
                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      {/* 🔥 COLUMNA NUMÉRICA DE LA FILA */}
                      <td className="p-1 bg-slate-50 border-r border-slate-100 text-center font-black text-slate-400 w-12 group-hover:bg-slate-200 transition-colors">
                        {numeroFila}
                      </td>
                      
                      <td className="p-1 bg-white group-hover:bg-slate-50">
                        <input 
                          type="text" value={row.codigoInche}
                          onChange={(e) => actualizarCelda(row.id, 'codigoInche', e.target.value.toUpperCase())}
                          placeholder="EJ: CÓDIGO"
                          className="w-full h-12 text-center font-mono font-bold text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-purple-400 focus:bg-purple-50 outline-none rounded-lg transition-all"
                        />
                      </td>
                      
                      <td className="p-1 bg-blue-50/20 group-hover:bg-blue-50/40">
                        <div className="relative flex items-center justify-center h-12">
                          <span className="absolute left-4 font-bold text-blue-400">$</span>
                          <input 
                            type="number" step="0.01" value={row.costoPDF || ''}
                            onChange={(e) => actualizarCelda(row.id, 'costoPDF', parseFloat(e.target.value) || 0)}
                            className="w-full h-full text-center font-bold text-blue-700 bg-transparent border border-transparent hover:border-blue-200 focus:border-blue-400 focus:bg-white outline-none rounded-lg transition-all pl-6"
                          />
                        </div>
                      </td>
                      
                      <td className="p-4 font-black text-center text-emerald-700 bg-emerald-50/30 group-hover:bg-emerald-50/60 transition-colors">
                        S/ {costoSolesCalculado.toFixed(2)}
                      </td>
                      
                      <td className="p-1 bg-orange-50/20 group-hover:bg-orange-50/40">
                        <div className="relative flex items-center justify-center h-12">
                          <span className="absolute left-4 font-bold text-orange-400">S/</span>
                          <input 
                            type="number" step="0.01" value={row.valorComercial || ''}
                            onChange={(e) => actualizarCelda(row.id, 'valorComercial', parseFloat(e.target.value) || 0)}
                            className="w-full h-full text-center font-black text-orange-700 bg-transparent border border-transparent hover:border-orange-200 focus:border-orange-400 focus:bg-white outline-none rounded-lg transition-all pl-6"
                          />
                        </div>
                      </td>

                      <td className="p-2 text-center bg-white group-hover:bg-slate-50">
                        <button 
                          type="button" onClick={() => eliminarFila(row.id)}
                          className="w-8 h-8 mx-auto flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 BARRA DE PAGINACIÓN */}
      <div className="max-w-[1600px] mx-auto w-full bg-white border border-slate-200 rounded-b-3xl p-4 flex items-center justify-between shadow-sm relative z-10">
        <p className="text-sm font-bold text-slate-500">
          Mostrando <span className="text-slate-800">{datosFiltrados.length === 0 ? 0 : ((paginaActual - 1) * ITEMS_POR_PAGINA) + 1}</span> a <span className="text-slate-800">{Math.min(paginaActual * ITEMS_POR_PAGINA, datosFiltrados.length)}</span> de <span className="text-slate-800">{datosFiltrados.length}</span> registros
        </p>
        <div className="flex items-center gap-2">
          <button 
            type="button" onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1 || cargando}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-slate-700 px-4 py-2 bg-slate-100 rounded-xl">
            Página {paginaActual} de {totalPaginas || 1}
          </span>
          <button 
            type="button" onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas || totalPaginas === 0 || cargando}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🔥 MODAL ELEGANTE DE ÉXITO */}
      <Dialog open={modalExito.visible} onOpenChange={(open) => setModalExito({ ...modalExito, visible: open })}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-slate-100 p-6 shadow-2xl bg-white text-center">
          <DialogHeader className="flex flex-col items-center gap-4 mt-2">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-pulse" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800">¡Guardado Exitoso!</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500">
              Se han empaquetado <strong className="text-emerald-600">{modalExito.registros} registros</strong> financieros y han sido inyectados de forma segura en la base de datos central.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-center">
            <Button 
              type="button" onClick={() => setModalExito({ visible: false, registros: 0 })}
              className="w-full rounded-xl h-12 font-black text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105"
            >
              Cerrar y Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}