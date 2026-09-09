import { Rocket, Construction } from "lucide-react";

export default function EnConstruccionPage() {
  return (
    <main className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center animate-in zoom-in-95 fade-in duration-700">
        
        {/* Contenedor del Cohete Animado */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse shadow-2xl border-4 border-indigo-50">
            {/* El cohete levitando */}
            <Rocket className="w-16 h-16 text-indigo-600 animate-bounce relative z-10" />
          </div>
          {/* Fuego del cohete */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-12 bg-gradient-to-t from-transparent via-orange-400 to-yellow-300 rounded-full blur-md animate-pulse opacity-80"></div>
        </div>

        {/* Textos de aviso */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
            <Construction className="w-8 h-8 text-amber-500" />
            Sección en Órbita
          </h1>
          <p className="text-lg font-medium text-slate-500">
            Estamos ensamblando los motores de esta página. <br/>
            <strong className="text-slate-800">¡Estará lista para despegar muy pronto!</strong>
          </p>
        </div>

      </div>
    </main>
  );
}