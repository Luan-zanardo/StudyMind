"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Award, FileText, Clock, Trash2, ChevronDown, ChevronUp, Loader2, CheckCircle2, Circle } from "lucide-react";

interface StudySession {
  id: string;
  created_at: string;
  score: number;
  total: number;
  topic: string;
}

interface GroupedData {
  [topic: string]: {
    sessions: StudySession[];
    totalQuestions: number;
    totalCorrect: number;
    lastDate: string;
  };
}

export default function Analysis({ user }: { user: any }) {
  const [history, setHistory] = useState<StudySession[]>([]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Busca Histórico
      const { data: historyData } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Busca Status dos Materiais (Checklist Manual)
      const { data: statusData } = await supabase
        .from("material_status")
        .select("topic")
        .eq("user_id", user.id)
        .eq("is_completed", true);

      if (historyData) setHistory(historyData);
      if (statusData) setCompletedTopics(statusData.map(s => s.topic));
      
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const toggleComplete = async (topic: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita expandir o acordeão ao clicar no check
    
    const isCurrentlyCompleted = completedTopics.includes(topic);
    
    if (isCurrentlyCompleted) {
      // Remove do banco
      await supabase.from("material_status").delete().eq("user_id", user.id).eq("topic", topic);
      setCompletedTopics(prev => prev.filter(t => t !== topic));
    } else {
      // Adiciona no banco
      await supabase.from("material_status").upsert({ 
        user_id: user.id, 
        topic: topic, 
        is_completed: true 
      });
      setCompletedTopics(prev => [...prev, topic]);
    }
  };

  const clearHistory = async () => {
    if (confirm("Deseja realmente apagar todo o histórico de estudos?")) {
      await supabase.from("study_sessions").delete().eq("user_id", user.id);
      setHistory([]);
    }
  };

  if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  const grouped: GroupedData = history.reduce((acc: GroupedData, curr) => {
    if (!acc[curr.topic]) {
      acc[curr.topic] = { sessions: [], totalQuestions: 0, totalCorrect: 0, lastDate: curr.created_at };
    }
    acc[curr.topic].sessions.push(curr);
    acc[curr.topic].totalQuestions += curr.total;
    acc[curr.topic].totalCorrect += curr.score;
    return acc;
  }, {});

  const topics = Object.keys(grouped);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter text-white">Histórico de Materiais</h2>
        <button onClick={clearHistory} className="text-zinc-600 hover:text-red-400 text-xs font-black uppercase tracking-widest transition flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Limpar Tudo
        </button>
      </div>

      {topics.length > 0 ? (
        <div className="grid gap-6">
          {topics.map((topic) => {
            const data = grouped[topic];
            const accuracy = (data.totalCorrect / data.totalQuestions) * 100;
            const isExpanded = expandedTopic === topic;
            const isChecked = completedTopics.includes(topic);

            return (
              <div key={topic} className={`bg-white/[0.03] border rounded-[2.5rem] transition-all overflow-hidden ${isExpanded ? "border-indigo-500/50 bg-white/[0.05]" : "border-white/5 hover:border-white/10"}`}>
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 p-8">
                  <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => setExpandedTopic(isExpanded ? null : topic)}>
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${isChecked ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"}`}>
                        <FileText className={`w-7 h-7 ${isChecked ? "text-emerald-500" : "text-zinc-600"}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white truncate max-w-[200px] md:max-w-md">{topic}</h3>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
                        {data.sessions.length} Tentativas • {isChecked ? "Estudado" : "Em Progresso"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1 text-center">Checklist</p>
                      <button 
                        onClick={(e) => toggleComplete(topic, e)}
                        className={`p-2 rounded-xl transition-all ${isChecked ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" : "bg-white/5 text-zinc-700 hover:text-zinc-500"}`}
                      >
                        {isChecked ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Média</p>
                      <p className={`text-2xl font-black ${accuracy >= 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>{accuracy.toFixed(0)}%</p>
                    </div>
                    
                    <button onClick={() => setExpandedTopic(isExpanded ? null : topic)} className="p-2 hover:bg-white/5 rounded-lg transition">
                      {isExpanded ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-8 pb-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="h-px bg-white/5 mb-6" />
                    {data.sessions.map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <Clock className="w-4 h-4 text-zinc-700" />
                          <span className="text-sm font-medium text-zinc-400">{new Date(session.created_at).toLocaleDateString('pt-BR')} às {new Date(session.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{session.score} / {session.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-[3rem] p-32 text-center">
          <Award className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-bold text-zinc-500 mb-2">Sem histórico</h3>
          <p className="text-zinc-600 max-w-xs mx-auto font-medium">As sessões e seu checklist manual serão salvos na sua conta.</p>
        </div>
      )}
    </div>
  );
}
