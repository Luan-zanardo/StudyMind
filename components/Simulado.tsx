"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, RotateCcw, Trophy } from "lucide-react";

interface Questao {
  enunciado: string;
  opcoes: string[];
  correta: number;
}

export default function Simulado({ questoes, onComplete }: { questoes: Questao[], onComplete?: (score: number, total: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleNext = () => {
    const isCorrect = selected === questoes[current].correta;
    const newScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) setScore(newScore);
    
    if (current < questoes.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setFinished(true);
      if (onComplete) onComplete(newScore, questoes.length);
    }
  };

  const resetSimulado = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setRevealed(false);
  };

  if (finished) {
    return (
      <div className="bg-white/[0.03] border border-white/10 p-8 md:p-12 rounded-[3rem] text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Simulado Concluído!</h2>
          <p className="text-zinc-400 text-lg mt-2 font-medium">Excelente progresso. Veja seu desempenho abaixo.</p>
          
          <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Acertos</p>
              <p className="text-3xl font-black text-emerald-400">{score}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total</p>
              <p className="text-3xl font-black text-white">{questoes.length}</p>
            </div>
          </div>

          <button 
            onClick={resetSimulado}
            className="mt-10 w-full py-5 bg-white text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-zinc-200 transition active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            Refazer Simulado
          </button>
        </div>
      </div>
    );
  }

  const q = questoes[current];

  return (
    <div className="bg-white/[0.03] border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
      <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em]">
        <span className="text-zinc-500">Questão {current + 1} de {questoes.length}</span>
        <span className="text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">Score: {score}</span>
      </div>
      
      <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">{q.enunciado}</h3>

      <div className="grid gap-4">
        {q.opcoes.map((opcao, idx) => (
          <button
            key={idx}
            onClick={() => !revealed && setSelected(idx)}
            className={`text-left p-6 rounded-[1.5rem] border transition-all duration-300 font-medium relative overflow-hidden ${
              selected === idx 
                ? "border-indigo-500 bg-indigo-500/10 text-white" 
                : "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/[0.04]"
            } ${revealed && idx === q.correta ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : ""}
              ${revealed && selected === idx && idx !== q.correta ? "border-red-500 bg-red-500/10 text-red-400" : ""}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-sm ${
                selected === idx ? "bg-indigo-500 border-transparent text-white" : "bg-white/5 border-white/10 text-zinc-500"
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="flex-1">{opcao}</span>
              {revealed && idx === q.correta && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4">
        {!revealed ? (
          <button
            disabled={selected === null}
            onClick={() => setRevealed(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-lg transition shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Confirmar Resposta
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition active:scale-95"
          >
            {current === questoes.length - 1 ? "Finalizar" : "Próxima Questão"}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
