"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, Brain, GraduationCap, Loader2, 
  Sparkles, Layout, CheckCircle2, AlertCircle, 
  BarChart2, LogOut, BookOpen, ChevronRight
} from "lucide-react";
import Simulado from "@/components/Simulado";
import Analysis from "@/components/Analysis";
import Link from "next/link";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"study" | "analysis">("study");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<{msg: string, details?: string} | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else setUser(user);
      setAuthLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const savePerformance = async (score: number, total: number) => {
    if (!user) return;
    await supabase.from("study_sessions").insert({
      user_id: user.id,
      score,
      total,
      topic: file?.name?.replace(".pdf", "").replace(".pptx", "") || "Simulado"
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setData(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/process", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw { msg: result.error || "Falha na geração", details: result.details };
      setData(result);
    } catch (err: any) {
      setError({ msg: err.msg || "Erro no processamento.", details: err.details });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#030014] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>;

  return (
    <main className="min-h-screen bg-[#030014] text-white">
      <nav className="sticky top-0 z-50 bg-[#030014]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 p-2.5 rounded-2xl group-hover:scale-110 transition-transform"><Brain className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-black tracking-tight hidden sm:block">StudyMind</span>
          </Link>
          <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5 gap-1.5">
            <TabButton active={activeTab === "study"} onClick={() => setActiveTab("study")} icon={<GraduationCap className="w-4 h-4" />} label="Estudo" />
            <TabButton active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} icon={<BarChart2 className="w-4 h-4" />} label="Análise" />
          </div>
          <button onClick={handleLogout} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-red-500/10 transition"><LogOut className="w-5 h-5 text-zinc-500" /></button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === "analysis" ? <Analysis user={user} /> : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 sticky top-36">
              <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] pointer-events-none" />
                <h2 className="text-lg font-bold flex items-center gap-3"><Upload className="w-5 h-5 text-indigo-400" /> Material</h2>
                <div className="relative">
                  <input type="file" accept=".pdf,.pptx" className="hidden" id="file-upload" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center border border-white/10 border-dashed rounded-[1.5rem] p-8 hover:bg-white/5 cursor-pointer transition-all">
                    <FileText className={`w-10 h-10 mb-4 ${file ? "text-emerald-400" : "text-zinc-700"}`} />
                    <p className="text-xs font-bold text-zinc-400 text-center truncate w-full px-2">{file ? file.name : "Selecionar PDF ou PPTX"}</p>
                  </label>
                </div>
                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">{error.msg}</div>}
                <button onClick={handleUpload} disabled={!file || loading} className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-zinc-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Gerar Estudo"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-12">
              {data ? (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Resumo Estruturado por Tópicos */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/20 rounded-xl"><BookOpen className="w-6 h-6 text-indigo-400" /></div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter text-white">Resumo Master</h2>
                        <p className="text-zinc-500 text-sm font-medium">Os conceitos centrais explicados em profundidade.</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-6">
                      {data.resumo.map((item: any, i: number) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] group hover:border-white/10 transition-all relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/30 group-hover:bg-indigo-500 transition-colors" />
                          <div className="flex items-start gap-4">
                            <span className="text-indigo-500/50 font-black text-4xl tracking-tighter leading-none">{String(i + 1).padStart(2, '0')}</span>
                            <div className="space-y-3">
                              <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">{item.topico}</h3>
                              <p className="text-zinc-400 leading-relaxed font-medium text-base">
                                {item.explicacao}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Simulado */}
                  <div className="pt-8 border-t border-white/5">
                    <Simulado questoes={data.questoes} onComplete={savePerformance} />
                  </div>

                  {/* Flashcards */}
                  <section className="space-y-8 pt-8 border-t border-white/5">
                    <h2 className="text-2xl font-black flex items-center gap-3"><Layout className="w-6 h-6 text-indigo-400" /> Memorização Ativa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {data.flashcards.map((card: any, i: number) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] group hover:border-indigo-500/30 transition-all">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-6 block">Card #{i+1}</span>
                          <h4 className="text-lg font-bold text-white mb-6 leading-snug">{card.frente}</h4>
                          <p className="text-sm font-medium text-zinc-500 pt-6 border-t border-white/5"><span className="text-indigo-500 font-black block text-xs mb-1 uppercase">Resposta Sugerida</span>{card.verso}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="h-full min-h-[600px] bg-white/[0.03] border border-white/5 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-10 bg-white/5 rounded-full border border-white/10 mb-8 animate-pulse"><Brain className="w-20 h-20 text-zinc-600 opacity-20" /></div>
                  <h3 className="text-3xl font-black mb-4 tracking-tighter text-zinc-300">Pronto para a Imersão?</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto leading-relaxed">Carregue um PDF ou PPTX para transformar slides em uma trilha de aprendizado master.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button onClick={onClick} className={`px-4 sm:px-8 py-3 rounded-[1.2rem] flex items-center gap-3 text-sm font-bold transition-all duration-300 ${active ? "bg-white text-black shadow-xl scale-105" : "text-zinc-500 hover:text-white"}`}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}
