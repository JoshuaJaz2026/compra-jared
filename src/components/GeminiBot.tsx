"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, User, Cpu } from "lucide-react";
import { usePathname } from "next/navigation"; // 🔥 Importamos el hook

export default function GeminiBot() {
  const pathname = usePathname(); // 🔥 Leemos la ruta
  
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  
  const [historial, setHistorial] = useState([
    { rol: "bot", texto: "¡Sistemas en línea! 🤖 Soy MiniJared, estoy conectado a tu base de datos de combos. Pídeme el Top 5 más rentable de hoy o consúltame sobre cualquier estrategia de compras." }
  ]);

  const finalChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abrirBot = () => setAbierto(true);
    window.addEventListener('open-minijared', abrirBot);
    return () => window.removeEventListener('open-minijared', abrirBot);
  }, []);

  useEffect(() => {
    if (finalChatRef.current && abierto) {
      finalChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [historial, abierto]);

  // Función para renderizar negritas (Markdown básico)
  const formatearTexto = (texto: string) => {
    const partes = texto.split(/(\*\*.*?\*\*)/g);
    return partes.map((parte, idx) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return <strong key={idx} className="font-black text-indigo-900">{parte.slice(2, -2)}</strong>;
      }
      return <span key={idx}>{parte}</span>;
    });
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const peticion = mensaje;
    setHistorial(prev => [...prev, { rol: "user", texto: peticion }]);
    setMensaje("");
    setCargando(true);

    try {
      const tcGuardado = localStorage.getItem('tc_combos_jared') || "3.45";

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: peticion, tc: parseFloat(tcGuardado) })
      });

      const data = await res.json();
      let textoRespuesta = data.respuesta;
      
      // 🚀 INTERCEPTORES DE COMANDOS IA
      const filterRegex = /\[FILTER:(.*?)\]/;
      const selectRegex = /\[SELECT:(.*?)\]/;
      const updateRegex = /\[UPDATE:(.*?)\]/;
      
      // 1. Filtrar
      if (filterRegex.test(textoRespuesta)) {
        const match = textoRespuesta.match(filterRegex);
        const combos = match[1].split(',').map((c: string) => c.trim());
        window.dispatchEvent(new CustomEvent('ai-filter-table', { detail: combos }));
        textoRespuesta = textoRespuesta.replace(filterRegex, '').trim();
      }
      
      // 2. Seleccionar (Checkboxes)
      if (selectRegex.test(textoRespuesta)) {
        const match = textoRespuesta.match(selectRegex);
        const combos = match[1].split(',').map((c: string) => c.trim());
        window.dispatchEvent(new CustomEvent('ai-select-table', { detail: combos }));
        textoRespuesta = textoRespuesta.replace(selectRegex, '').trim();
      }

      // 3. Actualizar Precios
      if (updateRegex.test(textoRespuesta)) {
        const match = textoRespuesta.match(updateRegex);
        const actualizaciones = match[1].split(',').map((u: string) => {
          const [combo, precio] = u.split('=');
          return { combo: combo.trim(), precio: parseFloat(precio) };
        });
        window.dispatchEvent(new CustomEvent('ai-update-table', { detail: actualizaciones }));
        textoRespuesta = textoRespuesta.replace(updateRegex, '').trim();
      }
      
      setHistorial(prev => [...prev, { rol: "bot", texto: textoRespuesta }]);
    } catch (error) {
      setHistorial(prev => [...prev, { rol: "bot", texto: "⚠️ Hubo un error de conexión con mi servidor. Intenta nuevamente." }]);
    } finally {
      setCargando(false);
    }
  };

  // 🔥 Ocultamos el Bot si estamos en el login, y también si no está abierto
  if (pathname === '/login') return null;
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg relative z-10 animate-bounce [animation-duration:3s]">
                <Cpu className="w-6 h-6 text-emerald-400" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                MiniJared <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Beta IA</span>
              </h3>
              <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Conectado a Base de Datos
              </p>
            </div>
          </div>

          <button onClick={() => setAbierto(false)} className="relative z-10 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-5 custom-scrollbar">
          {historial.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.rol === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.rol === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-900 text-emerald-400'}`}>
                {msg.rol === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-sm font-medium leading-relaxed whitespace-pre-wrap ${msg.rol === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                {formatearTexto(msg.texto)}
              </div>
            </div>
          ))}
          
          {cargando && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 text-emerald-400 shadow-sm">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
          <div ref={finalChatRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
          <form onSubmit={enviarMensaje} className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ej: Dime los 3 combos de mayor rentabilidad..." 
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-inner"
              autoFocus
              disabled={cargando}
            />
            <button 
              type="submit" 
              disabled={!mensaje.trim() || cargando}
              className="absolute right-3 w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}