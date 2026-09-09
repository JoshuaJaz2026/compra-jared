"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Calculator, Lightbulb, Server, 
  BookOpen, Store, Star, Bot, ChevronLeft, ChevronRight, LogOut 
} from "lucide-react";
import { logoutAction, getLoggedUser } from "@/app/login/actions";

export default function Sidebar() {
  const [colapsado, setColapsado] = useState(false);
  const [usuario, setUsuario] = useState({ nombre: "Cargando...", inicial: "" });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/login') {
      getLoggedUser().then(data => setUsuario(data));
    }
  }, [pathname]);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  const menu = [
    { nombre: "Dashboard", ruta: "/", icono: LayoutDashboard },
    { nombre: "Combos 2025 - 2026", ruta: "/combos_2025_2026", icono: Calculator },
    { nombre: "Propuestas", ruta: "/propuestas", icono: Lightbulb },
    { nombre: "Data de K.O.", ruta: "/data-ko", icono: Server },
    { nombre: "Block de Compras", ruta: "/block-compras", icono: BookOpen },
    { nombre: "Cocinas Inche", ruta: "/cocinas-inche", icono: Store },
    { nombre: "Rubí", ruta: "/rubi", icono: Star },
  ];

  return (
    <aside 
      className={`relative h-screen bg-[#0f172a] border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 z-50 ${
        colapsado ? "w-20" : "w-64"
      }`}
    >
      <button 
        onClick={() => setColapsado(!colapsado)}
        className="absolute -right-3 top-6 bg-indigo-600 text-white rounded-full p-1 shadow-lg hover:bg-indigo-500 transition-colors z-50"
      >
        {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`flex items-center h-20 px-6 overflow-hidden transition-all duration-300 ${colapsado ? "justify-center px-0" : ""}`}>
        {colapsado ? (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xl tracking-tighter">
            E
          </div>
        ) : (
          <div className="flex flex-col whitespace-nowrap">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              ELECTRO<span className="text-emerald-400">JARED</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
              Cotizador Maestro
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3 custom-scrollbar">
        {menu.map((item) => {
          const activo = pathname === item.ruta || (item.ruta !== "/" && pathname.includes(item.ruta));
          return (
            <Link key={item.ruta} href={item.ruta} className="w-full">
              <div 
                className={`flex items-center rounded-xl transition-all duration-200 group ${
                  colapsado ? "justify-center h-12 w-12 mx-auto" : "px-3 py-3 gap-3"
                } ${
                  activo 
                    ? "bg-slate-800/80 text-emerald-400 border border-slate-700/50" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
                title={colapsado ? item.nombre : ""}
              >
                <item.icono className={`flex-shrink-0 ${colapsado ? "w-6 h-6" : "w-5 h-5"} ${activo ? "text-emerald-400" : "group-hover:text-indigo-400"}`} />
                {!colapsado && <span className="font-bold text-sm truncate">{item.nombre}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 flex flex-col gap-4 border-t border-slate-800">
        <button 
          onClick={() => window.dispatchEvent(new Event('open-minijared'))}
          className={`flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.3)] group ${
            colapsado ? "h-12 w-12 mx-auto" : "h-12 w-full gap-2 px-4"
          }`}
          title={colapsado ? "Activar a MiniJared" : ""}
        >
          <Bot className={`flex-shrink-0 animate-pulse ${colapsado ? "w-6 h-6" : "w-5 h-5"}`} />
          {!colapsado && <span className="font-black text-sm whitespace-nowrap">Activar a MiniJared</span>}
        </button>

        <div className={`flex items-center justify-between overflow-hidden ${colapsado ? "flex-col gap-3" : "px-1"}`}>
          <div className={`flex items-center gap-3 ${colapsado ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 font-bold flex-shrink-0">
              {usuario.inicial}
            </div>
            {!colapsado && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-sm font-bold text-slate-200">{usuario.nombre}</span>
                <span className="text-xs font-medium text-slate-500">Administrador</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className={`text-slate-500 hover:text-rose-500 transition-colors flex-shrink-0 ${colapsado ? "mt-2" : ""}`}
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}