"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, Brain, GraduationCap, Loader2, 
  Layout, BarChart2, LogOut, BookOpen, History
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
  const [materials, setMaterials] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndLoadMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setAuthLoading(false);

      // Fetch processed materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('processed_materials')
        .select('id, file_name, ai_content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (materialsData) {
        setMaterials(materialsData);
      }
    };
    checkUserAndLoadMaterials();
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
    if (!file || !user) return;

    setLoading(true);
    setError(null);
    setData(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: formData
      });

      const result = await res.json();

      if (!res.ok) {
        throw {
          msg: result.error || "Falha na geração",
          details: result.details
        };
      }

      setData(result);
      // Add new material to the top of the list without re-fetching
      setMaterials(prev => [{ file_name: file.name, ai_content: result }, ...prev]);
    } catch (err: any) {
      setError({
        msg: err.msg || "Erro no processamento.",
        details: err.details
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialClick = (material: any) => {
    setData(material.ai_content);
    setFile(null); // Clear file input
  };

  if (authLoading)
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );

  return (
    <main className="min-h-screen bg-[#030014] text-white">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#030014]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 p-2.5 rounded-2xl group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:block">
              StudyMind
            </span>
          </Link>

          <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5 gap-1.5">
            <TabButton
              active={activeTab === "study"}
              onClick={() => setActiveTab("study")}
              icon={<GraduationCap className="w-4 h-4" />}
              label="Estudo"
            />
            <TabButton
              active={activeTab === "analysis"}
              onClick={() => setActiveTab("analysis")}
              icon={<BarChart2 className="w-4 h-4" />}
              label="Análise"
            />
          </div>

          <button
            onClick={handleLogout}
            className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-red-500/10 transition"
          >
            <LogOut className="w-5 h-5 text-zinc-500" />
          </button>

        </div>
      </nav>

      {/* CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        {activeTab === "analysis" ? (
          <Analysis user={user} />
        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* MATERIAL (UPLOAD) */}
            <div className="w-full mb-10 lg:mb-0 lg:col-span-4 lg:sticky lg:top-36 space-y-8">

              <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">

                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px]" />

                <h2 className="text-lg font-bold flex items-center gap-3">
                  <Upload className="w-5 h-5 text-indigo-400" />
                  Material
                </h2>

                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.pptx"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center border border-white/10 border-dashed rounded-[1.5rem] p-8 hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <FileText
                      className={`w-10 h-10 mb-4 ${
                        file ? "text-emerald-400" : "text-zinc-700"
                      }`}
                    />
                    <p className="text-xs font-bold text-zinc-400 text-center truncate w-full px-2">
                      {file ? file.name : "Selecionar PDF ou PPTX"}
                    </p>
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
                    {error.msg}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-zinc-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Gerar Estudo"}
                </button>
              </div>

              {materials.length > 0 && (
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <History className="w-5 h-5 text-indigo-400" />
                    Histórico
                  </h2>
                  <div className="space-y-4">
                    {materials.map((material, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleMaterialClick(material)}
                        className="cursor-pointer p-4 border border-white/10 rounded-2xl bg-white/5 w-full flex items-center gap-4 hover:bg-white/10 transition"
                      >
                        <FileText className="w-8 h-8 text-zinc-400" />
                        <p className="text-sm font-semibold text-zinc-300 break-words">
                          {material.file_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* CONTEÚDO DIREITA */}
            <div className="lg:col-span-8 space-y-12">
              {data ? (
                <div className="space-y-8 lg:space-y-16">
                  {/* RESUMO */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter">
                          Resumo Master
                        </h2>
                        <p className="text-zinc-500 text-sm">
                          Os conceitos centrais explicados em profundidade.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-6">
                      {data.resumo.map((item: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white/[0.03] border border-white/5 p-6 md:p-8 rounded-[2.5rem]"
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-indigo-500/50 font-black text-4xl">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="space-y-3">
                              <h3 className="text-xl font-bold">
                                {item.topico}
                              </h3>
                              <p className="text-zinc-400">
                                {item.explicacao}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  {/* SIMULADO */}
                  <Simulado
                    questoes={data.questoes}
                    onComplete={savePerformance}
                  />
                </div>
              ) : (
                <div className="h-full min-h-[600px] bg-white/[0.03] border border-white/5 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-10 bg-white/5 rounded-full border border-white/10 mb-8">
                    <Brain className="w-20 h-20 text-zinc-600 opacity-20" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">
                    Pronto para a Imersão?
                  </h3>
                  <p className="text-zinc-500 max-w-sm">
                    Carregue um PDF ou PPTX para transformar slides em uma
                    trilha de aprendizado.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-8 py-3 rounded-[1.2rem] flex items-center gap-3 text-sm font-bold transition-all duration-300 ${
        active
          ? "bg-white text-black shadow-xl scale-105"
          : "text-zinc-500 hover:text-white"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}