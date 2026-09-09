"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, ShieldCheck, Mail, User, Phone, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { loginAction, registerAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  
  const [esLogin, setEsLogin] = useState(true);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmPass, setMostrarConfirmPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [celular, setCelular] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg("");

    if (esLogin) {
      const res = await loginAction(correo, contrasena);
      if (res.success) {
        router.push("/");
      } else {
        setErrorMsg(res.message || "Error al iniciar sesión");
        setCargando(false);
      }
    } else {
      if (contrasena !== confirmarContrasena) {
        setErrorMsg("Las contraseñas no coinciden");
        setCargando(false);
        return;
      }
      const res = await registerAction({ nombres, apellidos, celular, correo, contrasena, confirmarContrasena });
      if (res.success) {
        router.push("/");
      } else {
        setErrorMsg(res.message || "Error al crear la cuenta");
        setCargando(false);
      }
    }
  };

  const cambiarVista = () => {
    setEsLogin(!esLogin);
    setErrorMsg("");
    setCorreo("");
    setContrasena("");
    setConfirmarContrasena("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            {esLogin ? <ShieldCheck className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1">
            ELECTRO<span className="text-emerald-400">JARED</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-2">
            {esLogin ? "Ingresa tus credenciales de acceso al ERP" : "Completa tus datos para crear un nuevo usuario"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!esLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Nombres" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div className="relative">
                  <input type="text" placeholder="Apellidos" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-4 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="tel" placeholder="Número de Celular" required value={celular} onChange={(e) => setCelular(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder="Correo Electrónico"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={mostrarPass ? "text" : "password"}
              placeholder="Contraseña"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className={`w-full bg-slate-950/50 border ${errorMsg && esLogin ? 'border-rose-500' : 'border-slate-700'} focus:border-indigo-500 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
            />
            <button type="button" onClick={() => setMostrarPass(!mostrarPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
              {mostrarPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!esLogin && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={mostrarConfirmPass ? "text" : "password"}
                placeholder="Confirmar Contraseña"
                required
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                className={`w-full bg-slate-950/50 border ${errorMsg && errorMsg.includes('coinciden') ? 'border-rose-500' : 'border-slate-700'} focus:border-indigo-500 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-slate-500 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
              />
              <button type="button" onClick={() => setMostrarConfirmPass(!mostrarConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {mostrarConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {errorMsg && <p className="text-rose-400 text-xs font-bold mt-1 ml-2 animate-pulse">{errorMsg}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 mt-4"
          >
            {cargando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : esLogin ? (
              <>Ingresar al Sistema <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Crear Usuario <UserPlus className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={cambiarVista} className="text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 mx-auto">
            {esLogin ? (
              <>¿No tienes cuenta? <span className="text-indigo-400">Crear usuario</span></>
            ) : (
              <><LogIn className="w-4 h-4" /> Ya tengo cuenta, <span className="text-indigo-400">iniciar sesión</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}