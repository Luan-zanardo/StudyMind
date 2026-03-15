import Link from "next/link";
import { Brain, ArrowRight, Zap, BookOpen, Layers } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-4xl space-y-10">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-500/20">
            <Brain className="w-16 h-16 text-white" />
          </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
          Study<span className="text-indigo-500">Mind</span>
        </h1>
        
        <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl mx-auto font-medium">
          Transforme seus PDFs em simulados interativos e resumos inteligentes em segundos.
        </p>

        <div className="pt-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-zinc-200 transition active:scale-95"
          >
            Começar Grátis
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <Zap className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Rápido</h3>
            <p className="text-zinc-500 text-sm">Geração instantânea de conteúdo.</p>
          </div>
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <BookOpen className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Simulados</h3>
            <p className="text-zinc-500 text-sm">Questões inteligentes baseadas no seu PDF.</p>
          </div>
          <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
            <Layers className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Flashcards</h3>
            <p className="text-zinc-500 text-sm">Memorização ativa de longo prazo.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
